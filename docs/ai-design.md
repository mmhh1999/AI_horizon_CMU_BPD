# AI Design: Where AI Is Used, and Where It Isn't

## Principle

**Deterministic core, AI at the edges where language is the bottleneck.**

Scores, zoning checks, and counterfactuals are computed by code, so anyone can reproduce and audit them. We use AI to *read* dense legal text, to *explain* computed tradeoffs in plain language, and to *listen* to users' priorities. AI never produces a score, never makes a legal determination, and never picks a "best" housing type.

This is also why the project is not a thin wrapper. The value lives in the data pipeline, the constraint engine, the scoring, and the counterfactual math. If the LLM is switched off, the tool still works, with templated text in place of generated explanations.

## What shipped (as of submission)

- **Built:** A2 ("Why A over B?") and A4 ("Why not B?") as "Explain in plain language" buttons, the Horizon copilot (same server and number check, answering questions about the current dashboard), and A7 illustrations.
- **Simplified:** A2 does not surface per-claim `DATA` / `ASSUMPTION` / `VALUE` tags; the number-grounding check is the enforced guardrail.
- **Not built:** A1 (zoning extraction; the app's zoning values are hand-entered draft placeholders), A3 (values interview), A5 (zoning Q&A), A6 (ZBA mining).

The role table below is the original design, kept for reference.

## Why this split: the evidence

| Design choice | Evidence |
|---|---|
| The LLM never answers legal questions freely; all zoning facts come from a verified rules table | General-purpose LLMs hallucinated 58–88% of the time on specific, verifiable legal questions [G2]. Commercial retrieval-augmented legal tools still hallucinate [G3] |
| We still use an LLM to *extract* zoning rules, with validation | LLM extraction of zoning codes can be accurate at scale when validated against hand-coded data [G1]. We follow the same pattern: extract, then check every row by hand |
| Rules table fields follow a standard schema | The National Zoning Atlas methodology [G5]; its Pittsburgh atlas [C4] can later serve as an independent cross-check |
| Extract from the **codified** text (eCode360), not from amending ordinances | Amendments mark changes with strikethrough and underline, which disappear in plain text. We hit exactly this problem with Ord. 2025-1579 [B3]: two sources disagree on whether the per-unit lot minimum still exists |
| Explanations are contrastive ("why A *rather than* B") | This is how people actually ask for explanations [D3] |
| "What would have to change" is a counterfactual: the smallest change that flips the result | [D4], applied to three levers: values, rules, site |
| Robustness (SMAA) and tipping points are **math, not AI** | [D1, D2]. They are exact and reproducible, and the LLM only puts them into words |
| The risk table is organized by Govern, Map, Measure, Manage | NIST AI RMF 1.0 [G4] |

Codes refer to [references.md](references.md).

## AI roles

| # | Role | When | Input → Output | Guardrails | Human in the loop | Priority |
|---|---|---|---|---|---|---|
| A1 | **Zoning code → rules tables** (one per rule-set: `pre-2025`, `current`, `bill-2025-1545`) | Build time (offline) | Text of Pittsburgh Code Ch. 903 and 911 (and the bill's draft text) → structured rows per district: permitted unit types, minimum lot size, lot area per unit (if still in force), setbacks, height and stories | Every row must carry the **section number and a verbatim quote**; missing quote means the row is rejected; the code snapshot's retrieval date is recorded. Validate the `pre-2025` table against the HNA's lot-size tables [C1 pp. 31–32] | A teammate checks **every** row against the code and fills a `verified_by` field. Unverified rows show as "unverified" in the UI | **MVP** |
| A2 | **"Why A over B?" explainer** | Runtime | JSON of scores, inputs, weights, constraint results, and source IDs → a short plain-language explanation | Structured output; each claim tagged `DATA`, `ASSUMPTION`, or `VALUE` with source IDs; **every number in the text must appear in the input JSON** (otherwise regenerate or use the template); no new facts | The user sees sources next to each claim and can open them | **MVP** |
| A3 | **Values interview** | Runtime | The user's own words ("we're a CDC; keeping current renters housed matters most…") → proposed weights plus a one-line rationale each | Weights are only *proposed*; the output schema is limited to the six dimensions | **The user must confirm or edit the sliders** before anything re-ranks | **MVP** |
| A4 | **"Why not B?" narrator** | Runtime | Tipping points, dominance, SMAA rank acceptability, binding rule, zoning stretch, and rule-set differences, all computed by code → a plain-language "what would have to change" across the three levers (Values, Rules, Site) | Same number check as A2; always names the human process that decides (City Planning, ZBA) and never predicts its outcome | An escalation box: "confirm with…" | **MVP** |
| A5 | **Zoning Q&A with citations** | Runtime | "Why can't a fourplex go here?" → an answer grounded in retrieved Ch. 903 and 911 passages | Answers must quote a section; if retrieval is weak or the text is ambiguous, it says so and refers the user to City Planning | Escalation on ambiguity | Stretch |
| A7 | **Housing-type illustrations** | Build time (pre-generated) | A text description of a housing type (for example, a fourplex with an individual porch for each unit, on a Pittsburgh street) → one illustrative image per type, stored in `src/app/assets/renderings/` | Every image is labeled "AI-generated illustration of the housing type, not a design for this site." No dimensions, costs, or site claims are attached. Prompts emphasize street life, porches, and front doors, as the advisors asked | A team member reviews each image before it ships and rejects misleading ones | Branch `mso-v0` |
| A6 | **ZBA decision mining** | Build time | ZBA decision PDFs → variance type, standard, and outcome | Descriptive statistics only ("how often lot-area relief appears"); never a prediction for a specific case | Spot-check a sample by hand | Stretch |

## What AI deliberately does not do

- **Compute or adjust scores.** Scoring functions are plain code with documented formulas ([concept.md](concept.md)).
- **Decide legality.** It extracts and explains; the verified rules table plus deterministic checks decide; the City has final say.
- **Recommend a single "best" typology.** This is contrary to the brief, so we show tradeoffs and tipping points instead.
- **Predict prices, rents, costs, or approval outcomes.** We don't have data that would justify this.
- **See personal data.** Owner names and mailing addresses in assessment records are dropped at ingest and never reach a prompt or the UI.
- **Rank neighborhoods for investment targeting.** Affordability-need and displacement indicators are shown as context and caution, never as an "opportunity" ranking. See [limitations.md](limitations.md).

## Integrity checklist (maps to the "Data & AI Integrity" judging criterion)

- [ ] Every zoning result links to a code section (eCode360) with the snapshot date
- [ ] Every score shows its inputs, data source, and vintage
- [ ] ACS margins of error are carried or flagged; tract-level values are labeled as tract-level
- [ ] LLM outputs pass the number-grounding check, and the template fallback works when the LLM is off
- [ ] Every AI-proposed weight requires user confirmation
- [ ] The escalation path ("confirm with City Planning / ZBA; get survey and geotech") is always visible
- [ ] No PII in data files, prompts, logs, or the UI
- [ ] API keys live in `.env` (git-ignored) and never in commits

## Tooling

- **Runtime LLM:** a small local server (`src/server/`) behind a provider interface: Groq (default, `openai/gpt-oss-120b`) or Claude, chosen with `LLM_PROVIDER`. It serves A2, A4 and the Horizon copilot, applies the number-grounding check, and the app falls back to template text when it is off.
- **Development tools:** Cursor (sponsor credits are available via Slack), Claude Code, and others. Everything we use is logged in [ai-usage-log.md](ai-usage-log.md) for the submission's AI disclosure.
