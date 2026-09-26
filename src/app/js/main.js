// App state and wiring: County > City > neighborhood (needs + opportunities) > parcel (futures, why / why not).
import { EXAMPLES, SCENARIO_SETS, MAX_TYPES, districtRules, suggestTypes } from "./config.js";
import { makeFrame, bbox } from "./geo.js";
import { buildScenario, effectiveRules, defaultAssumptions, applyChip, removeChange } from "./scenarios.js";
import { createMap, setLevel, setClasses, setHood, setOpportunities, setContext, showParcel, fitTo, ringsOf, CONTEXT } from "./map.js";
import { renderParcelCard, renderFutures, renderDetail, renderWhy, renderSetSelect, renderTypePicker, renderSources, renderPriorities, prioRankHTML } from "./ui.js";
import { PRESETS, setWeight, suggestedEmphasis, weightsFromEmphasis } from "./priorities.js";
import { sunAt, shadowST } from "./sun.js";
import { solarDefaults, solarEnvelope, checkSolar, compactness, tod, green, goalsFor } from "./solar.js";
import { answer } from "./answers.js";
import { loadCounty, loadCity, loadHood, HOOD_INDICATORS, COUNTY_INDICATORS, TAGS, TAG_ORDER, RAMP, classify } from "./data.js";
import { renderCountyPanel, renderCityPanel, renderNeeds, renderNeedsCompact, parcelOpportunityHTML } from "./needs.js";

const $ = (s) => document.querySelector(s);
const state = {
  level: "county", stage: "community", slug: null, muni: null, indicator: "needs", countyIndicator: "vacantShare", opp: new Set(["VB", "VL", "PO"]),
  parcelId: null, setKey: "suggested", types: SCENARIO_SETS.default.ids, selected: "smallmf", whyOpen: false, needsOpen: false, layersOpen: true,
  assumptions: defaultAssumptions(), transitions: {}, overlay: null, shadow: false, hour: 12, answer: "", exampleIdx: -1,
  solar: solarDefaults(), solarShow: true, perfOpen: false, weightsOpen: false, weights: { ...PRESETS.even.w }, preset: "even",
};
let county, city, hood, area, map, byId, frame, ctx, futures = [];
let mapReady = false;
let signalMapReady;
const mapReadyPromise = new Promise((resolve) => { signalMapReady = resolve; });

async function init() {
  [county, city] = await Promise.all([loadCounty(), loadCity()]);
  $("#hoodList").innerHTML = city.hoods.map((h) => `<option value="${h.name}"></option>`).join("");
  renderLayerButtons();
  bindEvents();
  map = createMap("map", { county, city }, {
    muni: onMuni, hood: (slug) => goHood(slug), parcel: (id) => selectParcel(id),
    ready: () => {
      mapReady = true; applyChoropleths(); setLevel(map, state.level);
      if (state.level === "county") fitTo(map, county.munis.flatMap((m) => ringsOf(m.g)), 16);
      signalMapReady();
      render();
    },
  });
  window.__hfMap = map;
  render();
}

// ------------------------------------------------------------------ levels
function onMuni(m) {
  if (m.city) return goCity();
  state.muni = m;
  render();
}

function goCounty() {
  Object.assign(state, { level: "county", stage: "community", slug: null, parcelId: null, exampleIdx: -1 });
  setNav("explore");
  if (mapReady) { setLevel(map, "county"); fitTo(map, county.munis.flatMap((m) => ringsOf(m.g)), 16); }
  render();
}

function goCity() {
  Object.assign(state, { level: "city", stage: "community", slug: null, parcelId: null, muni: null, exampleIdx: -1 });
  setNav("explore");
  if (mapReady) { setLevel(map, "city"); fitTo(map, county.munis.find((m) => m.city).g, 16); }
  render();
}

