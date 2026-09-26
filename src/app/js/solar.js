// Performance beyond zoning: solar envelope (Knowles-style), compactness, transit (TOD) and green space.
// These are community goals and comparative estimates, not current Pittsburgh law. Uses global SunCalc.
import { SUN, PARKING, FLOOR_TO_FLOOR } from "./config.js";
import { walkMinutes } from "./scenarios.js";

const M_PER_FT = 0.3048;

export const SOLAR_WINDOWS = {
  noon2: { label: "Solar noon ± 2 h", short: "noon ± 2 h" },
  day: { label: "9:00–15:00", short: "9–15 h" },
};
export const SOLAR_FENCES = { 12: "12 ft fence (low-density)", 25: "25 ft fence (denser areas)" };
export const solarDefaults = () => ({ window: "noon2", fence: 12 });

const STREET_ROW = 50; // ft protected across the street (typical right-of-way)
const CELL = 3; // ft grid

function sunSamples(frame, win) {
  const noon = SunCalc.getTimes(new Date(Date.UTC(SUN.year, SUN.month, SUN.day, 17)), frame.lat0, frame.lon0).solarNoon.getTime();
  const [t0, t1] = win === "day"
    ? [Date.UTC(SUN.year, SUN.month, SUN.day, 14), Date.UTC(SUN.year, SUN.month, SUN.day, 20)] // 9:00–15:00 EST
    : [noon - 2 * 3600e3, noon + 2 * 3600e3];
  const out = [];
  for (let t = t0; t <= t1 + 1; t += 20 * 60e3) {
    const p = SunCalc.getPosition(new Date(t), frame.lat0, frame.lon0);
    if (p.altitude <= 0.03) continue;
    const dx = Math.sin(p.azimuth), dy = Math.cos(p.azimuth); // shadow direction, x = east / y = north
    const ds = dx * frame.u[0] + dy * frame.u[1], dt = dx * frame.v[0] + dy * frame.v[1];
    out.push({ dir: [ds, dt], tan: Math.tan(p.altitude), alt: p.altitude });
  }
  return { samples: out, noon: new Date(noon) };
}

