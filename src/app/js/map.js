// Map: County (municipalities) > City (neighborhoods) > neighborhood parcels > parcel.
// Opportunity layers color parcels; context layers are shown one at a time.
import { TAGS, TAG_ORDER, RAMP } from "./data.js";

const fc = (features) => ({ type: "FeatureCollection", features });
const EMPTY = fc([]);

export const ZONE_COLORS = [
  ["R1D", "#ECEBE6"], ["R1A", "#ECEBE6"], ["R2", "#D9D6CC"], ["R3", "#D9D6CC"], ["RM", "#B8B2A3"],
  ["LNC", "#F3D98B"], ["UNC", "#F3D98B"], ["NDO", "#F3D98B"], ["P", "#D3E3CC"], ["EMI", "#D8D8E4"], ["H", "#E4E4E1"],
];
const zoneColorExpr = ["match", ["get", "base"], ...ZONE_COLORS.flat(), "#DDD9CF"];
const rampExpr = ["match", ["get", "cls"], 0, RAMP[0], 1, RAMP[1], 2, RAMP[2], 3, RAMP[3], 4, RAMP[4], "#FFFFFF"];

export const CONTEXT = {
  zoning: { label: "Zoning", icon: "layers", legend: [["Single-family", "#ECEBE6"], ["2–3 homes", "#D9D6CC"], ["Multi-family", "#B8B2A3"], ["Commercial / mixed", "#F3D98B"], ["Parks", "#D3E3CC"]], layers: ["ov-zoning", "ov-zoning-line"] },
  transit: { label: "Transit", icon: "bus", legend: [["Bus stop (bigger = more trips)", "#1E1E1E"], ["T / busway stop", "#2A8C82"]], layers: ["ov-transit"] },
  green: { label: "Green space", icon: "trees", legend: [["Park or greenway", "#9CC48A"], ["500 ft / 1,000 ft from the lot", "#5E8C4A"]], layers: ["ov-parks", "ov-parks-line", "ov-ring"] },
  slope: { label: "Steep slopes", icon: "mountain", legend: [["Steeper than 25%", "#A8836A"]], layers: ["ov-slope"] },
  geo: { label: "Hazards", icon: "triangle-alert", legend: [["Landslide-prone", "#D08A3A"], ["Old mines", "#6D6D8C"], ["FEMA flood hazard area", "#5B8DB8"]], layers: ["ov-landslide", "ov-undermined", "ov-flood"] },
};