async function goHood(slug, parcelId = null) {
  await mapReadyPromise;
  if (state.slug === slug && hood && !parcelId) {
    if (state.level === "parcel") { state.level = "nbhd"; state.stage = "opportunity"; state.parcelId = null; setNav("explore"); setLevel(map, "nbhd"); fitTo(map, hood.g, 20); render(); }
    return;
  }
  const meta = city.hoods.find((h) => h.slug === slug);
  if (!meta) return;
  document.body.classList.add("loading");
  try {
    const data = await loadHood(slug);
    hood = meta; area = data; byId = new Map(data.parcels.map((p) => [p.id, p]));
    Object.assign(state, { level: "nbhd", stage: "opportunity", slug, parcelId: null, needsOpen: false, layersOpen: true });
    setNav("explore");
    if (state.setKey === "suggested") state.types = suggestTypes(meta.needs).slice(0, 3);
    setLevel(map, "nbhd");
    setHood(map, data, slug, state.opp);
    setContext(map, state.overlay);
    if (!parcelId) fitTo(map, meta.g, 20);
  } finally { document.body.classList.remove("loading"); }
  if (parcelId) selectParcel(parcelId); else render();
}

function selectParcel(id, fly = true) {
  const p = byId?.get(id);
  if (!p) return;
  if (state.level !== "parcel") state.layersOpen = false;
  state.level = "parcel";
  state.stage = "futures";
  setNav("futures");
  state.parcelId = id;
  state.needsOpen = false;
  state.perfOpen = false;
  state.weightsOpen = false;
  $("#typeOptions").open = false;
  state.assumptions = defaultAssumptions();
  state.transitions = {};
  state.whyOpen = false;
  state.answer = "";
  frame = makeFrame(p.c, p.fe);
  ctx = buildContext(p);
  ctx.solarEnv = solarEnvelope(frame, ctx.lotST, state.solar);
  setLevel(map, "parcel");
  showParcel(map, p, fly);
  recompute(null);
  const firstConditional = futures.find((f) => f.status === "conditional");
  state.selected = futures.length ? (firstConditional || futures[0]).id : null;
  render();
}

function applyChoropleths() {
  const cI = COUNTY_INDICATORS[state.countyIndicator];
  const cc = classify(county.munis.map(cI.get));
  setClasses(map, "munis", county.munis.map((m) => cc.cls(cI.get(m))));
  const hI = HOOD_INDICATORS[state.indicator];
  const hc = classify(city.hoods.map(hI.get));
  setClasses(map, "hoods", city.hoods.map((h) => hc.cls(hI.get(h))));
  state.legendCounty = { ind: cI, c: cc };
  state.legendHood = { ind: hI, c: hc };
}

// ------------------------------------------------------------------ parcel engine (unchanged logic)
function buildContext(p) {
  const toST = (ll) => frame.toST(frame.toXY(ll));
  const lotST = p.c.map(toST);
  const R = 140; // ft around the lot
  const box = bbox(lotST.map(([s, t]) => [s, t]));
  const near = (ring) => ring.some(([s, t]) => s > box[0] - R && s < box[2] + R && t > box[1] - R && t < box[3] + R);
  const nbST = [];
  const [lx0, ly0, lx1, ly1] = bbox(p.c);
  const pad = 0.0012;
  for (const b of area.buildings) {
    const c0 = b.c[0];
    if (c0[0] < lx0 - pad || c0[0] > lx1 + pad || c0[1] < ly0 - pad || c0[1] > ly1 + pad) continue;
    if (b.p === p.id) continue;
    const ring = b.c.map(toST);
    if (near(ring)) nbST.push({ ring, h: b.h });
  }
  const nbLotsST = [];
  for (const q of area.parcels) {
    if (q.id === p.id) continue;
    const c0 = q.c[0];
    if (c0[0] < lx0 - pad || c0[0] > lx1 + pad || c0[1] < ly0 - pad || c0[1] > ly1 + pad) continue;
    const ring = q.c.map(toST);
    if (near(ring)) nbLotsST.push(ring);
  }
  const existingFoot = area.buildings.filter((b) => b.p === p.id).reduce((s, b) => s + Math.abs(areaST(b.c.map(toST))), 0);
  return { lotST, nbST, nbLotsST, existingFoot, shadows: [] };
}
const areaST = (r) => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return a / 2; };

