# Local branch `david_1.0`: clearer comparison and stakeholder views

Built on `david`; not pushed. Run `python3 -m http.server 8791 --directory src/app` from the repo root, then open `http://localhost:8791/?demo=1`.

## What changed

- A prominent housing-type ranking appears before the scenario cards. Rows and cards use the same deterministic weighted fit calculation; selecting a row opens that scenario. Scores are relative to user-selected weights, not permit decisions, market returns, or one universal “best” type.
- Five tabs—Policy maker, Community, Developer, Architect, Investor—show different decision prompts and apply clearly labeled *editorial starter weights*. Users can adjust all ten weights afterward. Police reports, smell reports, and the cost illustration never enter the rank. The Investor tab does not model revenue or investment return.
- The desktop map begins wider. Both separators can be dragged or adjusted with arrow keys, double-click resets widths, and widths persist in browser local storage. On screens 1200 px or narrower, panels stack instead.
- Top search now suggests City neighborhoods, parcels within the currently open neighborhood, and page shortcuts. Searching Ranking, Costs, or Priorities without a selected lot opens the first example. It is intentionally local and deterministic; no LLM or geocoding is used until the team agrees on a sourced, privacy-aware design.
- The house-plus button now starts a fresh County exploration and resets local weights and cost assumptions. It remains visible on mobile.
- Thirteen new AI-generated housing-type illustrations are in `src/app/assets/renderings-v2/`, each 1448 × 1086 PNG. The old JPG set remains untouched. The detail view uses `object-fit: contain`, preventing the previous forced crop.

## Image-generation prompt set

Built-in image generation was used once per housing type (with one corrected second pass for the house-plus-ADU image). Each prompt shared: “high-resolution editorial architectural photograph on an ordinary Pittsburgh street; plausible materials and scale; wide 4:3 landscape; complete roofs, ground floors and setbacks visible with generous edge margin; soft overcast light; no main-subject people, text, logos, or watermark; generic typology, not a design for a real site.”

The distinct subjects were: house plus backyard ADU (`detached`), side-by-side duplex, three-unit triplex, four-unit fourplex, porch-focused fourplex, attached townhouses, cottage court, courtyard apartments, small multifamily apartment building, garage ADU, multigenerational house with secondary suite, live-work units, and ground-floor shop with apartments (`mixeduse`).

## Remaining limitations

The role mixes are illustrative judgments, not research-backed stakeholder preferences. Zoning values and several typology dimensions remain draft. Images should not be taken as site-specific massing. Search only covers neighborhoods and parcels from the open neighborhood; it cannot find arbitrary addresses citywide. AI explanations are deferred pending a team decision on factual grounding, hosting, and inference cost. See [limitations](../limitations.md).
