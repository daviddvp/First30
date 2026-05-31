import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "soft" | "ghost";
const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  soft: "bg-accent-soft text-accent-strong hover:bg-accent-soft",
  ghost: "bg-surface text-ink border border-border-strong hover:bg-subtle",
};

export function Button({
  children, variant = "primary", icon: Icon, onClick, type = "button",
}: {
  children: React.ReactNode;
  variant?: Variant;
  icon?: LucideIcon;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} onClick={onClick} className={cn(
      "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition",
      VARIANT[variant],
    )}>
      {Icon && <Icon size={15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}
