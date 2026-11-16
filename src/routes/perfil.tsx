import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Gift, LogOut, MapPinned, Route as RouteIcon, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { BrandCard } from "@/components/app/BrandCard";
import { SignInPrompt } from "@/components/app/AppHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { REPORT_CATEGORIES, REWARDS } from "@/lib/mobility/rules";
import { formatDistance, formatDuration } from "@/lib/mobility/routing";
import { signOut, useMobilityState, useSession } from "@/lib/mobility/store";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil · Mobilidade+ SP" },
      {
        name: "description",
        content: "Seu histórico de trajetos, reportes enviados, pontos acumulados e gift cards resgatados.",
      },
      { property: "og:title", content: "Meu perfil · Mobilidade+ SP" },
      { property: "og:description", content: "Trajetos, reportes, pontos e resgates no Mobilidade+ SP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const fmt = (t: number) => format(t, "dd 'de' MMM, HH:mm", { locale: ptBR });

function ProfilePage() {
  const { ready, user, profile } = useSession();
  const { reports } = useMobilityState();
  if (!ready) return null;
  if (!user || !profile)
    return (
      <SignInPrompt
        title="Seu perfil"
        text="Entre para acompanhar seus trajetos, reportes e pontos acumulados."
      />
    );

  const myReports = reports.filter((r) => r.userId === user.id);
  const stats = [
    { label: "Saldo atual", value: profile.points, icon: Sparkles, tone: "bg-signal text-signal-foreground" },
    { label: "Pontos acumulados", value: profile.earned, icon: Zap, tone: "bg-ink text-ink-foreground" },
    { label: "Reportes enviados", value: myReports.length, icon: MapPinned, tone: "bg-hazard text-hazard-foreground" },
    { label: "Resgates", value: profile.redemptions.length, icon: Gift, tone: "bg-safe text-safe-foreground" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl border-2 border-ink bg-signal text-display text-3xl font-extrabold text-signal-foreground">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex-1">
          <h1 className="text-display text-3xl font-extrabold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · membro desde {format(user.createdAt, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button variant="outline" onClick={() => signOut()}>
          <LogOut /> Sair
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-float">
            <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-4" />
            </span>
            <p className="text-display mt-3 text-3xl font-extrabold text-foreground">
              {value.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="trips" className="mt-10">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="trips">Deslocamentos ({profile.trips.length})</TabsTrigger>
          <TabsTrigger value="reports">Reportes ({myReports.length})</TabsTrigger>
          <TabsTrigger value="redemptions">Resgates ({profile.redemptions.length})</TabsTrigger>
          <TabsTrigger value="points">Extrato</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4 space-y-2">
          {profile.trips.length === 0 && (
            <Empty text="Nenhum trajeto ainda. Planeje uma rota no mapa e toque em Iniciar trajeto." />
          )}
          {profile.trips.map((t) => (
            <Row key={t.id}>
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${t.mode === "safe" ? "bg-safe text-safe-foreground" : "bg-signal text-signal-foreground"}`}
              >
                {t.mode === "safe" ? <ShieldCheck className="size-5" /> : <RouteIcon className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {t.from} → {t.to}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.mode === "safe" ? "Rota segura" : "Rota rápida"} · {formatDistance(t.distanceKm)} ·{" "}
                  {formatDuration(t.durationMin)} · {fmt(t.createdAt)}
                </p>
              </div>
              <Points amount={t.points} />
            </Row>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-2">
          {myReports.length === 0 && <Empty text="Você ainda não reportou nenhuma ocorrência." />}
          {myReports.map((r) => {
            const c = REPORT_CATEGORIES[r.category];
            return (
              <Row key={r.id}>
                {r.image ? (
                  <img src={r.image} alt={c.label} className="size-12 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-xl">
                    {c.emoji}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{c.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.description || "Sem descrição"} · {fmt(r.createdAt)} · {r.confirmations} confirmações
                  </p>
                </div>
                <Points amount={c.points} />
              </Row>
            );
          })}
        </TabsContent>

        <TabsContent value="redemptions" className="mt-4">
          {profile.redemptions.length === 0 ? (
            <Empty text="Nenhum resgate ainda. Visite o Clube de Benefícios." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.redemptions.map((r) => {
                const reward = REWARDS.find((x) => x.id === r.rewardId);
                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-3 shadow-float">
                    {reward && <BrandCard brand={reward.brand} name={r.name} value={r.value} />}
                    <p className="mt-3 rounded-lg bg-secondary px-3 py-2 font-mono text-sm font-bold tracking-wider text-foreground">
                      {r.code}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {r.cost.toLocaleString("pt-BR")} pts · {fmt(r.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="points" className="mt-4 space-y-2">
          {profile.ledger.map((e) => (
            <Row key={e.id}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{e.label}</p>
                <p className="text-xs text-muted-foreground">{fmt(e.createdAt)}</p>
              </div>
              <Points amount={e.amount} />
            </Row>
          ))}
        </TabsContent>
      </Tabs>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="signal" size="lg">
          <Link to="/">Abrir mapa</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/recompensas">Ver recompensas</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">{children}</div>
  );
}

function Points({ amount }: { amount: number }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${amount >= 0 ? "bg-signal text-signal-foreground" : "bg-secondary text-muted-foreground"}`}
    >
      {amount >= 0 ? "+" : ""}
      {amount.toLocaleString("pt-BR")} pts
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
