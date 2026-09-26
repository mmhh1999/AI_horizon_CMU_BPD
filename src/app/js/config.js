// Configuration. EVERY rule and typology number below is a DRAFT placeholder until verified
// against the codified Pittsburgh Code (eCode360) and the typology sources (Parolek 2020 / MMH).
// See docs/concept.md, docs/massing-and-metrics.md, docs/limitations.md.

export const RULES_VERIFIED = false;

// District rules (draft). `uses` = scenario ids permitted by right.
// Residential base districts use density subdistricts (VL/L/M/H/VH) for dimensional rules.
const RES_SUB = {
  VL: { minLot: 6000, front: 30, rear: 30, side: 5 },
  L: { minLot: 3000, front: 30, rear: 30, side: 5 },
  M: { minLot: 2400, front: 20, rear: 25, side: 5 },
  H: { minLot: 1200, front: 15, rear: 15, side: 5 },
  VH: { minLot: 1200, front: 15, rear: 15, side: 5 },
};
// House + ADU, garage ADU and multigenerational suites are listed where the main house is allowed;
// the second unit itself is gated separately by the ADU policy constraint.
const RES_USES = {
  R1D: ["detached", "garageadu", "multigen"],
  R1A: ["detached", "garageadu", "multigen", "townhouse"],
  R2: ["detached", "garageadu", "multigen", "duplex"],
  R3: ["detached", "garageadu", "multigen", "duplex", "triplex", "townhouse"],
  RM: ["detached", "garageadu", "multigen", "duplex", "triplex", "townhouse", "fourplex", "porch4", "cottage", "courtyard", "smallmf"],
};
const MIXED_USES = ["townhouse", "smallmf", "mixeduse", "livework", "triplex", "fourplex", "porch4", "courtyard"];
const MIXED = {
  LNC: { label: "Neighborhood commercial", uses: MIXED_USES, front: 0, rear: 15, side: 0, minLot: 0, maxHeightFt: 40, maxStories: 3 },
  NDO: { label: "Neighborhood office", uses: ["townhouse", "smallmf", "livework", "triplex", "fourplex", "porch4"], front: 0, rear: 15, side: 0, minLot: 0, maxHeightFt: 40, maxStories: 3 },
  UNC: { label: "Urban neighborhood commercial", uses: MIXED_USES, front: 0, rear: 15, side: 0, minLot: 0, maxHeightFt: 45, maxStories: 4 },
};

export function districtRules(zoning) {
  if (!zoning) return null;
  const [base, sub] = zoning.split("-");
  if (MIXED[base]) return { base, sub: null, ...MIXED[base], mixed: true };
  if (RES_USES[base] && RES_SUB[sub]) {
    const tall = base === "RM";
    return {
      base, sub, label: null, uses: RES_USES[base], ...RES_SUB[sub],
      maxHeightFt: tall ? 55 : 40, maxStories: tall ? 4 : 3, mixed: false,
    };
  }
  return null; // parks, institutional, hillside etc. are out of scope in v1
}

export const PARKING = {
  perUnit: 1, // draft: spaces required per dwelling unit today
  perCommercialSf: 1 / 500, // draft
  sfPerSpace: 325, // surface space incl. aisle share
  minOpenShare: 0.1, // draft: share of lot kept unpaved
};

