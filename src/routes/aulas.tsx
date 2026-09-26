import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, GraduationCap, User, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill, statusCircle } from "@/components/teckey/StatusBadge";
import { actions, professorName, useTeckey, type Classroom } from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aulas")({
  head: () => ({
    meta: [
      { title: "Aulas y Pabellones — TECKEY System" },
      {
        name: "description",
        content: "Mapa visual de los pabellones F y B con el estado de cada aula piso por piso.",
      },
      { property: "og:title", content: "Aulas y Pabellones — TECKEY System" },
      {
        property: "og:description",
        content: "Mapa visual de los pabellones F y B con el estado de cada aula piso por piso.",
      },
    ],
  }),
  component: AulasPage,
});

function AulasPage() {
  const { classrooms, professors } = useTeckey();
  const [pav, setPav] = useState<"F" | "B">("F");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profId, setProfId] = useState("");
  const [duration, setDuration] = useState("40min");

  const floors = useMemo(() => {
    const list = classrooms.filter((c) => c.pavilion === pav);
    return [1, 2, 3].map((f) => ({ floor: f, rooms: list.filter((c) => c.floor === f) }));
  }, [classrooms, pav]);

  const selected: Classroom | undefined = classrooms.find((c) => c.id === selectedId);
  const prof = professors.find((p) => p.id === selected?.professorId);

  const grant = () => {
    if (!selected || !profId) {
      toast.error("Seleccione un profesor");
      return;
    }
    actions.grantEmergency(selected.id, profId, duration);
    toast.success("Permiso inmediato otorgado", {
      description: `Aula ${selected.id} habilitada por ${duration}.`,
    });
    setSelectedId(null);
    setProfId("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Aulas y Pabellones</h2>
          <p className="text-sm text-muted-foreground">
            Gestión global de espacios. Haga clic en un aula para ver su detalle.
          </p>
        </div>
        <div className="flex gap-3">
          <StatusPill status="ocupado" />
          <StatusPill status="programado" />
          <StatusPill status="disponible" />
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        {(["F", "B"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPav(p)}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-colors",
              pav === p
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pabellón {p}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {floors
          .slice()
          .reverse()
          .map(({ floor, rooms }) => (
            <div key={floor} className="surface-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-5 py-3">
                <p className="text-sm font-semibold">Piso {floor}</p>
                <p className="text-xs text-muted-foreground">{rooms.length} aulas</p>
              </div>
              <div className="flex flex-wrap gap-4 p-6">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedId(room.id)}
                    className={cn(
                      "grid h-20 w-20 place-items-center rounded-full text-sm font-semibold ring-8 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
                      statusCircle[room.status],
                    )}
                    title={`${pav}${room.number}`}
                  >
                    {room.number}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  Aula {selected.id}
                  <StatusPill status={selected.status} />
                </DialogTitle>
                <DialogDescription>
                  Pabellón {selected.pavilion} · Piso {selected.floor}
                </DialogDescription>
              </DialogHeader>

              {selected.status !== "disponible" ? (
                <div className="space-y-3 text-sm">
                  <Detail icon={GraduationCap} k="Curso" v={selected.course!} />
                  <Detail icon={GraduationCap} k="Carrera" v={selected.career!} />
                  <Detail icon={User} k="Profesor" v={prof ? professorName(prof) : "—"} />
                  <Detail icon={Clock} k="Horario" v={selected.time!} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-available/50 bg-available/15 p-3 text-sm">
                    Espacio libre. Puede habilitar una clase de emergencia.
                  </div>
                  <div className="space-y-2">
                    <Label>Profesor</Label>
                    <Select value={profId} onValueChange={setProfId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un profesor" />
                      </SelectTrigger>
                      <SelectContent>
                        {professors.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {professorName(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duración</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="40min">40 min</SelectItem>
                        <SelectItem value="1h 40min">1h 40min</SelectItem>
                        <SelectItem value="2h 40min">2h 40min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={grant}>
                    <Zap className="mr-2 h-4 w-4" /> Otorgar Permiso Inmediato
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  icon: Icon,
  k,
  v,
}: {
  icon: typeof User;
  k: string;
  v: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {k}
      </span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
