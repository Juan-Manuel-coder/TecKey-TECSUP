import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarRange, Link2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { actions, professorName, useTeckey } from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tarjetas")({
  head: () => ({
    meta: [
      { title: "Tarjetas RFID — TECKEY System" },
      {
        name: "description",
        content: "Tarjetas RFID asignadas, stock disponible y aulas autorizadas por docente.",
      },
      { property: "og:title", content: "Tarjetas RFID — TECKEY System" },
      {
        property: "og:description",
        content: "Tarjetas RFID asignadas, stock disponible y aulas autorizadas por docente.",
      },
    ],
  }),
  component: TarjetasPage,
});

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const blocks = ["07:00 - 09:40", "09:50 - 11:30", "11:40 - 14:20", "14:30 - 17:10", "17:20 - 20:00"];

function TarjetasPage() {
  const { cards, professors, classrooms } = useTeckey();
  const [tab, setTab] = useState<"asignadas" | "stock">("asignadas");
  const [scheduleCard, setScheduleCard] = useState<string | null>(null);
  const [assignCard, setAssignCard] = useState<string | null>(null);
  const [pick, setPick] = useState("");

  const assigned = cards.filter((c) => c.professorId);
  const stock = cards.filter((c) => !c.professorId);
  const withoutCard = professors.filter((p) => !p.cardId);

  const confirmAssign = () => {
    if (!assignCard || !pick) {
      toast.error("Seleccione un profesor");
      return;
    }
    actions.assignCard(assignCard, pick);
    toast.success("Tarjeta vinculada correctamente");
    setAssignCard(null);
    setPick("");
  };

  const scheduleFor = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId)!;
    const rooms = classrooms.filter((c) => c.professorId === card.professorId);
    return { card, rooms };
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tarjetas RFID</h2>
        <p className="text-sm text-muted-foreground">
          {assigned.length} asignadas · {stock.length} en stock
        </p>
      </div>

      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        {(
          [
            ["asignadas", `Tarjetas Asignadas (${assigned.length})`],
            ["stock", `Stock Disponible (${stock.length})`],
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
            {label}
          </button>
        ))}
      </div>

      <div className="surface-card overflow-x-auto p-5">
        {tab === "asignadas" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Profesor asignado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assigned.map((c) => {
                const prof = professors.find((p) => p.id === c.professorId);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell>{prof ? professorName(prof) : "—"}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          c.status === "Activa"
                            ? "bg-scheduled/15 text-scheduled"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setScheduleCard(c.id)}>
                          <CalendarRange className="mr-2 h-4 w-4" /> Ver Aulas Autorizadas
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            actions.removeCard(c.id);
                            toast.error("Tarjeta eliminada", { description: c.code });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full bg-available/25 px-2.5 py-1 text-xs font-semibold text-available-foreground">
                      Sin asignar
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => setAssignCard(c.id)}>
                      <Link2 className="mr-2 h-4 w-4" /> Asignar a Profesor
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {stock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No hay chips sin asignar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!assignCard} onOpenChange={(o) => !o && setAssignCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar tarjeta</DialogTitle>
            <DialogDescription>
              Solo se listan profesores en estado “Sin Tarjeta”.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Profesor</Label>
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un profesor sin tarjeta" />
              </SelectTrigger>
              <SelectContent>
                {withoutCard.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {professorName(p)} · DNI {p.dni}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {withoutCard.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todos los profesores ya tienen una tarjeta vinculada.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignCard(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmAssign}>Confirmar vinculación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!scheduleCard} onOpenChange={(o) => !o && setScheduleCard(null)}>
        <DialogContent className="max-w-3xl">
          {scheduleCard &&
            (() => {
              const { card, rooms } = scheduleFor(scheduleCard);
              const prof = professors.find((p) => p.id === card.professorId);
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>Aulas autorizadas · {card.code}</DialogTitle>
                    <DialogDescription>
                      {prof ? professorName(prof) : "—"} · Semestre 2026-II
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className="border border-border bg-secondary p-2 text-left">Bloque</th>
                          {days.map((d) => (
                            <th key={d} className="border border-border bg-secondary p-2">
                              {d}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {blocks.map((b, bi) => (
                          <tr key={b}>
                            <td className="border border-border p-2 font-medium text-muted-foreground">
                              {b}
                            </td>
                            {days.map((d, di) => {
                              const room = rooms[(bi + di) % Math.max(rooms.length, 1)];
                              const show = rooms.length > 0 && (bi + di) % 3 === 0;
                              return (
                                <td key={d} className="border border-border p-2 text-center">
                                  {show ? (
                                    <span className="inline-flex rounded-md bg-scheduled/15 px-2 py-1 font-semibold text-scheduled">
                                      {room.id}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/50">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
