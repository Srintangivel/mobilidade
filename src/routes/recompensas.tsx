import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BrandCard } from "@/components/app/BrandCard";
import { SignInPrompt } from "@/components/app/AppHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { REPORT_CATEGORIES, REWARDS, TRIP_POINTS, canRedeem, type Reward } from "@/lib/mobility/rules";
import { redeemReward, useSession, type Redemption } from "@/lib/mobility/store";

export const Route = createFileRoute("/recompensas")({
  head: () => ({
    meta: [
      { title: "Clube de Benefícios · Mobilidade+ SP" },
      {
        name: "description",
        content: "Troque seus pontos por gift cards de Uber, Spotify, iFood, 99 e créditos de Bilhete Único.",
      },
      { property: "og:title", content: "Clube de Benefícios · Mobilidade+ SP" },
      {
        property: "og:description",
        content: "Troque pontos por gift cards de Uber, Spotify, iFood e Bilhete Único.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { ready, user, profile } = useSession();
  const [pending, setPending] = useState<Reward | null>(null);
  const [result, setResult] = useState<Redemption | null>(null);

  if (!ready) return null;
  if (!user || !profile)
    return (
      <SignInPrompt
        title="Clube de Benefícios"
        text="Entre na sua conta para ver seu saldo e trocar pontos por gift cards."
      />
    );

  const confirm = () => {
    if (!pending) return;
    try {
      setResult(redeemReward(pending.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível resgatar.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-safe">Clube de Benefícios</p>
          <h1 className="text-display mt-2 text-4xl font-extrabold text-foreground sm:text-5xl">
            Resgatar recompensas
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Reporte ocorrências, confirme avisos e registre trajetos. Cada ação vira pontos que você
            troca por gift cards.
          </p>
        </div>
        <div className="rounded-3xl border-2 border-ink bg-signal p-5 text-signal-foreground shadow-pop">
          <p className="text-xs font-bold uppercase tracking-widest">Seu saldo</p>
          <p className="text-display mt-1 flex items-center gap-2 text-5xl font-extrabold">
            <Sparkles className="size-8" />
            {profile.points.toLocaleString("pt-BR")}
          </p>
          <p className="mt-1 text-sm font-semibold">
            {profile.earned.toLocaleString("pt-BR")} pontos acumulados no total
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {Object.values(REPORT_CATEGORIES).map((c) => (
          <span key={c.label} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
            {c.emoji} {c.short} <span className="text-safe">+{c.points}</span>
          </span>
        ))}
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
          🧭 Trajeto <span className="text-safe">+{TRIP_POINTS}</span>
        </span>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
          ✅ Confirmar ocorrência <span className="text-safe">+5</span>
        </span>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REWARDS.map((r) => {
          const ok = canRedeem(profile.points, r);
          const pct = Math.min(100, (profile.points / r.cost) * 100);
          return (
            <article key={r.id} className="flex flex-col rounded-3xl border border-border bg-card p-4 shadow-float">
              <BrandCard brand={r.brand} name={r.name} value={r.value} />
              <div className="mt-4 flex-1">
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-display text-2xl font-bold text-foreground">
                    {r.cost.toLocaleString("pt-BR")} <span className="text-sm font-semibold">pts</span>
                  </span>
                  {!ok && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      faltam {(r.cost - profile.points).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
                <Progress value={pct} className="mt-2 h-1.5" />
              </div>
              <Button
                className="mt-4 w-full"
                size="lg"
                variant={ok ? "signal" : "secondary"}
                disabled={!ok}
                onClick={() => setPending(r)}
              >
                {ok ? "Resgatar" : "Pontos insuficientes"}
              </Button>
            </article>
          );
        })}
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Resgatar {pending?.name} {pending?.value}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.cost.toLocaleString("pt-BR")} pontos serão descontados do seu saldo. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Confirmar resgate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RedeemedDialog redemption={result} onClose={() => setResult(null)} />
    </div>
  );
}

export function RedeemedDialog({ redemption, onClose }: { redemption: Redemption | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const reward = REWARDS.find((r) => r.id === redemption?.rewardId);
  return (
    <Dialog open={redemption !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-display text-2xl">Resgate concluído! 🎉</DialogTitle>
          <DialogDescription>Use o código abaixo no app parceiro. Ele também fica salvo no seu perfil.</DialogDescription>
        </DialogHeader>
        {redemption && reward && (
          <div className="space-y-4">
            <BrandCard brand={reward.brand} name={reward.name} value={reward.value} />
            <button
              onClick={() => {
                navigator.clipboard?.writeText(redemption.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex w-full items-center justify-between rounded-xl border-2 border-dashed border-ink bg-secondary px-4 py-3 font-mono text-lg font-bold tracking-wider text-foreground"
            >
              {redemption.code}
              {copied ? <Check className="size-5 text-safe" /> : <Copy className="size-5" />}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
