// App state and wiring. Five steps: Community > Who are you planning for? > Opportunity > Housing futures > Trade-offs.
// `stage` is the step the user is on; `level` is the map level (county, city, nbhd, parcel).
import { EXAMPLES, SCENARIO_SETS, MAX_TYPES, districtRules, suggestTypes } from "./config.js";
import { makeFrame, bbox } from "./geo.js";
import { buildScenario, effectiveRules, defaultAssumptions, applyChip, removeChange } from "./scenarios.js";
import { createMap, setLevel, setClasses, setHood, setOpportunities, setContext, showParcel, fitTo, ringsOf, CONTEXT } from "./map.js";
import { renderParcelCard, renderFutures, renderDetail, renderWhy, renderSetSelect, renderTypePicker, renderSources, weightsHTML, tradeSwitchHTML, scoreBreakdownHTML, prioRankHTML, compareFacts } from "./ui.js";
import { PRESETS, CRITERIA, setWeight, suggestedEmphasis, weightsFromEmphasis, evaluate } from "./priorities.js";
import { sunAt, shadowST } from "./sun.js";
import { explainWhyNot, explainCompare } from "./explain.js";
import { solarDefaults, solarEnvelope, checkSolar, compactness, tod, green, goalsFor } from "./solar.js";
import { answer, COMPARE_Q } from "./answers.js";
import { ROLES, roleWeights, roleLabel, roleHTML, planningForHTML, weightStripHTML, rankingHTML } from "./roles.js";
import { initSearch } from "./search.js";
import { setupSplitters, resetSplitters } from "./splitter.js";
import { loadCounty, loadCity, loadHood, loadSmell, HOOD_INDICATORS, COUNTY_INDICATORS, TAGS, TAG_ORDER, RAMP, classify } from "./data.js";
import { renderCountyPanel, renderCityPanel, renderNeeds, renderNeedsCompact, renderOpportunity, needsStripHTML, parcelOpportunityHTML } from "./needs.js";
import { defaultCost, renderCost } from "./cost.js";
import { askMira, renderMiraFab, renderMiraPanel, tradeoffCtaHTML, TRADEOFF_CTA_PROMPT } from "./mira.js";

const STEPS = [
  ["community", "Community", "Community", "users"],
  ["perspective", "Who are you planning for?", "Perspective", "user-check"],
  ["opportunity", "Opportunity", "Opportunity", "map-pin"],
  ["futures", "Housing futures", "Futures", "layout-grid"],
  ["tradeoffs", "Trade-offs", "Trade-offs", "scale"],
];
const LAYOUTS = ["layout-map", "layout-panel", "layout-trio"];

const $ = (s) => document.querySelector(s);
const state = {
  level: "county", stage: "community", slug: null, muni: null, indicator: "needs", countyIndicator: "vacantShare", opp: new Set(["VB", "VL", "PO"]),
  parcelId: null, setKey: "suggested", types: SCENARIO_SETS.default.ids, selected: "smallmf", whyOpen: false, needsOpen: false, layersOpen: true,
  assumptions: defaultAssumptions(), transitions: {}, overlay: null, shadow: false, hour: 12, answer: "", answerId: 0, exampleIdx: -1,
  solar: solarDefaults(), solarShow: false, solarOpen: false, weightsOpen: false, railFocus: "why",
  weights: roleWeights("community"), preset: null, role: "community", roleModified: false, cost: defaultCost(),
  mira: { open: false, avatar: "idle", messages: [], input: "" },
};
let county, city, smell, hood, area, map, byId, frame, ctx, futures = [];
let mapReady = false, searchApi, layoutKey = "", fitPending = true;
let signalMapReady;
const mapReadyPromise = new Promise((resolve) => { signalMapReady = resolve; });

