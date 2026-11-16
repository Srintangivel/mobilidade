// Browser-only: imports Leaflet. Load with React.lazy behind <ClientOnly>.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SP_CENTER } from "@/lib/mobility/places";
import { REPORT_CATEGORIES } from "@/lib/mobility/rules";
import type { LatLng, RouteOption } from "@/lib/mobility/routing";
import type { Report } from "@/lib/mobility/store";

export interface MobilityMapProps {
  reports: Report[];
  origin: LatLng | null;
  dest: LatLng | null;
  routes: { active: RouteOption; inactive?: RouteOption | undefined } | null;
  activeKind: "fast" | "safe";
  picking: boolean;
  draft: LatLng | null;
  focus: { point: LatLng; zoom: number; key: number } | null;
  currentUserId: string | null;
  confirmedIds: string[];
  onPick: (p: LatLng) => void;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}

const icons = new Map<string, L.DivIcon>();
function pinIcon(category: Report["category"]) {
  let icon = icons.get(category);
  if (!icon) {
    icon = L.divIcon({
      className: "",
      html: `<div class="mp-pin mp-pin--${category}"><span>${REPORT_CATEGORIES[category].emoji}</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32],
    });
    icons.set(category, icon);
  }
  return icon;
}

const endpointIcon = (kind: "origin" | "dest") =>
  L.divIcon({
    className: "",
    html: `<div class="mp-endpoint mp-endpoint--${kind}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const draftIcon = L.divIcon({
  className: "",
  html: `<div class="mp-draft"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function ClickCatcher({ picking, onPick }: { picking: boolean; onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (picking) onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function FitRoute({ coords }: { coords: LatLng[] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!coords || coords.length < 2) return;
    const bounds = L.latLngBounds(coords);
    const wide = window.innerWidth >= 768;
    map.fitBounds(bounds, {
      paddingTopLeft: wide ? [420, 60] : [30, 260],
      paddingBottomRight: wide ? [60, 60] : [30, 220],
    });
  }, [coords, map]);
  return null;
}

function FlyTo({ focus }: { focus: MobilityMapProps["focus"] }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo(focus.point, focus.zoom, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

export default function MobilityMap(props: MobilityMapProps) {
  const { reports, origin, dest, routes, activeKind, picking, draft, focus } = props;
  const colors = useMemo(
    () => ({
      ink: cssVar("--ink"),
      signal: cssVar("--signal"),
      safe: cssVar("--safe"),
      muted: cssVar("--muted-foreground"),
    }),
    [],
  );
  const activeColor = activeKind === "fast" ? colors.signal : colors.safe;

  return (
    <MapContainer
      center={SP_CENTER}
      zoom={13}
      minZoom={10}
      zoomControl={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={16}
        maxZoom={19}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={16}
        maxZoom={19}
      />
      <ClickCatcher picking={picking} onPick={props.onPick} />
      <FitRoute coords={routes?.active.coords ?? null} />
      <FlyTo focus={focus} />

      {routes?.inactive && (
        <Polyline
          positions={routes.inactive.coords}
          pathOptions={{ color: colors.muted, weight: 5, opacity: 0.45, dashArray: "2 10", lineCap: "round" }}
        />
      )}
      {routes && (
        <>
          <Polyline
            positions={routes.active.coords}
            pathOptions={{ color: colors.ink, weight: 10, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
          />
          <Polyline
            positions={routes.active.coords}
            pathOptions={{ color: activeColor, weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }}
          />
        </>
      )}

      {origin && <Marker position={origin} icon={endpointIcon("origin")} />}
      {dest && <Marker position={dest} icon={endpointIcon("dest")} />}
      {draft && <Marker position={draft} icon={draftIcon} />}

      {reports.map((r) => {
        const cat = REPORT_CATEGORIES[r.category];
        const mine = r.userId === props.currentUserId;
        const confirmed = props.confirmedIds.includes(r.id);
        return (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={pinIcon(r.category)}>
            <Popup minWidth={240} maxWidth={280}>
              <div className="space-y-2 font-sans">
                {r.image && (
                  <img
                    src={r.image}
                    alt={cat.label}
                    className="h-36 w-full rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {cat.emoji} {cat.label}
                  </p>
                  {r.description && <p className="mt-1 text-sm text-foreground">{r.description}</p>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.userName} ·{" "}
                  {formatDistanceToNow(r.createdAt, { addSuffix: true, locale: ptBR })} ·{" "}
                  {r.confirmations} confirmações
                </p>
                {mine ? (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => props.onDelete(r.id)}>
                    <Trash2 /> Remover meu reporte
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={confirmed}
                    onClick={() => props.onConfirm(r.id)}
                  >
                    <CheckCircle2 /> {confirmed ? "Você confirmou" : "Ainda está aqui (+5)"}
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
