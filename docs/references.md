# References

Each entry gives the citation, what it grounds in our tool, and where it is used. Codes such as [D1] are used in [concept.md](concept.md) and [ai-design.md](ai-design.md). Bibliographic details were checked on 2026-09-25. Datasets are in [data-sources.md](data-sources.md).

**Team rules**

1. A reference goes here only if we can say which module or claim it supports.
2. When we cite a specific number or definition, record the page.
3. In the UI and the video, describe evidence as evidence ("studies of X found Y"), not as a prediction for the parcel on screen.

## A. Housing typology and site evaluation

| # | Citation | Grounds | Used in |
|---|---|---|---|
| A1 | Parolek, D. G., with Nelson, A. C. (2020). *Missing Middle Housing: Thinking Big and Building Small to Respond to Today's Housing Crisis.* Island Press. ISBN 978-1-64283-054-5. | Typology definitions and building and lot geometry (fourplex, duplex, townhouse, cottage court) | Typology table; Layer 1; supply score |
| A2 | Opticos Design. *Missing Middle Housing* (website). https://missingmiddlehousing.com/ | Per-type specs, used to cross-check A1 | Typology table |
| A3 | Peiser, R. B., & Hamilton, D. (2012). *Professional Real Estate Development: The ULI Guide to the Business* (3rd ed.). Urban Land Institute. ISBN 978-0-87420-163-5. | Developer-style site evaluation: market, location, physical, infrastructure, legal, access | Structure of Layers 1–2; what we mark as out of scope |
| A4 | U.S. Green Building Council. *LEED v4 for Neighborhood Development* (reference guide). https://www.usgbc.org/guide/nd | Principles only (smart location, compact pattern, transit). **We do not compute a LEED score.** | Land & climate; Access |
| A5 | HUD PD&R (2026, March 5). "The Picket Fence: Evaluating Systems-Built Housing Approaches in Pittsburgh." *PD&R Edge.* https://www.huduser.gov/portal/pdredge/pdr-edge-trending-030526.html | A modular missing-middle concept home in Garfield; HUD-funded evaluation by the University of Pittsburgh, final report expected in 2026 | Demo neighborhood; continuation story (no numbers unless the report publishes them) |
| A6 | Benson, E. M., & Bereitschaft, B. (2020). "Are LEED-ND developments catalysts of neighborhood gentrification?" *International Journal of Urban Sustainable Development*, 12(1), 73–88. https://doi.org/10.1080/19463138.2019.1658588 | Green or "smart growth" siting can come with gentrification | Equity lens caveat; why we don't sell "green = good" |

Notes: "Zoning stretch" came to us from Azadeh. Find the page in A1 before calling it Parolek's term. A 4th edition of A3 (2023, with additional co-authors) exists, so cite the edition we actually consulted.

## B. Law: Pittsburgh zoning code and legislation

| # | Citation | Grounds | Used in |
|---|---|---|---|
| B1 | City of Pittsburgh. *Code of Ordinances*, Title Nine (Zoning), Ch. 903, Residential Zoning Districts. eCode360. https://ecode360.com/45474194 (Title Nine index: https://ecode360.com/45474054) | Districts R1D, R1A, R2, R3, RM and their density subdistricts; lot size, setbacks, height | Rules tables; Layer 1 |
| B2 | Same code, Ch. 911, Primary Uses (§911.02 Use Table). eCode360, via the index above | Which residential uses are permitted in each district | Layer 1 use check |
| B3 | City of Pittsburgh (2025). Ordinance amending Ch. 903 "to reduce required minimum lot sizes." File No. 2025-1579; passed 2025-05-05, signed and effective 2025-05-07. https://pittsburgh.legistar.com/LegislationDetail.aspx?ID=7248895&GUID=DC74390E-DCCC-41E1-92E2-9923E1E1B5FB | Reduced minimum lot sizes across residential subdistricts (e.g., Very Low-Density minimum lot 8,000 to 6,000 sf). **Open question:** EngagePgh [C2] says it *removed* the minimum lot size per unit, but our text extraction of the ordinance suggests the per-unit values remain. Settle this from the codified eCode360 text, not from the amending ordinance, because strikethrough formatting is lost in plain text | `current` vs. `pre-2025` rule-sets |
| B4 | City of Pittsburgh. Council Bill 2025-1545 (zoning text amendment: ADUs, Affordable Housing Bonus Program, parking). Planning Commission recommended it 2026-06-02; Council public hearing 2026-09-23; **vote pending as of 2026-09-25.** Hearing page: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026 | As proposed: ADUs allowed citywide as accessory to residential uses, no owner-occupancy requirement, up to two per lot; an optional affordable housing density bonus (which replaced a mandatory citywide inclusionary zoning draft in Oct 2025); removal of minimum off-street parking | `bill-2025-1545` rule-set (labeled "proposed") |
| B5 | City of Pittsburgh, Dept. of City Planning. *Zoning Code.* https://pittsburghpa.gov/dcp/zoning-code | The City's authority over interpretation | Disclaimer; escalation |
| B6 | City of Pittsburgh, Zoning Board of Adjustment. https://pittsburghpa.gov/dcp/zba | The venue for variances and special exceptions | "Kind of relief" wording |

