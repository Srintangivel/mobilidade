import { cn } from "@/lib/utils";
import type { RewardBrand } from "@/lib/mobility/rules";

export const BRAND_STYLE: Record<RewardBrand, string> = {
  uber: "bg-brand-uber text-brand-uber-foreground",
  spotify: "bg-brand-spotify text-brand-spotify-foreground",
  ifood: "bg-brand-ifood text-brand-ifood-foreground",
  transit: "bg-brand-transit text-brand-transit-foreground",
  "99": "bg-brand-99 text-brand-99-foreground",
};

export function BrandCard({
  brand,
  name,
  value,
  className,
}: {
  brand: RewardBrand;
  name: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[1.6] flex-col justify-between overflow-hidden rounded-2xl p-4",
        BRAND_STYLE[brand],
        className,
      )}
    >
      <span className="absolute -right-8 -top-8 size-28 rounded-full bg-current opacity-10" />
      <span className="absolute -bottom-10 right-6 size-20 rounded-full bg-current opacity-10" />
      <span className="text-display text-xl font-extrabold">{name}</span>
      <div className="flex items-end justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest opacity-75">Gift card</span>
        <span className="text-display text-3xl font-extrabold">{value}</span>
      </div>
    </div>
  );
}
