// Scenario engine: massing for each housing future, what stands in its way, and what would unlock it.
// Status: viable ("Can be built") · conditional ("Needs changes") · constrained ("Not allowed").

import {
  districtRules, SCENARIOS, lower, PARKING, FLOOR_TO_FLOOR, ROOF_ALLOWANCE, PV, RUNOFF_C, STORMWATER_FLAG, EXISTING_UNITS,
} from "./config.js";
import { rectXY } from "./geo.js";

const SF_PER_M2 = 10.7639;
const IMPLAUSIBLE = 0.4; // gaps above this share of the requirement count as "not allowed", not "needs changes"
const fmt = (x) => Math.round(x).toLocaleString("en-US");

const RES_LABEL = { R1D: "Single-family", R1A: "Single-family (attached)", R2: "Two-family", R3: "Up to 3 homes", RM: "Multi-family" };
export const zoneLabel = (r) => (r ? r.label || RES_LABEL[r.base] || r.base : "Unknown");

// Who can change what (plain language for developers and policymakers).
const WHO = {
  variance: { who: "Zoning Board", type: "Variance", icon: "gavel" },
  council: { who: "City Council", type: "Policy change", icon: "landmark" },
  bill: { who: "City Council · Bill 2025-1545 (pending)", type: "Policy change", icon: "landmark" },
  rezoning: { who: "City Council · rezoning", type: "Rezoning", icon: "landmark" },
  design: { who: "Developer", type: "Design choice", icon: "hard-hat" },
  siteplan: { who: "Planning Commission · site plan", type: "Review", icon: "clipboard-check" },
};

export const defaultAssumptions = () => ({
  heightFt: null, stories: null, sideYard: null, rearYard: null, lotWaiver: false,
  allowUses: [], parking: "current", greenRoof: false, capacity: false, allowAdu: false, sitePlan: false,
});

export function effectiveRules(parcel, a) {
  const r = districtRules(parcel.z);
  if (!r) return null;
  return {
    ...r, base0: r,
    uses: [...new Set([...r.uses, ...a.allowUses])],
    maxHeightFt: a.heightFt ?? r.maxHeightFt,
    maxStories: a.stories ?? r.maxStories,
    side: a.sideYard ?? r.side,
    rear: a.rearYard ?? r.rear,
    minLot: a.lotWaiver ? 0 : r.minLot,
  };
}

const h = (stories, roof, groundFt = null) =>
  (groundFt ? groundFt + (stories - 1) * FLOOR_TO_FLOOR : stories * FLOOR_TO_FLOOR) + ROOF_ALLOWANCE[roof];

function flex(want, avail, min) {
  if (avail >= want) return { val: want, dev: 0 };
  if (avail >= min) return { val: avail, dev: 0 };
  return { val: min, dev: min - avail };
}

