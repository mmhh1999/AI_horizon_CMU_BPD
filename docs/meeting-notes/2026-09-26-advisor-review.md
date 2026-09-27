# Advisor Review, Sat 2026-09-26 (morning, during the build window)

**Participants:** Meltem Sahin Ozkoc, Minghao Xu, David Liu, Olaf Fu (team); Azadeh Sawyer and Vivian Loftness (advisors).
**Source:** the meeting transcript, Meltem's notes, and Minghao's follow-up notes in the team chat. This is a cleaned summary, not a verbatim record.

**Status:** the team treats this review as the **current source of truth for product direction**. It supersedes the parcel-first flow in [../ui-spec.md](../ui-spec.md) where they conflict.

## The main change: lead with community needs, not code constraints

The prototype shown at the review was parcel-first: pick a lot, see what fits, see why other types don't. Both advisors asked the team to **stop leading with what is prohibited**. Codes and standards change, and a planning conversation should start from what a neighborhood needs.

New product hierarchy:

**Allegheny County → neighborhood → "What does this neighborhood need?" → development opportunities → parcel → housing futures → performance and constraints → stakeholder priorities → Why / Why not**

The "Why Not?" layer stays. It now comes after the needs and opportunities, and it reports a blocked option with its reason instead of removing it: *"Not allowed by current code, here's the reason, but let them make the decision."*

## 1. Community needs framework

- **Boundary:** use the City's neighborhood lines (for example, Larimer, Highland Park).
- **Needs to show first:**
  - Socioeconomic diversity (income and ethnicity)
  - Age diversity: multigenerational housing, ADUs
  - Transit-oriented development (TOD), so households need fewer cars
  - Whole-life access: walking distance to jobs, retail, groceries
  - Filling vacant lots and replacing vacant buildings
  - Housing types that are missing from the neighborhood's stock (for example, a neighborhood that is almost all single-family detached, with no senior or co-housing options)
- **Data:** Census/ACS for age, income, and ethnic composition.
- **Displacement and gentrification:**
  - In an underserved neighborhood, **diversify housing types and income levels** rather than adding only affordable-only stock.
  - Losing middle-income families is what flipped Larimer; young families are key to holding a mixed-income balance, which requires homes with enough bedrooms.
  - Wealthy empty nesters moving in can also flip a neighborhood.
- **College students:** transient; high demand near campuses tends to raise rents while lowering housing quality. Not a target group for stable neighborhoods.
- **Language:** say "underserved," not "poor."

## 2. Development opportunities (map layers)

Advisors' priority list for "where could intervention plausibly happen":

