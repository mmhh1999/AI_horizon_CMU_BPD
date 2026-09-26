// Monochrome axonometric renderer (SVG). Coordinates are lot-local (s = along the street, t = depth), feet.
// The street is in the foreground; the viewer looks from the street-right corner.

const C30 = Math.cos(Math.PI / 6), S30 = Math.sin(Math.PI / 6);
const P = (s, t, z) => [(s + t) * C30, (s - t) * S30 - z];
const VIEW = [1, -1]; // viewer direction in (s, t)

function signedArea(r) { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return a / 2; }
function ccw(r) { return signedArea(r) < 0 ? [...r].reverse() : r; }

function prismFaces(ring, z0, z1) {
  const r = ccw(ring);
  const walls = [];
  for (let i = 0; i < r.length - 1; i++) {
    const [a, b] = [r[i], r[i + 1]];
    const n = [b[1] - a[1], -(b[0] - a[0])];
    const len = Math.hypot(n[0], n[1]) || 1;
    const dot = (n[0] * VIEW[0] + n[1] * VIEW[1]) / (len * Math.SQRT2);
    if (dot > 0.001) walls.push({ a, b, dot, facing: Math.abs(n[0]) > Math.abs(n[1]) ? "s" : "t" });
  }
  return { walls, top: r.map(([s, t]) => [s, t, z1]), base: z0 };
}

const depth = (ring) => { let d = -Infinity; for (const [s, t] of ring) d = Math.max(d, s - t); return d; };