Code version: eCode360 showed Pittsburgh legislation through 2026-08-05 when we checked. Record the retrieval date in every rules table.

## C. Pittsburgh plans, markets, and local analyses

| # | Citation | Grounds | Used in |
|---|---|---|---|
| C1 | City of Pittsburgh, Dept. of City Planning (2022, January). *Housing Needs Assessment: Final Report* (prepared by HR&A Advisors). https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/21887_pittsburgh_hna_final_report.pdf | **p. 19:** missing-middle rental demand of about 1,900 units, about a third of projected rental need. **pp. 20–23:** displacement from rising rents (Lawrenceville, Brookline, Mt. Washington, Hill District) *and* from deteriorating conditions and vacancy (Allentown, Knoxville, Mt. Oliver). **p. 28:** multi-unit (4+) development is allowed on only 23% of city land; redlining legacy. **pp. 31–32:** minimum lot size per unit tables; share of parcels below minimum lot size. **pp. 38, 43:** "soft density" 2–4 units and by-right duplexes recommended. **pp. 42–43:** recommended *Anti-Displacement Review* of zoning changes | Reform Lens; replication check; equity lens; problem framing in the pitch (page numbers are PDF pages) |
| C2 | City of Pittsburgh. *Implementing the Housing Needs Assessment* (EngagePgh; updated June 2026). https://engage.pittsburghpa.gov/implementing-housing-needs-assessment | Status of each reform: lot size (passed), and ADUs, parking, and the affordable bonus (pending) | Rule-set status labels |
| C3 | Allegheny County Economic Development & Urban Redevelopment Authority of Pittsburgh, with Reinvestment Fund (2021). *Housing Market Value Analysis 2021.* WPRDC: https://data.wprdc.org/dataset/market-value-analysis-2021 | Block-group market clusters | Equity lens: market context |
| C4 | National Zoning Atlas. *Pennsylvania Zoning Atlas* (in progress; "Zoning Report: Pittsburgh" forthcoming fall 2026). https://www.zoningatlas.org/pennsylvania | An independent, standardized reading of Pittsburgh-area zoning | Cross-check for our rules table; continuation partner |

## D. Decision analysis and explanation

| # | Citation | Grounds | Used in |
|---|---|---|---|
| D1 | Lahdelma, R., Hokkanen, J., & Salminen, P. (1998). "SMAA: Stochastic multiobjective acceptability analysis." *European Journal of Operational Research*, 106(1), 137–143. https://doi.org/10.1016/S0377-2217(97)00163-X | Exploring the whole weight space to see which valuations make each alternative best, without asking users for exact weights | Robustness strip (rank-1 acceptability) |
| D2 | Lahdelma, R., & Salminen, P. (2001). "SMAA-2: Stochastic Multicriteria Acceptability Analysis for Group Decision Making." *Operations Research*, 49(3). | Rank acceptability indices and central weight vectors for groups | Central weights ("people who pick X typically value…") |
| D3 | Miller, T. (2019). "Explanation in artificial intelligence: Insights from the social sciences." *Artificial Intelligence*, 267, 1–38. https://arxiv.org/abs/1706.07269 | People ask *contrastive* questions ("why P rather than Q?") | Designing "Why A, not B?" |
| D4 | Wachter, S., Mittelstadt, B., & Russell, C. (2018). "Counterfactual Explanations without Opening the Black Box: Automated Decisions and the GDPR." *Harvard Journal of Law & Technology*, 31(2), 841–887. https://arxiv.org/abs/1711.00399 | Explanation as "the smallest change that would flip the outcome" | Tipping points; the three levers |
| D5 | Keeney, R. L. (1992). *Value-Focused Thinking: A Path to Creative Decisionmaking.* Harvard University Press. | Making values explicit and separate from facts and alternatives | Layer 3; DATA vs. VALUE tags |
| D6 | Malczewski, J. (2006). "GIS-based multicriteria decision analysis: a survey of the literature." *International Journal of Geographical Information Science*, 20(7), 703–726. https://doi.org/10.1080/13658810600661508 | The standard framing for weighted overlay and suitability; places our method in GIS-MCDA | Methods section of the README |
| D7 | Klosterman, R. E. (1999). "The What if? collaborative planning support system." *Environment and Planning B*, 26(3), 393–408. | Precedent for scenario-based planning support systems | Positioning: what's new in our tool |