async function init() {
  [county, city, smell] = await Promise.all([loadCounty(), loadCity(), loadSmell().catch(() => null)]);
  setupSplitters($(".ws"), () => map);
  searchApi = initSearch({
    city,
    currentArea: () => ["nbhd", "parcel"].includes(state.level) ? area : null,
    onHood: (slug) => { state.exampleIdx = -1; goHood(slug); },
    onParcel: (id) => { state.exampleIdx = -1; selectParcel(id); },
    onAction: (key) => {
      if (key === "example") $("#tryExample").click();
      else if (key === "sources") $("#openSources").click();
      else if (state.level === "parcel") openSection(key);
      else if (key === "priorities" && state.slug) goStage("perspective");
      else {
        const ex = EXAMPLES[0];
        goHood(ex.slug, ex.id).then(() => { state.exampleIdx = 0; openSection(key); });
      }
    },
  });
  renderLayerButtons();
  bindEvents();
  map = createMap("map", { county, city }, {
    muni: onMuni, hood: (slug) => goHood(slug), parcel: (id) => selectParcel(id),
    ready: () => {
      mapReady = true; applyChoropleths(); setLevel(map, state.level);
      fitPending = true;
      signalMapReady();
      render();
    },
  });
  window.__hfMap = map;
  render();
}

// ------------------------------------------------------------------ levels and steps
function onMuni(m) {
  if (m.city) return goCity();
  state.muni = m;
  render();
}

function goCounty() {
  Object.assign(state, { level: "county", stage: "community", slug: null, parcelId: null, exampleIdx: -1 });
  if (mapReady) setLevel(map, "county");
  fitPending = true;
  render();
}

function goCity() {
  Object.assign(state, { level: "city", stage: "community", slug: null, parcelId: null, muni: null, exampleIdx: -1 });
  if (mapReady) setLevel(map, "city");
  fitPending = true;
  render();
}

async function goHood(slug, parcelId = null) {
  await mapReadyPromise;
  if (state.slug === slug && hood && !parcelId) {
    if (state.level === "parcel") backToHood("opportunity");
    return;
  }
  const meta = city.hoods.find((h) => h.slug === slug);
  if (!meta) return;
  document.body.classList.add("loading");
  try {
    const data = await loadHood(slug);
    hood = { ...meta, smell: smell?.hoods?.[slug] }; area = data; byId = new Map(data.parcels.map((p) => [p.id, p]));
    Object.assign(state, { level: "nbhd", stage: "community", slug, parcelId: null, needsOpen: false, layersOpen: !matchMedia("(max-width: 760px)").matches });
    if (state.setKey === "suggested") state.types = suggestTypes(meta.needs);
    setLevel(map, "nbhd");
    setHood(map, data, slug, state.opp);
    setContext(map, state.overlay);
    fitPending = !parcelId;
  } finally { document.body.classList.remove("loading"); }
  if (parcelId) selectParcel(parcelId); else { render(); scrollPanelsTop(); }
}

function backToHood(stage) {
  Object.assign(state, { level: "nbhd", stage, parcelId: null, exampleIdx: -1 });
  setLevel(map, "nbhd");
  fitPending = true;
  render();
  scrollPanelsTop();
}

function selectParcel(id, fly = true) {
  const p = byId?.get(id);
  if (!p) return;
  if (state.level !== "parcel") state.layersOpen = false;
  Object.assign(state, { level: "parcel", stage: "futures", parcelId: id, assumptions: defaultAssumptions(), transitions: {}, whyOpen: false, answer: "", weightsOpen: false });
  frame = makeFrame(p.c, p.fe);
  ctx = buildContext(p);
  ctx.solarEnv = solarEnvelope(frame, ctx.lotST, state.solar);
  setLevel(map, "parcel");
  showParcel(map, p, false);
  fitPending = fly;
  recompute(null);
  state.selected = futures.length ? evaluate(futures, state.weights)[0].f.id : null;
  render();
  scrollPanelsTop();
}