function computeFutures(assumptions) {
  const p = byId.get(state.parcelId);
  const rules = effectiveRules(p, assumptions);
  if (!rules) return [];
  return state.types.map((id) => {
    const f = buildScenario(id, p, frame, rules, assumptions, p.hz, ctx.existingFoot);
    f.perf = { solar: checkSolar(f, ctx.solarEnv), compact: compactness(f), tod: tod(p, f, assumptions, area.stops), green: green(p, f) };
    f.goals = goalsFor(f, f.perf);
    return f;
  });
}

function recompute(prev) {
  const before = prev ? Object.fromEntries(prev.map((f) => [f.id, f.status])) : null;
  futures = computeFutures(state.assumptions);
  state.transitions = {};
  if (before) for (const f of futures) if (before[f.id] && before[f.id] !== f.status) state.transitions[f.id] = { from: before[f.id], to: f.status };
  updateShadows();
}

function updateShadows() {
  const f = futures.find((x) => x.id === state.selected);
  if (!f || !state.shadow) { ctx.shadows = []; return; }
  const sun = sunAt(frame, state.hour);
  ctx.shadows = f.volumes.map((v) => shadowST(frame, [[v.s0, v.t0], [v.s1, v.t0], [v.s1, v.t1], [v.s0, v.t1], [v.s0, v.t0]], v.h, sun)).filter(Boolean);
}

const icons = () => { if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } }); };

// ------------------------------------------------------------------ render
function render() {
  renderCrumbs();
  renderJourney();
  const local = state.level === "nbhd" || state.level === "parcel";
  const ws = document.querySelector(".ws");
  const layout = `stage-${state.stage}`;
  if (!ws.classList.contains(layout)) {
    ws.classList.remove("stage-community", "stage-opportunity", "stage-futures", "stage-tradeoffs");
    ws.classList.add(layout);
    if (mapReady) requestAnimationFrame(() => map.resize());
  }
  $("#layerToggle").hidden = !local;
  $("#layerToggle").setAttribute("aria-expanded", String(state.layersOpen));
  $("#layerBar").hidden = !local || !state.layersOpen;
  $("#futuresBlock").hidden = state.level !== "parcel";
  const reviewing = state.level === "parcel" && state.stage === "tradeoffs";
  $("#reviewTradeoffs").hidden = !state.parcelId || reviewing;
  $("#detail").hidden = !reviewing;
  $("#priorities").hidden = !reviewing;
  $("#why").hidden = !reviewing;
  renderLegend();

  if (state.level === "county") renderCountyPanel($("#parcelCard"), county, city, state.countyIndicator, state.muni);
  else if (state.level === "city") renderCityPanel($("#parcelCard"), city, state.indicator);

  if (state.level === "nbhd") renderNeeds($("#needs"), hood, city);
  else if (state.level === "parcel") renderNeedsCompact($("#needs"), hood, city, state.needsOpen);
  else $("#needs").innerHTML = state.level === "county" ? intro("county") : intro("city");

  if (state.level === "nbhd") {
    $("#parcelCard").innerHTML = `<div class="eyebrow">${hood.name}</div><div class="hint"><i data-lucide="mouse-pointer-click" class="ic"></i> Click a colored lot to see what could be built there. Colors follow the Opportunities toggles on the map.</div>`;
    renderWhy($("#why"), null);
  }
  if (state.level === "county" || state.level === "city") renderWhy($("#why"), null);
  document.querySelectorAll("#oppLayers button").forEach((b) => b.classList.toggle("on", state.opp.has(b.dataset.tag)));
  document.querySelectorAll(".opp[data-tag]").forEach((b) => b.classList.toggle("on", state.opp.has(b.dataset.tag)));

  if (state.level !== "parcel") { $("#exampleNote").textContent = ""; icons(); return; }
  const p = byId.get(state.parcelId);
  renderParcelCard($("#parcelCard"), p, frame);
  $("#parcelCard").insertAdjacentHTML("beforeend", parcelOpportunityHTML(p, hood));
  const rules0 = districtRules(p.z);
  if (!rules0) {
    $("#futures").innerHTML = `<div class="oos">Zoning <b>${p.z || "unknown"}</b> is outside this prototype's draft rule set (residential and neighborhood-commercial districts only). Try another lot.</div>`;
    $("#detail").innerHTML = ""; $("#priorities").innerHTML = ""; renderWhy($("#why"), null); $("#exampleNote").textContent = ""; icons(); return;
  }
  state.lotST = ctx.lotST;
  renderSetSelect($("#setSelect"), state.setKey, hood.name);
  renderTypePicker($("#typePicker"), state.types, suggestTypes(hood.needs), hood.name);
  renderFutures($("#futures"), futures, state);
  const f = futures.find((x) => x.id === state.selected);
  renderDetail($("#detail"), f, p, ctx, state);
  renderWhy($("#why"), f, p, state, futures);
  renderPriorities($("#priorities"), futures, state, hood);
  $("#exampleNote").textContent = state.exampleIdx >= 0 ? EXAMPLES[state.exampleIdx].why : "";
  icons();
}

