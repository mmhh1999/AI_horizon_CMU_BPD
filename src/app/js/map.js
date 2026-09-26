// Site map: parcel boundaries, selection, and one-at-a-time overlays (zoning, transit, slope, geohazards).

const fc = (features) => ({ type: "FeatureCollection", features });

export const ZONE_COLORS = [
  ["R1D", "#ECEBE6"], ["R1A", "#ECEBE6"], ["R2", "#D9D6CC"], ["R3", "#D9D6CC"], ["RM", "#B8B2A3"],
  ["LNC", "#F3D98B"], ["UNC", "#F3D98B"], ["NDO", "#F3D98B"], ["P", "#D3E3CC"], ["EMI", "#D8D8E4"], ["H", "#E4E4E1"],
];
const zoneColorExpr = ["match", ["get", "base"], ...ZONE_COLORS.flat(), "#DDD9CF"];

export const OVERLAYS = {
  zoning: { label: "Zoning", icon: "layers", legend: [["Single-family", "#ECEBE6"], ["2–3 homes", "#D9D6CC"], ["Multi-family", "#B8B2A3"], ["Commercial / mixed", "#F3D98B"], ["Parks", "#D3E3CC"]] },
  transit: { label: "Bus stops", icon: "bus", legend: [["Bus stop (bigger = more trips)", "#1E1E1E"]] },
  slope: { label: "Steep slopes", icon: "mountain", legend: [["Steeper than 25%", "#A8836A"]] },
  geo: { label: "Hazards", icon: "triangle-alert", legend: [["Landslide-prone", "#D08A3A"], ["Old mines", "#6D6D8C"]] },
};

export function createSiteMap(container, area, onSelect, onReady) {
  const map = new maplibregl.Map({
    container,
    style: "https://tiles.openfreemap.org/styles/positron",
    bounds: bounds(area.parcels),
    fitBoundsOptions: { padding: 20 },
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.on("load", () => {
    map.addSource("zones", { type: "geojson", data: fc(area.zones.map((z) => ({ type: "Feature", properties: { z: z.z, base: (z.z || "").split("-")[0] }, geometry: z.g }))) });
    map.addSource("slope", { type: "geojson", data: fc(area.hazards.slope.map((g) => ({ type: "Feature", properties: {}, geometry: g }))) });
    map.addSource("landslide", { type: "geojson", data: fc(area.hazards.landslide.map((g) => ({ type: "Feature", properties: {}, geometry: g }))) });
    map.addSource("undermined", { type: "geojson", data: fc(area.hazards.undermined.map((g) => ({ type: "Feature", properties: {}, geometry: g }))) });
    map.addSource("stops", { type: "geojson", data: fc(area.stops.map((s) => ({ type: "Feature", properties: { t: s.t || 0, n: s.n }, geometry: { type: "Point", coordinates: [s.x, s.y] } }))) });
    map.addSource("parcels", { type: "geojson", data: fc(area.parcels.map((p, i) => ({ type: "Feature", id: i, properties: { i }, geometry: { type: "Polygon", coordinates: [p.c] } }))) });
    map.addSource("sel", { type: "geojson", data: fc([]) });

    map.addLayer({ id: "ov-zoning", type: "fill", source: "zones", layout: { visibility: "none" }, paint: { "fill-color": zoneColorExpr, "fill-opacity": 0.6 } });
    map.addLayer({ id: "ov-zoning-line", type: "line", source: "zones", layout: { visibility: "none" }, paint: { "line-color": "#8A8A87", "line-width": 0.8 } });
    map.addLayer({ id: "ov-slope", type: "fill", source: "slope", layout: { visibility: "none" }, paint: { "fill-color": "#A8836A", "fill-opacity": 0.4 } });
    map.addLayer({ id: "ov-landslide", type: "fill", source: "landslide", layout: { visibility: "none" }, paint: { "fill-color": "#D08A3A", "fill-opacity": 0.3 } });
    map.addLayer({ id: "ov-undermined", type: "line", source: "undermined", layout: { visibility: "none" }, paint: { "line-color": "#6D6D8C", "line-width": 1.8, "line-dasharray": [2, 2] } });
    map.addLayer({ id: "parcel-fill", type: "fill", source: "parcels", paint: { "fill-color": "#1E1E1E", "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.10, 0] } });
    map.addLayer({ id: "parcel-line", type: "line", source: "parcels", paint: { "line-color": "#9A9A96", "line-width": ["interpolate", ["linear"], ["zoom"], 15, 0.25, 18, 0.9] } });
    map.addLayer({ id: "ov-transit", type: "circle", source: "stops", layout: { visibility: "none" }, paint: { "circle-color": "#1E1E1E", "circle-opacity": 0.85, "circle-stroke-color": "#fff", "circle-stroke-width": 1, "circle-radius": ["interpolate", ["linear"], ["get", "t"], 0, 3, 200, 6, 600, 10] } });
    map.addLayer({ id: "sel-fill", type: "fill", source: "sel", paint: { "fill-color": "#FFB81C", "fill-opacity": 0.45 } });
    map.addLayer({ id: "sel-line", type: "line", source: "sel", paint: { "line-color": "#1E1E1E", "line-width": 2.5 } });

    let hover = null;
    map.on("mousemove", "parcel-fill", (e) => {
      map.getCanvas().style.cursor = "pointer";
      const id = e.features[0].id;
      if (hover !== null && hover !== id) map.setFeatureState({ source: "parcels", id: hover }, { hover: false });
      hover = id; map.setFeatureState({ source: "parcels", id }, { hover: true });
    });
    map.on("mouseleave", "parcel-fill", () => {
      map.getCanvas().style.cursor = "";
      if (hover !== null) map.setFeatureState({ source: "parcels", id: hover }, { hover: false });
      hover = null;
    });
    map.on("click", "parcel-fill", (e) => onSelect(area.parcels[e.features[0].properties.i].id));
    // start with the attribution collapsed (still one click away)
    map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
    onReady(map);
  });
  return map;
}

export function showParcel(map, parcel, fly = true) {
  map.getSource("sel").setData(fc([{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [parcel.c] } }]));
  if (fly) {
    const b = bounds([parcel]);
    map.fitBounds(b, { padding: 140, maxZoom: 18.2, duration: 900 });
  }
}

export function setOverlay(map, key) {
  const layers = { zoning: ["ov-zoning", "ov-zoning-line"], transit: ["ov-transit"], slope: ["ov-slope"], geo: ["ov-landslide", "ov-undermined"] };
  for (const [k, ids] of Object.entries(layers)) for (const id of ids) map.setLayoutProperty(id, "visibility", k === key ? "visible" : "none");
}

function bounds(parcels) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of parcels) for (const [x, y] of p.c) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [[x0, y0], [x1, y1]];
}
