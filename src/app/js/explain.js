// Client for the local explain-proxy (src/server/app.py): A2 "why A over B" and
// A4 "why not B" from docs/ai-design.md. Every call can fail (proxy not running,
// no API key, ungrounded reply) and callers must keep working with the existing
// template text when it does — this never replaces the deterministic core.

const PROXY_URL = "http://127.0.0.1:8799/api/explain";
const TIMEOUT_MS = 12000;

async function explain(role, facts) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, facts }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? data.text : null;
  } catch {
    return null; // proxy not running, network error, or timeout: caller falls back to templates
  } finally {
    clearTimeout(timer);
  }
}

export const explainWhyNot = (facts) => explain("why-not", facts);
export const explainCompare = (facts) => explain("compare", facts);
