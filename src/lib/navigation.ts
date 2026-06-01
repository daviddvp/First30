import {
  LayoutDashboard, UserPlus, AlertTriangle, Users,
  CheckSquare, MessageSquare, FileText, Settings, Upload, type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Texto corto para el badge lateral (placeholder hasta tener datos). */
  badge?: string;
  tone?: "neutral" | "danger";
};

/** Fuente única de verdad de la navegación principal del producto. */
export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Nuevos socios", href: "/members", icon: UserPlus, badge: "8" },
  { label: "Socios en riesgo", href: "/risk", icon: AlertTriangle, badge: "3", tone: "danger" },
  { label: "Coaches", href: "/coaches", icon: Users },
  { label: "Tareas", href: "/tasks", icon: CheckSquare, badge: "8" },
  { label: "Mensajes", href: "/messages", icon: MessageSquare },
  { label: "Informe semanal", href: "/reports/weekly", icon: FileText },
  { label: "Importar socios", href: "/import/members", icon: Upload },
  { label: "Configuración", href: "/settings", icon: Settings },
];

/** Devuelve el item de navegación activo según la ruta actual. */
export function activeNav(pathname: string): NavItem | undefined {
  return [...NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
}
