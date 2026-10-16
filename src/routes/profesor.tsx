import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Bell, CalendarPlus, LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { setSession, useSession } from "@/lib/auth";
import {
  actions,
  BLOCKS,
  CURRENT_WEEK,
  DAYS,
  gapMinutes,
  minutesNow,
  professorName,
  profSchedule,
  scheduleEntry,
  todayIndex,
  useTeckey,
  WEEKS,
} from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profesor")({
  head: () => ({
    meta: [
      { title: "Mi Horario — TECKEY System" },
      { name: "description", content: "Horario semanal del docente, solicitudes de recuperación y apertura por contingencia." },
      { property: "og:title", content: "Mi Horario — TECKEY System" },
      { property: "og:description", content: "Horario semanal del docente, solicitudes de recuperación y apertura por contingencia." },
    ],
  }),
  component: ProfesorPage,
});

function useMinutes() {
  const [m, setM] = useState(minutesNow());
  useEffect(() => {
    const t = setInterval(() => setM(minutesNow()), 15_000);
    return () => clearInterval(t);
  }, []);
  return m;
}

function ProfesorPage() {
  const { session } = useSession();
  const { professors, emergencies, classrooms, requests, notifications } = useTeckey();
  const navigate = useNavigate();
  const mins = useMinutes();
  const today = todayIndex();
  const [week, setWeek] = useState(CURRENT_WEEK);
  const [recOpen, setRecOpen] = useState(false);
  const [conOpen, setConOpen] = useState(false);

  const profId = session?.role === "profesor" ? session.professorId : "";
  const prof = professors.find((p) => p.id === profId);
  const base = useMemo(() => (profId ? profSchedule(profId) : {}), [profId]);

  const cell = (d: number, b: number) => {
    const em = emergencies.find((e) => e.professorId === profId && e.week === week && e.day === d && e.blockIndex === b);
    if (em) return { classroomId: em.classroomId, course: "Recuperación / Emergencia", career: `${em.minutes} min`, extra: true };
    const s = base[`${d}-${b}`];
    return s ? { ...s, extra: false } : null;
  };

  // Clases activas ahora (con 10 min de anticipación)
  const active = BLOCKS.filter((b) => mins >= b.start - 10 && mins < b.end)
    .map((b) => ({ block: b, slot: (() => {
      const em = emergencies.find((e) => e.professorId === profId && e.week === CURRENT_WEEK && e.day === today && e.blockIndex === b.index);
      if (em) return { classroomId: em.classroomId, course: "Recuperación / Emergencia" };
      return base[`${today}-${b.index}`];
    })() }))
    .filter((x) => x.slot);

  const myRequests = requests.filter((r) => r.professorId === profId);
  const myNotifs = notifications.filter((n) => n.audience === "profesor" && n.professorId === profId);

  if (!prof) return null;

  const logout = () => {
    setSession(null);
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="mr-auto leading-tight">
            <p className="text-sm font-semibold text-sidebar-accent-foreground">TECKEY · Portal Docente</p>
            <p className="text-xs text-sidebar-foreground/70">{professorName(prof)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="mr-auto">
            <h2 className="text-2xl font-semibold tracking-tight">Horario Semanal de Clases</h2>
            <p className="text-sm text-muted-foreground">Lunes a Sábado · Semestre 2026-II</p>
          </div>
          <Select value={String(week)} onValueChange={(v) => setWeek(Number(v))}>
            <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEEKS.map((w) => <SelectItem key={w} value={String(w)}>Semana {w}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="lg" className="bg-scheduled text-scheduled-foreground hover:bg-scheduled/90" onClick={() => setRecOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Solicitar Aula de Recuperación
          </Button>
          <Button size="lg" variant="destructive" onClick={() => setConOpen(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" /> Apertura por Contingencia (Fallo de Huella)
          </Button>
        </div>

        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-28 border-b border-border p-2 text-left text-muted-foreground">Bloque</th>
                {DAYS.map((d, i) => (
                  <th key={d} className={cn("border-b border-border p-2 text-left", week === CURRENT_WEEK && i === today && "text-primary")}>
                    {d}{week === CURRENT_WEEK && i === today ? " (hoy)" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOCKS.map((b) => (
                <tr key={b.index}>
                  <td className="border-b border-border p-2 font-medium text-muted-foreground">{b.label}</td>
                  {DAYS.map((_, d) => {
                    const c = cell(d, b.index);
                    const now = week === CURRENT_WEEK && d === today && mins >= b.start && mins < b.end;
                    return (
                      <td key={d} className="border-b border-border p-1.5">
                        {c ? (
                          <div className={cn("rounded-lg p-2", now ? "bg-occupied text-occupied-foreground" : c.extra ? "bg-available/40" : "bg-scheduled/15")}>
                            <p className="font-semibold">{c.course}</p>
                            <p className="opacity-80">Aula {c.classroomId} · {c.career}</p>
                          </div>
                        ) : (
                          <div className="h-10 rounded-lg border border-dashed border-border" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="surface-card p-5">
            <h3 className="font-semibold">Mis solicitudes</h3>
            <ul className="mt-3 divide-y divide-border text-sm">
              {myRequests.length === 0 && <li className="py-3 text-muted-foreground">Aún no tiene solicitudes.</li>}
              {myRequests.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">
                      {r.kind === "contingencia" ? "Contingencia" : "Recuperación"} · Aula {r.classroom}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.duration}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold",
                    r.status === "pendiente" ? "bg-available/40" : r.status === "aprobada" ? "bg-scheduled text-scheduled-foreground" : "bg-occupied text-occupied-foreground")}>
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="surface-card p-5">
            <h3 className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4" /> Notificaciones</h3>
            <ul className="mt-3 divide-y divide-border text-sm">
              {myNotifs.length === 0 && <li className="py-3 text-muted-foreground">Sin notificaciones.</li>}
              {myNotifs.slice(0, 8).map((n) => (
                <li key={n.id} className="py-3">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <RecoveryDialog open={recOpen} onOpenChange={setRecOpen} profId={profId} emergencies={emergencies} rooms={classrooms.map((c) => c.id)} mins={mins} busy={(d, b) => !!cell(d, b)} />
      <ContingencyDialog open={conOpen} onOpenChange={setConOpen} profId={profId} active={active.map((a) => ({ blockIndex: a.block.index, label: a.block.label, classroomId: a.slot!.classroomId, course: a.slot!.course }))} />
    </div>
  );
}

function RecoveryDialog({ open, onOpenChange, profId, emergencies, rooms, mins, busy }: {
  open: boolean; onOpenChange: (o: boolean) => void; profId: string;
  emergencies: Parameters<typeof scheduleEntry>[0]; rooms: string[]; mins: number; busy: (d: number, b: number) => boolean;
}) {
  const today = todayIndex();
  const [week, setWeek] = useState(CURRENT_WEEK);
  const [day, setDay] = useState(today);
  const [pick, setPick] = useState<{ room: string; block: number } | null>(null);
  const [reason, setReason] = useState("");

  const isFuture = (b: number) => week > CURRENT_WEEK || (week === CURRENT_WEEK && (day > today || (day === today && BLOCKS[b]!.start > mins)));
  const blocks = BLOCKS.filter((b) => isFuture(b.index));

  const submit = () => {
    if (!pick || !reason.trim()) return;
    actions.requestRecovery({ professorId: profId, classroomId: pick.room, week, day, blockIndex: pick.block, reason: reason.trim() });
    toast.success("Solicitud enviada al Administrador", { description: `Aula ${pick.room} · ${DAYS[day]} S${week}` });
    setPick(null); setReason(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Solicitar Aula de Recuperación</DialogTitle>
          <DialogDescription>Elija una fecha futura y un espacio libre (amarillo).</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-3">
          <Select value={String(week)} onValueChange={(v) => { setWeek(Number(v)); setPick(null); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{WEEKS.filter((w) => w >= CURRENT_WEEK).map((w) => <SelectItem key={w} value={String(w)}>Semana {w}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(day)} onValueChange={(v) => { setDay(Number(v)); setPick(null); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{DAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {blocks.length === 0 && <p className="text-sm text-muted-foreground">No hay bloques futuros en esta fecha.</p>}
          {blocks.map((b) => {
            const mine = busy(day, b.index) && week === CURRENT_WEEK ? true : busy(day, b.index);
            const free = rooms.filter((r) => !scheduleEntry(emergencies, r, week, day, b.index));
            return (
              <div key={b.index}>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{b.label} {mine && "· (ya tiene clase en este bloque)"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {free.map((r) => (
                    <button key={r} disabled={mine} onClick={() => setPick({ room: r, block: b.index })}
                      className={cn("rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-40",
                        pick?.room === r && pick.block === b.index ? "bg-primary text-primary-foreground" : "bg-available/50 hover:bg-available")}>
                      {r}
                    </button>
                  ))}
                  {free.length === 0 && <span className="text-xs text-muted-foreground">Sin aulas libres</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          <Label>Motivo</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Recuperación por feriado" />
        </div>
        <DialogFooter>
          <p className="mr-auto self-center text-xs text-muted-foreground">
            {pick ? `Aula ${pick.room} · ${BLOCKS[pick.block]!.label} · ${gapMinutes(pick.block)} min` : "Seleccione un aula"}
          </p>
          <Button onClick={submit} disabled={!pick || !reason.trim()}>Enviar solicitud</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContingencyDialog({ open, onOpenChange, profId, active }: {
  open: boolean; onOpenChange: (o: boolean) => void; profId: string;
  active: { blockIndex: number; label: string; classroomId: string; course: string }[];
}) {
  const [sel, setSel] = useState("");
  const [reason, setReason] = useState("");
  const chosen = active.find((a) => `${a.blockIndex}-${a.classroomId}` === sel);

  const submit = () => {
    if (!chosen || !reason.trim()) return;
    actions.requestContingency({ professorId: profId, classroomId: chosen.classroomId, blockIndex: chosen.blockIndex, reason: reason.trim() });
    toast.success("Solicitud de desbloqueo enviada", { description: `Aula ${chosen.classroomId}` });
    setSel(""); setReason(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apertura por Contingencia (Fallo de Huella)</DialogTitle>
          <DialogDescription>Solicite al Administrador el desbloqueo remoto de la puerta de su clase activa.</DialogDescription>
        </DialogHeader>
        {active.length === 0 ? (
          <p className="rounded-lg border border-border bg-secondary/60 p-3 text-sm">
            No tiene una clase activa en este momento. Solo puede solicitarlo durante su clase (o 10 min antes).
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Clase activa</Label>
              <Select value={sel} onValueChange={setSel}>
                <SelectTrigger><SelectValue placeholder="Seleccione su clase" /></SelectTrigger>
                <SelectContent>
                  {active.map((a) => (
                    <SelectItem key={`${a.blockIndex}-${a.classroomId}`} value={`${a.blockIndex}-${a.classroomId}`}>
                      {a.course} · Aula {a.classroomId} · {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justificación (obligatoria)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describa el fallo del lector de huella" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="destructive" onClick={submit} disabled={!chosen || !reason.trim()}>Solicitar desbloqueo remoto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
