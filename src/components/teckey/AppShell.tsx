import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Building2,
  LayoutDashboard,
  Users,
  ScrollText,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTeckey } from "@/lib/teckey-store";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/aulas", label: "Aulas y Pabellones", icon: Building2 },
  { to: "/profesores", label: "Gestión de Profesores", icon: Users },
  { to: "/tarjetas", label: "Tarjetas RFID", icon: CreditCard },
  { to: "/solicitudes", label: "Solicitudes y Notificaciones", icon: ClipboardList },
  { to: "/logs", label: "Registro de Accesos", icon: ScrollText },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--color-scheduled)]"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-wide text-sidebar-accent-foreground">TECKEY</p>
        <p className="text-xs text-sidebar-foreground/70">Control de acceso RFID</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { requests } = useTeckey();
  const pending = requests.filter((r) => r.status === "pendiente").length;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-sidebar lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto p-4 text-xs text-sidebar-foreground/60">
          Semestre 2026-II · v1.0
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navegación</SheetTitle>
                <Brand />
                <NavList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="mr-auto">
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">TECKEY System</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Gestión global de pabellones y accesos
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground md:flex">
              <CalendarDays className="h-4 w-4 text-primary" />
              Sábado, 26 de Septiembre de 2026
            </div>

            <Select defaultValue="6">
              <SelectTrigger className="w-[190px] bg-card text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                  Semestre 2026-II: Ago 17 - Dic 05
                </div>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    Semana {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link to="/solicitudes" className="relative">
              <Button variant="ghost" size="icon" aria-label="Alertas pendientes">
                <Bell className="h-5 w-5" />
              </Button>
              {pending > 0 && (
                <span className="pointer-events-none absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
                  {pending}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                AD
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-semibold">Admin Central</p>
                <p className="text-[11px] text-muted-foreground">Oficina de Servicios</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
