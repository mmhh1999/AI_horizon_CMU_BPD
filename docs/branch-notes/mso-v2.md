# `mso-v2`: staged, map-first integration branch

**Owner:** Meltem Sahin Ozkoc · **Base:** `david_1.0` @ `d81d131` · **Started:** Sun 2026-09-27

Convergence branch for the submission demo. It rebuilds the interface as Olaf's map-first staged journey and keeps every feature David added (police and Smell Pittsburgh context, cost explorer, stakeholder personas, ranking, search, resizable panels). No new analysis features. `mso-v1` is superseded and left as is.

Run `python3 -m http.server 8795 --directory src/app` from the repo root and open `http://localhost:8795/`. The plain URL always starts at the County map.

## Journey

1. **Community**: full-width County and City maps; picking a neighborhood opens its needs, "Who lives here" profile, and police + smell context.
2. **Who are you planning for?**: five stakeholder personas and all ten priority weights, before any lot is chosen.
3. **Opportunity**: opportunity lot layers on the map; pick a lot.
4. **Housing futures**: persona tabs and weights at the top, then the ranking, cards, and type picker.
5. **Trade-offs**: 3D detail, performance, cost explorer, score breakdown, and Why / Why not.

## Ported from `olaf-ai-integration`

- Stage state separate from the map level, the interactive journey bar, stage-dependent layouts, the full-width Community map, the docked legend, and the "Review trade-offs" step.

## Changed on this branch

- An explicit persona step (step 2) and weights shown above the ranking.
- "Who lives here" open by default.
- Pittsburgh black / gold interface chrome instead of green; map data colors unchanged.
- Solar envelope kept, presented as an optional "winter sun for neighbors" goal (collapsed, mesh off by default).
- Warmer original renders shown uncropped, with David's v2 set as fallback.
- Panel widths reset per stage and no longer persist across reloads; `?demo` no longer auto-jumps to a lot.

## Left for the team

- LLM chat / rank reasoning over structured JSON facts (provider-agnostic, key in `.env`).
- Demo video script, repo made public, submission form.
- Cherry-picks or a PR to `main`.
