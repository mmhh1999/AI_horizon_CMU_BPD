# Branch `mso-v1`: integration line for submission

> **Status: archived 2026-09-27, renamed to `archive/mso-v1`. Superseded by `mso-v2`; do not demo, review, or merge.**
> Why it was replaced:
> - The stage layouts used `!important` grid templates that fought `david_1.0`'s five-track splitter grid.
> - The map was fitted before the grid resized, so it loaded off-center.
> - `?demo=1` auto-opened a lot, so the app appeared to start at Housing futures instead of the County map.
> - There was no separate "Who are you planning for?" step.
>
> `mso-v2` rebuilt the same goals from `david_1.0`; see `docs/branch-notes/mso-v2.md` on that branch.

**Owner:** Meltem Sahin Ozkoc · **Base:** `david_1.0` @ `d81d131` · **Started:** Sun 2026-09-27

Convergence branch for the hackathon demo. It keeps David's cost explorer, smell/context panel, stakeholder personas, search, splitters, and ranking; restores Olaf's four-step guided journey; moves priorities under personas; shifts the chrome to Pittsburgh black/gold; and de-emphasizes the solar envelope (still available, not default).

## Inherited from `david_1.0`

- Police activity + Smell Pittsburgh neighborhood context (`environment.js`, `build_smell.py`)
- Editable cost explorer (`cost.js`)
- Five stakeholder tabs + housing-type ranking (`roles.js`)
- Resizable panels (`splitter.js`), search (`search.js`), `renderings-v2/` PNG set

## Ported from `olaf-ai-integration`

- Interactive journey: Community → Opportunity → Housing futures → Trade-offs
- Stage-based layout (full-width map on Community entry)
- `tests/guided_flow.py` (updated for `mso-v1`)

## Changes on this branch only

| Area | What |
|---|---|
| Journey | `#journey` step nav replaces static step labels |
| Personas | `roleView` + `#priorities` above ranking and scenario cards |
| Palette | Pittsburgh black / gold chrome (`david.css`) |
| Solar | Off by default; optional mesh toggle; solar tile collapsed under Performance |
| Illustrations | `renderings-v2` with fallback to warmer `renderings/` JPGs |
| Defaults | “Who lives here” profile `<details>` always open |

## Left for the team (not blocking this branch)

- API-based LLM for chat / rank reasoning (structured JSON facts in, `.env` key)
- Demo video script and submission form
- Final render regeneration (warmer street-life prompts) if time allows
- Cherry-pick selected commits back to `main` after review

## Run

```bash
cd src/app && python3 -m http.server 8791   # http://localhost:8791/?demo=1
python tests/guided_flow.py                 # needs playwright + local Chrome
python tests/smoke_app.py
```
