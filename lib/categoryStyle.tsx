import {
  Baby,
  Book,
  Briefcase,
  Bus,
  Car,
  Coffee,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Music,
  PawPrint,
  Phone,
  Plane,
  PiggyBank,
  Receipt,
  Repeat,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Users,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Colori e icone delle categorie (migrazione 017 del server, 13/11/2026). Stesso elenco del server
 * (`utils/categoryStyle.js`): se ne aggiungi uno qui, aggiungilo anche li'.
 *
 * Una categoria senza colore scelto ne prende uno stabile ricavato dall'id, cosi' i grafici restano
 * leggibili anche prima che l'utente scelga; senza icona usa l'etichetta generica.
 */
export const CATEGORY_COLORS = {
  slate: "#64748b",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  green: "#16a34a",
  teal: "#0d9488",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  pink: "#ec4899",
} as const;
export type CategoryColor = keyof typeof CATEGORY_COLORS;

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tag: Tag,
  "shopping-cart": ShoppingCart,
  utensils: Utensils,
  coffee: Coffee,
  car: Car,
  fuel: Fuel,
  bus: Bus,
  plane: Plane,
  home: House,
  zap: Zap,
  wifi: Wifi,
  phone: Phone,
  repeat: Repeat,
  "heart-pulse": HeartPulse,
  dumbbell: Dumbbell,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  gift: Gift,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  wallet: Wallet,
  "piggy-bank": PiggyBank,
  receipt: Receipt,
  landmark: Landmark,
  "gamepad-2": Gamepad2,
  music: Music,
  book: Book,
  "paw-print": PawPrint,
  baby: Baby,
  users: Users,
  wrench: Wrench,
  sparkles: Sparkles,
};

/** Colori usati quando non c'e' una scelta: niente grigio, che resta per "Other". */
const AUTO: CategoryColor[] = ["sky", "orange", "violet", "teal", "pink", "amber", "blue", "red", "green"];

type Styled = { id?: string | number; name?: unknown; color?: unknown; icon?: unknown };

/** Il colore della categoria in esadecimale: quello scelto o uno stabile dall'id. */
export function categoryHex(category: Styled | undefined | null): string {
  const chosen = typeof category?.color === "string" ? category.color : "";
  if (chosen in CATEGORY_COLORS) return CATEGORY_COLORS[chosen as CategoryColor];
  // la categoria di ripiego ("Altro" / "Other") resta grigia anche senza una scelta
  const name = typeof category?.name === "string" ? category.name.trim().toLowerCase() : "";
  if (name === "altro" || name === "other") return CATEGORY_COLORS.slate;
  const seed = Number(category?.id ?? 0) || 0;
  return CATEGORY_COLORS[AUTO[Math.abs(seed) % AUTO.length]];
}

export function categoryIcon(category: Styled | undefined | null): LucideIcon {
  const chosen = typeof category?.icon === "string" ? category.icon : "";
  return CATEGORY_ICONS[chosen] ?? Tag;
}

/** Icona della categoria in un riquadro tinto del suo colore. */
export function CategoryAvatar({
  category,
  size = "md",
  className,
}: {
  category: Styled | undefined | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = categoryIcon(category);
  const hex = categoryHex(category);
  const box = size === "sm" ? "h-7 w-7 rounded-lg" : size === "lg" ? "h-11 w-11 rounded-xl" : "h-9 w-9 rounded-xl";
  const glyph = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", box, className)}
      style={{ backgroundColor: `${hex}1f`, color: hex }}
      aria-hidden="true"
    >
      <Icon className={glyph} />
    </span>
  );
}