// Scenario templates (DRAFT; replace with sourced values).
export const SCENARIOS = {
  townhouse: { id: "townhouse", name: "Townhouses", icon: "house", sub: "Row of 3-story homes", unitW: 18, minUnitW: 16, d: 36, minD: 30, stories: 3, roof: "flat" },
  smallmf: { id: "smallmf", name: "Apartment building", icon: "building-2", sub: "4-story walk-up", stories: 4, roof: "flat", unitSf: 850, efficiency: 0.8 },
  mixeduse: { id: "mixeduse", name: "Shops + apartments", icon: "store", sub: "Ground-floor shop, homes above", stories: 4, groundFt: 14, roof: "flat", unitSf: 850, efficiency: 0.8, commercialShare: 0.7 },
  detached: { id: "detached", name: "House + backyard unit", icon: "house", sub: "Single home with an ADU", w: 22, d: 34, minW: 14, minD: 26, stories: 2, roof: "pitched", adu: { w: 20, d: 22, stories: 2, maxH: 30, sep: 10 } },
  duplex: { id: "duplex", name: "Duplex", icon: "house", sub: "Two homes side by side", w: 30, d: 40, minW: 24, minD: 30, stories: 2, roof: "pitched", units: 2 },
  triplex: { id: "triplex", name: "Triplex", icon: "building", sub: "Three stacked flats, one per floor", w: 26, d: 44, minW: 22, minD: 34, stories: 3, roof: "flat", units: 3 },
  fourplex: { id: "fourplex", name: "Fourplex · shared entry", icon: "building", sub: "Four flats off one stair and door", w: 32, d: 44, minW: 28, minD: 36, stories: 2, roof: "flat", units: 4 },
  porch4: { id: "porch4", name: "Fourplex · porches", icon: "door-open", sub: "Four flats, each with its own porch and door", w: 34, d: 44, minW: 30, minD: 36, porch: 8, stories: 2, roof: "pitched", units: 4 },
  courtyard: { id: "courtyard", name: "Courtyard apartments", icon: "layout-panel-top", sub: "Two-story U around a shared court", wing: 24, minW: 64, maxW: 110, minD: 72, maxD: 120, stories: 2, roof: "flat", unitSf: 750, efficiency: 0.8 },
  livework: { id: "livework", name: "Live-work units", icon: "briefcase", sub: "Row homes with a street-level workshop", unitW: 20, minUnitW: 18, d: 40, minD: 32, stories: 3, groundFt: 14, roof: "flat", workShare: 0.5 },
  multigen: { id: "multigen", name: "Multigenerational house", icon: "users", sub: "Main house plus an accessible ground-floor suite", w: 24, d: 32, minW: 18, minD: 26, stories: 2, roof: "pitched", suite: { w: 18, d: 20 } },
  cottage: { id: "cottage", name: "Cottage court", icon: "tent-tree", sub: "Small one-story cottages around a shared green", cw: 20, cd: 28, gap: 10, court: 20, minUnits: 3, stories: 1, roof: "pitched" },
  garageadu: { id: "garageadu", name: "Garage ADU", icon: "warehouse", sub: "Apartment over a rear garage; the house stays", w: 22, d: 32, minW: 14, minD: 26, stories: 2, roof: "pitched", carriage: { w: 22, d: 24, stories: 2, rear: 5, sep: 10, maxH: 26 } },
};

export const lower = (s) => s.split(" ").map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(" ");

export const TYPE_ORDER = ["garageadu", "detached", "multigen", "duplex", "triplex", "fourplex", "porch4", "cottage", "townhouse", "livework", "courtyard", "smallmf", "mixeduse"];
export const MAX_TYPES = 4;

export const SCENARIO_SETS = {
  default: { label: "Townhouses · Apartments · Shops + homes", ids: ["townhouse", "smallmf", "mixeduse"] },
  middle: { label: "Missing middle · Duplex · Triplex · Porch fourplex", ids: ["duplex", "triplex", "porch4", "townhouse"] },
  gentle: { label: "Gentle infill · Garage ADU · House + ADU · Multigenerational", ids: ["garageadu", "detached", "multigen", "duplex"] },
  entries: { label: "Fourplex: shared entry vs. porches", ids: ["fourplex", "porch4"] },
  shared: { label: "Shared open space · Cottage court · Courtyard", ids: ["cottage", "courtyard", "townhouse"] },
  corridor: { label: "Main street · Live-work · Shops + homes · Apartments", ids: ["livework", "mixeduse", "smallmf"] },
};

// Types that tend to answer each community need (draft editorial mapping, shown as a suggestion only).
export const NEED_TYPES = {
  aging: ["multigen", "garageadu", "cottage"],
  families: ["triplex", "townhouse", "courtyard"],
  transit: ["smallmf", "mixeduse", "livework"],
  middle: ["duplex", "triplex", "porch4"],
  affordability: ["fourplex", "courtyard", "smallmf"],
  vacancy: ["townhouse", "cottage", "duplex"],
  renters: ["townhouse", "porch4", "duplex"],
  alone: ["cottage", "smallmf", "garageadu"],
  population: ["townhouse", "triplex", "fourplex"],
  green: ["cottage", "courtyard"],
  distress: ["duplex", "garageadu"],
};

