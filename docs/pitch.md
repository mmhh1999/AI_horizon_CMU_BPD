# Housing Futures: "Why-Not?" (one-page pitch, v2)

*Track 3: Housing Typology, Equity & Climate Matchmaker. Draft for the Sat 09:15 team sync and the advisor call.*

## The problem

Pittsburgh needs more kinds of housing, not just more housing. The City's 2022 Housing Needs Assessment estimates missing-middle rental demand at about 1,900 units, roughly a third of projected rental need. It also finds that multi-unit housing is allowed on only 23% of city land. The rules are moving: minimum lot sizes were cut in May 2025, and a bill legalizing ADUs and removing parking minimums had its Council hearing on September 23, 2026.

A planner, CDC, or small developer still cannot easily answer: **for this parcel, which housing types fit, what does each give up, and what would have to change for a different answer?**

## What we build

For any City of Pittsburgh parcel, the tool:

1. **Checks fit.** Six typologies (detached, ADU, duplex, townhouse, fourplex, small multifamily) are checked against site hazards (slope, undermining, landslide, flood) and zoning. Every result cites a code section, and each non-fitting type shows the **one rule that binds** and by how much.
2. **Scores the outcomes** on six transparent dimensions: net new units, buildability, affordability need, transit access, land and climate, and physical scale fit.
3. **Separates data from values.** Users set weights or pick a persona. We also show **robustness**: the share of all possible priority mixes under which each type comes out on top (SMAA). A type that wins almost everywhere is a data-driven conclusion. One that wins only under narrow weights is a value judgment, and the tool says so.
4. **Answers "Why not B?" with three levers:**
   - **Values:** "B wins if you weight climate above X"
   - **Rules:** "blocked by [section]. The 2025 reform changed this" or "the pending bill would allow an ADU here"
   - **Site:** e.g., "most of the lot is on 25%+ slope, which no policy fixes"
5. **Adds an equity lens.** It flags demolition of existing homes and scores supply as *net* units. It shows market context and the HNA's two displacement pathways: rent-driven in hot markets, decline-driven in weak ones.

## Where AI fits, and where it doesn't

- **AI reads the law, and a human verifies it.** An LLM extracts zoning rules from Ch. 903 and 911 into a table with section quotes; a teammate checks every row. This follows validated LLM zoning extraction (Bartik, Gupta & Milo), with a guard against legal hallucination (Dahl et al. 2024; Magesh et al. 2025).
- **AI explains, and the math decides.** Contrastive "why A, not B?" explanations use only computed numbers, with each claim tagged DATA, ASSUMPTION, or VALUE. Scores, robustness, and tipping points are deterministic code, and the app still works with the LLM off.
- **AI listens, and the user confirms.** Plain-language priorities become proposed weights that the user must approve.

## Why this isn't generic

- A **robustness** answer instead of one ranking.
- A **Reform Lens** tied to Pittsburgh's live zoning agenda.
- **Two-pathway displacement** from the City's own assessment.
- A **replication check** against the HNA's lot-size table before we show any new number.

## Who it's for, and what's next

- **Primary users:** City Planning (as a prototype of the HNA-recommended *Anti-Displacement Review* of zoning changes), CDCs screening sites, and small developers.
- **After the event:** a pilot with City Planning and CDCs, and a cross-check against the National Zoning Atlas's Pittsburgh report (forthcoming fall 2026).

## Honest limits

Decision support only, not legal advice. No infrastructure-capacity data, no market pro forma, and no prediction of approvals or construction. Tract-level data describe areas, not people. Full list: [limitations.md](limitations.md).

## Decisions needed at 09:15

1. Name
2. Two demo neighborhoods
3. Runtime LLM
4. Owners per workstream ([build-plan.md](build-plan.md))
5. P0/P1/P2 cut line ([concept.md](concept.md#scope-and-priorities-for-39-hours))

Sources: [references.md](references.md). Key local sources: HNA 2022 (C1), Ord. 2025-1579 (B3), Bill 2025-1545 (B4).