export function createMap(container, { county, city }, on) {
  const map = new maplibregl.Map({
    container,
    style: "https://tiles.openfreemap.org/styles/positron",
    bounds: bounds(county.munis.flatMap((m) => ringsOf(m.g))),
    fitBoundsOptions: { padding: 16 },
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map._hf = { county, city, hood: null, level: "county", selHood: null };
  map.on("load", () => {
    map.addSource("munis", { type: "geojson", data: fc(county.munis.map((m, i) => ({ type: "Feature", id: i, properties: { i, city: m.city ? 1 : 0, cls: -1 }, geometry: m.g }))) });
    map.addSource("hoods", { type: "geojson", data: fc(city.hoods.map((h, i) => ({ type: "Feature", id: i, properties: { i, slug: h.slug, cls: -1 }, geometry: h.g }))) });
    for (const s of ["parcels", "sel", "zones", "slope", "landslide", "undermined", "flood", "stops", "parks", "ring"]) map.addSource(s, { type: "geojson", data: EMPTY });

    map.addLayer({ id: "muni-fill", type: "fill", source: "munis", paint: { "fill-color": rampExpr, "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.78] } });
    map.addLayer({ id: "muni-line", type: "line", source: "munis", paint: { "line-color": "#8A8A87", "line-width": 0.6 } });
    map.addLayer({ id: "muni-city", type: "line", source: "munis", filter: ["==", ["get", "city"], 1], paint: { "line-color": "#C98A00", "line-width": 2.6 } });
    map.addLayer({ id: "hood-fill", type: "fill", source: "hoods", layout: { visibility: "none" }, paint: { "fill-color": rampExpr, "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.8] } });
    map.addLayer({ id: "hood-line", type: "line", source: "hoods", layout: { visibility: "none" }, paint: { "line-color": "#6B6B6B", "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.5, 15, 1.4] } });
    map.addLayer({ id: "hood-sel", type: "line", source: "hoods", layout: { visibility: "none" }, filter: ["==", ["get", "slug"], ""], paint: { "line-color": "#C98A00", "line-width": 3 } });

    map.addLayer({ id: "ov-zoning", type: "fill", source: "zones", layout: { visibility: "none" }, paint: { "fill-color": zoneColorExpr, "fill-opacity": 0.6 } });
    map.addLayer({ id: "ov-zoning-line", type: "line", source: "zones", layout: { visibility: "none" }, paint: { "line-color": "#8A8A87", "line-width": 0.8 } });
    map.addLayer({ id: "ov-parks", type: "fill", source: "parks", layout: { visibility: "none" }, paint: { "fill-color": "#9CC48A", "fill-opacity": 0.55 } });
    map.addLayer({ id: "ov-parks-line", type: "line", source: "parks", layout: { visibility: "none" }, paint: { "line-color": "#5E8C4A", "line-width": 1 } });
    map.addLayer({ id: "ov-slope", type: "fill", source: "slope", layout: { visibility: "none" }, paint: { "fill-color": "#A8836A", "fill-opacity": 0.4 } });
    map.addLayer({ id: "ov-flood", type: "fill", source: "flood", layout: { visibility: "none" }, paint: { "fill-color": "#5B8DB8", "fill-opacity": 0.35 } });
    map.addLayer({ id: "ov-landslide", type: "fill", source: "landslide", layout: { visibility: "none" }, paint: { "fill-color": "#D08A3A", "fill-opacity": 0.3 } });
    map.addLayer({ id: "ov-undermined", type: "line", source: "undermined", layout: { visibility: "none" }, paint: { "line-color": "#6D6D8C", "line-width": 1.8, "line-dasharray": [2, 2] } });

    map.addLayer({ id: "parcel-fill", type: "fill", source: "parcels", paint: {
      "fill-color": ["match", ["get", "op"], ...TAG_ORDER.flatMap((k) => [k, TAGS[k].color]), "#1E1E1E"],
      "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], ["case", ["==", ["get", "op"], ""], 0.12, 0.9], ["case", ["==", ["get", "op"], ""], 0, 0.7]],
    } });
    map.addLayer({ id: "parcel-line", type: "line", source: "parcels", paint: { "line-color": "#9A9A96", "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.15, 18, 0.9] } });
    map.addLayer({ id: "ov-ring", type: "line", source: "ring", layout: { visibility: "none" }, paint: { "line-color": "#5E8C4A", "line-width": 1.6, "line-dasharray": [3, 2] } });
    map.addLayer({ id: "ov-transit", type: "circle", source: "stops", layout: { visibility: "none" }, paint: {
      "circle-color": ["case", ["==", ["get", "rp"], 1], "#2A8C82", "#1E1E1E"], "circle-opacity": 0.85, "circle-stroke-color": "#fff", "circle-stroke-width": 1,
      "circle-radius": ["interpolate", ["linear"], ["get", "t"], 0, 3, 200, 5, 600, 8] } });
    map.addLayer({ id: "sel-fill", type: "fill", source: "sel", paint: { "fill-color": "#FFB81C", "fill-opacity": 0.45 } });
    map.addLayer({ id: "sel-line", type: "line", source: "sel", paint: { "line-color": "#1E1E1E", "line-width": 2.5 } });

    hover(map, "muni-fill", "munis");
    hover(map, "hood-fill", "hoods");
    hover(map, "parcel-fill", "parcels");
    map.on("click", "muni-fill", (e) => { if (map._hf.level === "county") on.muni(county.munis[e.features[0].properties.i]); });
    map.on("click", "hood-fill", (e) => { if (map._hf.level === "city") on.hood(city.hoods[e.features[0].properties.i].slug); });
    map.on("click", "parcel-fill", (e) => on.parcel(map._hf.hood.parcels[e.features[0].properties.i].id));
    map.on("click", (e) => {
      if (map._hf.level !== "nbhd" && map._hf.level !== "parcel") return;
      const hit = map.queryRenderedFeatures(e.point, { layers: ["parcel-fill"] });
      if (hit.length) return;
      const h = map.queryRenderedFeatures(e.point, { layers: ["hood-fill"] });
      if (h.length) on.hood(city.hoods[h[0].properties.i].slug);
    });
    map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
    on.ready?.(map);
  });
  return map;
}

function hover(map, layer, source) {
  let h = null;
  map.on("mousemove", layer, (e) => {
    map.getCanvas().style.cursor = "pointer";
    const id = e.features[0].id;
    if (h !== null && h !== id) map.setFeatureState({ source, id: h }, { hover: false });
    h = id; map.setFeatureState({ source, id }, { hover: true });
  });
  map.on("mouseleave", layer, () => {
    map.getCanvas().style.cursor = "";
    if (h !== null) map.setFeatureState({ source, id: h }, { hover: false });
    h = null;
  });
}

const vis = (map, id, on) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", on ? "visible" : "none");

export function setLevel(map, level) {
  map._hf.level = level;
  const county = level === "county", city = level === "city", local = level === "nbhd" || level === "parcel";
  vis(map, "muni-fill", county);
  vis(map, "muni-city", county || city);
  vis(map, "muni-line", county || city);
  vis(map, "hood-fill", city || local);
  vis(map, "hood-line", city || local);
  vis(map, "hood-sel", local);
  map.setPaintProperty("hood-fill", "fill-opacity", local
    ? ["case", ["==", ["get", "slug"], map._hf.selHood || ""], 0, 0.35]
    : ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.8]);
  for (const id of ["parcel-fill", "parcel-line"]) vis(map, id, local);
  if (!local) { map.getSource("sel").setData(EMPTY); map.getSource("ring").setData(EMPTY); }
}

export function setClasses(map, source, classes) {
  const d = map._hf[source === "munis" ? "county" : "city"][source];
  map.getSource(source).setData(fc(d.map((x, i) => ({ type: "Feature", id: i, properties: { i, slug: x.slug, city: x.city ? 1 : 0, cls: classes[i] }, geometry: x.g }))));
}

export function setHood(map, hood, slug, activeTags) {
  map._hf.hood = hood;
  map._hf.selHood = slug;
  map.setFilter("hood-sel", ["==", ["get", "slug"], slug]);
  map.getSource("zones").setData(fc(hood.zones.map((z) => ({ type: "Feature", properties: { z: z.z, base: (z.z || "").split("-")[0] }, geometry: z.g }))));
  for (const k of ["slope", "landslide", "undermined", "flood"]) map.getSource(k).setData(fc((hood.hazards[k] || []).map((g) => ({ type: "Feature", properties: {}, geometry: g }))));
  map.getSource("stops").setData(fc(hood.stops.map((s) => ({ type: "Feature", properties: { t: s.t || 0, n: s.n, rp: s.rp || 0 }, geometry: { type: "Point", coordinates: [s.x, s.y] } }))));
  map.getSource("parks").setData(fc(hood.parks.map((p) => ({ type: "Feature", properties: { n: p.n }, geometry: p.g }))));
  setOpportunities(map, activeTags);
}

export function setOpportunities(map, active) {
  const hood = map._hf.hood;
  if (!hood) return;
  const order = TAG_ORDER.filter((k) => active.has(k));
  map.getSource("parcels").setData(fc(hood.parcels.map((p, i) => ({
    type: "Feature", id: i, properties: { i, op: order.find((k) => p.o && p.o.includes(k)) || "" }, geometry: { type: "Polygon", coordinates: [p.c] },
  }))));
}

export function setContext(map, key) {
  for (const [k, o] of Object.entries(CONTEXT)) for (const id of o.layers) vis(map, id, k === key);
}

export function showParcel(map, parcel, fly = true) {
  map.getSource("sel").setData(fc([{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [parcel.c] } }]));
  const [cx, cy] = centroid(parcel.c);
  map.getSource("ring").setData(fc([500, 1000].map((ft) => ({ type: "Feature", properties: { ft }, geometry: circle(cx, cy, ft) }))));
  if (fly) map.fitBounds(bounds(parcel.c), { padding: 140, maxZoom: 18.2, duration: 900 });
}

// Accepts a GeoJSON geometry or a list of [lon, lat] points.
export function fitTo(map, geomOrPoints, padding = 24) {
  const pts = Array.isArray(geomOrPoints) ? geomOrPoints : ringsOf(geomOrPoints);
  map.fitBounds(bounds(pts), { padding, duration: 800 });
}

export function ringsOf(g) {
  if (!g) return [];
  if (g.type === "Polygon") return g.coordinates[0];
  if (g.type === "MultiPolygon") return g.coordinates.flatMap((p) => p[0]);
  return [];
}

function centroid(ring) {
  const n = ring.length - 1;
  return [ring.slice(0, n).reduce((a, p) => a + p[0], 0) / n, ring.slice(0, n).reduce((a, p) => a + p[1], 0) / n];
}

function circle(lon, lat, ft, n = 64) {
  const kx = Math.cos((lat * Math.PI) / 180) * 111320 * 3.28084, ky = 110540 * 3.28084;
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; pts.push([lon + (Math.cos(a) * ft) / kx, lat + (Math.sin(a) * ft) / ky]); }
  return { type: "LineString", coordinates: pts };
}

function bounds(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [[x0, y0], [x1, y1]];
}
