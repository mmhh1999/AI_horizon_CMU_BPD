# Data Sources

All sources are public. Most rows come from the organizer's data catalog; caveats are quoted or condensed from it. **When a dataset is downloaded, record the retrieval date and version here.** Vintages must line up; for example, ACS 2020–2024 joins to 2020 census tract boundaries.

## Core (team shortlist, 2026-09-25)

| Dataset | Steward | Grain / join key | Used for | Caveat | Retrieved |
|---|---|---|---|---|---|
| [Allegheny County Parcel Boundaries](https://data.wprdc.org/dataset/allegheny-county-parcel-boundaries) | Allegheny County GIS / WPRDC | Parcel polygon / parcel ID | Lot area and approximate dimensions; spatial joins to everything else | Geometry and assessment records update on different schedules; validate parcel IDs | |
| [Allegheny County Property Assessments](https://data.wprdc.org/dataset/property-assessments) | Allegheny County / WPRDC | Parcel / parcel ID | Land use, existing building (stories, year), vacancy signals, neighborhood scale | Stale or missing fields; **assessed value is not market value**. **Drop owner and mailing-address fields at ingest** | |
| [Pittsburgh Zoning Districts](https://data.wprdc.org/dataset/pittsburgh-zoning) | City of Pittsburgh / WPRDC | Zoning polygon / spatial join | Base district per parcel | "Map alone is insufficient: overlays, definitions, exceptions, and review rules matter" | |
| Pittsburgh Zoning Code, Ch. 903 and 911 | City of Pittsburgh (eCode360) | Section number | Rules table (AI extraction plus human verification) | The City has final say on interpretation; cite sections and flag ambiguity. See [references.md](references.md#b-law-pittsburgh-zoning-code-and-legislation) | |
| [Pittsburgh 25% or Greater Slope](https://data.wprdc.org/dataset/25-or-greater-slope) | City of Pittsburgh / WPRDC | Slope polygon / spatial join | Buildability, hazard penalty | Derived threshold layer; not a substitute for survey or geotech | |
| [Pittsburgh Undermined Areas](https://data.wprdc.org/dataset/undermined-areas) | City / County / WPRDC | Polygon / spatial join | Buildability, hazard flag | Historic mine maps can be incomplete; **never use alone for safety decisions** | |
| [Pittsburgh Regional Transit GTFS](https://data.wprdc.org/dataset/port-authority-of-allegheny-county-transit-data) | PRT / WPRDC | Stop, route, trip / stop ID | Access score (distance, scheduled trips per day); Land & climate | Scheduled service is not realized reliability; the agency appears as "Port Authority" in older data | |
| [ACS 2020–2024 5-year](https://www.census.gov/data/developers/data-sets/acs-5year.html) (released 2026-01-29) | U.S. Census Bureau | Tract or block group / GEOID | Affordability & need, demand context, displacement caution flag | Margins of error, so avoid false precision; tract values are not parcel facts | |
| [TIGER/Line 2020 tracts](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) | U.S. Census Bureau | Tract / GEOID | Joining ACS to parcels | Boundary vintage must match the statistics | |
| Missing Middle Housing type specs ([Parolek 2020](references.md#a-housing-typology-and-site-evaluation); [missingmiddlehousing.com](https://missingmiddlehousing.com/)) | Island Press / Opticos Design | Typology | Typology geometry: footprint, stories, units, lot size | Generic national specs; Pittsburgh lots and topography differ | |

## Added in v2 (see [concept.md](concept.md#what-changed-from-v1-and-why))

| Dataset | Steward | Grain / join key | Used for | Caveat | Retrieved |
|---|---|---|---|---|---|
| [Landslide Prone Areas](https://pghgishub-pittsburghpa.opendata.arcgis.com/maps/pittsburghpa::landslide-prone-areas) (also on [WPRDC](https://data.wprdc.org/en_GB/dataset/landslide-prone-areas)) | City of Pittsburgh GIS | Polygon / spatial join | Site constraint and climate-hazard flag | Screening layer; see also the [Allegheny County Landslide Portal](https://landslide-portal-alcogis.opendata.arcgis.com/) | |
| [Housing Market Value Analysis 2021](https://data.wprdc.org/dataset/market-value-analysis-2021) | ACED / URA with Reinvestment Fund | Block group / GEOID | Equity lens: market context (appreciating vs. weak markets) | 2021 vintage; clusters describe markets, not people; never used as an investment ranking | |
| [EIA RECS 2020](https://www.eia.gov/consumption/residential/) consumption tables | U.S. EIA | Housing type × region or climate | Operational energy per unit by typology | National survey; pick the matching regional or climate table and record the table ID | |
| Pittsburgh Code, rule-set versions (`pre-2025`, `current`, `bill-2025-1545`) | City of Pittsburgh | Section number | Reform Lens | Pending and hypothetical rule-sets are labeled "proposed, not law." See [references.md § B](references.md#b-law-pittsburgh-zoning-code-and-legislation) | |

## APIs and services (for massing and metrics; see [massing-and-metrics.md](massing-and-metrics.md#4-apis-and-keys))

| Service | Endpoint | Used for | Terms / caveat | Checked |
|---|---|---|---|---|
| NLR PVWatts v8 | `https://developer.nlr.gov/api/pvwatts/v8.json` | Specific PV yield (kWh/kW·yr) for Pittsburgh | Free API key (DEMO_KEY is heavily rate-limited). **The developer.nrel.gov domain no longer resolves** since NREL was renamed the National Laboratory of the Rockies. NSRDB TMY weather | 2026-09-25: returns 200 |
| Open-Meteo Climate API | `https://climate-api.open-meteo.com/v1/climate` | Hot days and heavy-rain days, historical vs. 2031–2050 (CMIP6 HighResMIP, 10 km) | Free for non-commercial use; CC BY 4.0, attribute CMIP6 and Open-Meteo; show the spread across models | 2026-09-25: works |
| FEMA NFHL REST (layer 28, Flood Hazard Zones) | `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query` | Flood zone per parcel | Not a flood determination | Documented; test Saturday |
| USGS EPQS | `https://epqs.nationalmap.gov/v1/json?x=…&y=…&wkid=4326&units=Feet` | Spot elevations for the slope estimate | 3DEP-derived; RMSE about 0.5 m | 2026-09-25: works |
| [Allegheny County Building Footprints](https://data.wprdc.org/dataset/allegheny-county-building-footprint-locations) | WPRDC GeoJSON / Esri REST | Neighbor buildings for shading and height context | Historical: 1992–93 photogrammetry, updated after 2004 and 2015 flyovers; no height field (use assessment stories) | Listed |
| OpenFreeMap | `https://tiles.openfreemap.org/styles/positron` | Basemap for MapLibre | No key; OSM/OpenMapTiles attribution (automatic in MapLibre) | Documented |
| NOAA Atlas 14 (PFDS) | NOAA HDSC | Design-storm depth for the runoff metric | Record the station and the return period used | To retrieve Saturday |

**Validation sources (not inputs):** HNA 2022 lot-size tables (replication check, [C1] p. 32); National Zoning Atlas Pennsylvania ([C4]; Pittsburgh report forthcoming); Bartik, Gupta & Milo's AI zoning dataset ([G1]; check whether Pittsburgh is covered).

Candidate ACS tables (confirm on Saturday): B25003 tenure, B25070 gross rent as a percentage of household income (rent burden), B25002 occupancy/vacancy, B25024 units in structure.

## Recommended additions (Track 3 layers from the organizer catalog)

Add these only if they strengthen a specific score or flag, in rough priority order.

| Dataset | Why | Caveat |
|---|---|---|
| [FEMA National Flood Hazard Layer](https://www.fema.gov/flood-maps/national-flood-hazard-layer) | Flood is in our constraint list | Not a flood determination |
| [HUD CHAS](https://www.huduser.gov/portal/datasets/cp.html) | **Named in the Track 3 brief**; cost burden by HUD income band | Lags; complex tables |
| [National Land Cover Database](https://www.mrlc.gov/data) | Greenfield vs. infill, impervious surface, tree cover (the "preserve green space" note) | 30 m resolution misses parcel detail |
| [HUD USPS Vacancy](https://www.huduser.gov/portal/datasets/usps.html) | The "look at vacancy" note | Postal-status concept; suppression |
| [LEHD LODES](https://lehd.ces.census.gov/data/) | Jobs access (the brief's "opportunity access") | Modeled and noise-infused; lags |
| [HUD Location Affordability Index](https://hudgis-hud.opendata.arcgis.com/datasets/c1c32742599a42c9a45c95be50ed2ab6_12/about) | Housing plus transportation cost context | Modeled household profiles |
| [NREL ResStock](https://resstock.nrel.gov/) | Operational energy by building type, for the climate score | Modeled stock, not parcel-level |
| [PA DEP eMapPA](https://www.dep.pa.gov/DataandTools/Pages/eMapPA.aspx) | Contamination and brownfield flags | Many programs and vintages |
| [City-Owned Properties](https://data.wprdc.org/dataset/city-owned-properties), [Tax Delinquency](https://data.wprdc.org/dataset/city-of-pittsburgh-property-tax-delinquency) | Candidate infill sites | Ownership does not mean availability |
| [Allegheny County Property Sale Transactions](https://data.wprdc.org/dataset/allegheny-county-property-sale-transactions) | Market context (Peiser's "market" factor): neighborhood sale prices | Filter to valid, arm's-length sales |
| [Mapping Inequality](https://dsl.richmond.edu/panorama/redlining/) (HOLC 1930s maps) | Equity context: the HNA notes that multi-unit zoning today overlaps historically redlined areas ([C1] p. 28) | Historical; context only, never a score |
| [OpenStreetMap](https://www.openstreetmap.org/) | Amenities and street network, for a walkability proxy instead of the proprietary Walk Score | ODbL attribution and share-alike |
| EPA EJScreen, via the [PEDP archive](https://screening-tools.com/epa-ejscreen) | Environmental burden context | **EPA took EJScreen offline on 2025-02-05**; the organizer catalog's EPA link may not work. PEDP's reconstruction is v2.3. Cite the archive if used |

Full organizer catalog (58 sources): [AI Hackathon for Housing — Public Data Catalog](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA).

## Privacy

- We use parcel-level data about property, never about people. Owner names and mailing addresses are dropped at ingest and never displayed, logged, or sent to an LLM.
- Tract-level demographics describe areas, not households, and are never used to rank people.
