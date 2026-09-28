# Housing Futures: “Why-Not?”

**AI Horizons 2026 · AI for Housing Hackathon (Pittsburgh) · Track 3: Housing Typology, Equity & Climate Matchmaker**

**Housing Futures** is a decision-support tool for exploring what kinds of housing could make sense in a real Pittsburgh neighborhood and on a real parcel.

Instead of starting with “How much density can we fit?”, the tool starts with a more useful question:

> **What does this neighborhood need, where could intervention happen, and which housing futures make sense here?**

The workflow moves from the regional scale down to an individual site:

**County → Neighborhood → Community needs → Development opportunities → Parcel → Housing futures → Performance + constraints → Stakeholder priorities → Why / Why not**

For a selected parcel, Housing Futures compares multiple housing types and shows:

- what can plausibly fit;
- what each option contributes to housing supply, affordability needs, access, environmental performance, and neighborhood fit;
- where zoning, site conditions, or other constraints become binding;
- how different stakeholder priorities change the ranking;
- and what would have to change for another housing future to become more viable.

The goal is not to identify one universal “best” answer. It is to make the trade-offs visible.

---

## What the tool does

Housing Futures combines public data, parcel-level analysis, transparent scoring, and AI-assisted explanation into one interactive workflow.

### 1. Understand the community

The experience begins at the neighborhood scale rather than immediately asking the user to choose a parcel.

It brings together demographic, housing, transit, environmental, vacancy, and development-opportunity context to help users understand:

- who lives in the neighborhood;
- what housing pressures or needs may exist;
- where vacant or underused land may create opportunities;
- and which local conditions should be considered before proposing new housing.

### 2. Find development opportunities

Users can explore potential intervention sites such as:

- vacant lots and buildings;
- publicly owned land;
- deep lots and garages;
- transit-oriented locations;
- and other parcels where additional housing may be plausible.

The map supports a County → City → neighborhood → parcel workflow so users can move between broader community context and site-specific decisions.

### 3. Compare housing futures

For a real parcel, the tool compares a range of housing types, including:

- detached homes;
- accessory dwelling units;
- duplexes and triplexes;
- townhouses;
- fourplexes;
- cottage courts;
- small multifamily buildings;
- and other missing-middle configurations.

Each option is evaluated using a combination of site conditions, housing outcomes, planning context, and user-defined priorities.

Housing illustrations are intentionally generic examples of each housing type rather than site-specific architectural proposals.

### 4. Make trade-offs explicit

Housing Futures separates three things that are often mixed together:

| Layer | Question | What it represents |
|---|---|---|
| **Constraints** | Can this housing type plausibly fit here? | Site conditions, parcel geometry, and zoning assumptions |
| **Outcomes** | What could this option contribute? | Housing supply, affordability need, access, environmental performance, neighborhood fit, and related indicators |
| **Values** | What matters most to this user? | Editable stakeholder priorities and weights |

This separation helps users distinguish between a conclusion driven by data and one driven by a particular set of priorities.

---

## Stakeholder perspectives

Different users can approach the same parcel differently.

Housing Futures includes perspectives for:

- policy makers;
- community organizations;
- developers;
- architects and designers;
- and investors.

Each perspective begins with a different set of priorities, but all weights remain visible and editable.

The ranking therefore reflects the user's stated priorities rather than a hidden definition of what is “best.”

---

## “Why?” and “Why not?”

A core feature of the project is explaining decisions rather than simply showing a ranking.

For any housing option, the interface can help answer questions such as:

- Why does this option rank above another?
- Why does a fourplex not fit here?
- Which constraint matters most?
- Would another stakeholder prioritize this differently?
- What would need to change for another option to become competitive?

The tool frames these explanations through three types of change:

**Values** — how the user's priorities would need to change.

**Rules** — whether zoning or another regulatory constraint is binding.

**Site** — whether parcel geometry, slope, hazard conditions, or other physical facts limit the option.

This “Why-Not?” framing is intended to turn the ranking into a conversation about alternatives rather than a black-box recommendation.

---

## Horizon: the planning copilot

**Horizon** is the project's AI planning copilot.

It is available throughout the workflow and can explain the information already present in the application in plain language.

For example, users can ask Horizon to:

- summarize what stands out about a neighborhood;
- explain why particular sites appear as opportunities;
- interpret differences between housing types;
- explain a ranking;
- or clarify what is preventing another option from ranking higher.

Horizon does **not** generate the underlying scores or decide which housing type is best.

The application's calculations remain deterministic and inspectable. The language model receives structured results that the application has already computed and translates them into explanations.

For numerical explanations, the server checks that numbers mentioned by the model were present in the supplied application context. If the response is not sufficiently grounded, the interface falls back to deterministic template text.

The dashboard itself continues to work without the AI server.

---

## Data and analysis

Housing Futures uses public data from the City of Pittsburgh, Allegheny County, regional agencies, and national sources.

Examples include:

- Allegheny County parcels and property assessments;
- City of Pittsburgh zoning and property datasets;
- vacant, condemned, publicly owned, and other opportunity-site datasets;
- Pittsburgh slope, undermining, and landslide information;
- Pittsburgh Regional Transit GTFS data;
- Census ACS demographic and housing indicators;
- parks and green-space data;
- Pittsburgh Police public records;
- Smell Pittsburgh data from the CMU CREATE Lab;
- housing-cost and building-type references;
- and local policy documents such as the Pittsburgh Housing Needs Assessment.

