# Massing Generator and Climate/Performance Metrics: Design Spec

*Design only, written Fri 2026-09-25 before the build window. Implementation starts Sat 09:00 ET.*

Goal: for a selected parcel and rule-set, **generate a simple 3D massing for each typology from the zoning envelope**, then **measure and simulate** a small set of climate-resilience and performance metrics per typology. The metrics feed the six scores in [concept.md](concept.md#layer-2-outcomes-what-does-it-do) and a typology × metric matrix in the UI ([ui-spec.md](ui-spec.md)).

Principles:

- **Simple and explainable beats accurate-looking.** Every metric shows its formula, inputs, and source, and is tagged as **M** (measured), **S** (simulated), **C** (published coefficient), or **H** (heuristic).
- **Metrics that don't differ between typologies** (for example, regional climate projections) are shown as *site context*, not as a typology score.

## 1. Massing generator

### Inputs

| Input | Source |
|---|---|
| Parcel polygon | Parcel boundaries (WPRDC) |
| Front lot line | The parcel edge **not shared with another parcel**, i.e., facing the right-of-way. Fallback: the edge nearest the street centerline. A UI toggle lets the user flip it |
| District rules: setbacks (front, rear, interior side, exterior side), max height (ft and stories), minimum lot size, permitted unit types | Rules table for the selected rule-set (`current`, `pre-2025`, or `bill-2025-1545`), each row with a code citation |
| Typology template: footprint width and depth (with min–max flex), stories, floor-to-floor height, roof type, units and their arrangement (side-by-side or stacked), attached or detached, typical unit size | `data/reference/typologies.json`, sourced from Parolek and MMH ([references.md](references.md) A1, A2). Values TBD Saturday, **each with a source** |
| Neighbor buildings (for shading) | Allegheny County building footprints (historical, 2015 flyover). Height is approximated as stories × 11 ft from the assessment stories field (check the data dictionary). The OpenFreeMap basemap building layer can also give 3D context |

### Steps

1. **Local frame.** Project the parcel into feet (a local tangent plane at the centroid, or EPSG:2272). Rotate so that x runs along the front lot line and y runs into the lot.
2. **Lot dimensions.** Take the oriented bounding box, giving lot width `W` and depth `D`. Irregularity = parcel area ÷ OBB area; below about 0.8, flag "irregular lot: approximate".
3. **Buildable envelope (2D).** Start from the OBB rectangle `[s_side, W − s_side] × [s_front, D − s_rear]`, then intersect it with the parcel polygon buffered inward by the smallest setback. The result is the buildable area.
4. **Zoning envelope (3D).** Extrude the buildable area to the max height, and show the story cap as floor lines.
5. **Fit each typology.**
   - Place the footprint at the front setback line, centered on the lot width.
   - If the footprint is too wide or deep, shrink it within the template's flex range.
   - If it still doesn't fit, it is a **fail**, recorded as a *deviation* (required minus available, in ft), which feeds the zoning stretch.
   - Height = stories × floor-to-floor + roof allowance, checked against max height and stories.
   - **Use check:** the typology's unit count must be permitted in the district (Ch. 911), independent of geometry.
6. **Typology specifics.**
   - **Detached:** 1 unit, one volume.
   - **ADU:** the main house plus a rear detached volume (or garage-top unit) behind the rear yard line. **Only available under `bill-2025-1545 (proposed)`**; otherwise it shows as "not permitted under current rules."
   - **Duplex:** one volume with 2 units, side-by-side or stacked.
   - **Townhouse:** `N = floor(buildable width / unit width)` attached units in a row. N = 1 means the lot is too narrow, and the tool says "needs lot assembly."
   - **Fourplex:** 2 stories × 2 units, stacked.
   - **Small multifamily:** fills the buildable area up to the max stories. Units = GFA × 0.80 efficiency ÷ average unit size, capped by any per-unit lot-area rule in force.
7. **Outputs per typology:** footprint area, GFA, FAR, lot coverage, height and stories, units (and **net** units after subtracting existing units on the lot), average unit size, open space, roof area, exposed wall area, shared (party) wall area, envelope area per unit, and a compliance list (each rule: pass, fail with deviation, or not applicable).

### Known simplifications (these go into limitations)

- Setbacks are treated as uniform per edge type. Contextual setbacks, encroachments, corner-lot rules, and accessory-structure rules are not modeled unless added to the rules table.
- Only rectangular footprints. Irregular lots are approximated.
- Roofs are prisms (flat, or a gable approximated for height).
- Neighbor heights are estimates from stories.

## 2. Metrics matrix

Rows are metrics and columns are typologies. The last column is **type** (M, S, C, H) and each metric has a tooltip with its formula and source.

### A. Housing and land (from the massing)

| Metric | Formula | Type |
|---|---|---|
| Net new units | units − existing units on the lot | M/C |
| Units per acre | units ÷ lot acres | M |
| FAR; lot coverage | GFA ÷ lot area; footprint ÷ lot area | M |
| Open space per unit | (lot − footprint − paved area) ÷ units | H (paving assumption per typology) |
| Height vs. block | height ÷ median height of neighbors within 50 m | M/H |

### B. Energy and solar

| Metric | Formula | Source | Type |
|---|---|---|---|
| **Rooftop PV potential per unit** | usable roof area (m²) × module density (kW/m²) × specific yield (kWh/kW·yr) ÷ units | Specific yield from the **NLR PVWatts v8 API** (`developer.nlr.gov/api/pvwatts/v8.json`; NSRDB TMY). An exploratory call for central Pittsburgh gave about 1,141 kWh/kW·yr at 10° tilt and 1,205 at 25° tilt. Usable fraction: about 0.7 for flat roofs and 0.5 for pitched roofs (assumption, H) | S + H |
| PV share of household electricity | PV per unit ÷ electricity per unit | RECS 2020 by housing type ([references.md](references.md) F1) | C |
| Operational energy per unit | RECS 2020 site energy per household for the matching housing type and region | F1 | C |
| Envelope area per unit (compactness) | (exposed walls + roof) ÷ units; shared walls excluded | Massing | M (geometry) |
| **Winter sun on own roof** | Share of roof area in direct sun on Dec 21 from 09:00 to 15:00 (hourly), shaded by neighbors | SunCalc sun positions + 2D shadow projection (below) | S |

### C. Neighbor impact (solar access)

| Metric | Formula | Type |
|---|---|---|
| **Shadow cast on neighbors** | Hours × area of adjacent lots newly shaded on Dec 21 (09:00–15:00), compared with the existing building | S |

**Shadow method.** For each hour, take the sun azimuth and altitude from SunCalc. The shadow length of a prism of height `h` is `h / tan(altitude)`. The shadow polygon is the convex hull of the footprint and the footprint translated by that length away from the sun. Intersect it with the neighbor lots or roofs using turf.js, then sum the shaded area across hours. This is a flat-ground approximation; on steep lots, terrain is ignored, and the tool says so.

### D. Water and heat

| Metric | Formula | Source | Type |
|---|---|---|---|
| Impervious fraction | (footprint + paved area) ÷ lot. Paving includes parking pads where parking is required; **`bill-2025-1545` removes parking minimums**, so the Reform Lens changes this metric | Massing + rules | H |
| Design-storm runoff increase | P × Σ(Cᵢ × Aᵢ) − P × Σ(Cᵢ × Aᵢ,existing), with rational-method coefficients (roof and paving about 0.95, lawn about 0.20; values to cite) | P = design depth from NOAA Atlas 14 for Pittsburgh (retrieve on Saturday) | S (simple) |
| Tree and green retention | Share of lot left unbuilt and unpaved | Massing | H |

### E. Site hazards (the same for every typology on the lot; shown on the site card and used in Buildability)

| Hazard | Method | Source | Type |
|---|---|---|---|
| Flood zone | Point-in-polygon query | FEMA NFHL REST, layer 28 (`hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`) | M |
| Slope | Share of the lot on 25%+ slope (layer), plus a slope estimate from USGS EPQS elevations at the lot corners and centroid (`epqs.nationalmap.gov/v1/json`) | WPRDC + USGS 3DEP | M |
| Undermined / landslide-prone | Intersection share | WPRDC / City GIS layers | M |

### F. Climate context (area-level, **not** per typology)

| Context | Method | Source |
|---|---|---|
| Days ≥ 90°F per year, then vs. now | Count from daily max temperature, 1991–2010 vs. 2031–2050, shown as a **range across models** | Open-Meteo Climate API, CMIP6 HighResMIP downscaled to 10 km (`climate-api.open-meteo.com/v1/climate`; free for non-commercial use; CC BY 4.0 attribution to CMIP6 and Open-Meteo) |
| Heavy-rain days (≥ 1 in) per year | Same approach | Same |

An exploratory pull for central Pittsburgh (two models) gave about 11 hot days per year in 1991–2010, rising to about 21–28 in 2031–2050, and about 5–6 heavy-rain days rising to about 6–8. That supports putting weight on heat (impervious surface, open space) and stormwater metrics. These numbers are **context for weighting, not parcel predictions**. Show the model spread.

## 3. From metrics to the six scores

| Score | Metrics used |
|---|---|
| Housing supply | Net new units, units per acre |
| Buildability | Compliance margin, slope, undermining, landslide, irregular-lot flag |
| Land & climate | PV share, energy per unit, envelope area per unit, impervious fraction, runoff increase, hazard penalties |
| Neighborhood fit | Height vs. block, shadow cast on neighbors |
| Affordability & need; Access | Tract and GTFS inputs (not from the massing) |

Each score is a min–max or threshold mapping to 0–100. The mapping is listed in the UI tooltip (H).

## 4. APIs and keys

| Service | Key? | Notes |
|---|---|---|
| NLR PVWatts v8 | Yes, free signup at developer.nlr.gov (DEMO_KEY is heavily rate-limited) | The domain moved from developer.nrel.gov (it no longer resolves). Call once for the demo area and cache the result; yield barely varies within the city |
| Open-Meteo Climate | No | Non-commercial use; attribution required. Precompute once for the city |
| FEMA NFHL REST | No | Precompute per parcel for the demo area |
| USGS EPQS | No | Precompute corner elevations for demo parcels |
| OpenFreeMap basemap | No | `tiles.openfreemap.org/styles/positron`; MapLibre adds attribution automatically |
| LLM (explanations) | Yes | Server side only |

Keys live in `.env` and are called from a small server, never from browser code.
