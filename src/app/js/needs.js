// Community-first panels: county overview, City overview, "What does <neighborhood> need?", parcel opportunity context.
import { TAGS, TAG_ORDER, HOOD_INDICATORS, COUNTY_INDICATORS, pct, n0 } from "./data.js";
import { environmentHTML } from "./environment.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const icon = (name, cls = "") => `<i data-lucide="${name}" class="ic ${cls}"></i>`;
const title = (s) => (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const NEED_TEXT = {
  aging: (v, c) => `${pct(v)} of residents are 65+ (City ${pct(c)})`,
  families: (v, c) => `${pct(v)} of residents are under 18 (City ${pct(c)})`,
  affordability: (v, c) => `${pct(v)} of residents live below the poverty line (City ${pct(c)})`,
  population: (v) => `Population changed ${v > 0 ? "+" : ""}${pct(v)} from 2013 to 2023`,
  vacancy: (v, c) => (v != null ? `${pct(v)} of homes are vacant (City ${pct(c)})` : "Many vacant lots"),
  renters: (v, c) => `${pct(v)} of households rent (City ${pct(c)})`,
  alone: (v, c) => `${pct(v)} of households are one person living alone (City ${pct(c)})`,
  transit: (v, c) => `${pct(v)} of workers commute by transit or on foot (City ${pct(c)})`,
  green: (v, c) => `${pct(v)} of homes are within 1,000 ft of a park or greenway (City ${pct(c)})`,
  distress: (v, c) => `${pct(v, 1)} of buildings are rated poor or unsound (City ${pct(c, 1)})`,
  middle: (v, c) => `${pct(v)} of homes are in 2–4 unit buildings (City ${pct(c)})`,
};

// Which flagged needs a parcel's opportunities could speak to (plain language, no causal claims).
const PARCEL_NEEDS = [
  ["vacancy", (p) => has(p, "VL") || has(p, "VB"), "Brings a vacant lot or building back into use"],
  ["population", (p) => has(p, "VL") || has(p, "VB"), "New homes on empty land can help a shrinking neighborhood stabilize"],
  ["affordability", (p) => has(p, "PO"), "Public land can carry long-term affordability commitments"],
  ["aging", (p) => has(p, "GA") || has(p, "DL"), "A backyard or garage unit lets an older owner stay, downsize, or house a caregiver"],
  ["families", (p) => has(p, "DL") || (p.la || 0) >= 4000, "Room for family-size or multigenerational homes"],
  ["alone", (p) => has(p, "GA") || has(p, "DL"), "Small accessory homes suit one-person households"],
  ["transit", (p) => has(p, "TN"), "Car-light homes within a short walk of frequent transit"],
  ["renters", (p) => has(p, "PO") || has(p, "VL"), "Could host ownership-path or stable rental homes"],
  ["middle", (p) => (p.la || 0) >= 3000 && !has(p, "OS"), "Lot is large enough for 2–4 homes (missing middle)"],
  ["distress", (p) => has(p, "VB") || has(p, "OS"), "A distressed property that could be stabilized or repurposed"],
  ["green", (p) => (p.pk ?? 1e9) > 1000, "Far from parks today: keep shared green space on site"],
];
const has = (p, t) => p.o && p.o.includes(t);

function select(id, defs, key) {
  return `<select id="${id}" class="ind">${Object.entries(defs).map(([k, d]) => `<option value="${k}" ${k === key ? "selected" : ""}>${esc(d.label)}</option>`).join("")}</select>`;
}

// ---------------------------------------------------------------- left panel: county and city
export function renderCountyPanel(el, county, city, indKey, muni) {
  const R = county.regions;
  const C = R["City of Pittsburgh"], O = R["Allegheny County Outside the City of Pittsburgh"];
  const row = (label, a, b) => `<tr><td>${label}</td><td>${a}</td><td>${b}</td></tr>`;
  const m = muni && !muni.city ? muni : null;
  el.innerHTML = `
    <div class="eyebrow">Allegheny County</div>
    <div class="pc-title">${icon("map")}<div><b>${n0(county.totals.municipalities)} municipalities</b><span>${n0(county.totals.parcels)} parcel records · ${n0(R["Allegheny County"].population)} residents</span></div></div>
    <label class="lbl-sm">Color the map by</label>${select("countyInd", COUNTY_INDICATORS, indKey)}
    ${m ? `<div class="muni-card"><b>${esc(m.name)}</b>
      <div class="kv"><span>Parcels</span><b>${n0(m.stats?.parcels)}</b><span>Vacant land</span><b>${pct(m.stats?.vacantShare)}</b>
      <span>Owner-occupied</span><b>${pct(m.stats?.homesteadShare)}</b><span>Poor condition</span><b>${pct(m.stats?.poorShare, 1)}</b>
      <span>Median year built</span><b>${m.stats?.yearBuilt ?? "—"}</b><span>Tax-delinquent 2+ yrs</span><b>${n0(m.stats?.delinquent)}</b></div>
      <p class="muted small">Parcel-level futures cover the City of Pittsburgh in this prototype; other municipalities show this overview.</p></div>` : ""}
    <table class="cmp"><thead><tr><th></th><th>City</th><th>Rest of county</th></tr></thead><tbody>
      ${row("Residents", n0(C.population), n0(O.population))}
      ${row("65 and older", pct(C.age["65plus"]), pct(O.age["65plus"]))}
      ${row("Below poverty", pct(C.poverty), pct(O.poverty))}
      ${row("Renter households", pct(C.renter), pct(O.renter))}
      ${row("Vacant homes", pct(C.vacancy), pct(O.vacancy))}
    </tbody></table>
    <button class="btn-primary wide" data-go="city">${icon("building-2")} Explore the City of Pittsburgh ${icon("arrow-right")}</button>
    <p class="muted small">ACS 2019–2023 estimates (UCSUR / WPRDC). County parcels and assessments retrieved ${esc(county.meta.retrieved["assessments.csv"])}.</p>`;
}

export function renderCityPanel(el, city, indKey) {
  const s = city.city.stats, p = city.city.profile;
  el.innerHTML = `
    <div class="eyebrow">City of Pittsburgh</div>
    <div class="pc-title">${icon("building-2")}<div><b>90 neighborhoods</b><span>${n0(p.population)} residents · ${n0(s.parcels)} parcels</span></div></div>
    <label class="lbl-sm">Color neighborhoods by</label>${select("hoodInd", HOOD_INDICATORS, indKey)}
    <div class="kv">
      <span>Vacant lots</span><b>${n0(s.vacant_lot)}</b><span>Public land parcels</span><b>${n0(s.public_owned)}</b>
      <span>Vacant / condemned buildings</span><b>${n0(s.vacant_building)}</b><span>City lots for sale</span><b>${n0(s.publicForSale)}</b>
    </div>
    <p class="hint">${icon("mouse-pointer-click")} Click a neighborhood to see what it needs.</p>
    <button class="btn-ghost wide" data-hood="larimer">${icon("map-pin")} Start with Larimer (demo)</button>`;
}

// ---------------------------------------------------------------- center: What does X need?
function bars(parts, colors) {
  return `<div class="sbar">${parts.map(([l, v], i) => (v > 0.005 ? `<div style="flex:${v};background:${colors[i % colors.length]}" title="${esc(l)} ${pct(v)}">${v >= 0.12 ? `<span>${pct(v)}</span>` : ""}</div>` : "")).join("")}</div>
    <div class="slegend">${parts.map(([l, v], i) => `<span><i style="background:${colors[i % colors.length]}"></i>${esc(l)} ${pct(v)}</span>`).join("")}</div>`;
}
const GRAYS = ["#2F2F2F", "#5A5A58", "#8A8A87", "#B8B8B4", "#DDDDDA", "#EDEDEA"];

function diversityRow(label, v, med) {
  if (v == null) return "";
  const w = Math.round(v * 100), m = Math.round(med * 100);
  return `<div class="div-row"><span>${label}</span><div class="div-track"><div class="div-fill" style="width:${w}%"></div><i class="div-med" style="left:${m}%" title="City median"></i></div><b>${v.toFixed(2)}</b></div>`;
}

export function safetySentence(s, name) {
  if (!s) return "";
  const t25 = s.counts?.["2025"], t24 = s.counts?.["2024"];
  const tot = (c) => (c ? (c.person || 0) + (c.property || 0) + (c.society || 0) : 0);
  const trend = s.trend;
  const dir = trend == null ? "" : Math.abs(trend) < 0.05 ? "about the same as" : trend > 0 ? `${pct(Math.abs(trend))} higher than` : `${pct(Math.abs(trend))} lower than`;
  const rel = s.ratePer1000 == null ? "" : s.ratePer1000 > s.cityRatePer1000 * 1.25 ? "elevated relative to" : s.ratePer1000 < s.cityRatePer1000 * 0.8 ? "below" : "near";
  return `<p><b>Community safety context.</b> ${n0(tot(t25))} incidents were reported in ${esc(name)} in 2025 (${n0(t25?.person)} against persons, ${n0(t25?.property)} property, ${n0(t25?.society)} society)${dir ? `, ${dir} 2024 (${n0(tot(t24))})` : ""}.
    ${rel ? `Per resident, reported incidents are ${rel} the City overall${s.rateArea ? ` (rate for the combined census area ${esc(s.rateArea)})` : ""}.` : "Too few residents for a meaningful per-resident rate."}</p>
    <p class="muted small">Context, not a score. Reported incidents reflect reporting and enforcement as well as events, and per-resident rates overstate risk where many people visit. Built form is one part of a larger social system; the futures below show where homes could add porches, occupied ground floors and people on the street.</p>`;
}

export function renderNeeds(el, hood, city) {
  if (!hood) { el.innerHTML = ""; return; }
  const p = hood.profile, s = hood.stats, med = city.meta.diversityMedian, cp = city.city.profile;
  const needs = hood.needs.map((n) => `
    <li class="need"><span class="need-ic">${icon(n.icon)}</span><div><b>${esc(n.label)}</b><span>${esc((NEED_TEXT[n.key] || (() => ""))(n.value, n.city))}</span><em title="${esc(n.rule)}">${esc(n.src)} · rule: ${esc(n.rule)}</em></div></li>`).join("");
  const opp = TAG_ORDER.map((k) => ({ k, n: s[{ VL: "vacant_lot", VB: "vacant_building", PO: "public_owned", DL: "deep_lot", GA: "garage_adu", OS: "ownership_signal", TN: "transit_node" }[k]] }));
  el.innerHTML = `
    <div class="needs-card">
      <div class="eyebrow">Step 1 · Community</div>
      <h2>What does ${esc(hood.name)} need?</h2>
      <p class="muted">${p ? `${n0(p.population)} residents (2023), ${p.popChange > 0 ? "+" : ""}${pct(p.popChange)} since 2013 · ${n0(p.households)} households` : "No census profile for this neighborhood (very few residents)."}
      ${hood.acsShared ? `<br/><span class="small">Census figures cover the combined area “${esc(hood.acsArea)}”.</span>` : ""}</p>
      ${needs ? `<ul class="needs">${needs}</ul>` : `<p class="muted">No need crosses the published thresholds here. Compare the profile below with the City.</p>`}
      <details class="profile" ${needs ? "" : "open"}><summary>Who lives here and what homes exist</summary>
        ${p ? `<h4>${icon("users")} Age</h4>${bars([["Under 18", p.age.under18], ["18–24", p.age["18to24"]], ["25–44", p.age["25to44"]], ["45–64", p.age["45to64"]], ["65+", p.age["65plus"]]], GRAYS)}
        <h4>${icon("wallet")} Household income</h4>${bars([["< $25k", p.income.lt25k], ["$25–50k", p.income["25to50k"]], ["$50–75k", p.income["50to75k"]], ["$75–100k", p.income["75to100k"]], ["$100–200k", p.income["100to200k"]], ["$200k+", p.income["200kplus"]]], GRAYS)}
        <h4>${icon("globe")} Race and ethnicity</h4>${bars([["White", p.race.white], ["Black", p.race.black], ["Asian", p.race.asian], ["Other", p.race.other], ["Two or more", p.race.multiracial]], GRAYS)}<p class="muted small">Hispanic or Latino (any race): ${pct(p.hispanic)}.</p>
        <h4>${icon("shuffle")} Diversity (0 = one group, 1 = evenly mixed) <span class="muted small">| = City median</span></h4>
        ${diversityRow("Age", p.diversity.age, med.age)}${diversityRow("Income", p.diversity.income, med.income)}${diversityRow("Race", p.diversity.race, med.race)}` : ""}
        <h4>${icon("house")} Homes by building type</h4>${bars([["Single-family / row", s.stock.single], ["2–4 units", s.stock.two_to_four], ["5+ apartments", s.stock.apartments], ["Shops + homes", s.stock.mixed_use], ["Condos", s.stock.condo]], GRAYS)}
        ${p ? `<div class="kv"><span>Owner-occupied</span><b>${pct(p.ownerOcc)}</b><span>Renters</span><b>${pct(p.renter)}</b><span>Vacant homes</span><b>${pct(p.vacancy)}</b><span>City vacant homes</span><b>${pct(cp.vacancy)}</b></div>` : ""}
        <h4>${icon("trees")} Green space and transit</h4>
        <div class="kv"><span>Homes within 500 ft of a park</span><b>${pct(s.greenNear)}</b><span>within 1,000 ft (WHO ~300 m)</span><b>${pct(s.greenWho)}</b>
        <span>Homes with frequent transit ≤ ¼ mi</span><b>${pct(s.transitFrequent)}</b><span>City</span><b>${pct(city.city.stats.transitFrequent)}</b></div>
      </details>
      ${environmentHTML(hood)}
      <h3 class="opp-h">${icon("sparkles")} Where could new homes go? <span class="muted small">Toggle on the map</span></h3>
      <div class="opp-grid">${opp.map(({ k, n }) => `<button class="opp" data-tag="${k}" title="${esc(TAGS[k].why)}"><i style="background:${TAGS[k].color}"></i><span>${esc(TAGS[k].short)}</span><b>${n0(n)}</b></button>`).join("")}</div>
      <p class="muted small">Click a colored lot on the map to see its housing futures.</p>
    </div>`;
}

export function renderNeedsCompact(el, hood, city, open) {
  if (open) { renderNeeds(el, hood, city); el.querySelector(".needs-card h2")?.insertAdjacentHTML("afterend", `<button class="linkbtn" data-needs-toggle>Hide</button>`); return; }
  el.innerHTML = `<div class="needs-strip"><span class="eyebrow">${esc(hood.name)} needs</span>
    ${hood.needs.length ? hood.needs.map((n) => `<span class="nchip">${icon(n.icon)}${esc(n.label.split(":")[0])}</span>`).join("") : `<span class="muted small">No flagged needs</span>`}
    <button class="linkbtn" data-needs-toggle>Details</button></div>`;
}

// ---------------------------------------------------------------- parcel: opportunity tags + needs it could address
export function parcelOpportunityHTML(parcel, hood) {
  const tags = (parcel.o || []).map((k) => `<span class="tag" title="${esc(TAGS[k].why)}"><i style="background:${TAGS[k].color}"></i>${esc(TAGS[k].short)}</span>`).join("");
  const flagged = new Set((hood?.needs || []).map((n) => n.key));
  const helps = PARCEL_NEEDS.filter(([k, test]) => flagged.has(k) && test(parcel)).map(([, , t]) => t);
  const facts = [];
  if (parcel.po) facts.push(`${icon("landmark")}Owner: ${esc(parcel.po)}${parcel.ps ? ` · ${esc(parcel.ps)}` : ""}`);
  if (parcel.cm) facts.push(`${icon("triangle-alert")}On the City condemned / dead-end list`);
  if (parcel.cn) facts.push(`${icon("construction")}Condition: ${esc(title(parcel.cn))}`);
  if (parcel.vi) facts.push(`${icon("clipboard-list")}${parcel.vi} code-violation case${parcel.vi > 1 ? "s" : ""} since 2023`);
  if (parcel.pk != null) facts.push(`${icon("trees")}${n0(parcel.pk)} ft to the nearest park or greenway`);
  if (parcel.rf) facts.push(`${icon("move-vertical")}${n0(parcel.rf)} ft of yard behind the main building`);
  return `
    ${tags ? `<div class="tags">${tags}</div>` : `<div class="muted small">No opportunity tag on this lot.</div>`}
    ${facts.length ? `<ul class="facts">${facts.map((f) => `<li>${f}</li>`).join("")}</ul>` : ""}
    ${helps.length ? `<div class="helps"><b>${icon("heart-handshake")} Could help ${esc(hood.name)} with</b><ul>${helps.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></div>` : ""}
    ${has(parcel, "OS") ? `<p class="muted small">${icon("info")} The ownership signal combines public records (tax-bill address, number of parcels billed there, condition, violations, delinquency). It is a prompt to look closer, not a finding about any owner. No owner names or addresses are stored.</p>` : ""}`;
}
