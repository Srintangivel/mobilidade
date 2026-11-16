// Pure business rules for Mobilidade+ SP: points, rewards catalog and upload validation.

export type ReportCategory = "pothole" | "flood" | "lighting" | "accessibility";

export const REPORT_CATEGORIES: Record<
  ReportCategory,
  { label: string; short: string; emoji: string; points: number; description: string }
> = {
  pothole: {
    label: "Buraco na via",
    short: "Buraco",
    emoji: "🕳️",
    points: 50,
    description: "Buracos, asfalto cedendo, tampas soltas",
  },
  flood: {
    label: "Alagamento",
    short: "Alagamento",
    emoji: "🌊",
    points: 50,
    description: "Ruas alagadas ou com acúmulo de água",
  },
  lighting: {
    label: "Iluminação deficiente",
    short: "Iluminação",
    emoji: "💡",
    points: 30,
    description: "Postes apagados ou trechos escuros",
  },
  accessibility: {
    label: "Obstáculo de acessibilidade",
    short: "Acessibilidade",
    emoji: "♿",
    points: 40,
    description: "Calçadas quebradas, rampas bloqueadas",
  },
};

export const WELCOME_BONUS = 150;
export const TRIP_POINTS = 10;
export const CONFIRM_POINTS = 5;

export function pointsForReport(category: ReportCategory): number {
  return REPORT_CATEGORIES[category].points;
}

export type RewardBrand = "uber" | "spotify" | "ifood" | "transit" | "99";

export interface Reward {
  id: string;
  brand: RewardBrand;
  name: string;
  value: string;
  cost: number;
  description: string;
}

export const REWARDS: Reward[] = [
  {
    id: "bilhete-5",
    brand: "transit",
    name: "Bilhete Único",
    value: "R$ 5",
    cost: 300,
    description: "Crédito de recarga para ônibus, metrô e trem",
  },
  {
    id: "bilhete-20",
    brand: "transit",
    name: "Bilhete Único",
    value: "R$ 20",
    cost: 1100,
    description: "Crédito de recarga para ônibus, metrô e trem",
  },
  {
    id: "uber-20",
    brand: "uber",
    name: "Uber",
    value: "R$ 20",
    cost: 1400,
    description: "Gift card para viagens ou Uber Eats",
  },
  {
    id: "99-15",
    brand: "99",
    name: "99",
    value: "R$ 15",
    cost: 1000,
    description: "Crédito para corridas na 99",
  },
  {
    id: "ifood-25",
    brand: "ifood",
    name: "iFood",
    value: "R$ 25",
    cost: 1700,
    description: "Vale para pedidos no iFood",
  },
  {
    id: "spotify-1m",
    brand: "spotify",
    name: "Spotify Premium",
    value: "1 mês",
    cost: 1500,
    description: "Assinatura individual por 30 dias",
  },
];

export function canRedeem(balance: number, reward: Reward): boolean {
  return balance >= reward.cost;
}

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageValidation = { ok: true } | { ok: false; error: string };

export function validateImageFile(file: { type: string; size: number }): ImageValidation {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Formato não suportado. Use PNG, JPEG/JPG ou WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "A imagem passa de 5MB. Escolha um arquivo menor." };
  }
  return { ok: true };
}