function intro(level) {
  const lead = level === "county"
    ? "Start with the county: how do municipalities differ in vacant land, owner-occupancy, building condition and tax delinquency? Then open the City of Pittsburgh."
    : "Each of Pittsburgh's 90 neighborhoods has a community profile, published “needs” flags, and opportunity lots. Color the map by an indicator, then click a neighborhood.";
  return `<div class="needs-card intro"><div class="eyebrow">How it works</div><h2>Community first, then the lot</h2><p>${lead}</p>
    <ol class="flow"><li><b>Community</b> What does the neighborhood need?</li><li><b>Opportunities</b> Vacant lots and buildings, public land, deep lots, garages, transit nodes</li>
    <li><b>Housing futures</b> What could a lot become?</li><li><b>Performance and constraints</b> Sun, compactness, transit, green space; zoning and site</li>
    <li><b>Priorities and why not</b> What matters most, and what would have to change</li></ol></div>`;
}

function renderCrumbs() {
  const parts = [`<button data-crumb="county" class="${state.level === "county" ? "on" : ""}">Allegheny County</button>`];
  if (state.level !== "county") parts.push(`<button data-crumb="city" class="${state.level === "city" ? "on" : ""}">Pittsburgh</button>`);
  if (hood && (state.level === "nbhd" || state.level === "parcel")) parts.push(`<button data-crumb="hood" class="${state.level === "nbhd" ? "on" : ""}">${hood.name}</button>`);
  if (state.level === "parcel") parts.push(`<button class="on">Lot</button>`);
  $("#crumbs").innerHTML = parts.join(`<i data-lucide="chevron-right" class="ic"></i>`);
}

function renderJourney() {
  const steps = [
    ["community", "Community", "users"],
    ["opportunity", "Opportunity", "map-pin"],
    ["futures", "Housing futures", "layout-grid"],
    ["tradeoffs", "Trade-offs", "scale"],
  ];
  $("#journey").innerHTML = steps.map(([key, label, glyph], i) => {
    const enabled = key === "community" || (key === "opportunity" ? !!state.slug : !!state.parcelId);
    const active = key === state.stage;
    return `<button data-stage="${key}" ${active ? 'aria-current="step"' : ""} ${enabled ? "" : "disabled"}><i data-lucide="${glyph}" class="ic"></i><span>${label}</span></button>${i < steps.length - 1 ? '<i data-lucide="chevron-right" class="ic journey-sep"></i>' : ""}`;
  }).join("");
}

