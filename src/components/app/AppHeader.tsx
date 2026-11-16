import { Link } from "@tanstack/react-router";
import { Gift, LogOut, Map, Sparkles, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/mobility/store";

const NAV = [
  { to: "/", label: "Mapa", icon: Map },
  { to: "/recompensas", label: "Recompensas", icon: Gift },
  { to: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-signal text-lg font-black text-signal-foreground">
        M+
      </span>
      <span className="text-display hidden text-lg font-bold leading-none text-foreground sm:block">
        Mobilidade<span className="text-safe">+</span> SP
      </span>
    </Link>
  );
}

export function AppHeader() {
  const { ready, user, profile } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:px-5">
        <Logo />
        <nav className="ml-2 flex flex-1 items-center gap-1 sm:ml-6">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-ink data-[status=active]:text-ink-foreground sm:px-3"
            >
              <Icon className="size-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {!ready ? (
          <div className="h-9 w-24 animate-pulse rounded-lg bg-secondary" />
        ) : user && profile ? (
          <div className="flex items-center gap-2">
            <Link
              to="/recompensas"
              className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-signal px-3 py-1 text-sm font-bold text-signal-foreground"
            >
              <Sparkles className="size-4" />
              {profile.points.toLocaleString("pt-BR")}
              <span className="hidden sm:inline">pts</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="grid size-9 place-items-center rounded-full bg-ink text-sm font-bold text-ink-foreground"
                  aria-label="Menu da conta"
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil">
                    <UserRound /> Meu perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link to="/entrar">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

export function SignInPrompt({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
      <span className="route-stripe mb-6 h-3 w-24 rounded-full" />
      <h1 className="text-display text-3xl font-bold text-foreground">{title}</h1>
      <p className="mt-3 text-muted-foreground">{text}</p>
      <div className="mt-8 flex gap-3">
        <Button asChild variant="signal" size="xl">
          <Link to="/entrar">Entrar ou criar conta</Link>
        </Button>
      </div>
    </div>
  );
}
