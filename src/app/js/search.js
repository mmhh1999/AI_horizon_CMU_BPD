// Local-only search: neighborhoods, currently loaded neighborhood parcels, and page shortcuts.
// No geocoding service or LLM is called; this avoids inventing addresses or leaking queries.
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ACTIONS = [
  { label: "Try an example lot", key: "example", meta: "Guided demo" },
  { label: "Housing ranking", key: "ranking", meta: "Compare selected types" },
  { label: "Cost explorer", key: "cost", meta: "Adjust budget assumptions" },
  { label: "Stakeholder priorities", key: "priorities", meta: "Change ranking weights" },
  { label: "Sources", key: "sources", meta: "Check evidence and caveats" },
];

export function initSearch({ city, currentArea, onHood, onParcel, onAction }) {
  const form = document.querySelector("#searchForm"), input = document.querySelector("#search");
  const menu = document.querySelector("#searchSuggestions");
  const suggest = () => {
    const q = input.value.trim().toLowerCase();
    const hoods = city.hoods.filter((h) => !q || h.name.toLowerCase().includes(q)).slice(0, q ? 5 : 3)
      .map((h) => ({ label: h.name, meta: "Pittsburgh neighborhood", kind: "hood", value: h.slug }));
    const area = currentArea();
    const parcels = q.length >= 3 && area ? area.parcels.filter((p) => p.id.toLowerCase().includes(q) || (p.a || "").toLowerCase().includes(q)).slice(0, 4)
      .map((p) => ({ label: p.a || p.id, meta: `Lot · ${p.id}`, kind: "parcel", value: p.id })) : [];
    const actions = ACTIONS.filter((a) => !q || a.label.toLowerCase().includes(q)).slice(0, q ? 3 : 2)
      .map((a) => ({ ...a, kind: "action", value: a.key }));
    return [...hoods, ...parcels, ...actions];
  };
  const close = () => { menu.hidden = true; input.setAttribute("aria-expanded", "false"); };
  const show = () => {
    const items = suggest();
    menu.innerHTML = items.length ? items.map((x, i) => `<button type="button" data-search-index="${i}"><span>${esc(x.label)}</span><small>${esc(x.meta)}</small></button>`).join("")
      : `<p>No local match. Search a neighborhood or a lot in the open neighborhood.</p>`;
    menu.hidden = false; input.setAttribute("aria-expanded", "true");
    return items;
  };
  const run = (item) => {
    if (!item) return;
    input.value = item.label; close();
    if (item.kind === "hood") onHood(item.value);
    else if (item.kind === "parcel") onParcel(item.value);
    else onAction(item.value);
  };
  input.addEventListener("focus", show);
  input.addEventListener("input", show);
  input.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    if (!q) { show(); return; }
    const items = suggest();
    const exact = items.find((x) => x.label.toLowerCase() === q || x.value.toLowerCase() === q);
    if (exact || items[0]) run(exact || items[0]);
    else { input.setCustomValidity("No local match. Search a neighborhood or an open-neighborhood lot."); input.reportValidity(); setTimeout(() => input.setCustomValidity(""), 1800); }
  });
  menu.addEventListener("click", (e) => { const b = e.target.closest("[data-search-index]"); if (b) run(suggest()[+b.dataset.searchIndex]); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".search-shell")) close(); });
  return { clear() { input.value = ""; close(); } };
}
