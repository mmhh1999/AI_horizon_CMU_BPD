# Interface Spec (v1.2: Pittsburgh civic dashboard)

*Updated Fri 2026-09-25 from the team's UI brief. It supersedes the earlier "six futures" wireframe ([design/wireframe.svg](design/wireframe.svg), kept for reference). Screenshot: [design/workbench-v1.png](design/workbench-v1.png). Owner: Minghao.*

## v1.2 visual system (team direction: Pittsburgh civic dashboard)

The page should feel like a trustworthy city public-service tool: professional, clear, practical, with the steadiness of an industrial city.

- **Color.** Charcoal (#1E1E1E), dark gray, white and light gray (#F2F2F0) carry the page. **Gold (#FFB81C) is used only** for the primary button, selected states (the selected card's top bar and its WHY NOT?, the selected parcel on the map, the active nav item) and key markers (zoning-envelope dashes, blocker numbers). Status colors are muted green, orange and red, used in small chips.
- **Layout.** A fixed charcoal side navigation rail (Lots · Futures · Why not · Sources) and a wide main area: map, futures and why-not columns on an even grid with consistent 12–16 px spacing. Below 1200 px the columns stack. Below 760 px the rail becomes a top bar, and the page has no horizontal scroll at 390 px.
- **Type.** Inter; hierarchy comes from size, weight and gray level only (base 15 px; section labels in small caps gray).
- **Components.** 6 px radius, 1 px borders, light shadows (0 1px 2px). Line icons throughout (Lucide).
- **Interaction.** Clear hover (darker border), selected (charcoal border + gold bar) and focus (2 px gold outline) states. Transitions are 120 ms. Controls stay in the same place across states.
- **Avoided.** Large gradients, neon, glass effects, pill shapes everywhere, heavy shadows, marketing hero.

## v1.1 changes (team feedback: "too architectural")

- **Plain language for developers and policymakers.** Statuses read "Can be built", "Needs changes", "Not allowed". Blockers are phrased as problems ("Taller than the height limit", "Parking rule takes too much land"). Every blocker says **who can change it** (Zoning Board variance, City Council / Bill 2025-1545, rezoning, or developer design choice).
- **Diagrams instead of text:** a height comparison bar, a lot-use bar showing parking that doesn't fit, a hard-surface bar with its flag line, a lot budget (building, parking, open), and KPI tiles (new homes, floors, minutes to bus, open space).
- **Icons** (Lucide, ISC license) on every row, chip and option. Technical numbers such as FAR, runoff and usable roof sit behind "Technical details".
- ~~Fresh blue-green palette~~ (replaced in v1.2 by the civic charcoal + gold system). Base font 15 px.
- **Step labels:** 1 The lot · 2 Compare · 3 Why / why not.

## Principle

This is a **planning workbench, not an AI dashboard.** The page follows one chain of actions: **parcel → alternatives → trade-offs → Why not?** The target users are municipal planners, small developers, nonprofits, and community partners, so everything is written in plain language and points toward a decision.

Avoid this language: "best option", "optimal", "AI recommends", composite scores such as "87/100".
Use this language instead: "plausible futures", "current conditions", "trade-offs", "primary constraint", "what would need to change".

## Layout: three regions

| Region | Content |
|---|---|
| **Left: Site map** | A real Pittsburgh parcel map (MapLibre + OpenFreeMap) with thin parcel lines; click to select. One overlay at a time: Zoning · Transit · Slope 25%+ · Geohazards. A parcel card under the map shows parcel, lot area, zoning, existing use, and transit walk time, each with an evidence badge |
| **Center: Housing futures** | Three plausible futures, by default Townhouse · Small multifamily · Mixed-use low-rise, with alternative sets for missing middle and gentle infill. Each card has a monochrome axonometric massing thumbnail; units · floors · FAR; four qualitative dimensions (Housing capacity, Access, Climate & energy, Regulatory fit) with 10-step bars; the primary constraint; and a **WHY NOT?** button. Below the cards is an expanded view of the selected future: a larger axonometric with neighbors, the dashed draft zoning envelope, an optional winter shadow, and four evaluation groups (Housing · Access · Climate & energy · Regulatory) |
| **Right: Why / Why not** | What works · What limits it. **WHY NOT?** opens the counterfactual drawer: numbered constraints (current vs. required, typed as regulatory, physical, or environmental, each with a source badge), then **What could change?** chips. Clicking a chip recomputes every card and shows the status change (e.g., **CONDITIONAL → VIABLE**) with a one-paragraph summary. At the bottom is a small ask box with suggested questions; answers come only from the structured results |

## Status instead of scores

| Status | Meaning |
|---|---|
| **VIABLE** | No constraints under the draft rules |
| **CONDITIONAL** | Needs dimensional relief, a pending policy (Bill 2025-1545), stormwater mitigation, or site review |
| **CONSTRAINED** | Use not permitted (rezoning needed), or physically implausible |

The four card dimensions are qualitative levels with fixed, documented thresholds (see *Sources & Assumptions* in the app). There is no composite score and no ranking. SMAA robustness from [concept.md](concept.md) is kept as a possible analysis view, but it is not in the v1 UI.

## Counterfactual chips (implemented)

| Chip | Effect |
|---|---|
| Allow *N* ft · *k* stories | Raises the height and storey caps for this parcel |
| Remove parking minimum (as proposed in Bill 2025-1545) | Required spaces set to 0 |
| Add green roof + stormwater mitigation | Roof runoff coefficient drops from 0.95 to 0.4; clears the stormwater flag |
| Rezone to allow *typology* (map amendment) | Adds the use to the district |
| Reduce side / rear yards | Dimensional relief |
| Lot-size relief | Waives the minimum lot size |
| Allow ADUs (as proposed in Bill 2025-1545) | Gentle-infill set |
| Prioritize housing capacity | Smaller average units (650 sq ft). This can *add* parking pressure, which shows the trade-off |

Physical constraints (slope, undermining, landslide) never get a chip. The drawer says: "no policy change removes it."

## Evidence

Every metric group carries a source badge (PARCEL, ZONING, TRANSIT, HAZARD, SOLAR, CLIMATE, TYPOLOGY, CONTEXT, POLICY). Clicking a badge opens **Sources & Assumptions** at that source. That panel lists data sources, retrieval dates, simplified calculations, known uncertainty, and the decision-support disclaimer. A persistent header flag reads "Draft rules · unverified".

## Visual direction

- Off-white canvas (#F6F6F3), charcoal type, thin parcel lines, generous whitespace.
- Accent color is reserved for status (green, amber, red), the zoning envelope (blue dashed), and transit (teal).
- Massing is monochrome (white and light gray, charcoal edges, floor lines, a shop-front band for mixed-use). Neighbors in front of the lot are drawn as ground footprints only.
- No gradients, glowing AI elements, radar or donut charts, or large chat windows.

## Demo sequence (about 30 s)

1. Map → **Try an example parcel** (4401 Liberty Ave, LNC, vacant, 1 min to frequent transit).
2. Three futures appear: Townhouse **VIABLE**, Small multifamily **CONDITIONAL**, Mixed-use **CONDITIONAL**.
3. Small multifamily → **WHY NOT?** Height (40 ft allowed vs. ~44 ft needed), parking (23 spaces, ~7,475 sq ft, vs. ~0 sq ft left), stormwater (93% impervious).
4. Apply "Allow 44 ft", "Remove parking minimum", and "Add green roof" → **CONDITIONAL → VIABLE**.

All zoning numbers are draft placeholders until verified.