export function buildScenario(id, parcel, frame, rules, a, hz, existingFoot) {
  const T = SCENARIOS[id];
  const lotArea = frame.areaSf;
  const existingUnits = EXISTING_UNITS[parcel.u] ?? (parcel.k === "RESIDENTIAL" ? 1 : 0);
  const f = { id, name: T.name, icon: T.icon, sub: T.sub, roof: T.roof, volumes: [], units: 0, commercialSf: 0, constraints: [], lotArea, existingUnits };
  const C = (c) => f.constraints.push(c);
  const s0 = frame.sMin + rules.side, s1 = frame.sMax - rules.side;
  const t0 = rules.front, t1 = frame.tMax - rules.rear;
  const bw = Math.max(0, s1 - s0), bd = Math.max(0, t1 - t0);
  const mid = (frame.sMin + frame.sMax) / 2;
  f.envelope = { s0, s1, t0, t1, bw, bd, h: rules.maxHeightFt, ring: rectXY(frame, s0, s1, t0, t1) };
  const unitSf = a.capacity ? 650 : T.unitSf;

  const sideChip = (dev) => rules.side > 0 ? { key: "sideYard", value: Math.max(0, rules.side - Math.ceil(dev / 2)), label: `Reduce side yards to ${Math.max(0, rules.side - Math.ceil(dev / 2))} ft`, ...WHO.variance } : null;
  const rearChip = (dev) => ({ key: "rearYard", value: Math.max(0, rules.rear - Math.ceil(dev)), label: `Reduce rear yard to ${Math.max(0, rules.rear - Math.ceil(dev))} ft`, ...WHO.variance });
  const dimGap = (what, dev, req, chip) => {
    const bad = dev / req > IMPLAUSIBLE;
    C({
      key: what, kind: "regulatory", severity: bad ? "blocking" : "conditional", icon: "ruler",
      title: what === "width" ? "Lot too narrow for this design" : "Lot too shallow for this design",
      plain: `Needs about ${Math.ceil(dev)} ft more ${what === "width" ? "width" : "depth"} than the required yards leave.`,
      current: `Buildable ${what}: ${fmt(what === "width" ? bw : bd)} ft`, required: `Needs: ${fmt(req)} ft`,
      chip: bad ? null : chip, src: "ZONING",
    });
  };

  if (id === "townhouse") {
    const W = rules.side === 0 ? frame.width : frame.width - 2 * rules.side;
    let n = Math.floor(W / T.unitW);
    if (n < 1 && W >= T.minUnitW) n = 1;
    if (W < T.minUnitW) dimGap("width", T.minUnitW - W, T.minUnitW, sideChip(T.minUnitW - W));
    n = Math.max(1, n);
    const d = flex(T.d, bd, T.minD);
    if (d.dev > 0) dimGap("depth", d.dev, T.minD, rearChip(d.dev));
    const start = rules.side === 0 ? frame.sMin : frame.sMin + rules.side;
    const uw = Math.max(T.minUnitW, W / n);
    for (let i = 0; i < n; i++) f.volumes.push({ s0: start + i * uw, s1: start + (i + 1) * uw, t0, t1: t0 + d.val, h: h(T.stories, T.roof), stories: T.stories, party: n > 1 ? (i === 0 || i === n - 1 ? 1 : 2) : 0 });
    f.units = n; f.stories = T.stories;
  } else if (id === "smallmf" || id === "mixeduse") {
    const stories = T.stories;
    if (bw < 20) dimGap("width", 20 - bw, 20, sideChip(20 - bw));
    if (bd < 30) dimGap("depth", 30 - bd, 30, rearChip(30 - bd));
    const vol = { s0, s1, t0, t1, stories, h: h(stories, T.roof, id === "mixeduse" ? T.groundFt : null) };
    if (id === "mixeduse") vol.groundFt = T.groundFt;
    f.volumes.push(vol);
    const foot = bw * bd;
    const resFloors = id === "mixeduse" ? stories - 1 : stories;
    f.units = Math.max(0, Math.floor((foot * resFloors * T.efficiency) / unitSf));
    if (id === "mixeduse") f.commercialSf = Math.round(foot * T.commercialShare);
    f.stories = stories;
    if (f.units < 5 && id === "smallmf") C({ key: "size", kind: "physical", severity: f.units < 3 ? "blocking" : "conditional", icon: "ruler", title: "Lot too small for apartments", plain: `Only ${f.units} homes fit; apartment buildings usually need 5 or more.`, current: `${f.units} homes fit`, required: "5+ homes", chip: null, src: "TYPOLOGY" });
  } else if (id === "duplex" || id === "fourplex" || id === "triplex") {
    const w = flex(T.w, bw, T.minW), d = flex(T.d, bd, T.minD);
    if (w.dev > 0) dimGap("width", w.dev, T.minW, sideChip(w.dev));
    if (d.dev > 0) dimGap("depth", d.dev, T.minD, rearChip(d.dev));
    f.volumes.push({ s0: mid - w.val / 2, s1: mid + w.val / 2, t0, t1: t0 + d.val, h: h(T.stories, T.roof), stories: T.stories });
    f.units = T.units; f.stories = T.stories;
  } else if (id === "porch4") {
    const w = flex(T.w, bw, T.minW), d = flex(T.d + T.porch, bd, T.minD + T.porch);
    if (w.dev > 0) dimGap("width", w.dev, T.minW, sideChip(w.dev));
    if (d.dev > 0) dimGap("depth", d.dev, T.minD + T.porch, rearChip(d.dev));
    const a = mid - w.val / 2, b = mid + w.val / 2;
    f.volumes.push({ s0: a, s1: b, t0: t0 + T.porch, t1: t0 + d.val, h: h(T.stories, T.roof), stories: T.stories });
    f.volumes.push({ s0: a, s1: b, t0, t1: t0 + T.porch, h: 2 * FLOOR_TO_FLOOR, stories: 2, porch: true });
    f.units = T.units; f.stories = T.stories;
  } else if (id === "courtyard") {
    if (bw < T.minW) dimGap("width", T.minW - bw, T.minW, sideChip(T.minW - bw));
    if (bd < T.minD) dimGap("depth", T.minD - bd, T.minD, rearChip(T.minD - bd));
    const ww = Math.min(Math.max(bw, T.minW), T.maxW), dd = Math.min(Math.max(bd, T.minD), T.maxD);
    const a = mid - ww / 2, b = mid + ww / 2, hh = h(T.stories, T.roof);
    f.volumes.push({ s0: a, s1: a + T.wing, t0, t1: t0 + dd, h: hh, stories: T.stories });
    f.volumes.push({ s0: b - T.wing, s1: b, t0, t1: t0 + dd, h: hh, stories: T.stories });
    f.volumes.push({ s0: a + T.wing, s1: b - T.wing, t0: t0 + dd - T.wing, t1: t0 + dd, h: hh, stories: T.stories, party: 2 });
    const gfa = f.volumes.reduce((s, v) => s + (v.s1 - v.s0) * (v.t1 - v.t0) * v.stories, 0);
    f.units = Math.max(0, Math.floor((gfa * T.efficiency) / unitSf));
    f.courtSf = Math.max(0, (ww - 2 * T.wing) * (dd - T.wing));
    f.stories = T.stories;
  } else if (id === "livework") {
    const W = rules.side === 0 ? frame.width : frame.width - 2 * rules.side;
    let n = Math.floor(W / T.unitW);
    if (W < T.minUnitW) dimGap("width", T.minUnitW - W, T.minUnitW, sideChip(T.minUnitW - W));
    n = Math.max(1, n);
    const d = flex(T.d, bd, T.minD);
    if (d.dev > 0) dimGap("depth", d.dev, T.minD, rearChip(d.dev));
    const start = rules.side === 0 ? frame.sMin : frame.sMin + rules.side;
    const uw = Math.max(T.minUnitW, W / n);
    for (let i = 0; i < n; i++) f.volumes.push({ s0: start + i * uw, s1: start + (i + 1) * uw, t0, t1: t0 + d.val, h: h(T.stories, T.roof, T.groundFt), stories: T.stories, groundFt: T.groundFt, party: n > 1 ? (i === 0 || i === n - 1 ? 1 : 2) : 0 });
    f.units = n; f.stories = T.stories;
    f.commercialSf = Math.round(n * uw * d.val * T.workShare);
  } else if (id === "multigen") {
    const keep = existingUnits > 0;
    const w = flex(T.w, bw, T.minW);
    if (w.dev > 0 && !keep) dimGap("width", w.dev, T.minW, sideChip(w.dev));
    const need = T.minD + T.suite.d;
    if (bd < need) dimGap("depth", need - bd, need, rearChip(need - bd));
    const pd = Math.min(T.d, Math.max(T.minD, bd - T.suite.d));
    f.volumes.push({ s0: mid - w.val / 2, s1: mid + w.val / 2, t0, t1: t0 + pd, h: h(T.stories, T.roof), stories: T.stories, existing: keep });
    const sw = Math.min(T.suite.w, w.val);
    f.volumes.push({ s0: mid - sw / 2, s1: mid + sw / 2, t0: t0 + pd, t1: t0 + pd + T.suite.d, h: h(1, "flat"), stories: 1, adu: true, party: 0 });
    f.units = keep ? existingUnits + 1 : 2;
    f.keepsExisting = keep;
    f.stories = T.stories;
    if (!a.allowAdu && !rules.uses.includes("duplex")) C({ key: "adu", kind: "regulatory", severity: "conditional", icon: "house", title: "A second kitchen counts as a second home", plain: "A suite with its own kitchen is an accessory unit, which single-family zoning does not allow today; the pending bill would allow attached ADUs.", current: "Single-family only", required: "Attached suite", chip: { key: "allowAdu", value: true, label: "Allow accessory units (ADUs)", ...WHO.bill }, src: "POLICY" });
  } else if (id === "cottage") {
    const two = bw >= 2 * T.cw + T.court;
    if (bw < T.cw) dimGap("width", T.cw - bw, T.cw, sideChip(T.cw - bw));
    const minD = 2 * T.cd + T.gap;
    if (bd < minD) dimGap("depth", minD - bd, minD, rearChip(minD - bd));
    const per = Math.max(1, Math.floor((Math.max(bd, minD) + T.gap) / (T.cd + T.gap)));
    const cols = two ? [s0, s1 - T.cw] : [mid - T.cw / 2];
    for (const c of cols) for (let i = 0; i < per; i++) {
      const tt = t0 + i * (T.cd + T.gap);
      f.volumes.push({ s0: c, s1: c + T.cw, t0: tt, t1: tt + T.cd, h: h(1, "pitched"), stories: 1 });
    }
    f.units = f.volumes.length; f.stories = 1;
    f.courtSf = two ? (s1 - s0 - 2 * T.cw) * Math.max(0, per * (T.cd + T.gap) - T.gap) : 0;
    if (f.units < T.minUnits) C({ key: "size", kind: "physical", severity: "blocking", icon: "ruler", title: "Lot too small for a cottage court", plain: `Only ${f.units} cottages fit; a court usually has ${T.minUnits} or more around a shared green. Combining lots would help.`, current: `${f.units} cottages fit`, required: `${T.minUnits}+ cottages`, chip: null, src: "TYPOLOGY" });
    if (!a.sitePlan) C({ key: "sitePlan", kind: "regulatory", severity: "conditional", icon: "clipboard-check", title: "Several houses on one lot", plain: "More than one main building on a lot usually needs a planned-development or site-plan approval (draft reading; confirm with City Planning).", current: "One main building per lot", required: `${f.units} cottages`, chip: { key: "sitePlan", value: true, label: "Approve a site plan for the court", ...WHO.siteplan }, src: "ZONING" });
  } else if (id === "garageadu") {
    const keep = existingUnits > 0;
    const G = T.carriage;
    const w = flex(T.w, bw, T.minW);
    if (w.dev > 0 && !keep) dimGap("width", w.dev, T.minW, sideChip(w.dev));
    const tBack = frame.tMax - G.rear;
    const need = T.minD + G.sep + G.d;
    const room = tBack - t0;
    if (room < need) dimGap("depth", need - room, need, rearChip(need - room));
    const pd = Math.min(T.d, Math.max(T.minD, room - G.sep - G.d));
    f.volumes.push({ s0: mid - w.val / 2, s1: mid + w.val / 2, t0, t1: t0 + pd, h: h(T.stories, T.roof), stories: T.stories, existing: keep });
    const gw = Math.min(G.w, frame.width - 6);
    const gs = Math.max(frame.sMin + 3, frame.sMax - 3 - gw);
    f.volumes.push({ s0: gs, s1: gs + gw, t0: tBack - G.d, t1: tBack, h: Math.min(G.maxH, h(G.stories, "pitched")), stories: G.stories, adu: true, garage: true });
    f.units = keep ? existingUnits + 1 : 2;
    f.keepsExisting = keep;
    f.stories = T.stories;
    f.parkingCredit = 1;
    if (parcel.o && parcel.o.includes("GA")) f.sub = "Apartment over the existing rear garage; the house stays";
    if (!a.allowAdu) C({ key: "adu", kind: "regulatory", severity: "conditional", icon: "house", title: "Backyard homes not allowed yet", plain: "Pittsburgh does not allow accessory units (ADUs) citywide today; a pending bill would.", current: "ADUs not allowed", required: "Unit over the garage", chip: { key: "allowAdu", value: true, label: "Allow backyard units (ADUs)", ...WHO.bill }, src: "POLICY" });
  } else if (id === "detached") {
    const w = flex(T.w, bw, T.minW);
    if (w.dev > 0) dimGap("width", w.dev, T.minW, sideChip(w.dev));
    const need = T.minD + T.adu.sep + T.adu.d;
    const pd = Math.min(T.d, Math.max(T.minD, bd - T.adu.sep - T.adu.d));
    if (bd < need) dimGap("depth", need - bd, need, rearChip(need - bd));
    f.volumes.push({ s0: mid - w.val / 2, s1: mid + w.val / 2, t0, t1: t0 + pd, h: h(T.stories, T.roof), stories: T.stories, existing: existingUnits > 0 });
    const aw = Math.min(T.adu.w, bw);
    f.volumes.push({ s0: mid - aw / 2, s1: mid + aw / 2, t0: t1 - T.adu.d, t1, h: Math.min(T.adu.maxH, h(T.adu.stories, "pitched")), stories: T.adu.stories, adu: true });
    f.units = existingUnits > 0 ? existingUnits + 1 : 2;
    f.keepsExisting = existingUnits > 0;
    f.stories = T.stories;
    if (!a.allowAdu) C({ key: "adu", kind: "regulatory", severity: "conditional", icon: "house", title: "Backyard homes not allowed yet", plain: "Pittsburgh does not allow accessory units (ADUs) citywide today; a pending bill would.", current: "ADUs not allowed", required: "Backyard unit", chip: { key: "allowAdu", value: true, label: "Allow backyard units (ADUs)", ...WHO.bill }, src: "POLICY" });
  }

  // --- zoning use
  if (!rules.uses.includes(id)) {
    const allowed = rules.base0.uses.map((u) => SCENARIOS[u] ? lower(SCENARIOS[u].name) : u);
    C({
      key: "use", kind: "regulatory", severity: "blocking", icon: "file-text", title: "Zoning doesn't allow it",
      plain: `${zoneLabel(rules)} zoning (${parcel.z}) allows ${allowed.join(", ") || "none of these"}, not ${lower(T.name)}.`,
      current: `Allowed: ${allowed.join(", ")}`, required: T.name,
      chip: { key: "allowUses", value: id, label: `Rezone to allow ${lower(T.name)}`, ...WHO.rezoning }, src: "ZONING",
    });
  }

  // --- height
  const hMax = Math.max(...f.volumes.map((v) => v.h));
  const sMax = Math.max(...f.volumes.map((v) => v.stories));
  if (hMax > rules.maxHeightFt + 0.01 || sMax > rules.maxStories) {
    const need = Math.ceil(hMax);
    C({
      key: "height", kind: "regulatory", severity: hMax / rules.maxHeightFt > 1 + IMPLAUSIBLE ? "blocking" : "conditional", icon: "ruler",
      title: "Taller than the height limit",
      plain: `Needs about ${need} ft (${sMax} floors); the limit here is ${rules.maxHeightFt} ft (${rules.maxStories} floors).`,
      viz: { type: "height", allowed: rules.maxHeightFt, needed: need },
      current: `Limit: ${rules.maxHeightFt} ft · ${rules.maxStories} floors`, required: `Needs: ~${need} ft · ${sMax} floors`,
      chip: { key: "height", value: { heightFt: need, stories: Math.max(sMax, rules.maxStories) }, label: `Allow ${need} ft (${sMax} floors)`, ...WHO.variance }, src: "ZONING",
    });
  }

  // --- minimum lot size
  if (lotArea < rules.minLot) C({ key: "minLot", kind: "regulatory", severity: "conditional", icon: "ruler", title: "Lot smaller than the minimum", plain: `The lot is ${fmt(lotArea)} sq ft; this zone asks for ${fmt(rules.minLot)} sq ft.`, current: `Lot: ${fmt(lotArea)} sq ft`, required: `Minimum: ${fmt(rules.minLot)} sq ft`, chip: { key: "lotWaiver", value: true, label: "Grant lot-size relief", ...WHO.variance }, src: "ZONING" });

  // --- quantities
  f.footprint = f.volumes.reduce((s, v) => s + (v.s1 - v.s0) * (v.t1 - v.t0), 0);
  f.gfa = f.volumes.filter((v) => !v.porch).reduce((s, v) => s + (v.s1 - v.s0) * (v.t1 - v.t0) * v.stories, 0);
  f.heightFt = hMax;
  f.far = f.gfa / lotArea;
  f.coverage = f.footprint / lotArea;
  f.netUnits = f.units - existingUnits;
  f.demolition = existingUnits > 0 && !f.keepsExisting;
  f.dua = f.units / (lotArea / 43560);

  // --- parking
  const spaces = a.parking === "none" ? 0 : Math.ceil(f.units * PARKING.perUnit + f.commercialSf * PARKING.perCommercialSf);
  const parkingSf = Math.max(0, spaces - (f.parkingCredit || 0)) * PARKING.sfPerSpace;
  const available = Math.max(0, lotArea * (1 - PARKING.minOpenShare) - f.footprint);
  f.parking = { spaces, sf: parkingSf, available };
  if (parkingSf > available + 1) {
    C({
      key: "parking", kind: "regulatory", severity: "conditional", icon: "car", title: "Parking rule takes too much land",
      plain: `${spaces} required spaces need about ${fmt(parkingSf)} sq ft, but only ${fmt(available)} sq ft is left after the building.`,
      viz: { type: "lot", lot: lotArea, building: f.footprint, parking: parkingSf },
      current: `Required: ${spaces} spaces (~${fmt(parkingSf)} sq ft)`, required: `Left on site: ~${fmt(available)} sq ft`,
      chip: { key: "parking", value: "none", label: "Drop the parking minimum", ...WHO.bill }, src: "POLICY",
    });
  }
  const paved = Math.min(parkingSf, available);

  // --- stormwater
  const roofC = a.greenRoof ? RUNOFF_C.greenRoof : RUNOFF_C.impervious;
  const impervious = f.footprint + paved;
  const effImp = (roofC * f.footprint + RUNOFF_C.impervious * paved) / RUNOFF_C.impervious;
  f.imperviousShare = Math.min(1, impervious / lotArea);
  f.effImperviousShare = Math.min(1, effImp / lotArea);
  f.pervious = Math.max(0, lotArea - impervious);
  const existingImp = existingFoot + (existingUnits > 0 ? 250 * existingUnits : 0);
  f.perviousExisting = Math.max(0, lotArea - existingImp);
  const runoff = (imp) => (RUNOFF_C.impervious * imp + RUNOFF_C.pervious * Math.max(0, lotArea - imp)) / 12;
  f.runoffIncrease = runoff(effImp) - runoff(existingImp);
  if (f.effImperviousShare > STORMWATER_FLAG) {
    C({
      key: "stormwater", kind: "environmental", severity: "conditional", icon: "droplets", title: "Too much hard surface",
      plain: `${Math.round(f.imperviousShare * 100)}% of the lot would be roof or pavement. Expect stormwater requirements (confirm with City / PWSA).`,
      viz: { type: "paved", share: f.effImperviousShare, limit: STORMWATER_FLAG },
      current: `Hard surface: ${Math.round(f.imperviousShare * 100)}%`, required: `Flag above ${Math.round(STORMWATER_FLAG * 100)}%`,
      chip: a.greenRoof ? null : { key: "greenRoof", value: true, label: "Add a green roof", ...WHO.design }, src: "HAZARD",
    });
  }

  // --- site hazards (physical: no policy fixes them)
  const phys = (key, title, plain, severity) => C({ key, kind: "physical", severity, icon: "mountain", title, plain, current: plain, required: "Engineering review", chip: null, src: "HAZARD" });
  if (hz.s > 0.6) phys("slope", "Very steep lot", `${Math.round(hz.s * 100)}% of the lot is steeper than 25%. Likely not buildable without major grading.`, "blocking");
  else if (hz.s > 0.15) phys("slope", "Steep slope", `${Math.round(hz.s * 100)}% of the lot is steeper than 25%. Needs a geotechnical study.`, "conditional");
  if (hz.u > 0) phys("undermined", "Old mines underneath", "Part of the lot is over mapped mine workings. Needs a subsidence study.", "conditional");
  if (hz.l > 0) phys("landslide", "Landslide-prone area", "Part of the lot is mapped as landslide-prone. Needs a geotechnical study.", "conditional");
  if (hz.f === "SFHA") C({ key: "flood", kind: "environmental", severity: "conditional", icon: "droplets", title: "Flood zone", plain: "The lot is in a FEMA flood hazard area.", current: "FEMA flood zone", required: "Floodplain review", chip: null, src: "HAZARD" });

  // --- energy
  const roofType = f.roof === "flat" ? "flat" : "pitched";
  f.usableRoofSf = f.footprint * PV.usable[roofType] * (a.greenRoof ? 0.6 : 1);
  const kw = (f.usableRoofSf / SF_PER_M2) * PV.kwPerM2;
  f.pvPerUnit = f.units ? (kw * PV.yield[roofType]) / f.units : 0;
  let walls = 0;
  for (const v of f.volumes) {
    if (v.porch) continue;
    const w = v.s1 - v.s0, d = v.t1 - v.t0, hh = v.stories * FLOOR_TO_FLOOR;
    walls += (v.party === 2 ? 2 * w : v.party === 1 ? 2 * w + d : 2 * (w + d)) * hh;
  }
  f.envelopePerUnit = f.units ? (walls + f.footprint) / f.units : 0;

  for (const v of f.volumes) v.ring = rectXY(frame, v.s0, v.s1, v.t0, v.t1);
  f.status = f.constraints.some((c) => c.severity === "blocking") ? "constrained" : f.constraints.length ? "conditional" : "viable";
  f.levels = levels(f, parcel, hz);
  f.primary = sortedConstraints(f).slice(0, 2).map((c) => c.title);
  return f;
}

