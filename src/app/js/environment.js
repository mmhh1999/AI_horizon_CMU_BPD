// Community context only. Police and odor reporting never affect typology scores.
const n0 = (x) => Math.round(x || 0).toLocaleString("en-US");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const POLICE = "https://www.pittsburghpa.gov/Safety/Police/Police-Data-Portal";
const SMELL = "https://smellpgh.org/data";

export function environmentHTML(hood) {
  const s = hood.safety || {};
  const a = s.counts?.["2024"] || {}, b = s.counts?.["2025"] || {};
  const sum = (x) => (x.person || 0) + (x.property || 0) + (x.society || 0);
  const total = sum(b), previous = sum(a);
  const trend = previous ? Math.round((total - previous) / previous * 100) : null;
  const odor = hood.smell;
  const months = odor?.byMonth || [];
  const top = Math.max(1, ...months);
  return `<section class="environment" id="environment" aria-labelledby="environmentTitle">
    <div class="env-heading"><div><div class="eyebrow">Community context · 2025</div><h3 id="environmentTitle">Safety & air experience</h3></div><span class="env-pill">Context, never a score</span></div>
    <div class="env-grid">
      <article class="env-panel env-crime"><div class="env-label"><i data-lucide="shield" class="ic"></i> Police-reported activity</div>
        <div class="env-number">${n0(total)}<span>2025 records</span></div>
        <div class="env-trend">${trend == null ? "No 2024 comparison" : `${trend > 0 ? "+" : ""}${trend}% vs 2024 (${n0(previous)})`}</div>
        <div class="env-bar" role="img" aria-label="2025: ${n0(b.person)} against persons, ${n0(b.property)} against property, ${n0(b.society)} against society">
          <i style="width:${total ? (b.person || 0) / total * 100 : 0}%"></i><i style="width:${total ? (b.property || 0) / total * 100 : 0}%"></i><i style="width:${total ? (b.society || 0) / total * 100 : 0}%"></i></div>
        <div class="env-breakdown"><span>Persons <b>${n0(b.person)}</b></span><span>Property <b>${n0(b.property)}</b></span><span>Society <b>${n0(b.society)}</b></span></div>
        <a href="${POLICE}" target="_blank" rel="noopener">Pittsburgh Police data portal ↗</a>
      </article>
      <article class="env-panel env-smell"><div class="env-label"><i data-lucide="wind" class="ic"></i> Smell Pittsburgh reports</div>
        <div class="env-number">${odor ? n0(odor.reports) : "—"}<span>2025 reports rated 4–5 / 5</span></div>
        <div class="env-months" role="img" aria-label="Monthly reports: ${months.map((v, i) => `${i + 1}: ${v}`).join(", ")}">${months.map((v, i) => `<i title="${i + 1}/2025: ${n0(v)} reports" style="height:${Math.max(4, v / top * 100)}%"></i>`).join("")}</div>
        <div class="env-axis"><span>Jan</span><span>Dec</span></div>
        <a href="${SMELL}" target="_blank" rel="noopener">Smell Pittsburgh data ↗</a>
      </article>
    </div>
    <p class="env-note">${esc(hood.name)} figures describe reports, not a person's safety or measured air quality. Police records depend on reporting and enforcement; odor reports are voluntary. Smell locations are privacy-shifted, so a few may be assigned to a neighboring area. Neither source changes housing rankings.</p>
  </section>`;
}
