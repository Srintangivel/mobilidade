import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import skyline from "@/assets/sp-skyline.jpg";
import { WELCOME_BONUS } from "@/lib/mobility/rules";
import { signIn, signUp } from "@/lib/mobility/store";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta · Mobilidade+ SP" },
      {
        name: "description",
        content: "Crie sua conta no Mobilidade+ SP para reportar problemas nas ruas e trocar pontos por gift cards.",
      },
      { property: "og:title", content: "Entrar ou criar conta · Mobilidade+ SP" },
      {
        property: "og:description",
        content: "Reporte problemas nas ruas de SP e troque pontos por gift cards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img
          src={skyline}
          alt="Ilustração de São Paulo com rotas iluminadas"
          width={1024}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-10 pt-32">
          <h2 className="text-display max-w-md text-4xl font-bold text-ink-foreground">
            Cada buraco reportado deixa a cidade um pouco melhor.
          </h2>
          <p className="mt-3 max-w-md text-ink-foreground/75">
            Planeje rotas mais seguras, avise a comunidade e troque seus pontos por Uber, Spotify,
            iFood e Bilhete Único.
          </p>
        </div>
      </div>

      <div className="bg-grid flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-float sm:p-8">
          <h1 className="text-display text-3xl font-bold text-foreground">Bem-vindo(a)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ganhe <strong className="text-foreground">{WELCOME_BONUS} pontos</strong> ao criar sua conta.
          </p>

          <Tabs defaultValue="signup" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
              <TabsTrigger value="signin">Entrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const password = String(f.get("password"));
                  if (password.length < 6) {
                    toast.error("A senha precisa ter pelo menos 6 caracteres.");
                    return;
                  }
                  run(
                    () =>
                      signUp({
                        name: String(f.get("name")),
                        email: String(f.get("email")),
                        password,
                      }),
                    `Conta criada! +${WELCOME_BONUS} pontos de boas-vindas`,
                  );
                }}
              >
                <Field id="su-name" name="name" label="Nome" autoComplete="name" />
                <Field id="su-email" name="email" label="E-mail" type="email" autoComplete="email" />
                <Field
                  id="su-password"
                  name="password"
                  label="Senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                />
                <Button type="submit" variant="signal" size="xl" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />} Criar conta
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  run(
                    () => signIn({ email: String(f.get("email")), password: String(f.get("password")) }),
                    "Que bom te ver de novo!",
                  );
                }}
              >
                <Field id="si-email" name="email" label="E-mail" type="email" autoComplete="email" />
                <Field
                  id="si-password"
                  name="password"
                  label="Senha"
                  type="password"
                  autoComplete="current-password"
                />
                <Button type="submit" size="xl" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />} Entrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-xs text-muted-foreground">
            Sua conta fica salva apenas neste navegador.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} required className="h-11 rounded-xl" {...props} />
    </div>
  );
}