const ORDER = { blocking: 0, conditional: 1 };
const KIND_ORDER = { regulatory: 0, physical: 1, environmental: 2 };
export function sortedConstraints(f) {
  return [...f.constraints].sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

export function walkMinutes(parcel) { return (parcel.tr.d * 1.3) / 264; }

// Plain-language levels (value 1-5 for the dot meter). No composite score.
export function levels(f, parcel, hz) {
  const homes = f.units >= 10 ? ["Many", 5] : f.units >= 3 ? ["Some", 3] : ["Few", 1];
  const wm = walkMinutes(parcel);
  const transit = wm <= 5 && parcel.tr.t >= 300 ? ["Excellent", 5] : wm <= 10 ? ["Good", 3] : ["Limited", 1];
  let pts = 0;
  pts += f.pvPerUnit >= 4000 ? 2 : f.pvPerUnit >= 1500 ? 1 : 0;
  const perv = 1 - f.effImperviousShare;
  pts += perv >= 0.4 ? 2 : perv >= 0.2 ? 1 : 0;
  pts += hz.s > 0.15 || hz.u > 0 || hz.l > 0 || hz.f === "SFHA" ? 0 : 2;
  pts += f.envelopePerUnit <= 1200 ? 2 : f.envelopePerUnit <= 2500 ? 1 : 0;
  const sealed = f.effImperviousShare > STORMWATER_FLAG;
  const green = pts >= 6 && !sealed ? ["Good", 5] : pts >= 3.5 ? ["Fair", 3] : ["Low", 1];
  const n = f.constraints.length;
  const approvals = f.status === "viable" ? ["Allowed", 5] : f.status === "conditional" ? [`${n} change${n === 1 ? "" : "s"}`, 3] : ["Not allowed", 1];
  return { homes, transit, green, approvals };
}

export function applyChip(a, chip) {
  const n = { ...a, allowUses: [...a.allowUses] };
  if (chip.key === "height") { n.heightFt = chip.value.heightFt; n.stories = chip.value.stories; }
  else if (chip.key === "allowUses") { if (!n.allowUses.includes(chip.value)) n.allowUses.push(chip.value); }
  else n[chip.key] = chip.value;
  return n;
}

export function activeChanges(a) {
  const out = [];
  if (a.heightFt != null) out.push({ key: "height", label: `Height allowed to ${a.heightFt} ft`, icon: "ruler" });
  if (a.parking === "none") out.push({ key: "parking", label: "No parking minimum", icon: "car" });
  if (a.greenRoof) out.push({ key: "greenRoof", label: "Green roof", icon: "sprout" });
  if (a.allowAdu) out.push({ key: "allowAdu", label: "Backyard units allowed", icon: "house" });
  if (a.sitePlan) out.push({ key: "sitePlan", label: "Site plan approved", icon: "clipboard-check" });
  if (a.sideYard != null) out.push({ key: "sideYard", label: `Side yards ${a.sideYard} ft`, icon: "ruler" });
  if (a.rearYard != null) out.push({ key: "rearYard", label: `Rear yard ${a.rearYard} ft`, icon: "ruler" });
  if (a.lotWaiver) out.push({ key: "lotWaiver", label: "Lot-size relief", icon: "ruler" });
  if (a.capacity) out.push({ key: "capacity", label: "Smaller units", icon: "users" });
  for (const u of a.allowUses) out.push({ key: "allowUses:" + u, label: `Rezoned for ${SCENARIOS[u] ? lower(SCENARIOS[u].name) : u}`, icon: "landmark" });
  return out;
}

export function removeChange(a, key) {
  const n = { ...a, allowUses: [...a.allowUses] };
  if (key === "height") { n.heightFt = null; n.stories = null; }
  else if (key === "parking") n.parking = "current";
  else if (key.startsWith("allowUses:")) n.allowUses = n.allowUses.filter((u) => u !== key.split(":")[1]);
  else if (key === "sideYard" || key === "rearYard") n[key] = null;
  else n[key] = false;
  return n;
}

export const CAPACITY_CHIP = { key: "capacity", value: true, label: "Smaller units, more homes", ...WHO.design };
export const GREEN_CHIP = { key: "greenRoof", value: true, label: "Add a green roof", ...WHO.design };
