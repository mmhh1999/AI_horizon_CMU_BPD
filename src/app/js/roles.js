// Five transparent stakeholder lenses. Each tab applies an editorial starter weight mix,
// while the same deterministic scenario engine and source data remain unchanged.
import { CRITERIA, evaluate } from "./priorities.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const icon = (name) => `<i data-lucide="${name}" class="ic"></i>`;
const keys = CRITERIA.map((c) => c.key);
const weights = (values) => Object.fromEntries(keys.map((key, i) => [key, values[i]]));
export const ROLES = {
  policy: { label: "Policy maker", icon: "landmark", focus: "Housing supply, displacement, and draft approval barriers", jump: "why", jumpLabel: "Review barriers", w: weights([25,5,15,5,5,10,5,10,5,15]) },
  community: { label: "Community", icon: "users", focus: "Keeping existing homes, family needs, and neighborhood life", jump: "environment", jumpLabel: "See local context", w: weights([10,10,25,15,10,5,5,10,5,5]) },
  developer: { label: "Developer", icon: "hard-hat", focus: "What can fit, likely barriers, and screening-level costs", jump: "cost", jumpLabel: "Open cost explorer", w: weights([20,5,5,5,0,5,0,15,5,40]) },
  architect: { label: "Architect", icon: "ruler", focus: "Building form, street life, open space, and winter sun for neighbors", jump: "detail", jumpLabel: "Inspect the design", w: weights([10,10,5,20,5,20,5,5,15,5]) },
  investor: { label: "Investor", icon: "chart-no-axes-combined", focus: "Buildability and access; the cost card is separate, not a return forecast", jump: "cost", jumpLabel: "Test cost assumptions", w: weights([15,5,10,5,0,10,0,15,5,35]) },
};
export const roleWeights = (key) => ({ ...ROLES[key].w });
export const roleLabel = (state) => (state.roleModified ? `${ROLES[state.role]?.label || "Custom"} (edited weights)` : ROLES[state.role]?.label || "Community");

// One color per criterion, in CRITERIA order; used by the weight strip.
export const WEIGHT_COLORS = { homes: "#1E1E1E", family: "#8C5A2B", stay: "#C98A00", street: "#FFB81C", aging: "#B7A07A", climate: "#5A5A58", sun: "#E9D48A", transit: "#3F6E9A", green: "#7E9A6A", feasible: "#A8A49B" };

const tabsHTML = (state) => `<div class="role-tabs" role="tablist" aria-label="Stakeholder perspective">${Object.entries(ROLES).map(([key, r]) => `<button type="button" id="roleTab-${key}" role="tab" aria-controls="rolePanel" aria-selected="${state.role === key}" tabindex="${state.role === key ? 0 : -1}" class="${state.role === key ? "on" : ""}" data-role="${key}">${icon(r.icon)}${r.label}</button>`).join("")}</div>`;

function leaderFact(f, role) {
  if (!f) return "";
  return role === "policy" ? `${f.netUnits >= 0 ? "+" : ""}${f.netUnits} net new homes; ${f.status === "viable" ? "no modeled approval change" : "review modeled barriers"}`
    : role === "community" ? (f.demolition ? `Replaces ${f.existingUnits} existing home(s); examine displacement` : "No existing home removed in this scenario")
    : role === "developer" ? `${f.status === "viable" ? "Fits draft rules" : f.status === "conditional" ? "Needs changes under draft rules" : "Does not fit draft rules"}; see the cost explorer in Trade-offs`
    : role === "architect" ? `${f.stories} floors; ${Math.round(f.pervious / f.lotArea * 100)}% of lot left open`
    : "No revenue, rents, financing, or investment return is modeled";
}

