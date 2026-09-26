import { createFileRoute } from "@tanstack/react-router";
import {
  DoorOpen,
  Users,
  CreditCard,
  ShieldAlert,
  Clock,
  MapPin,
  Inbox,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/teckey/StatusBadge";
import { actions, professorName, useTeckey, type RequestItem } from "@/lib/teckey-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TECKEY System" },
      {
        name: "description",
        content: "Panel general de aulas ocupadas, profesores activos, tarjetas RFID y alertas de acceso.",
      },
      { property: "og:title", content: "Dashboard — TECKEY System" },
      {
        property: "og:description",
        content: "Panel general de aulas ocupadas, profesores activos, tarjetas RFID y alertas de acceso.",
      },
    ],
  }),
  component: Dashboard,
});

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { classrooms, professors, cards, requests } = useTeckey();
  const [selected, setSelected] = useState<RequestItem | null>(null);

  const occupied = classrooms.filter((c) => c.status === "ocupado");
  const assigned = cards.filter((c) => c.professorId).length;
  const pending = requests.filter((r) => r.status === "pendiente");
  const active = classrooms.filter((c) => c.status !== "disponible");

  const resolve = (status: "aprobada" | "rechazada") => {
    if (!selected) return;
    actions.resolveRequest(selected.id, status);
    toast[status === "aprobada" ? "success" : "error"](
      status === "aprobada" ? "Solicitud aprobada" : "Solicitud rechazada",
      { description: `Aula ${selected.classroom}` },
    );
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Estado general del sistema en tiempo real.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Aulas ocupadas hoy"
          value="14/40"
          hint="Pabellones F y B"
          icon={DoorOpen}
          tone="bg-occupied/12 text-occupied"
        />
        <MetricCard
          label="Profesores activos"
          value="45"
          hint={`${professors.length} registrados en el sistema`}
          icon={Users}
          tone="bg-primary/12 text-primary"
        />
        <MetricCard
          label="Tarjetas RFID asignadas"
          value="42"
          hint={`${assigned} vinculadas en esta vista`}
          icon={CreditCard}
          tone="bg-scheduled/15 text-scheduled"
        />
        <MetricCard
          label="Alertas de acceso denegado"
          value="3"
          hint="Últimas 24 horas"
          icon={ShieldAlert}
          tone="bg-available/25 text-available-foreground"
        />
      </div>

      <section className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Estado en vivo por pabellón</h3>
            <p className="text-sm text-muted-foreground">Clases en curso y programadas para hoy.</p>
          </div>
          <div className="flex gap-3 text-xs">
            <StatusPill status="ocupado" />
            <StatusPill status="programado" />
            <StatusPill status="disponible" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {active.slice(0, 8).map((c) => {
            const prof = professors.find((p) => p.id === c.professorId);
            return (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4"
              >
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                    c.status === "ocupado"
                      ? "bg-occupied text-occupied-foreground"
                      : "bg-scheduled text-scheduled-foreground"
                  }`}
                >
                  {c.id}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.course}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {prof ? professorName(prof) : "—"} · {c.career}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <Clock className="h-3.5 w-3.5" />
                  {c.time}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold tracking-tight">Solicitudes de acceso especial</h3>
          <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
            {pending.length} pendientes
          </span>
        </div>

        <ul className="mt-4 divide-y divide-border">
          {pending.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground">No hay solicitudes pendientes.</li>
          )}
          {pending.map((r) => {
            const prof = professors.find((p) => p.id === r.professorId);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{prof ? professorName(prof) : "—"}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Aula {r.classroom}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {r.duration} · {r.requestedAt}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{r.reason}</p>
                </div>
                <Button onClick={() => setSelected(r)}>Ver y Responder</Button>
              </li>
            );
          })}
        </ul>
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitud de acceso especial</DialogTitle>
            <DialogDescription>Revise el detalle antes de otorgar el permiso.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row
                k="Profesor"
                v={professorName(professors.find((p) => p.id === selected.professorId)!)}
              />
              <Row k="Aula solicitada" v={selected.classroom} />
              <Row k="Duración" v={selected.duration} />
              <Row k="Recibida" v={selected.requestedAt} />
              <div className="rounded-lg border border-border bg-secondary/60 p-3 text-sm">
                {selected.reason}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => resolve("rechazada")}>
              Rechazar
            </Button>
            <Button onClick={() => resolve("aprobada")}>Aprobar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