// Journey buttons and "Next" buttons. Going back to steps 1–3 from a lot returns to the neighborhood.
function goStage(key) {
  if (key === "community") {
    if (state.level === "parcel") return backToHood("community");
    if (state.level === "nbhd") { state.stage = "community"; render(); scrollPanelsTop(); }
    return;
  }
  if (key === "perspective" || key === "opportunity") {
    if (!state.slug) return;
    if (state.level === "parcel") return backToHood(key);
    state.stage = key; render(); scrollPanelsTop();
    return;
  }
  if (!state.parcelId || (key === "tradeoffs" && !futures.length)) return;
  state.stage = key;
  render();
  scrollPanelsTop();
}

// Rail and search shortcuts that need a lot.
function openSection(key) {
  if (state.level !== "parcel") return;
  if (key === "tradeoffs") goStage("tradeoffs");
  else if (key === "cost" || key === "why") {
    state.railFocus = key;
    if (key === "why") state.whyOpen = true;
    goStage("tradeoffs");
    $(key === "cost" ? "#cost" : "#why").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    if (key === "priorities") state.weightsOpen = true;
    goStage("futures");
    if (key === "priorities") $("#planningFor").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// On stacked (narrow) layouts the page scrolls, not the columns: bring the new step into view.
function scrollPanelsTop() {
  $("#sec-futures").scrollTop = 0;
  $("#why").scrollTop = 0;
  if (!matchMedia("(max-width: 1200px)").matches) return;
  const mapFirst = state.stage === "community" || state.stage === "opportunity";
  (mapFirst ? $("#journey") : $("#sec-futures")).scrollIntoView({ block: "start" });
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

// ------------------------------------------------------------------ layout: one grid per step, map refit after every width change
function layoutFor() {
  if (state.level === "county" || state.level === "city") return ["map", "full"];
  if (state.stage === "tradeoffs") return ["trio", "narrow"];
  return ["panel", state.stage === "futures" ? "mid" : "wide"];
}

function refit() {
  if (state.level === "county") fitTo(map, county.munis.flatMap((m) => ringsOf(m.g)), 16);
  else if (state.level === "city") fitTo(map, county.munis.find((m) => m.city).g, 16);
  else if (state.level === "nbhd" && hood) fitTo(map, hood.g, 20);
  else if (state.level === "parcel" && byId?.get(state.parcelId)) showParcel(map, byId.get(state.parcelId), true);
}

function applyLayout() {
  const ws = $(".ws");
  const [layout, width] = layoutFor();
  const key = `${layout}|${width}`;
  const changed = key !== layoutKey;
  if (changed) {
    ws.classList.remove(...LAYOUTS);
    ws.classList.add(`layout-${layout}`);
    resetSplitters(ws);
    layoutKey = key;
  }
  STEPS.forEach(([k]) => ws.classList.toggle(`stage-${k}`, k === state.stage));
  if (mapReady && (changed || fitPending)) {
    fitPending = false;
    requestAnimationFrame(() => { map.resize(); refit(); });
  }
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

// ------------------------------------------------------------------ Mira: global stage-aware copilot
// Only fields that actually exist in app state are included; nothing here is invented or recomputed.
function buildMiraContext() {
  const c = { stage: state.stage, stageLabel: STEPS.find(([k]) => k === state.stage)?.[1] };
  c.geography = { county: "Allegheny County" };
  if (state.level !== "county") c.geography.city = "Pittsburgh";
  if (hood) c.geography.neighborhood = hood.name;
  c.persona = roleLabel(state);
  const top = Object.entries(state.weights).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => CRITERIA.find((cr) => cr.key === k)?.label || k);
  if (top.length) c.topPriorities = top;
  if (hood?.needs?.length) c.communityNeeds = hood.needs.map((n) => n.label);
  const p = state.parcelId ? byId?.get(state.parcelId) : null;
  if (p) c.selectedOpportunity = { address: p.a || p.id, zoning: p.z || "unknown" };
  if (futures.length) {
    const rows = evaluate(futures, state.weights);
    c.alternatives = rows.map((r, i) => ({ rank: i + 1, name: r.f.name, status: r.f.status, fit: Math.round(r.fit * 100) }));
    const f = futures.find((x) => x.id === state.selected);
    if (f) c.selectedFuture = { name: f.name, status: f.status, netNewUnits: f.netUnits };
  }
  return c;
}

function renderMira() {
  const el = $("#mira");
  const context = buildMiraContext();
  el.innerHTML = renderMiraFab(state.mira) + renderMiraPanel(state.mira, context, state.stage);
  icons();
}

async function askMiraFlow(question) {
  if (!question || state.mira.avatar === "thinking") return;
  state.mira.messages.push({ role: "user", text: question });
  state.mira.avatar = "thinking";
  state.mira.input = "";
  renderMira();
  $("#miraLog").scrollTop = $("#miraLog").scrollHeight;
  const context = buildMiraContext();
  const history = state.mira.messages.slice(-6);
  const text = await askMira(question, context, history);
  if (text) {
    state.mira.messages.push({ role: "assistant", text: text.replace(/</g, "&lt;") });
    state.mira.avatar = "responding";
  } else {
    state.mira.avatar = "error";
  }
  renderMira();
  $("#miraLog").scrollTop = $("#miraLog").scrollHeight;
}

// ------------------------------------------------------------------ render
function render() {
  renderMira();
  renderCrumbs();
  renderJourney();
  applyLayout();
  syncRail();
  const { level: L, stage: S } = state;
  const local = L === "nbhd" || L === "parcel", atParcel = L === "parcel";
  $("#layerToggle").hidden = !local;
  $("#layerToggle").setAttribute("aria-expanded", String(state.layersOpen));
  $("#layerBar").hidden = !local || !state.layersOpen;
  renderLegend();

  const showFutures = atParcel && S === "futures", showTrade = atParcel && S === "tradeoffs";
  $("#perspective").hidden = S !== "perspective";
  $("#futuresBlock").hidden = !showFutures;
  $("#tradeoffsBlock").hidden = !showTrade;
  if (S !== "perspective") $("#perspective").innerHTML = "";
  if (!showFutures) $("#planningFor").innerHTML = "";

  if (L === "county") renderCountyPanel($("#parcelCard"), county, city, state.countyIndicator, state.muni);
  else if (L === "city") renderCityPanel($("#parcelCard"), city, state.indicator);
  if (L === "county" || L === "city") { $("#needs").innerHTML = ""; renderWhy($("#why"), null); }

  if (L === "nbhd") {
    $("#parcelCard").innerHTML = hoodHint();
    renderWhy($("#why"), null);
    if (S === "community") renderNeeds($("#needs"), hood, city, { next: true });
    else if (S === "perspective") { $("#needs").innerHTML = needsStripHTML(hood, "stage"); renderPerspective(); }
    else renderOpportunity($("#needs"), hood, roleLabel(state), EXAMPLES.some((e) => e.slug === state.slug));
  }
  document.querySelectorAll("#oppLayers button").forEach((b) => b.classList.toggle("on", state.opp.has(b.dataset.tag)));
  document.querySelectorAll(".opp[data-tag]").forEach((b) => b.classList.toggle("on", state.opp.has(b.dataset.tag)));

  if (!atParcel) { $("#exampleNote").textContent = ""; icons(); return; }
  const p = byId.get(state.parcelId);
  renderNeedsCompact($("#needs"), hood, city, state.needsOpen);
  renderParcelCard($("#parcelCard"), p, frame);
  $("#parcelCard").insertAdjacentHTML("beforeend", parcelOpportunityHTML(p, hood));
  if (!districtRules(p.z)) {
    $("#futuresBlock").hidden = false; $("#tradeoffsBlock").hidden = true;
    $("#futures").innerHTML = `<div class="oos">Zoning <b>${p.z || "unknown"}</b> is outside this prototype's draft rule set (residential and neighborhood-commercial districts only). Pick another lot on the map.</div>`;
    ["#planningFor", "#ranking"].forEach((s) => { $(s).innerHTML = ""; });
    $("#reviewTradeoffs").hidden = true;
    renderWhy($("#why"), null); $("#exampleNote").textContent = ""; icons(); return;
  }
  $("#reviewTradeoffs").hidden = false;
  state.lotST = ctx.lotST;
  const f = futures.find((x) => x.id === state.selected);
  if (showFutures) {
    $("#planningFor").innerHTML = planningForHTML(futures, state, weightsHTML(state, hood));
    renderSetSelect($("#setSelect"), state.setKey, hood.name);
    $("#ranking").innerHTML = rankingHTML(futures, state);
    renderTypePicker($("#typePicker"), state.types, suggestTypes(hood.needs), hood.name);
    renderFutures($("#futures"), futures, state);
  }
  if (showTrade) {
    if ($("#solarMore")) state.solarOpen = $("#solarMore").open;
    $("#tradeSwitch").innerHTML = tradeSwitchHTML(futures, state);
    $("#miraCta").innerHTML = futures.length > 1 ? tradeoffCtaHTML() : "";
    renderDetail($("#detail"), f, p, ctx, state);
    renderCost($("#cost"), f, state.cost);
    $("#scoreBreakdown").innerHTML = scoreBreakdownHTML(futures, state.weights);
  }
  renderWhy($("#why"), f, p, state, futures);
  $("#exampleNote").textContent = state.exampleIdx >= 0 ? EXAMPLES[state.exampleIdx].why : "";
  icons();
}

function renderPerspective() {
  $("#perspective").innerHTML = `${roleHTML([], state)}
    <section class="prio-card weights-card"><div class="eyebrow">Their priorities</div><h2>What matters most to ${state.roleModified ? "you" : `a ${ROLES[state.role].label.toLowerCase()}`}?</h2>
      <div id="weightStrip">${weightStripHTML(state.weights)}</div>
      ${weightsHTML(state, hood)}</section>
    <button class="btn-primary next-step" data-go-stage="opportunity"><i data-lucide="map-pin" class="ic"></i>Next: find a lot in ${hood.name}<i data-lucide="arrow-right" class="ic"></i></button>`;
}

function hoodHint() {
  const text = state.stage === "community"
    ? `Read what ${hood.name} needs, then choose who you are planning for.`
    : state.stage === "perspective"
      ? `Pick a lens and set priorities. They carry into the ranking once you choose a lot.`
      : `Click a colored lot to see what could be built there. Colors follow the Opportunity layers.`;
  return `<div class="eyebrow">${hood.name}</div><div class="hint"><i data-lucide="mouse-pointer-click" class="ic"></i> ${text}</div>`;
}

function renderJourney() {
  const at = STEPS.findIndex(([k]) => k === state.stage);
  const can = { community: true, perspective: !!state.slug, opportunity: !!state.slug, futures: !!state.parcelId, tradeoffs: !!state.parcelId && futures.length > 0 };
  const why = { perspective: "Pick a neighborhood first", opportunity: "Pick a neighborhood first", futures: "Pick a lot first", tradeoffs: "Pick a lot first" };
  $("#journey").innerHTML = STEPS.map(([k, label, short], i) => {
    const cur = i === at, done = i < at;
    return `<button type="button" data-stage="${k}" class="${done ? "done" : ""}" ${cur ? 'aria-current="step"' : ""} ${can[k] ? "" : `disabled title="${why[k]}"`}>
      <span class="jn">${done ? '<i data-lucide="check" class="ic"></i>' : i + 1}</span><span class="jl">${label}</span><span class="js">${short}</span></button>`;
  }).join('<i data-lucide="chevron-right" class="ic journey-sep"></i>');
}

function syncRail() {
  const lot = !!state.parcelId && futures.length > 0;
  const avail = { needs: !!state.slug, environment: !!state.slug, perspective: !!state.slug, futures: !!state.parcelId, cost: lot, why: lot };
  document.querySelectorAll(".rail [data-nav]").forEach((b) => { if (b.dataset.nav in avail) b.hidden = !avail[b.dataset.nav]; });
  const S = state.stage;
  setNav(S === "community" ? (state.slug ? "needs" : "explore") : S === "perspective" ? "perspective" : S === "opportunity" ? "explore" : S === "futures" ? "futures" : state.railFocus);
}

function renderCrumbs() {
  const parts = [`<button data-crumb="county" class="${state.level === "county" ? "on" : ""}">Allegheny County</button>`];
  if (state.level !== "county") parts.push(`<button data-crumb="city" class="${state.level === "city" ? "on" : ""}">Pittsburgh</button>`);
  if (hood && (state.level === "nbhd" || state.level === "parcel")) parts.push(`<button data-crumb="hood" class="${state.level === "nbhd" ? "on" : ""}">${hood.name}</button>`);
  if (state.level === "parcel") parts.push(`<button class="on">Lot</button>`);
  $("#crumbs").innerHTML = parts.join(`<i data-lucide="chevron-right" class="ic"></i>`);
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

// Live slider updates without a full re-render, so dragging stays smooth.
function refreshWeights(except) {
  document.querySelectorAll("[data-w]").forEach((x) => { if (x !== except) x.value = state.weights[x.dataset.w]; });
  document.querySelectorAll("[data-out]").forEach((o) => { o.textContent = state.weights[o.dataset.out]; });
  document.querySelectorAll("[data-preset], [data-emph]").forEach((b) => b.classList.remove("on"));
  if ($("#weightStrip")) $("#weightStrip").innerHTML = weightStripHTML(state.weights);
  if (state.level === "parcel" && futures.length && state.stage === "futures") {
    $("#ranking").innerHTML = rankingHTML(futures, state);
    renderFutures($("#futures"), futures, state);
  }
  if ($("#prioRank")) $("#prioRank").innerHTML = prioRankHTML(futures, state.weights);
  icons();
}

function setRole(key) {
  state.role = key; state.roleModified = false;
  state.weights = roleWeights(key); state.preset = null;
  render();
}

function bindEvents() {
  $("#journey").addEventListener("click", (e) => {
    const step = e.target.closest("[data-stage]");
    if (step && !step.disabled) goStage(step.dataset.stage);
  });
  $("#reviewTradeoffs").addEventListener("click", () => goStage("tradeoffs"));
  document.querySelector(".rail").addEventListener("click", (e) => {
    const b = e.target.closest("[data-nav]");
    if (!b) return;
    const k = b.dataset.nav;
    if (k === "sources") { renderSources($("#sources")); $("#sources").hidden = false; icons(); return; }
    if (k === "explore") { setNav(k); $("#sec-explore").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (k === "needs" || k === "environment") {
      if (state.level === "parcel") { state.needsOpen = true; render(); } else goStage("community");
      (k === "environment" ? $("#environment") : $("#needs"))?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (k === "perspective") return goStage("perspective");
    openSection(k);
  });
  $("#homeButton").addEventListener("click", () => {
    Object.assign(state, { role: "community", roleModified: false, weights: roleWeights("community"), preset: null, cost: defaultCost(), setKey: "suggested", types: SCENARIO_SETS.default.ids, solarShow: false, solarOpen: false });
    searchApi?.clear();
    goCounty();
  });

  const side = $("#sec-futures");
  side.addEventListener("click", (e) => {
    const role = e.target.closest("[data-role]");
    const go = e.target.closest("[data-go-stage]");
    const rank = e.target.closest("[data-rank]");
    const jump = e.target.closest("[data-role-jump]");
    const tag = e.target.closest("#needs [data-tag]");
    const preset = e.target.closest("[data-preset]");
    if (role && ROLES[role.dataset.role]) setRole(role.dataset.role);
    else if (go) goStage(go.dataset.goStage);
    else if (rank) { state.selected = rank.dataset.rank; state.stage = "tradeoffs"; updateShadows(); render(); scrollPanelsTop(); }
    else if (jump) openSection(jump.dataset.roleJump === "detail" ? "tradeoffs" : jump.dataset.roleJump);
    else if (tag) toggleTag(tag.dataset.tag);
    else if (e.target.closest("[data-needs-toggle]")) { state.needsOpen = !state.needsOpen; render(); }
    else if (e.target.closest("#hoodExample")) {
      const idx = EXAMPLES.findIndex((x) => x.slug === state.slug);
      if (idx >= 0) { state.exampleIdx = idx; selectParcel(EXAMPLES[idx].id); }
    } else if (preset) { state.weights = { ...PRESETS[preset.dataset.preset].w }; state.preset = preset.dataset.preset; state.roleModified = true; render(); }
    else if (e.target.closest("[data-emph]")) { state.weights = weightsFromEmphasis(suggestedEmphasis(hood?.needs)); state.preset = "needs"; state.roleModified = true; render(); }
  });
  side.addEventListener("input", (e) => {
    const s = e.target.closest("[data-w]");
    if (!s) return;
    state.roleModified = true;
    state.weights = setWeight(state.weights, s.dataset.w, +s.value);
    state.preset = null;
    refreshWeights(s);
  });
  side.addEventListener("keydown", (e) => {
    const tab = e.target.closest("[data-role]");
    if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const keys = Object.keys(ROLES), at = keys.indexOf(tab.dataset.role);
    const next = e.key === "Home" ? keys[0] : e.key === "End" ? keys[keys.length - 1]
      : keys[(at + (e.key === "ArrowRight" ? 1 : -1) + keys.length) % keys.length];
    setRole(next);
    $("#roleTab-" + next)?.focus();
  });
  document.addEventListener("toggle", (e) => {
    if (e.target.matches?.(".weight-edit")) state.weightsOpen = e.target.open;
    if (e.target.matches?.("#solarMore")) state.solarOpen = e.target.open;
  }, true);

  $("#tryExample").addEventListener("click", () => {
    state.exampleIdx = (state.exampleIdx + 1) % EXAMPLES.length;
    const ex = EXAMPLES[state.exampleIdx];
    const idx = state.exampleIdx;
    goHood(ex.slug, ex.id).then(() => { state.exampleIdx = idx; render(); });
  });
  $("#crumbs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-crumb]");
    if (!b) return;
    if (b.dataset.crumb === "county") goCounty();
    else if (b.dataset.crumb === "city") goCity();
    else if (b.dataset.crumb === "hood" && state.level === "parcel") backToHood("opportunity");
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
    if (state.setKey === "suggested") state.types = suggestTypes(hood?.needs);
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
  $("#futures").addEventListener("click", (e) => {
    const why = e.target.closest("[data-why]");
    const card = e.target.closest(".fcard");
    if (!card) return;
    state.selected = card.dataset.id;
    if (why) { state.whyOpen = true; state.railFocus = "why"; state.stage = "tradeoffs"; }
    updateShadows();
    render();
    if (why) scrollPanelsTop();
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
  $("#detail").addEventListener("input", (e) => { if (e.target.id === "hour") { state.hour = +e.target.value; updateShadows(); render(); } });
  const updateCostInput = (e) => {
    if (!["costPerSf", "costContingency", "costLand"].includes(e.target.id)) return;
    const key = { costPerSf: "perSf", costContingency: "contingency", costLand: "land" }[e.target.id];
    const num = Number(e.target.value);
    if (!Number.isFinite(num)) return;
    const limits = { perSf: [100, 400], contingency: [0, 30], land: [0, 10000000] };
    state.cost[key] = Math.min(limits[key][1], Math.max(limits[key][0], num));
    const draft = document.createElement("div");
    renderCost(draft, futures.find((x) => x.id === state.selected), state.cost);
    $("#cost .cost-results").innerHTML = draft.querySelector(".cost-results").innerHTML;
    $("#cost .cost-caveat").innerHTML = draft.querySelector(".cost-caveat").innerHTML;
    $("#cost").querySelectorAll(".cost-controls label b").forEach((b, i) => { b.textContent = draft.querySelectorAll(".cost-controls label b")[i].textContent; });
    if (e.type === "change") e.target.value = state.cost[key];
  };
  $("#cost").addEventListener("input", updateCostInput);
  $("#cost").addEventListener("change", updateCostInput);
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
    const ew = e.target.closest("[data-explain-why]");
    if (ew) { runExplain(ew, explainWhyNot(JSON.parse(ew.dataset.explainWhy)), "whyExplainOut"); return; }
    const ec = e.target.closest("[data-explain-compare]");
    if (ec) { runExplain(ec, explainCompare(JSON.parse(ec.dataset.explainCompare)), "rankExplainOut"); return; }
    if (e.target.closest("#miraFab")) {
      state.mira.open = !state.mira.open;
      state.mira.avatar = state.mira.open ? "open" : "idle";
      renderMira();
      if (state.mira.open) $("#miraInput")?.focus();
      return;
    }
    if (e.target.closest("#miraClose")) { state.mira.open = false; state.mira.avatar = "idle"; renderMira(); return; }
    const chip = e.target.closest("[data-mira-q]");
    if (chip) { askMiraFlow(chip.dataset.miraQ); return; }
    if (e.target.closest("[data-mira-cta]")) {
      state.mira.open = true; state.mira.avatar = "open"; renderMira();
      askMiraFlow(TRADEOFF_CTA_PROMPT);
      return;
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id === "miraForm") { e.preventDefault(); askMiraFlow($("#miraInput").value.trim()); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.mira.open) { state.mira.open = false; state.mira.avatar = "idle"; renderMira(); }
  });
}

async function runExplain(button, pending, outId) {
  if (button.disabled) return;
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = "Explaining…";
  const text = await pending;
  const out = document.getElementById(outId);
  if (text) {
    out.innerHTML = `<p>${text.replace(/</g, "&lt;")}</p><div class="muted small"><i data-lucide="sparkles" class="ic"></i> AI-phrased from the facts above; may be regenerated if it drifts from them.</div>`;
    button.remove();
  } else {
    out.innerHTML = `<p class="muted small">AI explanation unavailable right now. The facts above still stand.</p>`;
    button.disabled = false;
    button.innerHTML = original;
  }
  icons();
}

async function ask(q) {
  if (!q || !state.parcelId) return;
  const id = ++state.answerId;
  const f = futures.find((x) => x.id === state.selected);
  const p = byId.get(state.parcelId);
  const qq = q.replace(/</g, "&lt;");
  const rows = futures.length > 1 ? evaluate(futures, state.weights) : null;
  const templated = answer(q, {
    f, futures, rows, rules: effectiveRules(p, state.assumptions),
    whatIf: (patch) => computeFutures({ ...state.assumptions, ...patch }),
  });
  state.answer = `<div class="qa"><div class="qq">${qq}</div>${templated}</div>`;
  render();
  if (!COMPARE_Q.test(q) || !rows) return;
  const other = rows.find((r) => r.f.id === state.selected && r.f.id !== rows[0].f.id) || rows[1];
  const text = await explainCompare(compareFacts(rows[0], other));
  if (state.answerId !== id || !text) return;
  state.answer = `<div class="qa"><div class="qq">${qq}</div>${templated}<p>${text.replace(/</g, "&lt;")}</p><div class="muted small"><i data-lucide="sparkles" class="ic"></i> AI-phrased from the ranking above; may be regenerated if it drifts from the numbers.</div></div>`;
  render();
}

init().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML("afterbegin", `<div class="err">Could not start: ${err.message}. Serve this folder over HTTP (see README).</div>`);
});
