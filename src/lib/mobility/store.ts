// Local-first store for Mobilidade+ SP. Everything persists in localStorage so the
// app works with static hosting and keeps the user signed in across reloads.
import { useSyncExternalStore } from "react";
import {
  CONFIRM_POINTS,
  REPORT_CATEGORIES,
  REWARDS,
  TRIP_POINTS,
  WELCOME_BONUS,
  canRedeem,
  pointsForReport,
  type ReportCategory,
} from "./rules";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export interface Trip {
  id: string;
  from: string;
  to: string;
  mode: "fast" | "safe";
  distanceKm: number;
  durationMin: number;
  points: number;
  createdAt: number;
}

export interface Redemption {
  id: string;
  rewardId: string;
  name: string;
  value: string;
  cost: number;
  code: string;
  createdAt: number;
}

export interface PointsEntry {
  id: string;
  label: string;
  amount: number;
  createdAt: number;
}

export interface Profile {
  points: number;
  earned: number;
  trips: Trip[];
  redemptions: Redemption[];
  ledger: PointsEntry[];
  confirmed: string[];
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  category: ReportCategory;
  description: string;
  lat: number;
  lng: number;
  image?: string | undefined;
  createdAt: number;
  confirmations: number;
}

interface State {
  ready: boolean;
  users: User[];
  sessionUserId: string | null;
  profiles: Record<string, Profile>;
  reports: Report[];
}

const STORAGE_KEY = "mobilidade-sp:v1";

const SERVER_STATE: State = {
  ready: false,
  users: [],
  sessionUserId: null,
  profiles: {},
  reports: [],
};

let state: State = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function seedReports(): Report[] {
  const now = Date.now();
  const h = 3600_000;
  const base = { userId: "seed", userName: "Equipe Mobilidade+", confirmations: 3 };
  return [
    { ...base, id: "seed-1", category: "pothole", description: "Buraco grande na faixa da direita, perto do semáforo.", lat: -23.5596, lng: -46.6584, createdAt: now - 5 * h },
    { ...base, id: "seed-2", category: "flood", description: "Ponto de alagamento recorrente em dias de chuva forte.", lat: -23.5262, lng: -46.6663, createdAt: now - 26 * h, confirmations: 7 },
    { ...base, id: "seed-3", category: "lighting", description: "Três postes apagados no trecho próximo à praça.", lat: -23.5455, lng: -46.6418, createdAt: now - 9 * h },
    { ...base, id: "seed-4", category: "accessibility", description: "Rampa de acesso bloqueada por entulho.", lat: -23.5562, lng: -46.6352, createdAt: now - 2 * h, confirmations: 1 },
    { ...base, id: "seed-5", category: "pothole", description: "Asfalto cedendo na ciclofaixa.", lat: -23.5672, lng: -46.6905, createdAt: now - 50 * h },
    { ...base, id: "seed-6", category: "lighting", description: "Viela escura, evitar à noite.", lat: -23.5568, lng: -46.6868, createdAt: now - 12 * h, confirmations: 4 },
    { ...base, id: "seed-7", category: "flood", description: "Água acumulada sob o viaduto.", lat: -23.5409, lng: -46.6168, createdAt: now - 30 * h },
  ];
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Omit<State, "ready">;
      state = { ...SERVER_STATE, ...parsed, ready: true };
      return;
    }
  } catch {
    // corrupted storage: start fresh
  }
  state = { ...SERVER_STATE, ready: true, reports: seedReports() };
  persist(state);
}