export function renderAxo({ width, height, lotRing, neighborLots = [], neighbors = [], envelope = null, volumes = [], shadows = [], dashed = false, pad = 10, frameTo = "all", style = "full", solar = null }) {
  // --- bounds
  const pts = [];
  const add = (s, t, z) => pts.push(P(s, t, z));
  for (const [s, t] of lotRing) add(s, t, 0);
  for (const v of volumes) for (const s of [v.s0, v.s1]) for (const t of [v.t0, v.t1]) { add(s, t, 0); add(s, t, v.h); }
  if (envelope && frameTo !== "tight") for (const s of [envelope.s0, envelope.s1]) for (const t of [envelope.t0, envelope.t1]) add(s, t, envelope.h);
  if (frameTo === "context") for (const n of neighbors) for (const [s, t] of n.ring) { add(s, t, 0); add(s, t, n.h); }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min((width - 2 * pad) / (x1 - x0 || 1), (height - 2 * pad) / (y1 - y0 || 1));
  const ox = (width - (x1 - x0) * k) / 2 - x0 * k, oy = (height - (y1 - y0) * k) / 2 - y0 * k;
  const T = ([x, y]) => `${(x * k + ox).toFixed(1)},${(y * k + oy).toFixed(1)}`;
  const Q = (s, t, z) => T(P(s, t, z));
  const poly = (arr, attrs) => `<polygon points="${arr.join(" ")}" ${attrs}/>`;
  let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`;

  // --- ground: neighbor lots, shadows, lot
  for (const r of neighborLots) svg += poly(r.map(([s, t]) => Q(s, t, 0)), 'fill="none" stroke="#D8D8D5" stroke-width="0.6"');
  for (const r of shadows) svg += poly(r.map(([s, t]) => Q(s, t, 0)), 'fill="#1E1E1E" fill-opacity="0.10" stroke="none"');
  svg += poly(lotRing.map(([s, t]) => Q(s, t, 0)), `fill="#EDEDEA" stroke="#1E1E1E" stroke-width="${style === "thumb" ? 1 : 1.4}"`);

  // --- prisms (painter's order: far to near)
  const items = [];
  // Neighbors nearer to the viewer than the lot's center are drawn as ground footprints only,
  // so they never hide the massing (a common convention in feasibility diagrams).
  const xr = (r) => { let a = Infinity, b = -Infinity; for (const [s, t] of r) { const x = (s + t) * C30; a = Math.min(a, x); b = Math.max(b, x); } return [a, b]; };
  const lotX = xr(lotRing);
  const lotFront = depth(lotRing);
  const occludes = (r) => { const [a, b] = xr(r); return depth(r) > lotFront - 2 && a < lotX[1] && b > lotX[0]; };
  for (const n of neighbors) {
    if (occludes(n.ring)) svg += poly(n.ring.map(([s, t]) => Q(s, t, 0)), 'fill="#E6E6E3" fill-opacity="0.7" stroke="#C4C4C0" stroke-width="0.5" stroke-dasharray="2 2"');
    else items.push({ ring: n.ring, h: n.h, kind: "nb", d: depth(n.ring) });
  }
  svg += poly(lotRing.map(([s, t]) => Q(s, t, 0)), `fill="none" stroke="#1E1E1E" stroke-width="${style === "thumb" ? 1 : 1.4}"`);
  volumes.forEach((v) => items.push({ ring: [[v.s0, v.t0], [v.s1, v.t0], [v.s1, v.t1], [v.s0, v.t1], [v.s0, v.t0]], h: v.h, v, kind: "mass", d: depth([[v.s1, v.t0]]) }));
  items.sort((a, b) => a.d - b.d);

  for (const it of items) {
    const f = prismFaces(it.ring, 0, it.h);
    const mass = it.kind === "mass";
    const v = it.v || {};
    const kept = mass && v.existing, porch = mass && v.porch;
    const stroke = mass ? (dashed ? '#8A8A87" stroke-dasharray="3 2' : kept ? "#77776F" : "#1E1E1E") : "#C4C4C0";
    const sw = mass ? (style === "thumb" ? 0.8 : 1) * (porch ? 0.7 : 1) : 0.5;
    for (const w of f.walls.sort((a, b) => depth([a.a, a.b]) - depth([b.a, b.b]))) {
      let fill = mass ? (dashed ? "none" : w.facing === "t" ? "#FFFFFF" : "#DCDCD9") : w.facing === "t" ? "#EEEEEB" : "#E1E1DE";
      if (kept && !dashed) fill = w.facing === "t" ? "#ECECE8" : "#D3D3CF";
      const op = porch && !dashed ? ' fill-opacity="0.35"' : "";
      svg += poly([Q(...w.a, 0), Q(...w.b, 0), Q(...w.b, it.h), Q(...w.a, it.h)], `fill="${fill}"${op} stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"`);
      if (mass && !dashed && v.garage && w.facing === "t") {
        const inset = 0.2;
        const pa = [w.a[0] + (w.b[0] - w.a[0]) * inset, w.a[1] + (w.b[1] - w.a[1]) * inset], pb = [w.a[0] + (w.b[0] - w.a[0]) * (1 - inset), w.a[1] + (w.b[1] - w.a[1]) * (1 - inset)];
        svg += poly([Q(...pa, 0), Q(...pb, 0), Q(...pb, 8), Q(...pa, 8)], `fill="#8A8A87" fill-opacity="0.45" stroke="none"`);
      }
      if (mass && !dashed && !porch && it.v.stories > 1) {
        // floor lines
        const g = it.v.groundFt;
        const levels = [];
        for (let i = 1; i < it.v.stories; i++) levels.push(g ? g + (i - 1) * 10.5 : i * 10.5);
        for (const z of levels) svg += `<line x1="${Q(...w.a, z).split(",")[0]}" y1="${Q(...w.a, z).split(",")[1]}" x2="${Q(...w.b, z).split(",")[0]}" y2="${Q(...w.b, z).split(",")[1]}" stroke="#1E1E1E" stroke-opacity="${g && z === g ? 0.7 : 0.22}" stroke-width="${g && z === g ? 1 : 0.6}"/>`;
        if (g) { // shopfront band
          svg += poly([Q(...w.a, 1), Q(...w.b, 1), Q(...w.b, g - 3), Q(...w.a, g - 3)], `fill="#FFB81C" fill-opacity="0.55" stroke="none"`);
        }
      }
    }
    const topFill = mass ? (dashed ? "none" : kept ? "#F1F1EE" : "#FFFFFF") : "#F6F6F4";
    svg += poly(f.top.map(([s, t, z]) => Q(s, t, z)), `fill="${topFill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"`);
  }

  // --- solar envelope (mesh over the lot); heights are capped so tall southern cells don't dominate the view
  if (solar) {
    const cap = Math.max(envelope ? envelope.h : 0, ...volumes.map((v) => v.h), 30) * 1.15;
    const R = solar.rows, nj = R.length, ni = R[0].length;
    const stepJ = Math.max(1, Math.round(nj / 7)), stepI = Math.max(1, Math.round(ni / 5));
    const line = (cells) => {
      let d = "", pen = false;
      for (const c of cells) {
        if (!c) { pen = false; continue; }
        const [x, y] = Q(c[0], c[1], Math.min(cap, c[2])).split(",");
        d += `${pen ? "L" : "M"}${x},${y}`; pen = true;
      }
      return d ? `<path d="${d}" fill="none" stroke="#2F7FB8" stroke-width="0.8" stroke-opacity="0.7" stroke-linejoin="round"/>` : "";
    };
    for (let j = 0; j < nj; j += stepJ) svg += line(R[j]);
    for (let i = 0; i < ni; i += stepI) svg += line(R.map((row) => row[i]));
  }

  // --- zoning envelope (dashed wireframe)
  if (envelope) {
    const { s0, s1, t0, t1, h } = envelope;
    const e = [[s0, t0], [s1, t0], [s1, t1], [s0, t1]];
    const edge = (a, b) => `<line x1="${a.split(",")[0]}" y1="${a.split(",")[1]}" x2="${b.split(",")[0]}" y2="${b.split(",")[1]}" stroke="#C98A00" stroke-opacity="0.9" stroke-width="1.1" stroke-dasharray="4 3"/>`;
    for (let i = 0; i < 4; i++) {
      const a = e[i], b = e[(i + 1) % 4];
      svg += edge(Q(...a, h), Q(...b, h));
      svg += edge(Q(...a, 0), Q(...a, h));
    }
  }
  return svg + "</svg>";
}