export function suggestTypes(needs) {
  const score = new Map();
  (needs || []).forEach((n, i) => (NEED_TYPES[n.key] || []).forEach((t, j) => score.set(t, (score.get(t) || 0) + 3 - j + (needs.length - i) * 0.01)));
  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  return ranked.length ? ranked.slice(0, MAX_TYPES) : SCENARIO_SETS.default.ids;
}

export const FLOOR_TO_FLOOR = 10.5;
export const ROOF_ALLOWANCE = { pitched: 5, flat: 2 };

// NLR PVWatts v8, central Pittsburgh (exploratory call 2026-09-25): kWh per kW-yr.
export const PV = { yield: { flat: 1141, pitched: 1205 }, usable: { flat: 0.7, pitched: 0.5 }, kwPerM2: 0.2 };
export const RUNOFF_C = { impervious: 0.95, pervious: 0.2, greenRoof: 0.4 };
export const STORMWATER_FLAG = 0.7; // impervious share above which we flag stormwater management

export const EXISTING_UNITS = {
  "VACANT LAND": 0, "VACANT COMMERCIAL LAND": 0, "SINGLE FAMILY": 1, "TWO FAMILY": 2, "THREE FAMILY": 3,
  "FOUR FAMILY": 4, TOWNHOUSE: 1, ROWHOUSE: 1, "RES AUX BUILDING (NO HOUSE)": 0,
};

export const CLIMATE_CONTEXT = { hotThen: "11", hotNow: "21–28", rainThen: "5–6", rainNow: "6–8" };

// Demo path: Larimer (community-first story), plus one Bloomfield / Garfield-edge lot from the first prototype.
export const EXAMPLES = [
  { slug: "larimer", id: "0124K00080000000", why: "Larimer 1 of 3 · City-owned vacant lot on Larimer Ave, zoned multi-unit, listed for sale" },
  { slug: "larimer", id: "0125F00313000000", why: "Larimer 2 of 3 · City-owned vacant lot on the Frankstown Ave corridor, frequent transit" },
  { slug: "larimer", id: "0124J00186000000", why: "Larimer 3 of 3 · Deep single-family lot with a garage out back (ADU candidate)" },
  { slug: "bloomfield", id: "0049S00106000000", why: "Bloomfield · Vacant lot on Liberty Ave, next to a busy bus corridor" },
];

export const SUN = { year: 2026, month: 11, day: 21, hours: [9, 10, 11, 12, 13, 14, 15] };

export const SOURCES = {
  PARCEL: { label: "PARCEL · Allegheny County", text: "Allegheny County parcel boundaries (September 2026 release) and WPRDC Property Assessments (use, class, lot area, stories, year built, condition). Retrieved 2026-09-26. Lot width, depth and front edge are derived from the polygon. Owner mailing addresses are used only inside the data pipeline for an aggregate ownership signal and are never exported." },
  COMMUNITY: { label: "COMMUNITY · ACS 2019–2023", text: "American Community Survey 5-year estimates by Pittsburgh neighborhood (UCSUR neighborhood profiles via WPRDC; 2013 for change). Some neighborhoods are published as a combined area. Needs flags use published thresholds relative to the City; they suggest emphasis and never set priorities on their own." },
  OPPORTUNITY: { label: "OPPORTUNITY · County + City records", text: "Tags derived from County assessments, the City-owned property inventory, the condemned / dead-end property list, PLI code violations (last 3 years), City and County tax delinquency, County building footprints and PRT GTFS. Rules are published in each neighborhood file. The ownership signal is a prompt to look closer, not a finding about any owner." },
  SAFETY: { label: "SAFETY · Pittsburgh Bureau of Police", text: "Monthly criminal activity 2024–2026 (NIBRS Group A: person, property, society), counted by neighborhood. Shown as context next to design questions; never scored, ranked or mapped as a choropleth." },
  GREEN: { label: "GREEN · City + County parks", text: "City parks, County parks and City greenways (WPRDC). Straight-line distance from the lot. The WHO suggests green space within about 300 m (≈1,000 ft); the advisors suggested 100–500 ft for children and seniors." },
  ZONING: { label: "ZONING · City of Pittsburgh", text: "District from City of Pittsburgh zoning map (PGHWebZoning). Dimensional and use rules in this prototype are DRAFT placeholders pending verification against the codified Pittsburgh Code (eCode360, Ch. 903/904/911). Confirm with City Planning." },
  TRANSIT: { label: "TRANSIT · PRT", text: "PRT GTFS feed 2606 (WPRDC archive, retrieved 2026-09-26): weekday trips per stop; T and busway stops marked as rapid. Walk time = straight-line distance × 1.3 at 3 mph. Scheduled service is not realized reliability." },
  HAZARD: { label: "HAZARD · City GIS / FEMA", text: "25%+ slope, undermined areas, landslide-prone areas (City of Pittsburgh GIS via WPRDC); FEMA NFHL flood hazard areas (retrieved 2026-09-26, generalized to about 1 m). Screening layers only, not a site survey or geotechnical assessment." },
  SOLARENV: { label: "SOLAR ENVELOPE · Knowles / Boulder", text: "Solar envelope after Ralph Knowles (the largest volume that keeps neighbors in sun for a set time window), with a protected time and 'solar fence' modeled on Boulder, Colorado's solar access regulations (B.R.C. 1981 § 9-9-17: no more shading of adjacent lots than a 12 ft (Area I) or 25 ft (Area II) fence on the lot lines, from two hours before to two hours after solar noon on December 21; City of Boulder Solar Access Guide, checked 2026-09-26). Neighbors across the street are protected beyond a 50 ft right-of-way. Sun positions from SunCalc. Pittsburgh has no solar-access law: this is shown as a community goal only. Compactness = outside surface (walls, roof, ground floor, party walls excluded) ÷ volume. Green-space bands: 500 ft (advisor suggestion for children and seniors), 1,000 ft (≈300 m, WHO), ¼ mile." },
  SOLAR: { label: "SOLAR · NLR PVWatts v8", text: "Specific yield for central Pittsburgh from the NLR PVWatts v8 API (NSRDB TMY): 1,141 kWh/kW·yr at 10° tilt, 1,205 at 25°. Usable roof share and module density are assumptions." },
  CLIMATE: { label: "CLIMATE · Open-Meteo CMIP6", text: "Days ≥ 90°F and ≥ 1 in rain per year, 1991–2010 vs 2031–2050, two CMIP6 HighResMIP models downscaled to 10 km (Open-Meteo Climate API, CC BY 4.0). City-level context, not a parcel forecast." },
  TYPOLOGY: { label: "TYPOLOGY · MMH refs (draft)", text: "Thirteen building templates (from garage ADU and multigenerational house through triplex, porch vs. shared-entry fourplex, cottage court, courtyard, live-work, apartments and shops + homes) are DRAFT placeholders to be replaced with dimensions from Parolek (2020) Missing Middle Housing and missingmiddlehousing.com. Types suggested by neighborhood needs use an editorial mapping and are a starting point, not a ranking." },
  RENDER: { label: "ILLUSTRATIONS · AI-generated", text: "One illustration per housing type, generated with an AI image model on 2026-09-26 from short written descriptions of each type (porches, entries, street life, Pittsburgh brick context), then reviewed by the team. They show the character of a type, not a design, a site, real people or a proposal, and are never computed from this lot's numbers. Disclosed in docs/ai-usage-log.md." },
  CONTEXT: { label: "CONTEXT · County footprints", text: "Neighbor buildings from Allegheny County building footprints (WPRDC). Heights estimated from assessment stories × 11 ft + 4 ft, 28 ft when unknown, 12 ft for small accessory buildings." },
  POLICY: { label: "POLICY · Bill 2025-1545", text: "Pittsburgh Council Bill 2025-1545 (ADUs, affordable housing bonus, parking minimums), as proposed. Public hearing 2026-09-23; vote pending. Not law." },
};
