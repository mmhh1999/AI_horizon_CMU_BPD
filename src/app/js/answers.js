// Structured answers for the "Ask" box. Every sentence is built from computed results;
// nothing is added that the engine did not compute. (An LLM can later rephrase these.)
import { sortedConstraints } from "./scenarios.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const S = { viable: "Can be built", conditional: "Needs changes", constrained: "Not allowed" };

export const COMPARE_Q = /better|worse|instead|compare|rather than|\bover\b|outrank/;

export function answer(q, { f, futures, rules, whatIf, rows }) {
  const t = q.toLowerCase();
  if (COMPARE_Q.test(t)) {
    if (!rows || rows.length < 2) return `<p class="muted">Pick a housing type first to compare it with another.</p>`;
    const top = rows[0];
    const other = rows.find((r) => r.f.id !== top.f.id && (!f || r.f.id === f.id)) || rows[1];
    const why = (r) => (r.pros.length ? r.pros.map((p) => esc(p.text)).join("; ") : "no standout criterion at these weights");
    return `<p><b>${esc(top.f.name)}</b> (${Math.round(top.fit * 100)}/100) ranks above <b>${esc(other.f.name)}</b> (${Math.round(other.fit * 100)}/100) under your current priority weights, mainly because: ${why(top)}.</p><p class="muted">Different weights could rank them differently. This is a value choice, not a fact.</p>`;
  }
  if (/floor|stor|height|tall/.test(t)) {
    const four = futures.find((x) => x.stories >= 4) || f;
    const hc = four.constraints.find((c) => c.key === "height");
    if (hc) return `<p>A 4-floor <b>${esc(four.name.toLowerCase())}</b> needs about ${Math.ceil(four.heightFt)} ft. The limit here is ${rules.maxHeightFt} ft (${rules.maxStories} floors) under the draft rules, so it needs a height variance from the Zoning Board.</p>`;
    return `<p>A 4-floor <b>${esc(four.name.toLowerCase())}</b> (${Math.round(four.heightFt)} ft) fits the ${rules.maxHeightFt} ft limit with the changes you've applied.</p>`;
  }
  if (/parking/.test(t)) {
    const alt = whatIf({ parking: "none" });
    const rows = futures.map((x) => {
      const y = alt.find((z) => z.id === x.id);
      return `<li><b>${esc(x.name)}</b>: ${S[x.status]} → ${S[y.status]}${x.parking.spaces ? ` · frees ~${x.parking.sf.toLocaleString()} sq ft` : ""}</li>`;
    }).join("");
    return `<p>If the parking minimum were dropped (as proposed in Bill 2025-1545; not law yet):</p><ul>${rows}</ul>`;
  }
  if (/climate|resilien|heat|storm|green/.test(t)) {
    const rows = [...futures].sort((a, b) => b.pervious - a.pervious).map((x) =>
      `<li><b>${esc(x.name)}</b>: ${Math.round((x.pervious / x.lotArea) * 100)}% of the lot stays open · ${x.units} homes</li>`).join("");
    return `<p>More open ground usually means fewer homes on this lot:</p><ul>${rows}</ul><p class="muted">Which matters more is a value choice. The tool shows the trade-off; it does not pick a winner.</p>`;
  }
  if (/policy|fix|physical|regulat|which/.test(t)) {
    const g = { policy: [], physical: [], design: [] };
    for (const c of sortedConstraints(f)) (c.kind === "physical" ? g.physical : c.chip && c.chip.type === "Design choice" ? g.design : g.policy).push(c.title);
    return `<p>For the <b>${esc(f.name.toLowerCase())}</b>:</p><ul><li><b>Policy or approvals can fix:</b> ${esc(g.policy.join("; ") || "nothing needed")}</li><li><b>Design can fix:</b> ${esc(g.design.join("; ") || "nothing needed")}</li><li><b>Site conditions (engineering, not policy):</b> ${esc(g.physical.join("; ") || "none mapped")}</li></ul>`;
  }
  return `<p class="muted">I can answer from the numbers on this page: floors and height, parking, climate trade-offs, or which problems policy can fix.</p>`;
}
