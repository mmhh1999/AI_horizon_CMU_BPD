// DOM rendering: plain language for developers and policymakers, icons (Lucide), small diagrams.
import { SOURCES, SCENARIO_SETS, SCENARIOS, TYPE_ORDER, MAX_TYPES, CLIMATE_CONTEXT, districtRules, lower } from "./config.js";
import { sortedConstraints, walkMinutes, activeChanges, zoneLabel, CAPACITY_CHIP, GREEN_CHIP } from "./scenarios.js";
import { renderAxo } from "./axo.js";
import { SOLAR_WINDOWS, SOLAR_FENCES } from "./solar.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const n0 = (x) => (x == null || Number.isNaN(x) ? "—" : Math.round(x).toLocaleString("en-US"));
const title = (s) => (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
export const icon = (name, cls = "") => `<i data-lucide="${name}" class="ic ${cls}"></i>`;

export const STATUS = {
  viable: { label: "Can be built", icon: "circle-check" },
  conditional: { label: "Needs changes", icon: "triangle-alert" },
  constrained: { label: "Not allowed", icon: "circle-x" },
};
const statusChip = (s, big = false) => `<span class="status ${s} ${big ? "big" : ""}">${icon(STATUS[s].icon)}${STATUS[s].label}</span>`;
const dots = (v) => `<span class="dots">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</span>`;
const src = (key) => `<button class="src" data-src="${key}" title="Source: ${esc(SOURCES[key].label)}">${icon("info")}</button>`;

// ---------- parcel card (under the map)
export function renderParcelCard(el, parcel, frame) {
  if (!parcel) { el.innerHTML = `<div class="hint">${icon("mouse-pointer-click")} Click a lot on the map, or press <b>Try an example lot</b>.</div>`; return; }
  const r = districtRules(parcel.z);
  const wm = Math.max(1, Math.round(walkMinutes(parcel)));
  const vacant = /VACANT/.test(parcel.u || "");
  el.innerHTML = `
    <div class="eyebrow">The lot</div>
    <div class="pc-title">${icon("map-pin")}<div><b>${esc(title(parcel.a) || parcel.id)}</b><span>Parcel ${parcel.id}</span></div>${src("PARCEL")}</div>
    <div class="pc-chips">
      <span>${icon(vacant ? "square-dashed" : "house")}${vacant ? "Vacant lot" : esc(title(parcel.u))}</span>
      <span>${icon("ruler")}${n0(frame.areaSf)} sq ft</span>
      <span>${icon("file-text")}${esc(zoneLabel(r))} zoning <em>${esc(parcel.z || "")}</em></span>
      <span>${icon("bus")}${wm} min to bus · ${n0(parcel.tr.t)} trips/day</span>
    </div>`;
}

// ---------- futures cards (center)
export function renderFutures(el, futures, state) {
  el.innerHTML = futures.map((f) => {
    const t = state.transitions[f.id];
    const L = f.levels;
    const inWay = f.primary.length ? f.primary.join(" · ") : "Nothing under current rules";
    return `
    <article class="fcard ${state.selected === f.id ? "sel" : ""} ${f.status}" data-id="${f.id}">
      <header>${icon(f.icon, "tico")}<div><h3>${esc(f.name)}</h3><div class="fsub">${esc(f.sub)}</div></div></header>
      ${statusChip(f.status)}
      ${t ? `<div class="trans">${STATUS[t.from].label} ${icon("arrow-right")} <b>${STATUS[t.to].label}</b></div>` : ""}
      <div class="thumb">${renderAxo({ width: 240, height: 140, lotRing: state.lotST, envelope: f.envelope, volumes: f.volumes, dashed: f.status === "constrained", style: "thumb", pad: 10 })}</div>
      <div class="big">${f.units} <span>home${f.units === 1 ? "" : "s"}</span> · ${f.stories} <span>floor${f.stories === 1 ? "" : "s"}</span></div>
      ${f.demolition ? `<div class="demo">${icon("triangle-alert")}Replaces ${f.existingUnits} existing home${f.existingUnits === 1 ? "" : "s"}</div>` : ""}
      <ul class="lv">
        <li>${icon("house")}<span>Homes</span><b>${L.homes[0]}</b>${dots(L.homes[1])}</li>
        <li>${icon("bus")}<span>Transit</span><b>${L.transit[0]}</b>${dots(L.transit[1])}</li>
        <li>${icon("leaf")}<span>Climate</span><b>${L.green[0]}</b>${dots(L.green[1])}</li>
        <li>${icon("clipboard-check")}<span>Approvals</span><b class="${f.status}">${L.approvals[0]}</b>${dots(L.approvals[1])}</li>
      </ul>
      <div class="inway"><span>In the way</span>${esc(inWay)}</div>
      <button class="whynot" data-why="${f.id}">WHY NOT?</button>
    </article>`;
  }).join("");
}

// ---------- diagrams
function heightViz(v) {
  const max = Math.max(v.allowed, v.needed), W = 250, k = (W - 118) / max;
  return `<svg class="viz" viewBox="0 0 ${W} 56"><text x="0" y="15">Limit</text><rect x="62" y="5" width="${v.allowed * k}" height="14" rx="3" class="ok"/><text x="${66 + v.allowed * k}" y="16" class="val">${v.allowed} ft</text>
    <text x="0" y="41">Needs</text><rect x="62" y="31" width="${v.needed * k}" height="14" rx="3" class="warn"/><text x="${66 + v.needed * k}" y="42" class="val">${v.needed} ft</text></svg>`;
}
function lotViz(v) {
  const total = Math.max(v.lot, v.building + v.parking), W = 250, k = (W - 2) / total;
  const bw = v.building * k, pw = v.parking * k, lotX = v.lot * k;
  return `<svg class="viz" viewBox="0 0 ${W} 60">
    <defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#FDECEB"/><line x1="0" y1="0" x2="0" y2="5" stroke="#D8544E" stroke-width="2"/></pattern></defs>
    <rect x="1" y="12" width="${lotX}" height="20" rx="4" class="lot"/>
    <rect x="1" y="12" width="${bw}" height="20" rx="4" class="bld"/>
    <rect x="${1 + bw}" y="12" width="${Math.max(0, Math.min(pw, lotX - bw))}" height="20" class="park"/>
    ${bw + pw > lotX ? `<rect x="${1 + Math.max(bw, lotX)}" y="12" width="${bw + pw - Math.max(bw, lotX)}" height="20" fill="url(#hatch)"/>` : ""}
    <line x1="${1 + lotX}" y1="8" x2="${1 + lotX}" y2="34" class="edge"/>
    <text x="${Math.max(0, lotX - 22)}" y="7" class="val">lot edge</text>
    <text x="1" y="48">Building</text><text x="${Math.min(W - 110, 1 + bw + 4)}" y="48">Parking${bw + pw > lotX ? " (doesn't fit)" : ""}</text></svg>`;
}
function pavedViz(v) {
  const W = 250, k = W - 2;
  return `<svg class="viz" viewBox="0 0 ${W} 44"><rect x="1" y="6" width="${k}" height="16" rx="4" class="lot"/><rect x="1" y="6" width="${k * v.share}" height="16" rx="4" class="paved"/>
    <line x1="${1 + k * v.limit}" y1="2" x2="${1 + k * v.limit}" y2="26" class="edge"/><text x="1" y="38">${Math.round(v.share * 100)}% hard surface</text><text x="${k * v.limit - 30}" y="38" class="val">flag ${Math.round(v.limit * 100)}%</text></svg>`;
}
const viz = (c) => (!c.viz ? "" : c.viz.type === "height" ? heightViz(c.viz) : c.viz.type === "lot" ? lotViz(c.viz) : pavedViz(c.viz));

function lotBudget(f) {
  const lot = f.lotArea;
  const b = Math.min(f.footprint, lot), p = Math.min(f.parking.sf, Math.max(0, lot - b)), o = Math.max(0, lot - b - p);
  const pc = (v) => Math.round((v / lot) * 100);
  const seg = (v, cls) => (v > 0 ? `<div class="${cls}" style="flex:${v}">${pc(v) >= 18 ? `<span>${pc(v)}%</span>` : ""}</div>` : "");
  return `<div class="budget">${seg(b, "b-bld")}${seg(p, "b-park")}${seg(o, "b-open")}</div>
    <div class="blegend"><span><i class="b-bld"></i>Building ${pc(b)}%</span><span><i class="b-park"></i>Parking ${pc(p)}%</span><span><i class="b-open"></i>Open / green ${pc(o)}%</span></div>`;
}

function performance(f, parcel, ctx, state) {
  const P = f.perf;
  if (!P) return "";
  const s = P.solar, env = ctx.solarEnv, t = P.tod, g = P.green, c = P.compact;
  const opt = (id, obj, cur) => `<select id="${id}" class="mini">${Object.entries(obj).map(([k, v]) => `<option value="${k}" ${String(k) === String(cur) ? "selected" : ""}>${esc(v.label || v)}</option>`).join("")}</select>`;
  const tile = (ic, head, big, cls, body) => `<div class="ptile ${cls}"><div class="pt-head">${icon(ic)}<span>${head}</span></div><b>${big}</b><p>${body}</p></div>`;
  return `<div class="sect perf"><h4>Performance ${src("SOLARENV")}<span class="goal-note">community goals, not current Pittsburgh law</span></h4>
    <div class="ptiles">
      ${tile("sun-medium", "Solar envelope", s.fits ? "Fits" : `+${Math.round(s.maxOver)} ft over`, s.fits ? "ok" : "warn",
        `${s.fits ? "Keeps winter sun on neighbors' lots" : `Over the envelope on ${Math.round(s.share * 100)}% of the footprint`}: Dec 21, ${esc(SOLAR_WINDOWS[env.opts.window].short)}, above a ${env.opts.fence} ft solar fence. Sun peaks at ${Math.round(env.altNoonDeg)}°.`)}
      ${tile("box", "Compactness", c.sv.toFixed(2) + "<small> m²/m³</small>", c.label === "Spread out" ? "warn" : c.label === "Compact" ? "ok" : "", `${c.label}. ${n0(c.perUnit)} sq ft of outside surface per home. Lower means less heat loss.`)}
      ${tile("bus", "Transit (TOD)", `${Math.max(1, Math.round(t.walk))} min walk`, t.walk <= 5 ? "ok" : t.walk > 10 ? "warn" : "",
        `${n0(t.trips)} weekday trips within ¼ mile${t.rapid ? " · rapid (T / busway) stop" : ""}. ${t.avoided ? `${t.avoided} parking space${t.avoided === 1 ? "" : "s"} avoided (≈${n0(t.sfAvoided)} sq ft).` : t.required ? `Dropping the parking minimum would avoid ${t.required} space${t.required === 1 ? "" : "s"}.` : "No parking required."}`)}
      ${tile("trees", "Green space", g.d == null ? "—" : `${n0(g.d)} ft`, g.band === "near" ? "ok" : g.band === "far" ? "warn" : "", `${esc(g.label)}. ${Math.round(g.open * 100)}% of the lot stays open or green.`)}
    </div>
    <div class="solar-opts">${icon("sliders-horizontal")} Solar access window ${opt("solarWindow", SOLAR_WINDOWS, env.opts.window)} ${opt("solarFence", SOLAR_FENCES, env.opts.fence)}</div>
  </div>`;
}

// ---------- expanded view (center, below cards)
export function renderDetail(el, f, parcel, ctx, state) {
  if (!f) { el.innerHTML = ""; return; }
  const wm = Math.max(1, Math.round(walkMinutes(parcel)));
  const meaning = [];
  meaning.push([f.demolition ? "triangle-alert" : "house", f.demolition ? `${f.netUnits >= 0 ? "+" : ""}${f.netUnits} homes net; replaces ${f.existingUnits} existing` : `+${f.netUnits} homes${f.existingUnits === 0 ? " on an empty lot. No one displaced" : ""}`]);
  if (wm <= 10) meaning.push(["bus", `${wm}-minute walk to the bus; ${n0(parcel.tr.t)} weekday trips within ¼ mile`]);
  meaning.push(["sun", `Rooftop solar: about ${n0(f.pvPerUnit)} kWh a year per home`]);
  meaning.push(["thermometer-sun", `Hot days (≥ 90°F) in Pittsburgh: about ${CLIMATE_CONTEXT.hotThen}/yr → ${CLIMATE_CONTEXT.hotNow}/yr by the 2040s, so green space matters`]);
  el.innerHTML = `
    <div class="detail-head">
      <h2>${icon(f.icon)} ${esc(f.name)} on this lot</h2>${statusChip(f.status)}
      <label class="toggle">${icon("sun")}<input type="checkbox" id="shadowToggle" ${state.shadow ? "checked" : ""}/> Winter shadow</label>
      ${state.shadow ? `<input type="range" id="hour" min="9" max="15" step="1" value="${state.hour}"/><span class="muted">${state.hour}:00</span>` : ""}
      <label class="toggle">${icon("sun-medium")}<input type="checkbox" id="solarToggle" ${state.solarShow ? "checked" : ""}/> Solar envelope</label>
    </div>
    <div class="axo-big">${renderAxo({ width: 640, height: 280, lotRing: ctx.lotST, neighborLots: ctx.nbLotsST, neighbors: ctx.nbST, envelope: f.envelope, volumes: f.volumes, shadows: state.shadow ? ctx.shadows : [], dashed: f.status === "constrained", pad: 14, solar: state.solarShow ? ctx.solarEnv : null })}
      <div class="axo-legend"><span><i class="lg-lot"></i>This lot</span><span><i class="lg-mass"></i>New building</span>${f.volumes.some((v) => v.existing) ? `<span><i class="lg-kept"></i>Existing house (kept)</span>` : ""}<span><i class="lg-env"></i>Zoning envelope</span>${state.solarShow ? `<span><i class="lg-solar"></i>Solar envelope</span>` : ""}<span><i class="lg-nb"></i>Neighbors</span></div>
    </div>
    ${performance(f, parcel, ctx, state)}
    <div class="kpis">
      <div>${icon("house")}<b>${f.netUnits >= 0 ? "+" : ""}${f.netUnits}</b><span>new homes</span></div>
      <div>${icon("building-2")}<b>${f.stories}</b><span>floors</span></div>
      <div>${icon("bus")}<b>${wm} min</b><span>to the bus</span></div>
      <div>${icon("trees")}<b>${Math.round((f.pervious / f.lotArea) * 100)}%</b><span>open space</span></div>
    </div>
    <div class="sect"><h4>How the lot is used ${src("ZONING")}</h4>${lotBudget(f)}</div>
    <div class="sect"><h4>What it means</h4><ul class="means">${meaning.map(([i, t]) => `<li>${icon(i)}<span>${esc(t)}</span></li>`).join("")}</ul></div>
    <details class="tech"><summary>Technical details</summary>
      <div class="rows">
        <div><span>Floor area</span><b>${n0(f.gfa)} sq ft${f.commercialSf ? ` (${n0(f.commercialSf)} shop)` : ""}</b></div>
        <div><span>Floor area ratio (FAR)</span><b>${f.far.toFixed(1)}</b></div>
        <div><span>Lot coverage</span><b>${Math.round(f.coverage * 100)}%</b></div>
        <div><span>Height</span><b>${n0(f.heightFt)} ft (limit ${n0(f.envelope.h)} ft)</b></div>
        <div><span>Parking required</span><b>${f.parking.spaces} spaces · ${n0(f.parking.sf)} sq ft</b></div>
        <div><span>Usable roof for solar</span><b>${n0(f.usableRoofSf)} sq ft</b></div>
        <div><span>Extra runoff per 1" rain</span><b>${n0(f.runoffIncrease)} cu ft</b></div>
      </div>
      <div class="muted small">Simplified comparative estimates from public data, not engineering. ${src("SOLAR")}${src("HAZARD")}${src("CLIMATE")}${src("TYPOLOGY")}</div>
    </details>`;
}

// ---------- right panel: Why / Why not
export function renderWhy(el, f, parcel, state) {
  if (!f) { el.innerHTML = `<div class="empty">${icon("message-circle-question", "xl")}<h3>Why / Why not</h3><p>Start from a neighborhood's needs, pick an opportunity lot, and see what could be built there, what stands in the way, and what would unlock it.</p></div>`; return; }
  const cs = sortedConstraints(f);
  const changes = activeChanges(state.assumptions);
  const chips = [];
  const seen = new Set();
  for (const c of cs) if (c.chip && !seen.has(c.chip.label)) { seen.add(c.chip.label); chips.push(c.chip); }
  if (["smallmf", "mixeduse", "courtyard"].includes(f.id) && !state.assumptions.capacity) chips.push(CAPACITY_CHIP);
  if (!state.assumptions.greenRoof && !seen.has(GREEN_CHIP.label)) chips.push(GREEN_CHIP);
  const t = state.transitions[f.id];
  const works = worksList(f, parcel);

  const drawer = state.whyOpen ? `
    <section class="drawer">
      <h3>${f.status === "viable" ? `${icon("circle-check")} Nothing stands in the way` : `${icon("search")} What's in the way`}</h3>
      ${cs.length ? `<ol class="cons">${cs.map((c, i) => `
        <li class="${c.severity}">
          <div class="c-head"><span class="num">${i + 1}</span>${icon(c.icon)}<b>${esc(c.title)}</b>${src(c.src)}</div>
          <p>${esc(c.plain)}</p>
          ${viz(c)}
          <div class="who">${c.kind === "physical" ? `${icon("hammer")}<span>Site condition: needs engineering, not a policy change</span>` : c.chip ? `${icon(c.chip.icon)}<span>Who can change it: <b>${esc(c.chip.who)}</b> · ${esc(c.chip.type)}</span>` : `${icon("info")}<span>No simple fix</span>`}</div>
        </li>`).join("")}</ol>` : `<p class="muted">Allowed under the current (draft) rules. Compare the trade-offs in the cards.</p>`}
      <h3 class="wcc">${icon("key-round")} What would unlock it</h3>
      <div class="opts">${chips.length ? chips.map((c) => `
        <button class="opt" data-chip='${esc(JSON.stringify(c))}'>${icon(c.icon)}<span class="o-main">${esc(c.label)}<span class="o-who">${esc(c.who)} · ${esc(c.type)}</span></span><span class="o-add">${icon("plus")}</span></button>`).join("") : `<p class="muted small">Nothing left to change here.</p>`}</div>
      ${changes.length ? `<div class="applied"><span class="lbl">Applied:</span>${changes.map((c) => `<span class="appl">${icon(c.icon)}${esc(c.label)}<button data-remove="${c.key}" title="Undo">${icon("x")}</button></span>`).join("")}<button class="reset" id="resetChanges">Reset</button></div>` : ""}
      ${t ? `<div class="result ${t.to}"><div class="bigtrans">${STATUS[t.from].label} ${icon("arrow-right")} <b>${STATUS[t.to].label}</b></div>${t.to === "viable" ? `<div class="unlock">${icon("house")} <b>${f.units} homes</b> unlocked on this lot</div>` : ""}</div>` : ""}
      ${changes.length ? `<p class="summary">${esc(summaryText(f, changes))}</p>` : ""}
    </section>` : "";

  el.innerHTML = `
    <div class="eyebrow">Step 4 · Why / why not</div>
    <div class="why-head">${icon(f.icon, "tico")}<div><h2>${esc(f.name)}</h2>${statusChip(f.status, true)}</div></div>
    <section class="wsum">
      <h4>${icon("thumbs-up")} Why it can work</h4>
      <ul class="works">${works.map((w) => `<li>${icon("check")}<span>${esc(w)}</span></li>`).join("")}</ul>
      ${!state.whyOpen ? `
        <h4>${icon("octagon-alert")} What's in the way</h4>
        <ul class="blocks">${cs.length ? cs.map((c) => `<li>${icon(c.icon)}<span>${esc(c.title)}</span></li>`).join("") : `<li>${icon("check")}<span>Nothing under the current rules</span></li>`}</ul>
        <button class="whynot wide" data-why="${f.id}">WHY NOT? ${icon("arrow-right")}</button>` : ""}
    </section>
    ${drawer}
    ${goalsHTML(f)}
    <section class="ask">
      <h4>${icon("message-circle-question")} Ask a question</h4>
      <div class="sugg">${["Why not 4 floors?", "What if parking minimums were dropped?", "What if climate matters more than home count?", "Which problems can policy fix?"].map((q) => `<button class="q" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
      <form id="askForm"><input id="askInput" placeholder="Type a question…" autocomplete="off"/><button aria-label="Ask">${icon("send")}</button></form>
      <div id="answer">${state.answer || ""}</div>
      <div class="note">Answers only use the numbers on this page.</div>
    </section>`;
}

function goalsHTML(f) {
  if (!f.goals) return "";
  const head = `<h4>${icon("sprout")} Community goals <span class="goal-note">not current Pittsburgh law</span></h4>`;
  if (!f.goals.length) return `<section class="goals">${head}<p class="muted small">${icon("check")} Meets the solar-access, compactness, transit and green-space goals used here.</p></section>`;
  return `<section class="goals">${head}<ul class="glist">${f.goals.map((g) => `<li>${icon(g.icon)}<div><b>${esc(g.title)}</b><span>${esc(g.plain)}</span></div>${src(g.src)}</li>`).join("")}</ul></section>`;
}

function worksList(f, parcel) {
  const out = [];
  if (!f.constraints.some((c) => c.key === "use")) out.push(`Zoning allows ${lower(f.name)} here`);
  const wm = Math.max(1, Math.round(walkMinutes(parcel)));
  if (wm <= 10) out.push(`${wm}-minute walk to frequent bus service`);
  if (f.existingUnits === 0) out.push("Empty lot: no one is displaced");
  else if (f.keepsExisting) out.push("Keeps the existing home and adds one");
  if (f.courtSf > 400) out.push(`Shared court of about ${n0(f.courtSf)} sq ft`);
  if (f.id === "porch4") out.push("Each home has its own porch and front door");
  if (!parcel.hz.s && !parcel.hz.u && !parcel.hz.l && parcel.hz.f !== "SFHA") out.push("No mapped slope, mine, landslide or flood risk");
  if (!f.constraints.some((c) => c.key === "height")) out.push(`Fits the ${f.envelope.h} ft height limit`);
  return out.slice(0, 4);
}

function summaryText(f, changes) {
  const list = changes.map((c) => c.label.toLowerCase());
  const joined = list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : list[0];
  const st = { viable: "can be built", conditional: "still needs changes", constrained: "is still not allowed" }[f.status];
  const rest = f.constraints.length ? ` Still in the way: ${sortedConstraints(f).map((c) => c.title.toLowerCase()).join("; ")}.` : "";
  return `With ${joined}, the ${lower(f.name)} ${st}: ${f.units} homes on ${f.stories} floors, ${Math.round((f.pervious / f.lotArea) * 100)}% of the lot left open.${rest}`;
}

export function renderSetSelect(el, key, hoodName) {
  const opts = [["suggested", `Suggested by ${hoodName ? hoodName + "'s" : "the neighborhood's"} needs`], ...Object.entries(SCENARIO_SETS).map(([k, s]) => [k, s.label])];
  if (key === "custom") opts.push(["custom", "Custom mix"]);
  el.innerHTML = opts.map(([k, l]) => `<option value="${k}" ${k === key ? "selected" : ""}>${esc(l)}</option>`).join("");
}

export function renderTypePicker(el, types, suggested, hoodName) {
  const full = types.length >= MAX_TYPES;
  el.innerHTML = `<div class="tp-row">${TYPE_ORDER.map((id) => {
    const T = SCENARIOS[id], on = types.includes(id);
    return `<button class="tp ${on ? "on" : ""}" data-type="${id}" aria-pressed="${on}" ${!on && full ? `disabled title="Compare up to ${MAX_TYPES}: remove one first"` : ""}>${icon(T.icon)}${esc(T.name)}${suggested.includes(id) ? `<span class="star" title="Suggested by ${esc(hoodName || "the neighborhood")}'s needs">${icon("sparkles")}</span>` : ""}</button>`;
  }).join("")}</div>
  <div class="tp-note">${icon("sparkles")} suggested by ${esc(hoodName || "the neighborhood")}'s needs, as a starting point, not a ranking. Compare up to ${MAX_TYPES}.</div>`;
}

export function renderSources(el, focus) {
  el.innerHTML = `
    <div class="modal-card">
      <header><h2>${icon("book-open")} Where the numbers come from</h2><button id="closeSources" aria-label="Close">${icon("x")}</button></header>
      <p class="lead">Housing Futures is <b>decision support</b>. It is not zoning, engineering, financial, or legal advice. Zoning questions are decided by the City of Pittsburgh: check with City Planning or the Zoning Board of Adjustment, and get survey and geotechnical work for site conditions.</p>
      <div class="warnbox">${icon("triangle-alert")}<span><b>Draft rules.</b> Zoning numbers in this prototype (height limits, yards, lot sizes, allowed uses, parking) are placeholders until checked against the Pittsburgh Code. Building sizes are placeholders until sourced from Missing Middle Housing references.</span></div>
      <h3>Data</h3>
      <dl class="srcs">${Object.entries(SOURCES).map(([k, s]) => `<div id="src-${k}" class="${focus === k ? "focus" : ""}"><dt>${esc(s.label)}</dt><dd>${esc(s.text)}</dd></div>`).join("")}</dl>
      <h3>How it's estimated</h3>
      <ul>
        <li>Buildings are simple boxes inside the zoning envelope: 10.5 ft floors (14 ft for a shop floor); homes = floor area × 0.8 ÷ 850 sq ft (650 with "smaller units").</li>
        <li>Parking: 1 space per home + 1 per 500 sq ft of shop (draft rule); 325 sq ft per space; 10% of the lot kept open.</li>
        <li>Hard surface is flagged above 70% of the lot; a green roof counts as partly absorbing.</li>
        <li>Solar: usable roof × 0.2 kW/m² × PVWatts yield for Pittsburgh.</li>
        <li>"Many / Some / Few" and similar labels use fixed thresholds. There is no overall score and no "best" option.</li>
      </ul>
      <h3>What it can't tell you</h3>
      <ul>
        <li>Construction cost, rents, or whether a project pencils out.</li>
        <li>Water, sewer, or power capacity.</li>
        <li>Whether a variance or rezoning would actually be approved.</li>
        <li>Anything about a pending bill beyond "if it passed as proposed".</li>
      </ul>
    </div>`;
}