// Distance from P along dir to where the ray leaves the lot polygon; flags exits across the front (street) line.
function exitDistance(P, dir, ring) {
  let best = Infinity, street = false;
  for (let i = 0; i < ring.length - 1; i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[i + 1];
    const ex = bx - ax, ey = by - ay;
    const den = dir[0] * ey - dir[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const wx = ax - P[0], wy = ay - P[1];
    const lam = (wx * ey - wy * ex) / den;
    const mu = (wx * dir[1] - wy * dir[0]) / den;
    if (lam > 1e-6 && mu >= -1e-9 && mu <= 1 + 1e-9 && lam < best) {
      best = lam;
      street = Math.max(Math.abs(ay), Math.abs(by)) < 1.5;
    }
  }
  return { d: best === Infinity ? 0 : best, street };
}

function inside(P, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > P[1]) !== (yj > P[1]) && P[0] < ((xj - xi) * (P[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// Height limit at each grid point so that, during the protected window, no shadow falls on neighbors
// above the solar fence (and across the street, beyond the right-of-way).
export function solarEnvelope(frame, lotST, opts = solarDefaults()) {
  const { samples, noon } = sunSamples(frame, opts.window);
  const s0 = frame.sMin, s1 = frame.sMax, t0 = Math.max(0, frame.tMin), t1 = frame.tMax;
  const ns = Math.max(2, Math.ceil((s1 - s0) / CELL)), nt = Math.max(2, Math.ceil((t1 - t0) / CELL));
  const rows = [];
  for (let j = 0; j <= nt; j++) {
    const row = [];
    for (let i = 0; i <= ns; i++) {
      const P = [s0 + ((s1 - s0) * i) / ns, t0 + ((t1 - t0) * j) / nt];
      if (!inside(P, lotST)) { row.push(null); continue; }
      let H = Infinity;
      for (const k of samples) {
        const e = exitDistance(P, k.dir, lotST);
        H = Math.min(H, opts.fence + (e.d + (e.street ? STREET_ROW : 0)) * k.tan);
      }
      row.push([P[0], P[1], H === Infinity ? 200 : H]);
    }
    rows.push(row);
  }
  const at = (s, t) => {
    const i = Math.round(((s - s0) / (s1 - s0 || 1)) * ns), j = Math.round(((t - t0) / (t1 - t0 || 1)) * nt);
    const c = rows[Math.min(nt, Math.max(0, j))]?.[Math.min(ns, Math.max(0, i))];
    return c ? c[2] : null;
  };
  const altNoon = Math.max(...samples.map((k) => k.alt), 0);
  return { rows, at, opts, noon, samples: samples.length, altNoonDeg: (altNoon * 180) / Math.PI };
}

export function checkSolar(f, env) {
  let n = 0, over = 0, maxOver = 0;
  for (const v of f.volumes) {
    if (v.porch) continue;
    for (const row of env.rows) for (const c of row) {
      if (!c || c[0] < v.s0 || c[0] > v.s1 || c[1] < v.t0 || c[1] > v.t1) continue;
      n++;
      const d = v.h - c[2];
      if (d > 1) { over++; maxOver = Math.max(maxOver, d); }
    }
  }
  const share = n ? over / n : 0;
  return { fits: over === 0, share, maxOver, floorsOver: Math.ceil(maxOver / FLOOR_TO_FLOOR) };
}

// Surface-to-volume ratio (1/m): exposed walls + roof + ground floor over heated volume. Lower is more compact.
export function compactness(f) {
  let walls = 0, vol = 0, foot = 0;
  for (const v of f.volumes) {
    if (v.porch) continue;
    const w = v.s1 - v.s0, d = v.t1 - v.t0, hh = v.stories * FLOOR_TO_FLOOR;
    walls += (v.party === 2 ? 2 * w : v.party === 1 ? 2 * w + d : 2 * (w + d)) * hh;
    vol += w * d * hh; foot += w * d;
  }
  const sv = vol ? ((walls + 2 * foot) / vol) / M_PER_FT : 0;
  const label = sv <= 0.45 ? "Compact" : sv <= 0.75 ? "Moderate" : "Spread out";
  return { sv, label, perUnit: f.envelopePerUnit };
}

export function tod(parcel, f, a, stops) {
  const walk = walkMinutes(parcel);
  const stop = stops?.[parcel.tr?.s];
  const rapid = !!stop?.rp;
  const required = Math.max(0, Math.ceil(f.units * PARKING.perUnit + f.commercialSf * PARKING.perCommercialSf) - (f.parkingCredit || 0));
  const provided = a.parking === "none" ? 0 : required;
  const avoided = required - provided;
  const node = (parcel.o || []).includes("TN");
  return { walk, trips: parcel.tr?.t || 0, stop: stop?.n, rapid, required, avoided, sfAvoided: avoided * PARKING.sfPerSpace, node };
}

export function green(parcel, f) {
  const d = parcel.pk;
  const band = d == null ? null : d <= 500 ? "near" : d <= 1000 ? "who" : d <= 1320 ? "quarter" : "far";
  const label = { near: "Within 500 ft: close enough for children and seniors", who: "Within ~300 m (1,000 ft), the WHO's suggested distance", quarter: "Within a quarter mile", far: "More than a quarter mile away" }[band] || "Unknown";
  return { d, band, label, open: f.pervious / f.lotArea };
}

// Community goals (not current law) that a future does not meet; shown apart from legal constraints.
export function goalsFor(f, perf) {
  const out = [];
  const s = perf.solar;
  if (s && !s.fits) out.push({ key: "solar", icon: "sun", title: "Shades neighbors' winter sun", plain: `Rises up to ${Math.round(s.maxOver)} ft above the solar envelope over ${Math.round(s.share * 100)}% of its footprint. Stepping back the top ${s.floorsOver === 1 ? "floor" : `${s.floorsOver} floors`} on the north side would fit it.`, src: "SOLARENV" });
  if (perf.compact.sv > 0.75) out.push({ key: "compact", icon: "box", title: "Lots of outside wall per home", plain: `Surface-to-volume ratio ${perf.compact.sv.toFixed(2)} per m; attached or stacked homes lose less heat.`, src: "TYPOLOGY" });
  if (perf.green.band === "far") out.push({ key: "green", icon: "trees", title: "No park within a quarter mile", plain: `Nearest park or greenway is about ${Math.round(perf.green.d).toLocaleString("en-US")} ft away; plan shared green space on site.`, src: "GREEN" });
  if (perf.tod.walk > 10) out.push({ key: "tod", icon: "bus", title: "Car-light living is harder here", plain: `About ${Math.round(perf.tod.walk)} minutes' walk to the nearest stop.`, src: "TRANSIT" });
  return out;
}
