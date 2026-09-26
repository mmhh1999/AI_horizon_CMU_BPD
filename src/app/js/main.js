// App state and wiring.
import { EXAMPLES, SCENARIO_SETS, districtRules } from "./config.js";
import { makeFrame, bbox } from "./geo.js";
import { buildScenario, effectiveRules, defaultAssumptions, applyChip, removeChange } from "./scenarios.js";
import { createSiteMap, showParcel, setOverlay, OVERLAYS } from "./map.js";
import { renderParcelCard, renderFutures, renderDetail, renderWhy, renderSetSelect, renderSources } from "./ui.js";
import { sunAt, shadowST } from "./sun.js";
import { answer } from "./answers.js";

const $ = (s) => document.querySelector(s);
const state = {
  parcelId: null, setKey: "default", selected: "smallmf", whyOpen: false,
  assumptions: defaultAssumptions(), transitions: {}, overlay: null, shadow: false, hour: 12, answer: "", exampleIdx: -1,
};
let area, map, byId, frame, ctx, futures = [];

async function init() {
  area = await (await fetch("./data/area.json")).json();
  byId = new Map(area.parcels.map((p) => [p.id, p]));
  renderSetSelect($("#setSelect"), state.setKey);
  renderOverlayButtons();
  bindEvents();
  renderParcelCard($("#parcelCard"), null);
  renderWhy($("#why"), null);
  icons();
  map = createSiteMap("map", area, selectParcel, () => {});
}

function selectParcel(id, fly = true) {
  const p = byId.get(id);
  if (!p) return;
  setNav("explore");
  state.parcelId = id;
  state.assumptions = defaultAssumptions();
  state.transitions = {};
  state.whyOpen = false;
  state.answer = "";
  frame = makeFrame(p.c, p.fe);
  ctx = buildContext(p);
  showParcel(map, p, fly);
  recompute(null);
  const firstConditional = futures.find((f) => f.status === "conditional");
  state.selected = futures.length ? (firstConditional || futures[0]).id : null;
  render();
}

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
  return SCENARIO_SETS[state.setKey].ids.map((id) => buildScenario(id, p, frame, rules, assumptions, p.hz, ctx.existingFoot));
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

function render() {
  const p = byId.get(state.parcelId);
  renderParcelCard($("#parcelCard"), p, frame);
  if (!p) { icons(); return; }
  const rules0 = districtRules(p.z);
  if (!rules0) {
    $("#futures").innerHTML = `<div class="oos">Zoning <b>${p.z || "unknown"}</b> is outside this prototype's draft rule set (residential and neighborhood-commercial districts only). Try another parcel.</div>`;
    $("#detail").innerHTML = ""; renderWhy($("#why"), null); icons(); return;
  }
  state.lotST = ctx.lotST;
  renderFutures($("#futures"), futures, state);
  const f = futures.find((x) => x.id === state.selected);
  renderDetail($("#detail"), f, p, ctx, state);
  renderWhy($("#why"), f, p, state, futures);
  $("#exampleNote").textContent = state.exampleIdx >= 0 ? EXAMPLES[state.exampleIdx].why : "";
  icons();
}

function renderOverlayButtons() {
  $("#overlays").innerHTML = Object.entries(OVERLAYS).map(([k, o]) => `<button data-ov="${k}"><i data-lucide="${o.icon}" class="ic"></i>${o.label}</button>`).join("");
}
function renderLegend() {
  const o = OVERLAYS[state.overlay];
  $("#legend").innerHTML = o ? o.legend.map(([l, c]) => `<span><i style="background:${c}"></i>${l}</span>`).join("") : "";
  $("#legend").hidden = !o;
  document.querySelectorAll("#overlays button").forEach((b) => b.classList.toggle("on", b.dataset.ov === state.overlay));
  icons();
}

function setNav(key) { document.querySelectorAll(".rail .nav").forEach((b) => b.classList.toggle("on", b.dataset.nav === key)); }

function bindEvents() {
  document.querySelector(".rail").addEventListener("click", (e) => {
    const b = e.target.closest("[data-nav]");
    if (!b) return;
    const k = b.dataset.nav;
    if (k === "sources") { renderSources($("#sources")); $("#sources").hidden = false; icons(); return; }
    setNav(k);
    if (k === "explore") $("#sec-explore").scrollIntoView({ behavior: "smooth", block: "start" });
    if (k === "futures") { $("#sec-futures").scrollTo({ top: 0, behavior: "smooth" }); $("#sec-futures").scrollIntoView({ behavior: "smooth", block: "start" }); }
    if (k === "why") { if (state.parcelId) { state.whyOpen = true; render(); } $("#why").scrollIntoView({ behavior: "smooth", block: "start" }); }
  });
  $("#tryExample").addEventListener("click", () => {
    state.exampleIdx = (state.exampleIdx + 1) % EXAMPLES.length;
    selectParcel(EXAMPLES[state.exampleIdx].id);
  });
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#search").value.trim().toUpperCase();
    if (!q) return;
    const hit = area.parcels.find((p) => p.id === q) || area.parcels.find((p) => (p.a || "").toUpperCase().includes(q));
    if (hit) { state.exampleIdx = -1; selectParcel(hit.id); } else $("#search").setCustomValidity("No parcel found in the demo area"), $("#search").reportValidity(), setTimeout(() => $("#search").setCustomValidity(""), 1500);
  });
  $("#overlays").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ov]");
    if (!b) return;
    state.overlay = state.overlay === b.dataset.ov ? null : b.dataset.ov;
    setOverlay(map, state.overlay);
    renderLegend();
  });
  $("#setSelect").addEventListener("change", (e) => {
    state.setKey = e.target.value;
    if (!state.parcelId) return;
    recompute(null);
    state.selected = futures.length ? futures[0].id : null;
    render();
  });
  $("#futures").addEventListener("click", (e) => {
    const why = e.target.closest("[data-why]");
    const card = e.target.closest(".fcard");
    if (!card) return;
    state.selected = card.dataset.id;
    if (why) { state.whyOpen = true; setNav("why"); } else setNav("futures");
    updateShadows();
    render();
  });
  $("#detail").addEventListener("change", (e) => { if (e.target.id === "shadowToggle") { state.shadow = e.target.checked; updateShadows(); render(); } });
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