1. Vacant lots and abandoned buildings ("investment should start where there is distress")
2. URA- and City-owned properties (separate public dataset)
3. Deep lots and independent (detached) garages, as possible ADU sites
4. Properties of negligent absentee landlords
5. Transit nodes for densification (TOD zoning; Seattle's TOD housing rules as precedent)
6. Crime incident data, as a filtering layer and a community-needs signal
7. Green spaces: flag under-representation; proximity matters for children and seniors (the advisors recalled roughly 100–500 ft)

**Absentee landlords (handle with care):**
- The concern is owners who do no maintenance and provide no oversight, and who extract returns from distressed properties.
- The county data has no renter field, and scraping Zillow or realtor sites is not allowed.
- Proposed proxy: owners holding 2+ properties, then filtered further for signs of neglect.
- Not every multi-property owner is a problem. A community developer who lives in the neighborhood and is rebuilding it is a very different case.
- Possible responses: infill around such properties, a public buyout, or stricter county rules.
- Open question raised in the meeting: how this helps a developer-facing tool. The team decided to show it as a **context signal**, never as a target list.

**Zoom flow:** county map → click a neighborhood → vacant lots highlighted → click a parcel → community needs plus options.

Minghao's follow-up framing: an **Opportunity Layer** tags parcels with one or more signals (VACANT LOT, PUBLICLY OWNED, ABANDONED BUILDING, DEEP LOT, GARAGE / ADU POTENTIAL, ABSENTEE LANDLORD, TRANSIT DENSIFICATION). It does not recommend redevelopment automatically. It marks where further housing exploration may be especially relevant. Ownership condition is never assumed to justify redevelopment.

Workflow: **Community need → Development opportunity → Zoning + physical constraints → Plausible housing futures → Equity + climate + feasibility trade-offs → Why / why not?**

## 3. Housing types and environmental goals

- **More missing-middle options** than the three defaults suggested by the organizers:
  - Live-work units
  - Multigenerational housing
  - Duplex, triplex, fourplex
  - Townhouse
  - Courtyard building
  - ADU
- **Framing** (from *Missing Middle Housing*): *it is not about adding density; it is about which housing type, at what scale, in what configuration, makes sense in this location.* The advisors asked that this be stated boldly in the product and the pitch.
- **Fourplex best practice:**
  - Give each unit its own porch: two ground-floor porches left and right, and two upper porches on a stepped-back form.
  - This keeps eyes on the street and engagement with the community.
  - A single shared entry with a row of mailboxes gives nothing back to the street.
- **Environmental goals to surface early:**
  - **Right to sun (solar envelope):**
    - A solar envelope defines a build boundary *inside* the zoning envelope, so a building gains sun without shading its neighbors.
    - Solar access protection is law in some U.S. jurisdictions. The advisors named Colorado and New York; Boulder's solar fence ordinance is the best-documented example (see [references.md](../references.md) F4–F5).
    - Most people fight over views and only discover the loss of winter sun after a building goes up.
    - This is a differentiator for an architecture-school team.
  - **Compactness** (surface area to volume): townhouses and fourplexes are cheaper to heat and cool than detached houses.
  - **TOD:** reduce car dependence and on- and off-street parking.
- **Zero-lot-line development:**
  - Required side setbacks create unusable gaps between detached houses.
  - Philadelphia allows attached and semi-detached buildings without side yards. Advisors believe this is not available in Pittsburgh.
  - Treat it as a *rule change* in the Why Not layer, not as current law.
- **AI renderings:** generate a good-looking example of each type (for example, an attractive duplex) to counter negative preconceptions. Keep street vibrancy central in any image.

## 4. Community safety and social cohesion (from Minghao's notes)

- Treat safety as a **community condition and planning objective**. Do not claim that a housing type directly reduces crime.
- Use police data as **context, not a ranking.** Do not show "Crime score: 42, bad neighborhood." Say, for example: *"Community safety context: elevated reported incidents in the surrounding area relative to the comparison period."*
- Then connect to design questions: could this housing future add active frontage, occupied ground floors, porches, shared outdoor space, and pedestrian activity?
- **Caveats to show:** spatial accuracy, reporting practices, and privacy aggregation.
- **Desired futures:** everyday street presence; welcoming sidewalks; shared green and social spaces; socioeconomic and demographic diversity.
- **Revised objective:** *support housing futures that combine community safety context with active streets, usable shared spaces, walkability, and socioeconomic diversity, while being explicit that built form is only one part of a much larger social system.*

## 5. Stakeholder weighting

- Stakeholders weight their priorities (for example, climate, affordability, displacement, equity, housing production), totaling 100. The tool then surfaces the best-fit options and shows why each option does or does not work.
- **Order matters:** community needs first, so the user is informed about what the neighborhood needs; stakeholder weights come after.

## Next steps (agreed)

| Item | Owner |
|---|---|
| Vacant-lot and URA/City-owned layers | Team (branch `mso-v0`: Meltem) |
| Solar envelope in the tool | Team (branch `mso-v0`: Meltem) |
| Crime-incident and green-space layers | Team (branch `mso-v0`: Meltem) |
| Absentee-landlord proxy, handled carefully | Team (branch `mso-v0`: Meltem) |
| Seattle TOD zoning rules | Azadeh |
| Submission | Sun 2026-09-27, 23:59 ET |

The codebase is shared on GitHub. Each member iterates on a branch, and selected features are merged back.
