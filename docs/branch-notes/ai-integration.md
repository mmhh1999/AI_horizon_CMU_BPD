# Branch `ai-integration`: runtime LLM for A2 / A4, and Mira

**Owner:** Minghao (with Claude Code) · **Base:** `main` @ `3e563e5` (post `mso-v2` merge) · **Started:** Sun 2026-09-27

Adds the first runtime LLM calls described in [docs/ai-design.md](../ai-design.md) — until now A2 ("why A over B?") and A4 ("why not B?") were both `TBD` in [ai-usage-log.md](../ai-usage-log.md) — plus Mira, a global stage-aware planning-copilot panel layered on top. Everything else (scores, zoning checks, counterfactual math, existing UI) is unchanged; the LLM only rephrases numbers the engine already computed, and every reply is checked for that before it reaches the page.

## Mira (global assistant)

A floating button + panel, present on every stage (`src/app/js/mira.js`, wired into `src/app/js/main.js`), backed by a new `POST /api/reason` route that shares `/api/explain`'s provider and number-grounding code. Suggested questions and the panel's context summary change by stage; the Trade-offs stage adds an "Ask Mira to explain this trade-off" CTA that opens the same panel with a pre-filled prompt. `buildMiraContext()` in `main.js` reads only fields that already exist in app state (stage, geography, persona, weights, ranked alternatives, selected future) — it never recomputes or invents a fact. This is additive: the per-future "Explain in plain language" buttons and the ask-box comparison answer from the A2/A4 work above are unchanged and still work; Mira is the persistent, conversational layer on top of them, not a replacement. Assets are in `src/app/assets/mira/` (copied from the `Mira_12_UI_states/` folder at the repo root, which can be deleted once this lands). Seven of the twelve shipped avatar states are wired to real triggers (idle, hover, open, thinking, responding, error, plus a CSS-only hover swap); Excited/Notifying/Success/Speaking/Typing/Listening are mapped but not currently triggered.

## What this adds

| Area | What |
|---|---|
| `src/server/` | A small local HTTP proxy (`app.py`) holding the API key; `providers.py` (`Provider` interface, `ClaudeProvider`, `GroqProvider` — Groq's free tier is the default in `.env.example` since the team doesn't have an Anthropic key), `prompts.py`, `grounding.py` (every number in a reply must appear in the facts JSON it was given, or it's discarded) |
| `src/app/js/explain.js` | Frontend client; any failure (proxy not running, no key, timeout, ungrounded reply) resolves to `null` so callers keep the template text |
| Why-not drawer (`ui.js` `renderWhy`, A4) | "Explain in plain language" button turns the constraint list + unlock chips into a short paragraph |
| Ranking (`ui.js` `prioRankHTML`, A2) | Same button contrasts the #1 and #2 ranked types under the current weights |
| Ask box (`answers.js`, `main.js`, A2) | Comparison-style questions ("why is X ranked over Y") now get a deterministic templated answer first, then the same AI paragraph if the proxy is reachable |
| `.env.example` | `LLM_PROVIDER`, `ANTHROPIC_API_KEY`, `LLM_MODEL`, `LLM_PROXY_PORT` |

## Guardrails carried over from ai-design.md

- Number-grounding check (server-side, one retry, then a quiet "unavailable" fallback — never a broken UI).
- Never picks a "best" type; A2 explicitly says a different weighting could reorder the two types.
- Never predicts what a board or council decides; only narrates what the engine already flagged.
- The deterministic template answer always renders first; the AI paragraph, when it arrives, is additive.

## Simplified from the ai-design.md spec, for scope

- A2's per-claim `DATA` / `ASSUMPTION` / `VALUE` tagging is not surfaced in the UI text; the number-grounding check is the enforced guardrail instead. Revisit if a reviewer wants the tags visible.
- Comparison intent in the ask box is a keyword regex (`COMPARE_Q` in `answers.js`), not a classifier.

## Open items

- No API key is checked into `.env` (git-ignored); the demo needs one set locally or in whatever environment runs the video. `.env.example` defaults `LLM_PROVIDER` to `groq` (free tier, no card) since the team doesn't have an Anthropic key; `claude` remains the other option.
- `docs/ai-usage-log.md`'s "Runtime AI" table now names Groq (default) and Claude for A2/A4; A1 (zoning extraction), A3 (values interview), and A5 (cited zoning Q&A) are still `TBD`/stretch.
- Verified end-to-end against both providers' real endpoints with an invalid key (clean 401, no crash) and with each proxy off entirely (frontend falls back to templates); not yet verified with a real key that a full explanation renders correctly in the UI.

## Run

```bash
pip install -r src/server/requirements.txt
cp .env.example .env   # LLM_PROVIDER=groq + GROQ_API_KEY (console.groq.com), or claude + ANTHROPIC_API_KEY
python3 src/server/app.py &            # explain proxy on :8799
python3 -m http.server 8795 --directory src/app   # app on :8795
```

The app works with the proxy off; the two "Explain in plain language" buttons and the ranking-comparison ask-box questions just report the explanation as unavailable and keep the existing template/bullet text.