function renderLayerButtons() {
  $("#oppLayers").innerHTML = TAG_ORDER.map((k) => `<button data-tag="${k}" title="${TAGS[k].why}"><i class="sw" style="background:${TAGS[k].color}"></i>${TAGS[k].short}</button>`).join("");
  $("#overlays").innerHTML = Object.entries(CONTEXT).map(([k, o]) => `<button data-ov="${k}"><i data-lucide="${o.icon}" class="ic"></i>${o.label}</button>`).join("");
}

function renderLegend() {
  let items = null, head = "";
  if (state.level === "county" && state.legendCounty) ({ items, head } = choroLegend(state.legendCounty));
  else if (state.level === "city" && state.legendHood) ({ items, head } = choroLegend(state.legendHood));
  else if (CONTEXT[state.overlay]) { items = CONTEXT[state.overlay].legend; }
  $("#legend").innerHTML = items ? `${head}${items.map(([l, c]) => `<span><i style="background:${c}"></i>${l}</span>`).join("")}` : "";
  $("#legend").hidden = !items;
  document.querySelectorAll("#overlays button").forEach((b) => b.classList.toggle("on", b.dataset.ov === state.overlay));
}

function choroLegend({ ind, c }) {
  if (!c.breaks.length) return { items: null, head: "" };
  const edges = [c.min, ...c.breaks, c.max];
  return { head: `<b class="lg-head">${ind.label}</b>`, items: RAMP.map((col, i) => [`${ind.fmt(edges[i])}–${ind.fmt(edges[i + 1])}`, col]) };
}

function setNav(key) { document.querySelectorAll(".rail .nav").forEach((b) => b.classList.toggle("on", b.dataset.nav === key)); }

