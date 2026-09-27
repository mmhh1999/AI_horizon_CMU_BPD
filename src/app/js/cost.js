// Screening estimate: NAHB 2024 national single-family construction benchmark.
export const COST_SOURCE = "https://www.nahb.org/news-and-economics/housing-economics-plus/special-studies/special-studies-pages/cost-of-constructing-a-home-in-2024";
export const defaultCost = () => ({ perSf: 162, contingency: 15, land: 0 });
const money = (v) => "$" + Math.round(v).toLocaleString("en-US");
const n0 = (v) => Math.round(v).toLocaleString("en-US");

export function estimateCost(f, inputs) {
  const area = f.volumes.filter((v) => !v.existing && !v.porch)
    .reduce((sum, v) => sum + Math.max(0, v.s1 - v.s0) * Math.max(0, v.t1 - v.t0) * v.stories, 0);
  const construction = area * inputs.perSf;
  const reserve = construction * inputs.contingency / 100;
  const total = construction + reserve + inputs.land;
  return { area, construction, reserve, total, perAdded: f.netUnits > 0 ? total / f.netUnits : null };
}

export function renderCost(el, f, inputs) {
  if (!f) { el.innerHTML = ""; return; }
  const c = estimateCost(f, inputs);
  const low = c.area * inputs.perSf * 0.75 * (1 + inputs.contingency / 100) + inputs.land;
  const high = c.area * inputs.perSf * 1.25 * (1 + inputs.contingency / 100) + inputs.land;
  el.innerHTML = `
    <section class="cost-card" aria-labelledby="costTitle">
      <div class="cost-intro"><div><div class="eyebrow">Step 3 · Cost explorer</div><h2 id="costTitle">What might it cost?</h2>
        <p>Move the assumptions to compare the same building on different budgets.</p></div>
        <span class="cost-year">2024 $ benchmark</span></div>
      <div class="cost-layout">
        <div class="cost-controls">
          <label for="costPerSf">Construction per new sq ft <b>${money(inputs.perSf)}</b></label>
          <input id="costPerSf" type="range" min="100" max="400" step="1" value="${inputs.perSf}" />
          <div class="range-ends"><span>$100</span><span>$400</span></div>
          <label for="costContingency">Contingency <b>${inputs.contingency}%</b></label>
          <input id="costContingency" type="range" min="0" max="30" step="1" value="${inputs.contingency}" />
          <div class="range-ends"><span>0%</span><span>30%</span></div>
          <label for="costLand">Land acquisition / site purchase</label>
          <div class="money-input"><span>$</span><input id="costLand" type="number" min="0" max="10000000" step="1000" value="${inputs.land}" aria-label="Land acquisition dollars" /></div>
        </div>
        <div class="cost-results" aria-live="polite">
          <span class="cost-kicker">Illustrative total</span><strong>${money(c.total)}</strong>
          <span class="cost-range">Sensitivity band · ${money(low)} – ${money(high)}</span>
          <div class="cost-stack" aria-hidden="true"><i style="width:${c.total ? c.construction / c.total * 100 : 0}%"></i><i style="width:${c.total ? c.reserve / c.total * 100 : 0}%"></i><i style="width:${c.total ? inputs.land / c.total * 100 : 0}%"></i></div>
          <dl><div><dt>New floor area</dt><dd>${n0(c.area)} sq ft</dd></div><div><dt>Construction</dt><dd>${money(c.construction)}</dd></div>
            <div><dt>Contingency</dt><dd>${money(c.reserve)}</dd></div><div><dt>Land</dt><dd>${money(inputs.land)}</dd></div>
            <div class="cost-per"><dt>Per net new home</dt><dd>${c.perAdded == null ? "—" : money(c.perAdded)}</dd></div></dl>
        </div>
      </div>
      <p class="cost-caveat"><b>How to read this:</b> ${n0(c.area)} sq ft of modeled new gross floor area × ${money(inputs.perSf)}/sq ft, then contingency and land. The ±25% band is a sensitivity test, not a statistical confidence interval. NAHB's 2024 national single-family survey found $428,215 construction cost ÷ 2,647 <em>finished</em> sq ft, about $162/sq ft. Our model uses gross area, so even the area basis differs. Applying this benchmark to Pittsburgh, apartments, or mixed-use is unverified. Renovation, demolition, difficult ground, financing, operations, taxes and rent are not modeled. <a href="${COST_SOURCE}" target="_blank" rel="noopener">Read the NAHB source</a>.</p>
    </section>`;
}
