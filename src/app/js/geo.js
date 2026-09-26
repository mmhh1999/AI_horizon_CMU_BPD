// Local planar frame (feet) aligned to a lot's front lot line.
// x = east, y = north (ft); s = along the front line, t = depth into the lot.

const FT_PER_M = 3.28084;

export function makeFrame(ring, frontEdge) {
  const n = ring.length - 1;
  const lon0 = ring.slice(0, n).reduce((a, p) => a + p[0], 0) / n;
  const lat0 = ring.slice(0, n).reduce((a, p) => a + p[1], 0) / n;
  const kx = Math.cos((lat0 * Math.PI) / 180) * 111320 * FT_PER_M;
  const ky = 110540 * FT_PER_M;
  const toXY = ([lon, lat]) => [(lon - lon0) * kx, (lat - lat0) * ky];
  const toLL = ([x, y]) => [lon0 + x / kx, lat0 + y / ky];

  const pts = ring.map(toXY);
  const a = pts[frontEdge];
  const b = pts[(frontEdge + 1) % n];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  let v = [-u[1], u[0]];
  // v must point into the lot (towards the centroid, which is the origin of x/y).
  if ((0 - a[0]) * v[0] + (0 - a[1]) * v[1] < 0) v = [-v[0], -v[1]];

  const toST = ([x, y]) => [(x - a[0]) * u[0] + (y - a[1]) * u[1], (x - a[0]) * v[0] + (y - a[1]) * v[1]];
  const fromST = ([s, t]) => [a[0] + s * u[0] + t * v[0], a[1] + s * u[1] + t * v[1]];
  const st = pts.map(toST);
  const sMin = Math.min(...st.map((p) => p[0]));
  const sMax = Math.max(...st.map((p) => p[0]));
  const tMax = Math.max(...st.map((p) => p[1]));
  const tMin = Math.min(...st.map((p) => p[1]));

  // Camera bearing: look from the street into the lot (degrees clockwise from north).
  const bearing = (Math.atan2(v[0], v[1]) * 180) / Math.PI;

  return {
    lon0, lat0, toXY, toLL, toST, fromST, u, v, bearing,
    sMin, sMax, tMin, tMax,
    width: sMax - sMin,
    depth: tMax - Math.max(0, tMin),
    areaSf: Math.abs(shoelace(pts)),
    ringXY: pts,
  };
}

export function shoelace(pts) {
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) s += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  return s / 2;
}

// Rectangle in (s, t) -> closed ring in x/y feet.
export function rectXY(frame, s0, s1, t0, t1) {
  return [[s0, t0], [s1, t0], [s1, t1], [s0, t1], [s0, t0]].map(frame.fromST);
}

export function ringLL(frame, ringXY) {
  return ringXY.map(frame.toLL);
}

export function convexHull(points) {
  const p = points.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  hull.push(hull[0]);
  return hull;
}

export function bbox(ring) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

export const bboxOverlap = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