function bindEvents() {
  $("#journey").addEventListener("click", (e) => {
    const step = e.target.closest("[data-stage]");
    if (!step || step.disabled) return;
    const key = step.dataset.stage;
    if (key === "community") { if (state.level === "parcel" || state.level === "nbhd") goCity(); return; }
    if (key === "opportunity") { if (state.level === "parcel") goHood(state.slug); return; }
    if (state.parcelId && (key === "futures" || key === "tradeoffs")) {
      state.stage = key;
      setNav(key === "futures" ? "futures" : "why");
      render();
    }
  });
  $("#reviewTradeoffs").addEventListener("click", () => { state.stage = "tradeoffs"; setNav("why"); render(); $("#detail").scrollIntoView({ behavior: "smooth", block: "start" }); });
  document.querySelector(".rail").addEventListener("click", (e) => {
    const b = e.target.closest("[data-nav]");
    if (!b) return;
    const k = b.dataset.nav;
    if (k === "sources") { renderSources($("#sources")); $("#sources").hidden = false; icons(); return; }
    setNav(k);
    if (k === "explore") $("#sec-explore").scrollIntoView({ behavior: "smooth", block: "start" });
    if (k === "needs") { if (state.level === "parcel") { state.needsOpen = true; render(); } $("#needs").scrollIntoView({ behavior: "smooth", block: "start" }); }
    if (k === "futures" && state.parcelId) { state.stage = "futures"; render(); $("#futuresBlock").scrollIntoView({ behavior: "smooth", block: "start" }); }
    if (k === "why" && state.parcelId) { state.stage = "tradeoffs"; state.whyOpen = true; render(); $("#why").scrollIntoView({ behavior: "smooth", block: "start" }); }
  });
  $("#tryExample").addEventListener("click", () => {
    state.exampleIdx = (state.exampleIdx + 1) % EXAMPLES.length;
    const ex = EXAMPLES[state.exampleIdx];
    const idx = state.exampleIdx;
    goHood(ex.slug, ex.id).then(() => { state.exampleIdx = idx; render(); });
  });
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = $("#search").value.trim();
    const q = raw.toUpperCase();
    if (!q) return;
    const h = city.hoods.find((x) => x.name.toUpperCase() === q) || city.hoods.find((x) => x.name.toUpperCase().startsWith(q));
    if (h) { state.exampleIdx = -1; goHood(h.slug); return; }
    const hit = area && (area.parcels.find((p) => p.id === q) || area.parcels.find((p) => (p.a || "").toUpperCase().includes(q)));
    if (hit) { state.exampleIdx = -1; selectParcel(hit.id); return; }
    $("#search").setCustomValidity(area ? `Not found in ${hood.name}. Try a neighborhood name.` : "Type a neighborhood name, e.g. Larimer");
    $("#search").reportValidity();
    setTimeout(() => $("#search").setCustomValidity(""), 1500);
  });
  $("#crumbs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-crumb]");
    if (!b) return;
    if (b.dataset.crumb === "county") goCounty();
    else if (b.dataset.crumb === "city") goCity();
    else if (b.dataset.crumb === "hood" && state.level === "parcel") { state.level = "nbhd"; state.stage = "opportunity"; state.parcelId = null; state.exampleIdx = -1; setNav("explore"); setLevel(map, "nbhd"); fitTo(map, hood.g, 20); render(); }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "countyInd") { state.countyIndicator = e.target.value; applyChoropleths(); render(); }
    if (e.target.id === "hoodInd") { state.indicator = e.target.value; applyChoropleths(); render(); }
  });
  const toggleTag = (t) => {
    state.opp.has(t) ? state.opp.delete(t) : state.opp.add(t);
    setOpportunities(map, state.opp);
    render();
  };
  $("#oppLayers").addEventListener("click", (e) => { const b = e.target.closest("[data-tag]"); if (b) toggleTag(b.dataset.tag); });
  $("#needs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tag]");
    if (b) toggleTag(b.dataset.tag);
    if (e.target.closest("[data-needs-toggle]")) { state.needsOpen = !state.needsOpen; render(); }
  });
  $("#parcelCard").addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    const h = e.target.closest("[data-hood]");
    if (g && g.dataset.go === "city") goCity();
    if (h) goHood(h.dataset.hood);
  });
  $("#layerToggle").addEventListener("click", () => { state.layersOpen = !state.layersOpen; render(); });
  $("#overlays").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ov]");
    if (!b) return;
    state.overlay = state.overlay === b.dataset.ov ? null : b.dataset.ov;
    setContext(map, state.overlay);
    renderLegend();
    icons();
  });
  const retype = () => {
    if (!state.parcelId) return;
    recompute(null);
    if (!state.types.includes(state.selected)) state.selected = futures.length ? futures[0].id : null;
    updateShadows();
    render();
  };
  $("#setSelect").addEventListener("change", (e) => {
    state.setKey = e.target.value;
    if (state.setKey === "suggested") state.types = suggestTypes(hood?.needs).slice(0, 3);
    else if (SCENARIO_SETS[state.setKey]) state.types = SCENARIO_SETS[state.setKey].ids;
    retype();
  });
  $("#typePicker").addEventListener("click", (e) => {
    const b = e.target.closest("[data-type]");
    if (!b || b.disabled) return;
    const id = b.dataset.type;
    if (state.types.includes(id)) { if (state.types.length === 1) return; state.types = state.types.filter((t) => t !== id); }
    else if (state.types.length < MAX_TYPES) state.types = [...state.types, id];
    state.setKey = "custom";
    retype();
  });
  $("#priorities").addEventListener("input", (e) => {
    const s = e.target.closest("[data-w]");
    if (!s) return;
    state.weights = setWeight(state.weights, s.dataset.w, +s.value);
    state.preset = null;
    document.querySelectorAll("#priorities [data-w]").forEach((x) => { if (x !== s) x.value = state.weights[x.dataset.w]; });
    document.querySelectorAll("#priorities [data-out]").forEach((o) => { o.textContent = state.weights[o.dataset.out]; });
    document.querySelectorAll("#priorities [data-preset], #priorities [data-emph]").forEach((b) => b.classList.remove("on"));
    $("#prioRank").innerHTML = prioRankHTML(futures, state.weights);
    icons();
  });
  $("#priorities").addEventListener("click", (e) => {
    if (e.target.closest(".weight-details summary")) state.weightsOpen = !e.target.closest(".weight-details").open;
    const p = e.target.closest("[data-preset]");
    if (p) { state.weights = { ...PRESETS[p.dataset.preset].w }; state.preset = p.dataset.preset; render(); }
    if (e.target.closest("[data-emph]")) { state.weights = weightsFromEmphasis(suggestedEmphasis(hood?.needs)); state.preset = "needs"; render(); }
  });
  $("#futures").addEventListener("click", (e) => {
    const why = e.target.closest("[data-why]");
    const card = e.target.closest(".fcard");
    if (!card) return;
    state.selected = card.dataset.id;
    if (why) { state.stage = "tradeoffs"; state.whyOpen = true; setNav("why"); }
    else setNav(state.stage === "tradeoffs" ? "why" : "futures");
    updateShadows();
    render();
  });
  $("#detail").addEventListener("change", (e) => {
    if (e.target.id === "shadowToggle") { state.shadow = e.target.checked; updateShadows(); render(); }
    if (e.target.id === "solarToggle") { state.solarShow = e.target.checked; render(); }
    if (e.target.id === "solarWindow" || e.target.id === "solarFence") {
      state.solar = { ...state.solar, [e.target.id === "solarWindow" ? "window" : "fence"]: e.target.id === "solarFence" ? +e.target.value : e.target.value };
      ctx.solarEnv = solarEnvelope(frame, ctx.lotST, state.solar);
      recompute(null);
      render();
    }
  });
  $("#detail").addEventListener("click", (e) => {
    if (e.target.closest(".perf-more summary")) state.perfOpen = !e.target.closest(".perf-more").open;
  });
  $("#detail").addEventListener("input", (e) => { if (e.target.id === "hour") { state.hour = +e.target.value; updateShadows(); render(); } });
  $("#why").addEventListener("click", (e) => {
    const why = e.target.closest("[data-why]");
    const chip = e.target.closest("[data-chip]");
    const rm = e.target.closest("[data-remove]");
    const q = e.target.closest("[data-q]");
    if (why) { state.whyOpen = true; render(); }
    else if (chip) { const prev = futures; state.assumptions = applyChip(state.assumptions, JSON.parse(chip.dataset.chip)); recompute(prev); render(); }
    else if (rm) { const prev = futures; state.assumptions = removeChange(state.assumptions, rm.dataset.remove); recompute(prev); render(); }
    else if (e.target.closest("#resetChanges")) { const prev = futures; state.assumptions = defaultAssumptions(); recompute(prev); render(); }
    else if (q) ask(q.dataset.q);
  });
  $("#why").addEventListener("submit", (e) => { if (e.target.id === "askForm") { e.preventDefault(); ask($("#askInput").value); } });
  document.addEventListener("click", (e) => {
    const src = e.target.closest("[data-src]");
    if (src) { e.stopPropagation(); renderSources($("#sources"), src.dataset.src); $("#sources").hidden = false; icons(); document.getElementById("src-" + src.dataset.src)?.scrollIntoView({ block: "center" }); return; }
    if (e.target.closest("#openSources")) { renderSources($("#sources")); $("#sources").hidden = false; icons(); }
    if (e.target.closest("#closeSources") || e.target.id === "sources") $("#sources").hidden = true;
  });
}

function ask(q) {
  if (!q || !state.parcelId) return;
  const f = futures.find((x) => x.id === state.selected);
  const p = byId.get(state.parcelId);
  state.answer = `<div class="qa"><div class="qq">${q.replace(/</g, "&lt;")}</div>${answer(q, {
    f, futures, rules: effectiveRules(p, state.assumptions),
    whatIf: (patch) => computeFutures({ ...state.assumptions, ...patch }),
  })}</div>`;
  render();
}

init().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML("afterbegin", `<div class="err">Could not start: ${err.message}. Serve this folder over HTTP (see README).</div>`);
});
