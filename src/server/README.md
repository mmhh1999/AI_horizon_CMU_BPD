# Explain proxy (A2 / A4 runtime LLM)

A small local HTTP proxy for the two runtime AI roles in [docs/ai-design.md](../../docs/ai-design.md):

- **A2** "why A over B?" — contrasts two ranked housing types under the user's priority weights.
- **A4** "why not B?" — turns the already-computed constraint list and counterfactual chips into a short narrative.

The API key lives here, never in the browser. If this process is not running, the frontend ([src/app/js/explain.js](../app/js/explain.js)) silently falls back to the existing template text — the tool works with the proxy off.

## Guardrail

Every number the model writes must already appear in the JSON facts it was given ([grounding.py](grounding.py)); an ungrounded reply gets one retry, then the caller is told the explanation is unavailable. The model never invents a fact, never says a type is "best", and never predicts what a board or council will decide.

## Run

```bash
pip install -r src/server/requirements.txt
cp .env.example .env   # set LLM_PROVIDER and the matching key (ANTHROPIC_API_KEY or GROQ_API_KEY)
python3 src/server/app.py   # listens on http://127.0.0.1:8799
```

Two providers are implemented: `claude` (Anthropic, `claude-opus-5` default) and `groq` (Groq's free tier, `llama-3.3-70b-versatile` default — check console.groq.com for the current free-tier model list, it changes). Switch with `LLM_PROVIDER` in `.env`; no code changes needed either way.

`GET /api/health` reports the active provider and whether its key is set. `POST /api/explain` takes `{"role": "why-not" | "compare", "facts": {...}}` and returns `{"ok": true, "text": "..."}` or `{"ok": false, "error": "..."}`.

## Files

| File | Role |
|---|---|
| `app.py` | HTTP server (stdlib only): CORS, `/api/health`, `/api/explain`, the retry-then-fallback loop |
| `providers.py` | `Provider` interface + `ClaudeProvider` (Anthropic SDK) + `GroqProvider` (Groq SDK); swap via `LLM_PROVIDER` |
| `prompts.py` | System prompts for `why-not` and `compare`, sharing one guardrail preamble |
| `grounding.py` | Number-grounding check: every digit in the reply must be in the input JSON |

## Adding a provider

Add a class implementing `Provider.complete(system, user) -> str` in `providers.py`, register it in `_PROVIDERS`, add its key's env var name to `REQUIRED_ENV_VAR`, and point `LLM_PROVIDER` at its key. Nothing in `app.py`, `prompts.py`, or the frontend needs to change.