function persist(next: State) {
  const { ready: _ready, ...data } = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function commit(updater: (s: State) => State) {
  load();
  const next = updater(state);
  try {
    persist(next);
  } catch {
    throw new Error(
      "O armazenamento do navegador está cheio. Remova alguns reportes com foto e tente novamente.",
    );
  }
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return SERVER_STATE;
}

export function useMobilityState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const emptyProfile = (): Profile => ({
  points: 0,
  earned: 0,
  trips: [],
  redemptions: [],
  ledger: [],
  confirmed: [],
});

export function useSession() {
  const s = useMobilityState();
  const user = s.users.find((u) => u.id === s.sessionUserId) ?? null;
  const profile = user ? (s.profiles[user.id] ?? emptyProfile()) : null;
  return { ready: s.ready, user, profile };
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(`mobilidade-sp:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const uid = () => crypto.randomUUID();

function award(profile: Profile, amount: number, label: string): Profile {
  return {
    ...profile,
    points: profile.points + amount,
    earned: amount > 0 ? profile.earned + amount : profile.earned,
    ledger: [{ id: uid(), label, amount, createdAt: Date.now() }, ...profile.ledger],
  };
}

function updateProfile(userId: string, fn: (p: Profile) => Profile) {
  commit((s) => ({
    ...s,
    profiles: { ...s.profiles, [userId]: fn(s.profiles[userId] ?? emptyProfile()) },
  }));
}

function requireUser(): User {
  load();
  const user = state.users.find((u) => u.id === state.sessionUserId);
  if (!user) throw new Error("Entre na sua conta para continuar.");
  return user;
}

export async function signUp(input: { name: string; email: string; password: string }) {
  load();
  const email = input.email.trim().toLowerCase();
  if (state.users.some((u) => u.email === email)) {
    throw new Error("Já existe uma conta com este e-mail.");
  }
  const user: User = {
    id: uid(),
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    createdAt: Date.now(),
  };
  commit((s) => ({
    ...s,
    users: [...s.users, user],
    sessionUserId: user.id,
    profiles: {
      ...s.profiles,
      [user.id]: award(emptyProfile(), WELCOME_BONUS, "Bônus de boas-vindas"),
    },
  }));
  return user;
}

export async function signIn(input: { email: string; password: string }) {
  load();
  const email = input.email.trim().toLowerCase();
  const user = state.users.find((u) => u.email === email);
  const hash = await hashPassword(input.password);
  if (!user || user.passwordHash !== hash) {
    throw new Error("E-mail ou senha incorretos.");
  }
  commit((s) => ({ ...s, sessionUserId: user.id }));
  return user;
}

export function signOut() {
  commit((s) => ({ ...s, sessionUserId: null }));
}

export function addReport(input: {
  category: ReportCategory;
  description: string;
  lat: number;
  lng: number;
  image?: string | undefined;
}) {
  const user = requireUser();
  const points = pointsForReport(input.category);
  const report: Report = {
    id: uid(),
    userId: user.id,
    userName: user.name,
    confirmations: 0,
    createdAt: Date.now(),
    ...input,
  };
  commit((s) => ({
    ...s,
    reports: [report, ...s.reports],
    profiles: {
      ...s.profiles,
      [user.id]: award(
        s.profiles[user.id] ?? emptyProfile(),
        points,
        `Reporte: ${REPORT_CATEGORIES[input.category].short}`,
      ),
    },
  }));
  return { report, points };
}

export function deleteReport(reportId: string) {
  const user = requireUser();
  commit((s) => ({
    ...s,
    reports: s.reports.filter((r) => !(r.id === reportId && r.userId === user.id)),
  }));
}

export function confirmReport(reportId: string) {
  const user = requireUser();
  const report = state.reports.find((r) => r.id === reportId);
  if (!report) throw new Error("Ocorrência não encontrada.");
  if (report.userId === user.id) throw new Error("Você não pode confirmar o próprio reporte.");
  const profile = state.profiles[user.id] ?? emptyProfile();
  if (profile.confirmed.includes(reportId)) throw new Error("Você já confirmou esta ocorrência.");
  commit((s) => ({
    ...s,
    reports: s.reports.map((r) =>
      r.id === reportId ? { ...r, confirmations: r.confirmations + 1 } : r,
    ),
    profiles: {
      ...s.profiles,
      [user.id]: {
        ...award(profile, CONFIRM_POINTS, "Confirmação de ocorrência"),
        confirmed: [...profile.confirmed, reportId],
      },
    },
  }));
  return CONFIRM_POINTS;
}

export function recordTrip(input: Omit<Trip, "id" | "createdAt" | "points">) {
  const user = requireUser();
  const trip: Trip = { ...input, id: uid(), createdAt: Date.now(), points: TRIP_POINTS };
  updateProfile(user.id, (p) => ({
    ...award(p, TRIP_POINTS, `Trajeto até ${input.to}`),
    trips: [trip, ...p.trips],
  }));
  return trip;
}

function makeCode(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${prefix}-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function redeemReward(rewardId: string) {
  const user = requireUser();
  const reward = REWARDS.find((r) => r.id === rewardId);
  if (!reward) throw new Error("Recompensa indisponível.");
  const profile = state.profiles[user.id] ?? emptyProfile();
  if (!canRedeem(profile.points, reward)) throw new Error("Pontos insuficientes.");
  const redemption: Redemption = {
    id: uid(),
    rewardId: reward.id,
    name: reward.name,
    value: reward.value,
    cost: reward.cost,
    code: makeCode(reward.brand.toUpperCase().slice(0, 3)),
    createdAt: Date.now(),
  };
  updateProfile(user.id, (p) => ({
    ...award(p, -reward.cost, `Resgate: ${reward.name} ${reward.value}`),
    redemptions: [redemption, ...p.redemptions],
  }));
  return redemption;
}
