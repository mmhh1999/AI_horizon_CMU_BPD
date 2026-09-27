// Stakeholder priorities: weights that always sum to 100, value functions per criterion (0-1, published below),
// futures ordered by weighted fit with per-criterion reasons, and a quick SMAA robustness check.
// The fit is relative to the chosen priorities only; needs suggest emphasis but never set weights on their own.

const clamp = (x) => Math.max(0, Math.min(1, x));
const T = (m) => (f) => m[f.id] ?? 0.5;

// Typology-based judgments (DRAFT, editorial; see docs/limitations.md).
const FAMILY = { townhouse: 0.9, multigen: 0.9, triplex: 0.8, duplex: 0.8, porch4: 0.7, detached: 0.7, courtyard: 0.6, fourplex: 0.6, cottage: 0.5, livework: 0.5, garageadu: 0.4, smallmf: 0.4, mixeduse: 0.4 };
const STREET = { porch4: 1, livework: 1, mixeduse: 1, townhouse: 0.9, cottage: 0.8, courtyard: 0.8, duplex: 0.7, triplex: 0.7, multigen: 0.6, detached: 0.6, fourplex: 0.5, smallmf: 0.5, garageadu: 0.5 };
const AGING = { multigen: 1, garageadu: 0.9, cottage: 0.9, detached: 0.8, courtyard: 0.6, fourplex: 0.6, porch4: 0.6, smallmf: 0.5, triplex: 0.5, duplex: 0.5, mixeduse: 0.5, townhouse: 0.3, livework: 0.3 };

export const CRITERIA = [
  { key: "homes", label: "Housing production", icon: "house-plus", v: (f) => clamp(Math.log2(1 + Math.max(0, f.netUnits)) / Math.log2(21)),
    why: (f, v) => v >= 0.6 ? `adds ${f.netUnits} homes` : `adds only ${Math.max(0, f.netUnits)} home${f.netUnits === 1 ? "" : "s"}` },
  { key: "family", label: "Family-size and mixed homes", icon: "users", v: T(FAMILY),
    why: (f, v) => v >= 0.7 ? "homes with ground access or room for families" : "mostly smaller units" },
  { key: "stay", label: "Anti-displacement", icon: "shield", v: (f) => (f.existingUnits === 0 ? 1 : f.keepsExisting ? 0.9 : 0.1),
    why: (f, v) => f.existingUnits === 0 ? "empty lot: no one displaced" : f.keepsExisting ? "keeps the existing home" : `replaces ${f.existingUnits} existing home${f.existingUnits === 1 ? "" : "s"}` },
  { key: "street", label: "Community life and street presence", icon: "door-open", v: T(STREET),
    why: (f, v) => v >= 0.8 ? "doors, porches or shops on the street" : "few entries facing the street" },
  { key: "aging", label: "Aging in place, age diversity", icon: "accessibility", v: T(AGING),
    why: (f, v) => v >= 0.8 ? "one-level living or a unit for a relative or caregiver" : "stairs to most homes" },
  { key: "climate", label: "Climate and energy", icon: "leaf", v: (f) => 0.7 * clamp((1.0 - f.perf.compact.sv) / 0.7) + 0.3 * clamp(f.pvPerUnit / 4000),
    why: (f, v) => v >= 0.6 ? `compact (S/V ${f.perf.compact.sv.toFixed(2)}) with good rooftop solar` : `more outside wall per home (S/V ${f.perf.compact.sv.toFixed(2)})` },
  { key: "sun", label: "Winter sun for neighbors (optional)", icon: "sun-medium", v: (f) => (f.perf.solar.fits ? 1 : clamp(1 - f.perf.solar.share * Math.min(1, f.perf.solar.maxOver / 20))),
    why: (f, v) => f.perf.solar.fits ? "stays inside the solar envelope" : `up to ${Math.round(f.perf.solar.maxOver)} ft over the solar envelope` },
  { key: "transit", label: "Transit and car-free living", icon: "bus", v: (f) => { const w = f.perf.tod.walk; return 0.7 * (w <= 5 ? 1 : w <= 10 ? 0.6 : 0.2) + 0.3 * clamp(1 - f.parking.sf / Math.max(1, f.lotArea * 0.5)); },
    why: (f, v) => `${Math.max(1, Math.round(f.perf.tod.walk))}-min walk to the bus${f.parking.sf > 0 ? `, ${f.parking.spaces} parking spaces` : ", no parking lot"}` },
  { key: "green", label: "Green space and water", icon: "trees", v: (f) => 0.7 * clamp(f.pervious / f.lotArea / 0.6) + 0.3 * (f.constraints.some((c) => c.key === "stormwater") ? 0 : 1),
    why: (f, v) => `${Math.round((f.pervious / f.lotArea) * 100)}% of the lot stays open` },
  { key: "feasible", label: "Feasibility today", icon: "clipboard-check", v: (f) => (f.status === "viable" ? 1 : f.status === "conditional" ? Math.max(0.3, 1 - 0.2 * f.constraints.length) : 0),
    why: (f, v) => f.status === "viable" ? "allowed under current (draft) rules" : f.status === "conditional" ? `needs ${f.constraints.length} change${f.constraints.length === 1 ? "" : "s"}` : "not allowed today" },
];
const KEYS = CRITERIA.map((c) => c.key);