## E. Housing supply, zoning reform, and equity evidence

| # | Citation | Finding (short) | Used in |
|---|---|---|---|
| E1 | Asquith, B. J., Mast, E., & Reed, D. (2023). "Local Effects of Large New Apartment Buildings in Low-Income Areas." *Review of Economics and Statistics*, 105(2), 359–375. | New buildings lowered nearby rents by about 6% relative to comparison units | Equity evidence panel |
| E2 | Mast, E. (2023). "JUE Insight: The effect of new market-rate housing construction on the low-income housing market." *Journal of Urban Economics*, 133, 103383. | Migration chains: new market-rate units open up units in lower-income areas | Equity evidence panel |
| E3 | Been, V., Ellen, I. G., & O'Regan, K. (2019). "Supply Skepticism: Housing Supply and Affordability." *Housing Policy Debate*, 29(1), 25–40. https://doi.org/10.1080/10511482.2018.1476899 | Supply moderates prices; it is necessary but not sufficient, and subsidy is still needed | Framing; limitations |
| E4 | Freemark, Y. (2020). "Upzoning Chicago: Impacts of a Zoning Reform on Property Values and Housing Construction." *Urban Affairs Review*, 56(3), 758–789. | Upzoned parcels rose in value, with no short-run construction increase | The counterweight in the equity panel; why the Reform Lens shows *eligibility*, not predicted construction |
| E5 | Chapple, K., & Zuk, M. (2016). "Forewarned: The Use of Neighborhood Early Warning Systems for Gentrification and Displacement." *Cityscape*, 18(3), 109–130. | How displacement-risk tools are used, including strategically | Why the equity lens is context, not a ranking |
| E6 | Kulka, A., Sood, A., & Chiumenti, N. (2026). "Under the (Neighbor)Hood: Understanding Interactions Among Zoning Regulations." *Review of Economics and Statistics*. https://doi.org/10.1162/REST.a.1736 (SSRN 4082457) | Zoning rules interact; density limits (minimum lot size, units per lot) matter most | Binding-constraint analysis |
| E7 | Einstein, K. L., Glick, D. M., & Palmer, M. (2019). *Neighborhood Defenders: Participatory Politics and America's Housing Crisis.* Cambridge University Press. | Public land-use participation skews toward opponents | Defining "neighborhood fit" physically; widening who can see the tradeoffs |
| E8 | Greenaway-McGrevy, R., & Phillips, P. C. B. (2023). "The impact of upzoning on housing construction in Auckland." *Journal of Urban Economics*, 136, 103555. | Large-scale upzoning stimulated construction | Reform Lens context |
| E9 | Hamilton, E. (2024). "The Effects of Minimum-Lot-Size Reform on Houston Land Values." *Cityscape*, 26(3). https://www.huduser.gov/portal/periodicals/cityscape/vol26num3/article9.html | Evidence from Houston's minimum-lot-size reform | Context for Pittsburgh's 2025 lot-size change |

## F. Climate, energy, and travel

| # | Citation | Grounds | Used in |
|---|---|---|---|
| F1 | U.S. EIA. *2020 Residential Energy Consumption Survey (RECS)*, consumption and expenditure tables by housing type. https://www.eia.gov/consumption/residential/ | Energy per household for single-family detached, single-family attached, 2–4 unit apartments, and 5+ unit apartments; **pick the regional or climate table that matches Pittsburgh** | Land & climate coefficients |
| F2 | Goldstein, B., Gounaridis, D., & Newell, J. P. (2020). "The carbon footprint of household energy use in the United States." *PNAS*, 117(32), 19122–19130. https://doi.org/10.1073/pnas.1922205117 | Floor area and housing form drive residential emissions | Rationale for the climate score |
| F3 | Ewing, R., & Cervero, R. (2010). "Travel and the Built Environment: A Meta-Analysis." *Journal of the American Planning Association*, 76(3), 265–294. https://doi.org/10.1080/01944361003766766 | VMT is most strongly related to destination accessibility | Access and transport-emissions proxy |
| F4 | Knowles, R. L. (2003). "The solar envelope: its meaning for energy and buildings." *Energy and Buildings*, 35(1), 15–25. https://doi.org/10.1016/S0378-7788(02)00076-2 | The solar envelope: the largest volume on a lot that does not overshadow its surroundings during a chosen solar-access period | Solar envelope in the Performance layer ("right to sun") |
| F5 | City of Boulder, CO. Boulder Revised Code §9-9-17, *Solar Access* (adopted 1984). City guide: https://bouldercolorado.gov/services/solar-access-guide | A hypothetical "solar fence" (12 ft in Solar Access Area I, 25 ft in Area II) on the lot lines; new structures may not shade a protected lot more than that fence would, from two hours before to two hours after local solar noon on Dec 21 | Default parameters of our solar envelope; the precedent behind "solar access is law in some jurisdictions" (not Pittsburgh) |
| F6 | WHO Regional Office for Europe (2016). *Urban green spaces and health: a review of evidence.* WHO/EURO:2016-3352-43111-60341; and WHO (2017), *Urban green spaces: a brief for action* | Rule of thumb: residents should be able to reach a public green space of at least 0.5–1 ha within 300 m linear distance (about a 5-minute walk). Evidence on mental health, physical activity, and obesity | Green-space access threshold (300 m ≈ 1,000 ft); the advisors' 100–500 ft figure is shown as a stricter "next door" band |

