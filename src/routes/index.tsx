import { ClientOnly, Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  Bike,
  Car,
  Crosshair,
  Footprints,
  Loader2,
  LocateFixed,
  Navigation,
  ShieldCheck,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PlaceSearch } from "@/components/map/PlaceSearch";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { cn } from "@/lib/utils";
import { PLACES, type Place } from "@/lib/mobility/places";
import { REPORT_CATEGORIES, TRIP_POINTS, type ReportCategory } from "@/lib/mobility/rules";
import {
  MODE_LABEL,
  formatDistance,
  formatDuration,
  planRoute,
  type LatLng,
  type RouteOption,
  type RoutePlan,
  type TravelMode,
} from "@/lib/mobility/routing";
import {
  confirmReport,
  deleteReport,
  recordTrip,
  useMobilityState,
  useSession,
} from "@/lib/mobility/store";

const MobilityMap = lazy(() => import("@/components/map/MobilityMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mapa de rotas seguras em São Paulo · Mobilidade+ SP" },
      {
        name: "description",
        content:
          "Planeje rotas rápidas ou seguras em São Paulo, veja alagamentos, buracos e trechos escuros reportados pela comunidade.",
      },
      { property: "og:title", content: "Mapa de rotas seguras em São Paulo · Mobilidade+ SP" },
      {
        property: "og:description",
        content: "Rotas rápidas ou seguras e ocorrências reportadas pela comunidade em SP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

const MODE_ICON: Record<TravelMode, typeof Car> = { car: Car, bike: Bike, foot: Footprints };

function MapFallback() {
  return (
    <div className="bg-grid grid h-full w-full place-items-center bg-secondary">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function MapPage() {
  const navigate = useNavigate();
  const { reports } = useMobilityState();
  const { user, profile } = useSession();

  const [origin, setOrigin] = useState<Place | null>(PLACES[0] ?? null);
  const [dest, setDest] = useState<Place | null>(null);
  const [mode, setMode] = useState<TravelMode>("foot");
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<"fast" | "safe">("safe");
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<LatLng | null>(null);
  const [hidden, setHidden] = useState<ReportCategory[]>([]);
  const [focus, setFocus] = useState<{ point: LatLng; zoom: number; key: number } | null>(null);

  const reportCount = reports.length;

  useEffect(() => {
    if (!origin || !dest) {
      setPlan(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    planRoute([origin.lat, origin.lng], [dest.lat, dest.lng], mode, reports, ctrl.signal)
      .then((p) => setPlan(p))
      .catch(() => {})
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, dest, mode, reportCount]);

  const visibleReports = useMemo(
    () => reports.filter((r) => !hidden.includes(r.category)),
    [reports, hidden],
  );

  const active: RouteOption | null = plan ? plan[kind] : null;
  const inactive = plan && !plan.sameRoute ? plan[kind === "fast" ? "safe" : "fast"] : undefined;

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não permite localização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: Place = {
          id: `me-${Date.now()}`,
          name: "Minha localização",
          address: "Localização atual",
          kind: "street",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setOrigin(p);
        setFocus({ point: [p.lat, p.lng], zoom: 15, key: Date.now() });
      },
      () => toast.error("Não foi possível obter sua localização."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const requireLogin = (msg: string) => {
    toast(msg, { action: { label: "Entrar", onClick: () => navigate({ to: "/entrar" }) } });
  };

  const startReport = () => {
    if (!user) return requireLogin("Entre na sua conta para reportar e ganhar pontos.");
    setPicking(true);
  };

  const startTrip = () => {
    if (!active || !origin || !dest) return;
    if (!user) return requireLogin("Entre para salvar trajetos e ganhar pontos.");
    try {
      recordTrip({
        from: origin.name,
        to: dest.name,
        mode: kind,
        distanceKm: active.distanceKm,
        durationMin: active.durationMin,
      });
      toast.success(`Boa viagem! +${TRIP_POINTS} pontos`, {
        description: `${origin.name} → ${dest.name} salvo no seu histórico.`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar trajeto.");
    }
  };

  const handle = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Algo deu errado.");
    }
  };

  return (
    <div className={cn("relative h-[calc(100dvh-4rem)] w-full overflow-hidden", picking && "map-picking")}>
      <div className="absolute inset-0 isolate">
        <ClientOnly fallback={<MapFallback />}>
          <Suspense fallback={<MapFallback />}>
            <MobilityMap
              reports={visibleReports}
              origin={origin ? [origin.lat, origin.lng] : null}
              dest={dest ? [dest.lat, dest.lng] : null}
              routes={active ? { active, inactive } : null}
              activeKind={kind}
              picking={picking}
              draft={draft}
              focus={focus}
              currentUserId={user?.id ?? null}
              confirmedIds={profile?.confirmed ?? []}
              onPick={(p) => {
                setDraft(p);
                setPicking(false);
              }}
              onConfirm={(id) =>
                handle(() => {
                  const pts = confirmReport(id);
                  toast.success(`Ocorrência confirmada · +${pts} pontos`);
                })
              }
              onDelete={(id) => handle(() => deleteReport(id))}
            />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Planner panel */}
      <section className="pointer-events-none absolute inset-x-3 top-3 z-10 flex max-h-[calc(100%-6.5rem)] flex-col md:inset-x-auto md:left-4 md:top-4 md:w-[380px]">
        <div className="pointer-events-auto flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-float">
          <div className="space-y-2 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <PlaceSearch
                  label="Origem"
                  placeholder="De onde você sai?"
                  value={origin}
                  onSelect={setOrigin}
                  marker="origin"
                />
                <PlaceSearch
                  label="Destino"
                  placeholder="Para onde vamos? Ex.: MASP, Ibirapuera…"
                  value={dest}
                  onSelect={setDest}
                  marker="dest"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Usar minha localização"
                  onClick={useMyLocation}
                >
                  <LocateFixed />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Inverter origem e destino"
                  onClick={() => {
                    setOrigin(dest);
                    setDest(origin);
                  }}
                >
                  <ArrowDownUp />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
              {(Object.keys(MODE_LABEL) as TravelMode[]).map((m) => {
                const Icon = MODE_ICON[m];
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-colors",
                      m === mode ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" /> {MODE_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </div>

          {(loading || plan) && dest && (
            <div className="min-h-0 overflow-y-auto border-t border-border p-3">
              {loading && !plan ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Calculando rotas…
                </div>
              ) : plan ? (
                <div className={cn("space-y-2 transition-opacity", loading && "opacity-50")}>
                  <RouteCard
                    title="Rota mais rápida"
                    icon={<Zap className="size-4" />}
                    route={plan.fast}
                    selected={kind === "fast"}
                    tone="signal"
                    onClick={() => setKind("fast")}
                  />
                  <RouteCard
                    title="Mais segura / acessível"
                    icon={<ShieldCheck className="size-4" />}
                    route={plan.safe}
                    selected={kind === "safe"}
                    tone="safe"
                    note={
                      plan.sameRoute
                        ? "A rota mais rápida já é a mais segura."
                        : plan.fast.hazards.length > plan.safe.hazards.length
                          ? `Desvia de ${plan.fast.hazards.length - plan.safe.hazards.length} ocorrência(s)`
                          : "Caminho alternativo por vias mais tranquilas"
                    }
                    onClick={() => setKind("safe")}
                  />
                  {plan.fast.source === "estimate" && (
                    <p className="text-xs text-muted-foreground">
                      Sem conexão com o serviço de ruas — exibindo estimativa aproximada.
                    </p>
                  )}
                  <Button variant="signal" size="xl" className="mt-1 w-full" onClick={startTrip}>
                    <Navigation /> Iniciar trajeto · +{TRIP_POINTS} pts
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Picking banner */}
      {picking && (
        <div className="absolute inset-x-3 bottom-24 z-10 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-ink-foreground shadow-float">
          <Crosshair className="size-5 shrink-0 text-signal" />
          <p className="flex-1 text-sm font-semibold">Toque no mapa para marcar o local da ocorrência</p>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Cancelar"
            className="text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
            onClick={() => setPicking(false)}
          >
            <X />
          </Button>
        </div>
      )}

      {/* Legend / filters */}
      <div className="absolute bottom-4 left-3 z-10 flex max-w-[calc(100%-12rem)] flex-wrap gap-1.5 md:left-4">
        {(Object.keys(REPORT_CATEGORIES) as ReportCategory[]).map((c) => {
          const off = hidden.includes(c);
          return (
            <button
              key={c}
              onClick={() => setHidden((h) => (off ? h.filter((x) => x !== c) : [...h, c]))}
              className={cn(
                "flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-float transition-opacity",
                off && "opacity-45",
              )}
              aria-pressed={!off}
            >
              <span>{REPORT_CATEGORIES[c].emoji}</span>
              <span className="hidden sm:inline">{REPORT_CATEGORIES[c].short}</span>
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-3 z-10 md:right-4">
        <Button variant="hazard" size="xl" onClick={startReport} disabled={picking}>
          <TriangleAlert /> Reportar
        </Button>
      </div>

      {!user && (
        <Link
          to="/entrar"
          className="absolute right-4 top-4 z-10 hidden rounded-2xl border-2 border-ink bg-signal px-4 py-3 text-sm font-bold text-signal-foreground shadow-float lg:block"
        >
          Ganhe 150 pts ao criar sua conta →
        </Link>
      )}

      <ReportDialog point={draft} onClose={() => setDraft(null)} />
    </div>
  );
}

function RouteCard(props: {
  title: string;
  icon: React.ReactNode;
  route: RouteOption;
  selected: boolean;
  tone: "signal" | "safe";
  note?: string;
  onClick: () => void;
}) {
  const { route } = props;
  return (
    <button
      onClick={props.onClick}
      className={cn(
        "w-full rounded-xl border-2 p-3 text-left transition-all",
        props.selected ? "border-ink bg-secondary" : "border-border bg-card hover:border-muted-foreground",
      )}
      aria-pressed={props.selected}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-md",
              props.tone === "signal" ? "bg-signal text-signal-foreground" : "bg-safe text-safe-foreground",
            )}
          >
            {props.icon}
          </span>
          {props.title}
        </span>
        <span className="text-display text-xl font-bold text-foreground">
          {formatDuration(route.durationMin)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDistance(route.distanceKm)}</span>
        <span
          className={cn(
            "font-semibold",
            route.hazards.length ? "text-hazard" : "text-safe",
          )}
        >
          {route.hazards.length
            ? `${route.hazards.length} ocorrência(s) no caminho`
            : "Sem ocorrências no caminho"}
        </span>
      </div>
      {props.note && <p className="mt-1 text-xs text-muted-foreground">{props.note}</p>}
    </button>
  );
}
