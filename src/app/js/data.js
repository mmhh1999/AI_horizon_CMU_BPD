// Data loading (county overview, City neighborhoods, per-neighborhood parcel files) and map indicators.

const cache = new Map();
async function getJSON(url) {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); }));
  return cache.get(url);
}
export const loadCounty = () => getJSON("./data/county.json");
export const loadCity = () => getJSON("./data/city/neighborhoods.json");
export const loadHood = (slug) => getJSON(`./data/city/nbhd/${slug}.json`);

export const pct = (x, d = 0) => (x == null || Number.isNaN(x) ? "—" : `${(x * 100).toFixed(d)}%`);
export const n0 = (x) => (x == null || Number.isNaN(x) ? "—" : Math.round(x).toLocaleString("en-US"));
const signedPct = (x) => (x == null ? "—" : `${x > 0 ? "+" : ""}${(x * 100).toFixed(0)}%`);

// Opportunity tags (pipeline codes -> labels, colors, plain-language meaning).
export const TAGS = {
  VB: { label: "Vacant or condemned building", short: "Vacant building", color: "#B5533C", icon: "house-plug", why: "On the City condemned / dead-end list, rated unsound, or a City-held structure." },
  VL: { label: "Vacant lot", short: "Vacant lot", color: "#E3A51A", icon: "square-dashed", why: "Assessed as vacant land (or City-held vacant land) with no building footprint." },
  PO: { label: "Public land (City / URA / Housing Authority)", short: "Public land", color: "#3A6EA5", icon: "landmark", why: "Held by the City of Pittsburgh (excluding parks and greenways), the URA, or the Housing Authority." },
  GA: { label: "Garage or shed that could become an ADU", short: "Garage → ADU", color: "#7B5EA7", icon: "warehouse", why: "1–2 family lot with a small accessory building behind the house." },
  DL: { label: "Deep lot with room behind the house", short: "Deep lot", color: "#5E8C4A", icon: "move-vertical", why: "1–2 family lot at least 110 ft deep with 50+ ft behind the main building." },
  OS: { label: "Ownership signal (absentee, multi-parcel, maintenance issues)", short: "Ownership signal", color: "#6B6B6B", icon: "scan-search", why: "Tax bills go to an address elsewhere, that address receives bills for 2+ parcels, and the lot is condemned, rated poor, or has both code violations and tax delinquency. A signal to look closer, not a finding about anyone." },
  TN: { label: "Transit node (frequent or rapid transit)", short: "Transit node", color: "#2A8C82", icon: "train-front", why: "Within ¼ mile of a T or busway stop, or within 660 ft of a stop with 1,000+ weekday trips within ¼ mile." },
};
export const TAG_ORDER = ["VB", "VL", "PO", "GA", "DL", "OS", "TN"];

// Choropleth indicators for City neighborhoods.
export const HOOD_INDICATORS = {
  needs: { label: "Community needs flagged", get: (h) => h.needs.length, fmt: n0 },
  vacant: { label: "Vacant lots (share of parcels)", get: (h) => h.stats.vacantLotShare, fmt: pct },
  public: { label: "Public land parcels", get: (h) => h.stats.public_owned, fmt: n0 },
  poverty: { label: "Poverty rate", get: (h) => h.profile?.poverty, fmt: pct },
  seniors: { label: "Residents 65+", get: (h) => h.profile?.age?.["65plus"], fmt: pct },
  children: { label: "Residents under 18", get: (h) => h.profile?.age?.under18, fmt: pct },
  renters: { label: "Renter households", get: (h) => h.profile?.renter, fmt: pct },
  popChange: { label: "Population change 2013–2023", get: (h) => h.profile?.popChange, fmt: signedPct },
  green: { label: "Homes within 1,000 ft of a park", get: (h) => h.stats.greenWho, fmt: pct },
  transit: { label: "Homes with frequent transit nearby", get: (h) => h.stats.transitFrequent, fmt: pct },
  // Safety is deliberately not a map indicator: it is shown as context inside each neighborhood, never ranked.
};

export const COUNTY_INDICATORS = {
  vacantShare: { label: "Vacant land (share of parcels)", get: (m) => m.stats?.vacantShare, fmt: pct },
  homesteadShare: { label: "Owner-occupied homes (homestead)", get: (m) => m.stats?.homesteadShare, fmt: pct },
  poorShare: { label: "Buildings in poor condition", get: (m) => m.stats?.poorShare, fmt: (x) => pct(x, 1) },
  yearBuilt: { label: "Median year built (homes)", get: (m) => m.stats?.yearBuilt, fmt: (x) => (x ? String(x) : "—") },
  delinquent: { label: "Parcels tax-delinquent 2+ years", get: (m) => m.stats?.delinquent, fmt: n0 },
};

export const RAMP = ["#F3F1EA", "#DDD6C2", "#BFB293", "#978866", "#62563B"];

export function classify(values) {
  const v = values.filter((x) => x != null && !Number.isNaN(x)).sort((a, b) => a - b);
  if (!v.length) return { breaks: [], cls: () => -1 };
  const q = [0.2, 0.4, 0.6, 0.8].map((p) => v[Math.min(v.length - 1, Math.floor(p * v.length))]);
  return { breaks: q, min: v[0], max: v[v.length - 1], cls: (x) => (x == null || Number.isNaN(x) ? -1 : q.filter((b) => x > b).length) };
}
