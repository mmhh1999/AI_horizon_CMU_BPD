# Housing Futures: web app (prototype v1, "planning workbench")

A static page (plain HTML + ES modules, no build step). MapLibre GL JS 4.7 and SunCalc 1.9 load from jsdelivr; the basemap is OpenFreeMap (no API key). The design spec is in [docs/ui-spec.md](../../docs/ui-spec.md).

## Run

```bash
cd src/app
python3 -m http.server 8791
# open http://localhost:8791 and click "Try an example parcel"
```

ES modules and `fetch` do not work from `file://`, so the page must be served over HTTP.

## Files

| File | Role |
|---|---|
| `js/config.js` | Draft district rules, scenario templates, parking and stormwater parameters, examples, source texts |
| `js/scenarios.js` | Scenario engine: massing, constraints, VIABLE / CONDITIONAL / CONSTRAINED status, qualitative levels, counterfactual chips |
| `js/axo.js` | Monochrome axonometric SVG renderer (thumbnails and expanded view) |
| `js/map.js` | Site map: parcels, selection, overlays |
| `js/ui.js` | Parcel card, future cards, expanded view, Why / Why not drawer, Sources & Assumptions |
| `js/answers.js` | Structured answers for the ask box (only computed facts) |
| `js/sun.js`, `js/geo.js` | Winter shadow; lot-aligned local frame |
| `data/area.json` | Area extract (about 2 MB; see below) |

## Data (`data/area.json`, retrieved 2026-09-25)

The extract covers the Garfield / Penn Ave / Liberty Ave area of the City of Pittsburgh:

- 3,204 parcels (Allegheny County Parcels REST);
- zoning (City PGHWebZoning);
- WPRDC Property Assessments (use, class, lot area, stories only; **no owner fields**);
- 25%+ slope, undermined areas, and landslide-prone areas (City GIS);
- FEMA NFHL (only Zone X in this area);
- PRT stops with weekday trips (GTFS feed 2606);
- 2,603 OpenStreetMap buildings (© OpenStreetMap contributors, ODbL), with heights from assessment stories.

## Placeholders (said in the UI)

- **All zoning numbers are draft placeholders** until verified against the codified Pittsburgh Code. A header flag says so.
- Typology dimensions are placeholders until sourced from Parolek 2020 and missingmiddlehousing.com.
- The ask box and chip summaries use templates. LLM phrasing needs the small server; the answers never add facts.
- Not modeled: walkability to daily destinations, ACS/CHAS need, RECS energy, infrastructure capacity, market feasibility.