const W = (o) => Object.fromEntries(KEYS.map((k) => [k, o[k] || 0]));
export const PRESETS = {
  even: { label: "Even split", w: W(Object.fromEntries(KEYS.map((k) => [k, 10]))) },
  supply: { label: "Housing supply first", w: W({ homes: 30, feasible: 20, transit: 15, family: 10, stay: 5, street: 5, aging: 5, climate: 5, green: 5 }) },
  stay: { label: "Stay in place", w: W({ stay: 25, aging: 20, family: 15, street: 10, homes: 10, feasible: 10, green: 5, climate: 5 }) },
  climate: { label: "Climate first", w: W({ climate: 20, transit: 20, green: 20, sun: 15, homes: 10, feasible: 5, street: 5, family: 5 }) },
  community: { label: "Community life", w: W({ street: 25, family: 15, aging: 15, green: 15, stay: 10, homes: 10, feasible: 10 }) },
};

// Criteria each community need suggests emphasizing (shown as a suggestion; applied only on request).
const NEED_CRITERIA = { aging: ["aging"], families: ["family"], affordability: ["stay", "family"], population: ["homes"], vacancy: ["homes"], renters: ["stay"], alone: ["homes", "aging"], transit: ["transit"], green: ["green"], distress: ["street"], middle: ["family", "homes"] };
export function suggestedEmphasis(needs) {
  const out = [];
  for (const n of needs || []) for (const k of NEED_CRITERIA[n.key] || []) if (!out.includes(k)) out.push(k);
  return out;
}
export function weightsFromEmphasis(keys) {
  if (!keys.length) return { ...PRESETS.even.w };
  const hi = Math.min(20, Math.floor(60 / keys.length));
  const rest = KEYS.filter((k) => !keys.includes(k));
  const w = W(Object.fromEntries(keys.map((k) => [k, hi])));
  const left = 100 - hi * keys.length;
  rest.forEach((k, i) => { w[k] = Math.floor(left / rest.length) + (i < left % rest.length ? 1 : 0); });
  return w;
}

// Set one weight and rescale the others proportionally so the total stays exactly 100.
export function setWeight(w, key, value) {
  value = Math.max(0, Math.min(100, Math.round(value)));
  const others = KEYS.filter((k) => k !== key);
  const sumO = others.reduce((s, k) => s + w[k], 0);
  const left = 100 - value;
  const raw = others.map((k) => (sumO > 0 ? (w[k] / sumO) * left : left / others.length));
  const fl = raw.map(Math.floor);
  let rem = left - fl.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - fl[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rem > 0) { fl[i]++; rem--; } });
  const n = { [key]: value };
  others.forEach((k, i) => { n[k] = fl[i]; });
  return W(n);
}

export function evaluate(futures, w) {
  const rows = futures.map((f) => {
    const parts = CRITERIA.map((c) => { const v = c.v(f); return { key: c.key, label: c.label, icon: c.icon, v, contrib: (w[c.key] / 100) * v, text: c.why(f, v) }; });
    return { f, fit: parts.reduce((s, p) => s + p.contrib, 0), parts };
  }).sort((a, b) => b.fit - a.fit);
  for (const r of rows) {
    const weighted = r.parts.filter((p) => w[p.key] > 0);
    r.pros = [...weighted].sort((a, b) => b.contrib - a.contrib).filter((p) => p.v >= 0.6).slice(0, 2);
    r.cons = [...weighted].sort((a, b) => (w[b.key] / 100) * (1 - b.v) - (w[a.key] / 100) * (1 - a.v)).filter((p) => p.v < 0.5).slice(0, 2);
  }
  return rows;
}

// Deterministic PRNG so the robustness numbers don't flicker between renders.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// SMAA-style: share of random priority mixes under which each future ranks first.
export function robustness(futures, w, n = 1500) {
  if (futures.length < 2) return {};
  const vals = futures.map((f) => CRITERIA.map((c) => c.v(f)));
  const r = rng(futures.length * 7919 + Math.round(vals.flat().reduce((a, b) => a + b, 0) * 1000));
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
  const tally = (sample) => {
    const wins = new Array(futures.length).fill(0);
    for (let i = 0; i < n; i++) {
      const ws = sample();
      let best = -1, bi = 0;
      vals.forEach((v, j) => { const s = v.reduce((a, x, k) => a + x * ws[k], 0); if (s > best) { best = s; bi = j; } });
      wins[bi]++;
    }
    return wins.map((x) => x / n);
  };
  const anyMix = tally(() => { const e = KEYS.map(() => -Math.log(r() + 1e-12)); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); });
  const nearYou = tally(() => { const e = KEYS.map((k) => (w[k] + 1) * Math.exp(0.35 * gauss())); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); });
  return Object.fromEntries(futures.map((f, j) => [f.id, { any: anyMix[j], near: nearYou[j] }]));
}
