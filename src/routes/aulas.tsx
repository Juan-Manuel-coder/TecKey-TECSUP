import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, DoorOpen, GraduationCap, Lock, ShieldCheck, TimerReset, User, Zap } from "lucide-react";

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
import {
  BLOCKS,
  DAYS,
  WEEKS,
  actions,
  liveStatus,
  minutesNow,
  professorName,
  scheduleEntry,
  todayIndex,
  useTeckey,
  type Block,
} from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aulas")({
  head: () => ({
    meta: [
      { title: "Aulas y Pabellones — TECKEY System" },
      {
        name: "description",
        content:
          "Matriz en tiempo real y cronograma semanal de los pabellones F y B con control de apertura RFID.",
      },
      { property: "og:title", content: "Aulas y Pabellones — TECKEY System" },
      {
        property: "og:description",
        content:
          "Matriz en tiempo real y cronograma semanal de los pabellones F y B con control de apertura RFID.",
      },
    ],
  }),
  component: AulasPage,
});

function useClock() {
  const [now, setNow] = useState(() => minutesNow());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(minutesNow());
      actions.tickLocks();
    }, 10_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function AulasPage() {
  const [tab, setTab] = useState<"matriz" | "cronograma">("matriz");
  const [week, setWeek] = useState(6);

  return (
    <div className="mx-auto max-w-[95rem] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Aulas y Pabellones</h2>
          <p className="text-sm text-muted-foreground">
            Gestión global de espacios: estado en vivo y cronograma del ciclo (Semanas 1 a 16).
          </p>
        </div>
        <div className="flex gap-3">
          <StatusPill status="ocupado" />
          <StatusPill status="programado" />
          <StatusPill status="disponible" />
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        <TabBtn active={tab === "matriz"} onClick={() => setTab("matriz")}>
          Matriz en Tiempo Real
        </TabBtn>
        <TabBtn active={tab === "cronograma"} onClick={() => setTab("cronograma")}>
          Cronograma y Disponibilidad
        </TabBtn>
      </div>

      {tab === "matriz" ? (
        <MatrizView week={week} />
      ) : (
        <CronogramaView week={week} setWeek={setWeek} />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-5 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ============================ MATRIZ EN TIEMPO REAL ============================ */

function MatrizView({ week }: { week: number }) {
  const { classrooms, professors, emergencies, locks } = useTeckey();
  const mins = useClock();
  const day = todayIndex();
  const [pav, setPav] = useState<"F" | "B">("F");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profId, setProfId] = useState("");

  const floors = useMemo(() => {
    const list = classrooms.filter((c) => c.pavilion === pav);
    return [1, 2, 3].map((f) => ({ floor: f, rooms: list.filter((c) => c.floor === f) }));
  }, [classrooms, pav]);

  const selected = classrooms.find((c) => c.id === selectedId);
  const live = selected ? liveStatus(emergencies, selected.id, week, day, mins) : null;
  const entryProf = professors.find((p) => p.id === live?.entry?.professorId);
  const lock = selectedId ? locks[selectedId] : undefined;

  const freeBlock: Block | undefined =
    BLOCKS.find((b) => mins >= b.start && mins < b.end) ?? BLOCKS.find((b) => b.start > mins);

  const openDoor = () => {
    if (!selected || !live?.block) return;
    actions.openClassroom(selected.id, live.entry?.professorId, live.block.end);
    toast.success(`Aula ${selected.id} en ABIERTO (Modo Clase)`, {
      description: "Puerta liberada para el libre tránsito de estudiantes durante la sesión.",
    });
  };

  const closeDoor = () => {
    if (!selected) return;
    actions.closeClassroom(selected.id, live?.entry?.professorId);
    toast.success(`Aula ${selected.id} cerrada con tarjeta del docente.`);
  };

  const grantNow = () => {
    if (!selected || !profId || !freeBlock) {
      toast.error("Seleccione un profesor");
      return;
    }
    actions.grantEmergencyBlock({
      classroomId: selected.id,
      week,
      day,
      blockIndex: freeBlock.index,
      professorId: profId,
      minutes: freeBlock.end - freeBlock.start,
    });
    toast.success("Permiso inmediato otorgado", {
      description: `Aula ${selected.id} habilitada ${freeBlock.label} (${freeBlock.end - freeBlock.start} min).`,
    });
    setSelectedId(null);
    setProfId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {(["F", "B"] as const).map((p) => (
            <TabBtn key={p} active={pav === p} onClick={() => setPav(p)}>
              Pabellón {p}
            </TabBtn>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {DAYS[day]} · {String(Math.floor(mins / 60)).padStart(2, "0")}:
          {String(mins % 60).padStart(2, "0")} · Semana {week}
        </p>
      </div>

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
              {rooms.map((room) => {
                const st = liveStatus(emergencies, room.id, week, day, mins).status;
                const open = locks[room.id];
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedId(room.id)}
                    className={cn(
                      "relative grid h-20 w-20 place-items-center rounded-full text-sm font-semibold ring-8 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
                      statusCircle[st],
                    )}
                    title={`${room.id} — ${st}`}
                  >
                    {room.number}
                    {open && (
                      <span className="absolute -bottom-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {open.state === "abierto" ? "ABIERTO" : "10 min"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent>
          {selected && live && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  Aula {selected.id}
                  <StatusPill status={live.status} />
                </DialogTitle>
                <DialogDescription>
                  Pabellón {selected.pavilion} · Piso {selected.floor} · {DAYS[day]}, Semana {week}
                </DialogDescription>
              </DialogHeader>

              {live.status !== "disponible" && live.entry ? (
                <div className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <Detail icon={GraduationCap} k="Curso" v={live.entry.course} />
                    <Detail icon={GraduationCap} k="Carrera" v={live.entry.career} />
                    <Detail icon={User} k="Profesor" v={entryProf ? professorName(entryProf) : "—"} />
                    <Detail icon={Clock} k="Horario" v={live.block?.label ?? "—"} />
                  </div>

                  <div
                    className={cn(
                      "rounded-lg border p-3 text-sm",
                      lock?.state === "abierto"
                        ? "border-scheduled/50 bg-scheduled/15"
                        : lock?.state === "tolerancia"
                          ? "border-available/60 bg-available/15"
                          : "border-border bg-secondary/60",
                    )}
                  >
                    {lock?.state === "abierto" ? (
                      <p className="flex items-center gap-2 font-medium">
                        <DoorOpen className="h-4 w-4" /> ABIERTO (Modo Clase) — puerta liberada hasta{" "}
                        {live.block?.label.split(" - ")[1]}.
                      </p>
                    ) : lock?.state === "tolerancia" ? (
                      <p className="flex items-center gap-2 font-medium">
                        <TimerReset className="h-4 w-4" /> Clase finalizada: tolerancia de 10 minutos. Si el
                        docente no cierra con su tarjeta, el sistema ejecuta el Cierre Automático.
                      </p>
                    ) : (
                      <p className="flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Puerta cerrada. Valide el ingreso con la tarjeta del
                        docente.
                      </p>
                    )}
                  </div>

                  {!lock ? (
                    <Button className="w-full" onClick={openDoor}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Validar Ingreso (Abrir Modo Clase)
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" onClick={closeDoor}>
                      <Lock className="mr-2 h-4 w-4" /> Cerrar con tarjeta del docente
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-available/50 bg-available/15 p-3 text-sm">
                    Bloque libre {freeBlock ? `(${freeBlock.label})` : ""}. El permiso se restringe a la
                    duración de este hueco.
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
                    <div className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-sm">
                      {freeBlock ? `${freeBlock.end - freeBlock.start} min · ${freeBlock.label}` : "Sin bloques disponibles hoy"}
                    </div>
                  </div>
                  <Button className="w-full" onClick={grantNow} disabled={!freeBlock}>
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

/* ============================ CRONOGRAMA Y DISPONIBILIDAD ============================ */

type Filter = "todos" | "ocupado" | "programado" | "disponible";

function CronogramaView({ week, setWeek }: { week: number; setWeek: (w: number) => void }) {
  const { classrooms, professors, emergencies } = useTeckey();
  const mins = useClock();
  const today = todayIndex();
  const [day, setDay] = useState(today);
  const [filter, setFilter] = useState<Filter>("todos");
  const [pav, setPav] = useState<"F" | "B">("F");
  const [cell, setCell] = useState<{ roomId: string; block: Block } | null>(null);
  const [profId, setProfId] = useState("");

  const isToday = day === today;

  const rooms = useMemo(() => {
    const list = classrooms.filter((c) => c.pavilion === pav);
    if (filter === "todos") return list;
    return list.filter((c) => liveStatus(emergencies, c.id, week, day, mins).status === filter);
  }, [classrooms, pav, filter, emergencies, week, day, mins]);

  const grant = () => {
    if (!cell || !profId) {
      toast.error("Seleccione un profesor");
      return;
    }
    actions.grantEmergencyBlock({
      classroomId: cell.roomId,
      week,
      day,
      blockIndex: cell.block.index,
      professorId: profId,
      minutes: cell.block.end - cell.block.start,
    });
    toast.success("Clase de emergencia habilitada", {
      description: `${cell.roomId} · ${DAYS[day]} Semana ${week} · ${cell.block.label} (${cell.block.end - cell.block.start} min).`,
    });
    setCell(null);
    setProfId("");
  };

  return (
    <div className="space-y-4">
      <div className="surface-card flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Semana del ciclo</Label>
          <Select value={String(week)} onValueChange={(v) => setWeek(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue>Semana {week}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {WEEKS.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  Semana {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Día</Label>
          <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue>{DAYS[day]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d, i) => (
                <SelectItem key={d} value={String(i)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Pabellón</Label>
          <div className="inline-flex rounded-xl border border-border bg-card p-1">
            {(["F", "B"] as const).map((p) => (
              <TabBtn key={p} active={pav === p} onClick={() => setPav(p)}>
                {p}
              </TabBtn>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Filtro rápido</Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["todos", "Todos"],
                ["ocupado", "🔴 Ocupadas"],
                ["programado", "🟢 Programadas"],
                ["disponible", "🟡 Disponibles Ahora"],
              ] as Array<[Filter, string]>
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === k
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-24 border-b border-border bg-secondary/80 p-2 text-left">
                Aula
              </th>
              {BLOCKS.map((b) => (
                <th key={b.index} className="border-b border-border bg-secondary/60 p-2 font-medium">
                  {b.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="sticky left-0 z-10 border-b border-border bg-card p-2 font-semibold">
                  {room.id}
                </td>
                {BLOCKS.map((b) => {
                  const entry = scheduleEntry(emergencies, room.id, week, day, b.index);
                  const current = isToday && mins >= b.start && mins < b.end;
                  const prof = professors.find((p) => p.id === entry?.professorId);
                  if (!entry) {
                    return (
                      <td key={b.index} className="border-b border-l border-border p-1 align-top">
                        <button
                          onClick={() => setCell({ roomId: room.id, block: b })}
                          className="h-full w-full rounded-md bg-available/25 p-2 text-left text-available-foreground/90 transition-colors hover:bg-available/45"
                        >
                          <span className="block font-medium">Disponible ({b.end - b.start} min)</span>
                          <span className="text-[10px] opacity-70">Clic para clase de emergencia</span>
                        </button>
                      </td>
                    );
                  }
                  return (
                    <td key={b.index} className="border-b border-l border-border p-1 align-top">
                      <div
                        className={cn(
                          "rounded-md p-2",
                          current
                            ? "bg-occupied text-occupied-foreground"
                            : "bg-scheduled text-scheduled-foreground",
                        )}
                      >
                        <span className="block font-semibold leading-tight">{entry.course}</span>
                        <span className="block text-[10px] opacity-90">
                          {prof ? professorName(prof) : "—"}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={BLOCKS.length + 1} className="p-8 text-center text-muted-foreground">
                  No hay aulas que coincidan con el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!cell} onOpenChange={(o) => !o && setCell(null)}>
        <DialogContent>
          {cell && (
            <>
              <DialogHeader>
                <DialogTitle>Habilitar Clase de Emergencia</DialogTitle>
                <DialogDescription>
                  Aula {cell.roomId} · {DAYS[day]}, Semana {week} · {cell.block.label}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                  <Label>Duración del permiso</Label>
                  <div className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-sm">
                    {cell.block.end - cell.block.start} min · exclusivo para {cell.block.label}
                  </div>
                </div>
                <Button className="w-full" onClick={grant}>
                  <Zap className="mr-2 h-4 w-4" /> Otorgar Permiso Inmediato
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ icon: Icon, k, v }: { icon: typeof User; k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {k}
      </span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
