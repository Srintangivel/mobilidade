// Route planning on real streets via the public OSRM servers at routing.openstreetmap.de,
// with an offline estimate as fallback. The "safe" option minimises nearby reported hazards.
import type { Report } from "./store";

export type TravelMode = "car" | "bike" | "foot";
export type LatLng = [number, number];

export interface RouteOption {
  id: string;
  coords: LatLng[];
  distanceKm: number;
  durationMin: number;
  hazards: Report[];
  source: "osm" | "estimate";
}

export interface RoutePlan {
  fast: RouteOption;
  safe: RouteOption;
  sameRoute: boolean;
}

export const MODE_LABEL: Record<TravelMode, string> = {
  car: "Carro",
  bike: "Bike",
  foot: "A pé",
};

const PROFILE: Record<TravelMode, string> = {
  car: "routed-car",
  bike: "routed-bike",
  foot: "routed-foot",
};

// Free-flow car times are unrealistic in São Paulo; apply a traffic factor.
const TIME_FACTOR: Record<TravelMode, number> = { car: 1.5, bike: 1, foot: 1 };
const FALLBACK_SPEED_KMH: Record<TravelMode, number> = { car: 20, bike: 14, foot: 4.8 };
const HAZARD_RADIUS_M = 120;

function toMeters(origin: LatLng, p: LatLng): [number, number] {
  const k = 111_320;
  return [(p[1] - origin[1]) * k * Math.cos((origin[0] * Math.PI) / 180), (p[0] - origin[0]) * k];
}

export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function distanceToPolylineM(point: LatLng, line: LatLng[]) {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, ay] = toMeters(point, line[i]!);
    const [bx, by] = toMeters(point, line[i + 1]!);
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len));
    const px = ax + t * dx;
    const py = ay + t * dy;
    best = Math.min(best, Math.hypot(px, py));
  }
  return best;
}

export function hazardsNear(line: LatLng[], reports: Report[]) {
  return reports.filter((r) => distanceToPolylineM([r.lat, r.lng], line) <= HAZARD_RADIUS_M);
}

async function osrm(points: LatLng[], mode: TravelMode, alternatives: boolean, signal?: AbortSignal) {
  const coords = points.map((p) => `${p[1]},${p[0]}`).join(";");
  const url = `https://routing.openstreetmap.de/${PROFILE[mode]}/route/v1/driving/${coords}?overview=full&geometries=geojson${alternatives ? "&alternatives=3" : ""}`;
  const res = await fetch(url, { signal: signal ?? null });
  if (!res.ok) throw new Error(`Routing ${res.status}`);
  const json = (await res.json()) as {
    code: string;
    routes: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  if (json.code !== "Ok") throw new Error(json.code);
  return json.routes.map((r) => ({
    coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng),
    distanceKm: r.distance / 1000,
    durationMin: (r.duration / 60) * TIME_FACTOR[mode],
  }));
}

function detourPoints(a: LatLng, b: LatLng): LatLng[] {
  const mid: LatLng = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dLat = b[0] - a[0];
  const dLng = b[1] - a[1];
  const f = 0.18;
  return [
    [mid[0] - dLng * f, mid[1] + dLat * f],
    [mid[0] + dLng * f, mid[1] - dLat * f],
  ];
}

function curved(a: LatLng, b: LatLng, bulge: number): LatLng[] {
  const steps = 24;
  const dLat = b[0] - a[0];
  const dLng = b[1] - a[1];
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const off = Math.sin(Math.PI * t) * bulge;
    return [a[0] + dLat * t - dLng * off, a[1] + dLng * t + dLat * off] as LatLng;
  });
}

function estimate(a: LatLng, b: LatLng, mode: TravelMode) {
  const straight = haversineKm(a, b);
  return [0.06, -0.16].map((bulge, i) => {
    const distanceKm = straight * (i === 0 ? 1.3 : 1.45);
    return {
      coords: curved(a, b, bulge),
      distanceKm,
      durationMin: (distanceKm / FALLBACK_SPEED_KMH[mode]) * 60,
    };
  });
}

type Candidate = { coords: LatLng[]; distanceKm: number; durationMin: number };

export function choosePlan(candidates: Candidate[], reports: Report[], source: RouteOption["source"]): RoutePlan {
  const options: RouteOption[] = candidates.map((c, i) => ({
    ...c,
    id: `r${i}`,
    hazards: hazardsNear(c.coords, reports),
    source,
  }));
  const fast = [...options].sort((x, y) => x.durationMin - y.durationMin)[0]!;
  const safer = options
    .filter((o) => o !== fast && o.hazards.length <= fast.hazards.length)
    .filter((o) => o.durationMin <= fast.durationMin * 1.8)
    .sort((x, y) => x.hazards.length - y.hazards.length || x.durationMin - y.durationMin)[0];
  const safe = safer ?? fast;
  return { fast, safe, sameRoute: safe === fast };
}

export async function planRoute(
  origin: LatLng,
  dest: LatLng,
  mode: TravelMode,
  reports: Report[],
  signal?: AbortSignal,
): Promise<RoutePlan> {
  try {
    const main = await osrm([origin, dest], mode, true, signal);
    let candidates: Candidate[] = main;
    if (main.length < 2) {
      const detours = await Promise.allSettled(
        detourPoints(origin, dest).map((via) => osrm([origin, via, dest], mode, false, signal)),
      );
      for (const d of detours) if (d.status === "fulfilled") candidates = candidates.concat(d.value);
    }
    return choosePlan(candidates, reports, "osm");
  } catch (err) {
    if (signal?.aborted) throw err;
    return choosePlan(estimate(origin, dest, mode), reports, "estimate");
  }
}

export function formatDuration(min: number) {
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
}
