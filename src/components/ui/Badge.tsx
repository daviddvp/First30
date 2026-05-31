import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-subtle-2 text-muted",
  success: "bg-accent-soft text-accent-strong",
  accent: "bg-accent-soft text-accent-strong",
  warning: "bg-warn-soft text-warn-strong",
  danger: "bg-danger-soft text-danger-strong",
  info: "bg-info-soft text-info-strong",
};
const DOT: Record<BadgeTone, string> = {
  neutral: "bg-faint", success: "bg-accent", accent: "bg-accent",
  warning: "bg-warn", danger: "bg-danger", info: "bg-info",
};

export function Badge({
  children, tone = "neutral", dot = true, className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap",
      TONE[tone], className,
    )}>
      {dot && <span className={cn("inline-block h-1.5 w-1.5 rounded-full", DOT[tone])} />}
      {children}
    </span>
  );
}
