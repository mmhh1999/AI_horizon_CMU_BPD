"""Small local proxy for the runtime LLM roles described in docs/ai-design.md:
A2/A4 ('why A over B', 'why not B') at POST /api/explain, and Horizon, the global
stage-aware planning copilot, at POST /api/reason. The frontend (src/app/js/
explain.js, src/app/js/horizon.js) calls this over HTTP so the API key never
reaches the browser; if this process is not running, or a reply fails the
number-grounding check, the frontend falls back to template text it already
has, per the "deterministic core, AI at the edges" principle.

Run: python3 src/server/app.py   (reads .env from the repo root; see .env.example)
"""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grounding import check as grounded  # noqa: E402
from prompts import SYSTEMS, build_reason_message, build_user_message  # noqa: E402
from providers import Provider, active_provider_name, get_provider, is_configured, REQUIRED_ENV_VAR  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


load_dotenv(ROOT / ".env")

_provider: Provider | None = None
_provider_error: str | None = None
try:
    _provider = get_provider()
except Exception as exc:  # missing package, bad LLM_PROVIDER, etc.
    _provider_error = str(exc)


def _preflight() -> dict | None:
    """Checks shared by /api/explain and /api/reason; returns an error payload, or None if clear to call the model."""
    if _provider is None:
        return {"ok": False, "error": _provider_error or "no provider configured"}
    if not is_configured():
        var = REQUIRED_ENV_VAR.get(active_provider_name(), "the provider's API key")
        return {"ok": False, "error": f"{var} is not set"}
    return None


def _complete_grounded(system: str, user: str, facts: dict, retry_hint: str) -> dict:
    """Calls the active provider, retrying once if the reply isn't grounded in `facts`."""
    for _attempt in range(2):
        try:
            text = _provider.complete(system, user).strip()
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
        if text and grounded(text, facts):
            return {"ok": True, "text": text}
        user += retry_hint
    return {"ok": False, "error": "reply did not pass the number-grounding check"}


UNGROUNDED_HINT = "\n\nYour last reply used a number that was not in the JSON above. Try again, using only numbers copied from the JSON."


def explain(role: str, facts: dict) -> dict:
    if role not in ("why-not", "compare"):
        return {"ok": False, "error": f"unknown role '{role}'"}
    err = _preflight()
    if err:
        return err
    return _complete_grounded(SYSTEMS[role], build_user_message(facts), facts, UNGROUNDED_HINT)


def reason(question: str, context: dict, history: list) -> dict:
    err = _preflight()
    if err:
        return err
    return _complete_grounded(SYSTEMS["reason"], build_reason_message(question, context, history), context, UNGROUNDED_HINT)


class Handler(BaseHTTPRequestHandler):
    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802 (http.server's naming convention)
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/api/health":
            self._json(200, {"ok": True, "provider": active_provider_name(), "configured": is_configured()})
        else:
            self._json(404, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path not in ("/api/explain", "/api/reason"):
            self._json(404, {"ok": False, "error": "not found"})
            return
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self._json(400, {"ok": False, "error": "invalid JSON body"})
            return

        if self.path == "/api/explain":
            role, facts = body.get("role"), body.get("facts")
            if not role or not isinstance(facts, dict):
                self._json(400, {"ok": False, "error": "expected {role, facts}"})
                return
            self._json(200, explain(role, facts))
        else:
            question, context, history = body.get("question"), body.get("context"), body.get("history") or []
            if not question or not isinstance(context, dict) or not isinstance(history, list):
                self._json(400, {"ok": False, "error": "expected {question, context, history?}"})
                return
            self._json(200, reason(question, context, history))

    def log_message(self, fmt: str, *args) -> None:  # quieter than the default access log
        sys.stderr.write(f"[explain-proxy] {fmt % args}\n")


def main() -> None:
    port = int(os.environ.get("LLM_PROXY_PORT", "8799"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"explain-proxy listening on http://127.0.0.1:{port}  (provider error: {_provider_error or 'none'})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
