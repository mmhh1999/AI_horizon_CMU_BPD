// Five transparent stakeholder lenses. Each tab applies an editorial starter weight mix,
// while the same deterministic scenario engine and source data remain unchanged.
import { CRITERIA, evaluate } from "./priorities.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const keys = CRITERIA.map((c) => c.key);
const weights = (values) => Object.fromEntries(keys.map((key, i) => [key, values[i]]));
export const ROLES = {
  policy: { label: "Policy maker", icon: "landmark", focus: "Housing supply, displacement, and draft approval barriers", jump: "why", jumpLabel: "Review barriers", w: weights([25,5,15,5,5,10,5,10,5,15]) },
  community: { label: "Community", icon: "users", focus: "Keeping existing homes, family needs, and neighborhood life", jump: "environment", jumpLabel: "See local context", w: weights([10,10,25,15,10,5,5,10,5,5]) },
  developer: { label: "Developer", icon: "hard-hat", focus: "What can fit, likely barriers, and screening-level costs", jump: "cost", jumpLabel: "Open cost explorer", w: weights([20,5,5,5,0,5,0,15,5,40]) },
  architect: { label: "Architect", icon: "ruler", focus: "Building form, street life, open space, and solar assumptions", jump: "detail", jumpLabel: "Inspect the design", w: weights([10,10,5,15,5,20,15,5,10,5]) },
  investor: { label: "Investor", icon: "chart-no-axes-combined", focus: "Buildability and access; the cost card is separate, not a return forecast", jump: "cost", jumpLabel: "Test cost assumptions", w: weights([15,5,10,5,0,10,0,15,5,35]) },
};
export const roleWeights = (key) => ({ ...ROLES[key].w });

export function roleHTML(futures, state) {
  const role = ROLES[state.role] || ROLES.community;
  const winner = evaluate(futures, state.weights)[0];
  const f = winner?.f;
  const fact = !f ? "" : state.role === "policy" ? `${f.netUnits >= 0 ? "+" : ""}${f.netUnits} net new homes; ${f.status === "viable" ? "no modeled approval change" : "review modeled barriers"}`
    : state.role === "community" ? (f.demolition ? `Replaces ${f.existingUnits} existing home(s); examine displacement` : "No existing home removed in this scenario")
    : state.role === "developer" ? `${f.status === "viable" ? "Fits draft rules" : f.status === "conditional" ? "Needs changes under draft rules" : "Does not fit draft rules"}; cost estimate below`
    : state.role === "architect" ? `${f.stories} floors; ${Math.round(f.pervious / f.lotArea * 100)}% of lot left open`
    : "No revenue, rents, financing, or investment return is modeled";
  return `<section class="role-view" aria-label="Stakeholder perspectives">
    <div class="role-head"><div><span class="eyebrow">Choose a perspective</span><h3>Who are you planning for?</h3></div><span class="role-note">Each tab changes draft weights, not the facts</span></div>
    <div class="role-tabs" role="tablist" aria-label="Stakeholder perspective">${Object.entries(ROLES).map(([key, r]) => `<button type="button" id="roleTab-${key}" role="tab" aria-controls="rolePanel" aria-selected="${state.role === key}" tabindex="${state.role === key ? 0 : -1}" class="${state.role === key ? "on" : ""}" data-role="${key}">${r.label}</button>`).join("")}</div>
    <div class="role-content" id="rolePanel" role="tabpanel" aria-labelledby="roleTab-${state.role}"><div><b>${esc(role.label)} lens</b><p>Focus: ${esc(role.focus)}.</p>${f ? `<p class="role-fact">Current leader: <strong>${esc(f.name)}</strong> · ${esc(fact)}.</p>` : ""}</div>
      <button type="button" class="role-jump" data-role-jump="${role.jump}">${esc(role.jumpLabel)} →</button></div>
    <p class="role-disclaimer">${state.roleModified ? "You have edited the starter weights. " : ""}Starter weights are editorial examples, not advice. You can change every weight below; crime, smell, and illustrative cost never enter the ranking.</p>
  </section>`;
}

export function rankingHTML(futures, state) {
  if (!futures.length) return "";
  const rows = evaluate(futures, state.weights);
  const label = state.roleModified ? "your custom weights" : (ROLES[state.role]?.label.toLowerCase() || "your priorities");
  return `<section class="ranking" aria-labelledby="rankingTitle">
    <div class="rank-heading"><div><span class="eyebrow">Step 2 · Clear comparison</span><h3 id="rankingTitle">Housing types ranked for ${esc(label)}</h3></div><span class="rank-count">${rows.length} types</span></div>
    <p class="rank-explain">Higher fit means a closer match to the <em>current weights</em>, not permission to build or a guaranteed return. Choose a row to inspect the scenario.</p>
    <ol class="ranking-list">${rows.map((r, i) => `<li><button type="button" data-rank="${r.f.id}" class="${state.selected === r.f.id ? "selected" : ""}" aria-label="Inspect rank ${i + 1}, ${esc(r.f.name)}">
      <span class="rank-position">#${i + 1}</span><span class="rank-main"><b>${esc(r.f.name)}</b><small>${esc(r.f.status === "viable" ? "Fits draft rules" : r.f.status === "conditional" ? "Needs changes" : "Not allowed under draft rules")} · ${r.f.netUnits >= 0 ? "+" : ""}${r.f.netUnits} net homes</small></span>
      <span class="rank-score">${Math.round(r.fit * 100)}<small>/100</small></span><span class="rank-arrow">↗</span>
    </button></li>`).join("")}</ol>
    <p class="rank-foot">The score is a comparison aid; feasibility is based on draft zoning rules. Open Priorities to inspect and edit the ten inputs.</p>
  </section>`;
}