## K. Rule precedents from other cities (used only as "what would have to change")

| # | Citation | Grounds | Used in |
|---|---|---|---|
| K1 | City of Philadelphia, Zoning Code Title 14, §14-101 definitions ("Building, Attached": both side walls on the side lot lines) and yard provisions; RSA-5 district standards (no side yard on attached sides). https://www.phila.gov/zoning-summary-generator/ | Attached and semi-detached buildings need no side yard, which removes the unusable gaps between houses (zero-lot-line) | A Rules-lever chip ("allow zero-lot-line / attached forms"), labeled **not Pittsburgh law** |
| K2 | Sauer, L. Penn's Landing Square, Philadelphia (1970): about 45 units per acre in 2–3-story intertwined townhouses, each with private outdoor space | Precedent for dense low-rise housing without side-yard dead zones (raised by V. Loftness) | Housing-type narrative; illustration prompts |
| K3 | Seattle transit-oriented development housing rules | **To do (owner: Azadeh).** Precedent for allowing denser apartments and senior housing at transit nodes | TRANSIT NODE opportunity tag; TOD lever |

## G. AI reliability and governance

| # | Citation | Grounds | Used in |
|---|---|---|---|
| G1 | Bartik, A., Gupta, A., & Milo, D. *The Costs of Housing Regulation: Evidence From Generative Regulatory Measurement.* Working paper, SSRN 4627587. Code and data: https://github.com/dmilo75/ai-zon | LLMs can extract zoning rules at scale when validated (reported 96% accuracy on binary questions and 0.92 correlation for minimum lot size) | A1 extraction design; possible cross-check if Pittsburgh is covered |
| G2 | Dahl, M., Magesh, V., Suzgun, M., & Ho, D. E. (2024). "Large Legal Fictions: Profiling Legal Hallucinations in Large Language Models." *Journal of Legal Analysis*, 16(1), 64–93. https://doi.org/10.1093/jla/laae003 | High hallucination rates on specific legal questions (58–88% in their tests) | Why the LLM never answers legal questions freely |
| G3 | Magesh, V., Surani, F., Dahl, M., Suzgun, M., Manning, C. D., & Ho, D. E. (2025). "Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools." *Journal of Empirical Legal Studies*, 22, 216–242. https://doi.org/10.1111/jels.12413 | Even retrieval-augmented legal tools hallucinate | Why every zoning rule is human-verified |
| G4 | NIST (2023). *Artificial Intelligence Risk Management Framework (AI RMF 1.0)*, NIST AI 100-1. https://doi.org/10.6028/NIST.AI.100-1 | The Govern, Map, Measure, Manage structure | Structure of the risk table in the limitations |
| G5 | Bronin, S. C., & Ilyankou, I. *How to Make a Zoning Atlas: A Methodology for Translating and Standardizing District-Specific Regulations.* SSRN 3996609. | A standard schema for district rules | Field design for our rules table |

## H. Tools and specifications

| # | Citation | Note |
|---|---|---|
| H1 | Walk Score. *Professional APIs.* https://www.walkscore.com/professional/walk-score-apis.php | Optional; proprietary terms. Our default is our own access measure (GTFS plus OSM) |
| H2 | GTFS Schedule Reference. https://gtfs.org/documentation/schedule/reference/ | Parsing PRT stops and trips |

## I. Papers and benchmarks from the team doc (to do)

Fengrui collected benchmarks and papers in the shared doc. Move each item here in the table format above. Priority goes to anything that justifies transit distance thresholds, how need indicators are mapped to 0–100, and default persona weights (Olaf's question).

## J. Hackathon materials

- AI Horizons 2026. *AI for Housing Hackathon: Participant Packet.*
- Challenge 03 brief: https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate.html
- Organizer data catalog: https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA
