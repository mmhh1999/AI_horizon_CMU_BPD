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
const RES_USES = {
  R1D: ["detached"],
  R1A: ["detached", "townhouse"],
  R2: ["detached", "duplex"],
  R3: ["detached", "duplex", "townhouse"],
  RM: ["detached", "duplex", "townhouse", "fourplex", "smallmf"],
};
const MIXED = {
  LNC: { label: "Neighborhood commercial", uses: ["townhouse", "smallmf", "mixeduse", "fourplex"], front: 0, rear: 15, side: 0, minLot: 0, maxHeightFt: 40, maxStories: 3 },
  NDO: { label: "Neighborhood office", uses: ["townhouse", "smallmf", "fourplex"], front: 0, rear: 15, side: 0, minLot: 0, maxHeightFt: 40, maxStories: 3 },
  UNC: { label: "Urban neighborhood commercial", uses: ["townhouse", "smallmf", "mixeduse", "fourplex"], front: 0, rear: 15, side: 0, minLot: 0, maxHeightFt: 45, maxStories: 4 },
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
  fourplex: { id: "fourplex", name: "Fourplex", icon: "building", sub: "Four homes, two floors", w: 32, d: 44, minW: 28, minD: 36, stories: 2, roof: "flat", units: 4 },
};

export const SCENARIO_SETS = {
  default: { label: "Townhouses · Apartments · Shops + homes", ids: ["townhouse", "smallmf", "mixeduse"] },
  middle: { label: "Missing middle · Duplex · Fourplex · Townhouses", ids: ["duplex", "fourplex", "townhouse"] },
  gentle: { label: "Gentle infill · House + ADU · Duplex · Townhouses", ids: ["detached", "duplex", "townhouse"] },
};

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

export const EXAMPLES = [
  { id: "0049S00106000000", why: "Example 1 of 3 · Vacant lot on Liberty Ave, next to a busy bus corridor" },
  { id: "0051C00145000000", why: "Example 2 of 3 · Vacant lot zoned for up to three homes" },
  { id: "0050F00033000000", why: "Example 3 of 3 · Vacant lot zoned for single-family only" },
];

export const SUN = { year: 2026, month: 11, day: 21, hours: [9, 10, 11, 12, 13, 14, 15] };

export const SOURCES = {
  PARCEL: { label: "PARCEL · Allegheny County", text: "Allegheny County parcel boundaries (OPENDATA/Parcels REST) and WPRDC Property Assessments (use, class, lot area, stories; no owner fields). Retrieved 2026-09-25. Lot dimensions are approximated from the polygon." },
  ZONING: { label: "ZONING · City of Pittsburgh", text: "District from City of Pittsburgh zoning map (PGHWebZoning). Dimensional and use rules in this prototype are DRAFT placeholders pending verification against the codified Pittsburgh Code (eCode360, Ch. 903/904/911). Confirm with City Planning." },
  TRANSIT: { label: "TRANSIT · PRT", text: "PRT transit stops with weekday trips (WPRDC; GTFS feed version 2606). Walk time = straight-line distance × 1.3 at 3 mph. Scheduled service is not realized reliability." },
  HAZARD: { label: "HAZARD · City GIS / FEMA", text: "25%+ slope, undermined areas, landslide-prone areas (City of Pittsburgh GIS via WPRDC); FEMA NFHL flood zones. Screening layers only, not a site survey or geotechnical assessment." },
  SOLAR: { label: "SOLAR · NLR PVWatts v8", text: "Specific yield for central Pittsburgh from the NLR PVWatts v8 API (NSRDB TMY): 1,141 kWh/kW·yr at 10° tilt, 1,205 at 25°. Usable roof share and module density are assumptions." },
  CLIMATE: { label: "CLIMATE · Open-Meteo CMIP6", text: "Days ≥ 90°F and ≥ 1 in rain per year, 1991–2010 vs 2031–2050, two CMIP6 HighResMIP models downscaled to 10 km (Open-Meteo Climate API, CC BY 4.0). City-level context, not a parcel forecast." },
  TYPOLOGY: { label: "TYPOLOGY · MMH refs (draft)", text: "Building templates are DRAFT placeholders to be replaced with dimensions from Parolek (2020) Missing Middle Housing and missingmiddlehousing.com." },
  CONTEXT: { label: "CONTEXT · OpenStreetMap", text: "Neighbor buildings © OpenStreetMap contributors (ODbL). Heights estimated from assessment stories × 11 ft + 4 ft, or 28 ft when unknown." },
  POLICY: { label: "POLICY · Bill 2025-1545", text: "Pittsburgh Council Bill 2025-1545 (ADUs, affordable housing bonus, parking minimums), as proposed. Public hearing 2026-09-23; vote pending. Not law." },
};
