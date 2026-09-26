import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Clock, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { actions, professorName, useTeckey } from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/solicitudes")({
  head: () => ({
    meta: [
      { title: "Solicitudes y Notificaciones — TECKEY System" },
      {
        name: "description",
        content: "Bandeja del administrador para aprobar o rechazar solicitudes de acceso especial.",
      },
      { property: "og:title", content: "Solicitudes y Notificaciones — TECKEY System" },
      {
        property: "og:description",
        content: "Bandeja del administrador para aprobar o rechazar solicitudes de acceso especial.",
      },
    ],
  }),
  component: SolicitudesPage,
});

function SolicitudesPage() {
  const { requests, professors } = useTeckey();
  const [tab, setTab] = useState<"pendiente" | "aprobada" | "rechazada">("pendiente");
  const rows = requests.filter((r) => r.status === tab);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Solicitudes y Notificaciones</h2>
        <p className="text-sm text-muted-foreground">
          Bandeja de entrada de accesos especiales solicitados por los docentes.
        </p>
      </div>

      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        {(
          [
            ["pendiente", "Pendientes"],
            ["aprobada", "Aprobadas"],
            ["rechazada", "Rechazadas"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-colors",
              tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label} ({requests.filter((r) => r.status === k).length})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {rows.map((r) => {
          const prof = professors.find((p) => p.id === r.professorId);
          return (
            <div key={r.id} className="surface-card flex flex-wrap items-start gap-4 p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {prof ? `${prof.nombres.charAt(0)}${prof.apellidos.charAt(0)}` : "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{prof ? professorName(prof) : "—"}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Aula {r.classroom}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {r.duration} · {r.requestedAt}
                  </span>
                </p>
                <p className="mt-2 rounded-lg border border-border bg-secondary/60 p-3 text-sm">
                  {r.reason}
                </p>
              </div>
              {r.status === "pendiente" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      actions.resolveRequest(r.id, "aprobada");
                      toast.success("Solicitud aprobada", { description: `Aula ${r.classroom}` });
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" /> Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      actions.resolveRequest(r.id, "rechazada");
                      toast.error("Solicitud rechazada", { description: `Aula ${r.classroom}` });
                    }}
                  >
                    <X className="mr-2 h-4 w-4" /> Rechazar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="surface-card p-10 text-center text-sm text-muted-foreground">
            No hay solicitudes en esta bandeja.
          </div>
        )}
      </div>
    </div>
  );
}
