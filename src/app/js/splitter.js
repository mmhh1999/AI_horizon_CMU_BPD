// Desktop-only pointer and keyboard splitters. Widths persist locally; MapLibre is resized.
export function setupSplitters(ws, getMap) {
  const handles = [
    [document.querySelector("#splitMap"), "map"],
    [document.querySelector("#splitWhy"), "why"],
  ];
  const resize = () => requestAnimationFrame(() => getMap()?.resize());
  const widthOf = (key) => (key === "map" ? ws.querySelector(".map-col") : ws.querySelector(".why-col")).getBoundingClientRect().width;
  const apply = (key, requested) => {
    const total = ws.getBoundingClientRect().width;
    const other = widthOf(key === "map" ? "why" : "map");
    const low = key === "map" ? 320 : 280;
    const high = Math.max(low, total - other - 400 - 16);
    const value = Math.round(Math.max(low, Math.min(high, requested)));
    ws.style.setProperty(key === "map" ? "--map-w" : "--why-w", `${value}px`);
    resize();
  };
  for (const [handle, key] of handles) {
    handle.addEventListener("pointerdown", (e) => {
      if (matchMedia("(max-width: 1200px)").matches) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const origin = e.clientX, initial = widthOf(key);
      const move = (ev) => apply(key, initial + (key === "map" ? 1 : -1) * (ev.clientX - origin));
      const finish = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", finish);
        handle.removeEventListener("pointercancel", finish);
        try { localStorage.setItem("hf-layout-v1", JSON.stringify({ map: widthOf("map"), why: widthOf("why") })); } catch {}
        resize();
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
    });
    handle.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      apply(key, widthOf(key) + (key === "map" ? 1 : -1) * (e.key === "ArrowRight" ? 24 : -24));
      try { localStorage.setItem("hf-layout-v1", JSON.stringify({ map: widthOf("map"), why: widthOf("why") })); } catch {}
    });
    handle.addEventListener("dblclick", () => {
      ws.style.removeProperty("--map-w"); ws.style.removeProperty("--why-w");
      try { localStorage.removeItem("hf-layout-v1"); } catch {}
      resize();
    });
  }
  try {
    const saved = JSON.parse(localStorage.getItem("hf-layout-v1") || "null");
    if (saved && Number.isFinite(saved.map) && Number.isFinite(saved.why)) {
      ws.style.setProperty("--map-w", `${Math.max(320, Math.min(800, saved.map))}px`);
      ws.style.setProperty("--why-w", `${Math.max(280, Math.min(550, saved.why))}px`);
    }
  } catch {}
  new ResizeObserver(resize).observe(ws.querySelector("#map"));
}