// Step 2: the full perspective card (no lot needed).
export function roleHTML(futures, state) {
  const role = ROLES[state.role] || ROLES.community;
  const f = evaluate(futures, state.weights)[0]?.f;
  return `<section class="role-view" aria-label="Stakeholder perspectives">
    <div class="role-head"><div><span class="eyebrow">Step 2 · Perspective</span><h2>Who are you planning for?</h2></div><span class="role-note">Each tab changes draft weights, not the facts</span></div>
    ${tabsHTML(state)}
    <div class="role-content" id="rolePanel" role="tabpanel" aria-labelledby="roleTab-${state.role}"><div><b>${esc(role.label)} lens</b><p>Focus: ${esc(role.focus)}.</p>${f ? `<p class="role-fact">Current leader: <strong>${esc(f.name)}</strong> · ${esc(leaderFact(f, state.role))}.</p>` : ""}</div>
      ${f ? `<button type="button" class="role-jump" data-role-jump="${role.jump}">${esc(role.jumpLabel)} →</button>` : ""}</div>
    <p class="role-disclaimer">${state.roleModified ? "You have edited the starter weights. " : ""}Starter weights are editorial examples, not advice. You can change every weight below; crime, smell, and illustrative cost never enter the ranking.</p>
  </section>`;
}

export function weightStripHTML(w) {
  const top = CRITERIA.filter((c) => w[c.key] > 0).sort((a, b) => w[b.key] - w[a.key]).slice(0, 3);
  return `<div class="wstrip" role="img" aria-label="Current weights: ${CRITERIA.map((c) => `${esc(c.label)} ${w[c.key]}`).join(", ")}">${CRITERIA.filter((c) => w[c.key] > 0).map((c) => `<i style="flex:${w[c.key]};background:${WEIGHT_COLORS[c.key]}" title="${esc(c.label)}: ${w[c.key]}"></i>`).join("")}</div>
    <div class="wtop">Weighs most: ${top.map((c) => `<span><i style="background:${WEIGHT_COLORS[c.key]}"></i>${esc(c.label)} <b>${w[c.key]}</b></span>`).join("")}</div>`;
}

// Step 4 header: the chosen lens and its weights, directly above the ranking.
export function planningForHTML(futures, state, editorHTML) {
  const role = ROLES[state.role] || ROLES.community;
  const f = evaluate(futures, state.weights)[0]?.f;
  return `<section class="planning-for" aria-label="Who you are planning for">
    <div class="pf-head"><span class="eyebrow">Planning for</span>${state.roleModified ? `<span class="role-note">Edited weights</span>` : ""}</div>
    ${tabsHTML(state)}
    <p class="pf-focus"><b>${esc(role.label)}:</b> ${esc(role.focus)}.${f ? ` Leader: <strong>${esc(f.name)}</strong> · ${esc(leaderFact(f, state.role))}.` : ""}</p>
    <div id="weightStrip">${weightStripHTML(state.weights)}</div>
    <details class="weight-edit" ${state.weightsOpen ? "open" : ""}><summary>${icon("sliders-horizontal")}Edit the 10 weights</summary>${editorHTML}</details>
  </section>`;
}

export function rankingHTML(futures, state) {
  if (!futures.length) return "";
  const rows = evaluate(futures, state.weights);
  const label = state.roleModified ? "your custom weights" : (ROLES[state.role]?.label.toLowerCase() || "your priorities");
  return `<section class="ranking" aria-labelledby="rankingTitle">
    <div class="rank-heading"><div><span class="eyebrow">Ranked for this lot</span><h3 id="rankingTitle">Housing types ranked for ${esc(label)}</h3></div><span class="rank-count">${rows.length} types</span></div>
    <p class="rank-explain">Higher fit means a closer match to the <em>current weights</em>, not permission to build or a guaranteed return. Choose a row to review its trade-offs.</p>
    <ol class="ranking-list">${rows.map((r, i) => `<li><button type="button" data-rank="${r.f.id}" class="${state.selected === r.f.id ? "selected" : ""}" aria-label="Review rank ${i + 1}, ${esc(r.f.name)}">
      <span class="rank-position">#${i + 1}</span><span class="rank-main"><b>${esc(r.f.name)}</b><small>${esc(r.f.status === "viable" ? "Fits draft rules" : r.f.status === "conditional" ? "Needs changes" : "Not allowed under draft rules")} · ${r.f.netUnits >= 0 ? "+" : ""}${r.f.netUnits} net homes</small></span>
      <span class="rank-score">${Math.round(r.fit * 100)}<small>/100</small></span><span class="rank-arrow">↗</span>
    </button></li>`).join("")}</ol>
    <p class="rank-foot">The score is a comparison aid; feasibility is based on draft zoning rules. Change the lens or edit the weights above and the order updates.</p>
  </section>`;
}
