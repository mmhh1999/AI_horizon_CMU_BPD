// Winter-solstice shadows for display (flat-ground approximation). Uses global SunCalc.
import { SUN } from "./config.js";
import { convexHull } from "./geo.js";

export function sunAt(frame, hour) {
  // Pittsburgh local clock in December = UTC-5.
  const p = SunCalc.getPosition(new Date(Date.UTC(SUN.year, SUN.month, SUN.day, hour + 5, 0)), frame.lat0, frame.lon0);
  return { altitude: p.altitude, azimuth: p.azimuth };
}

// Shadow of a prism given as a ring in (s, t) feet; returns a ring in (s, t).
export function shadowST(frame, ringST, heightFt, sun) {
  if (sun.altitude <= 0.02) return null;
  const L = heightFt / Math.tan(sun.altitude);
  const dx = Math.sin(sun.azimuth) * L, dy = Math.cos(sun.azimuth) * L; // away from the sun, in x=east / y=north
  const xy = ringST.slice(0, -1).map(frame.fromST);
  const hull = convexHull(xy.concat(xy.map(([x, y]) => [x + dx, y + dy])));
  return hull.map(frame.toST);
}