The data pipeline records source provenance and includes privacy checks intended to keep owner names and mailing addresses out of exported application data.

See:

- [`docs/data-sources.md`](docs/data-sources.md) for the full data inventory and caveats;
- [`docs/references.md`](docs/references.md) for research and policy references;
- [`docs/limitations.md`](docs/limitations.md) for known limitations.

---

## Equity and community context

Housing Futures treats equity as context for decision-making rather than as an “investment opportunity” score.

The tool considers issues such as:

- existing housing on the parcel;
- whether new development creates net-new units;
- neighborhood housing need;
- vacancy and disinvestment;
- affordability pressure;
- access to transit and green space;
- and possible displacement concerns.

Police and Smell Pittsburgh data are presented only as contextual information. They are not converted into neighborhood “safety,” “quality,” or desirability scores and do not determine the housing ranking.

---

## Environmental and site considerations

The tool includes several environmental and physical-planning indicators, such as:

- parcel geometry;
- compactness;
- transit proximity;
- green-space access;
- slope and landslide conditions;
- undermining;
- and an optional solar-envelope / winter-sun analysis.

These indicators are intended to support early-stage comparison, not replace architectural, engineering, survey, geotechnical, or permitting work.

---

## Running the project

### Basic application

The core application is a static web app and can be run with:

```bash
python3 -m http.server 8795 --directory src/app
```

Then open:

```text
http://localhost:8795/
```

The application opens on the County map.

For a quick walkthrough, choose **Try an example lot** to open the Larimer demonstration site.

Map tiles and some external assets require an internet connection.

---

## Optional AI server

Horizon and the “Explain in plain language” features use a small local Python server.

Install the dependencies:

```bash
pip install -r src/server/requirements.txt
```

Add a supported API key to `.env`, following `.env.example`, then run:

```bash
python3 src/server/app.py
```

The default configuration uses Groq, with Claude available as an alternative provider.

The AI service is optional. Without it, the core application and deterministic analyses still work.

---

## Rebuilding the data

To rebuild the public-data pipeline:

```bash
python3 -m venv .venv
.venv/bin/pip install -r src/pipeline/requirements.txt

.venv/bin/python src/pipeline/fetch.py
.venv/bin/python src/pipeline/build.py
.venv/bin/python src/pipeline/check.py
```

The fetch step downloads the source datasets into git-ignored directories.

The build step creates the derived application data.

The check step validates coverage, schema, file sizes, and privacy requirements.

---

## Repository structure

```text
.
├── README.md
├── docs/
│   ├── pitch.md
│   ├── concept.md
│   ├── ai-design.md
│   ├── data-sources.md
│   ├── references.md
│   ├── limitations.md
│   ├── ai-usage-log.md
│   └── meeting-notes/
├── data/
│   └── reference/
├── src/
│   ├── app/
│   ├── pipeline/
│   └── server/
└── tests/
```

---

## AI use and disclosure

AI is used in two distinct ways in this project:

### Runtime AI

Horizon and the plain-language explanation features translate existing application results into conversational explanations.

AI does not determine feasibility, set stakeholder weights, calculate scores, or produce the underlying rankings.

### Development tools

The team used AI-assisted development tools including Claude Code, Cursor, OpenAI Codex, Cursor image generation, and OpenAI image generation.

The project's AI usage is documented in:

[`docs/ai-usage-log.md`](docs/ai-usage-log.md)

Additional design principles and guardrails are documented in:

[`docs/ai-design.md`](docs/ai-design.md)

---

## Team

**Minghao Xu**  
Project concept and planning documentation; repository integration; runtime AI architecture; Horizon planning copilot; AI explanation and grounding system.

**Meltem Sahin Ozkoc**  
Community-first product direction; data pipeline and neighborhood-needs framework; opportunity-site analysis; housing typologies and performance metrics; interface integration and demo narrative.

**David Liu (Fengrui)**  
Neighborhood context; cost explorer; stakeholder perspectives; ranked shortlist; search and interaction improvements; housing-type visual assets.

**Olaf Fu**  
Staged, map-first user journey and interface workflow.

**Advisors:** Azadeh and Vivian, providing references and site-evaluation criteria.

---

## Important limitations

Housing Futures is an exploratory planning and decision-support prototype.

It is **not**:

- legal or zoning advice;
- a permit determination;
- an engineering or geotechnical assessment;
- a financial feasibility study;
- an investment recommendation;
- or a prediction of development approval.

Some zoning values and housing-type assumptions remain prototype-level inputs and require professional verification.

Any real project should confirm zoning interpretations with the City of Pittsburgh and use appropriate site survey, architectural, engineering, financial, and geotechnical analysis.

See [`docs/limitations.md`](docs/limitations.md) for the full limitations statement.

---

## Core idea

> **Housing Futures is not trying to tell Pittsburgh what to build.**

It is designed to help planners, communities, designers, developers, and other stakeholders understand the housing futures a place could hold — and make the trade-offs behind those choices visible.
