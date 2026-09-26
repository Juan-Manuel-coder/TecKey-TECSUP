import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CreditCard, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { actions, professorName, useTeckey } from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profesores")({
  head: () => ({
    meta: [
      { title: "Gestión de Profesores — TECKEY System" },
      {
        name: "description",
        content: "Registro de profesores, datos de contacto y vinculación de tarjetas RFID.",
      },
      { property: "og:title", content: "Gestión de Profesores — TECKEY System" },
      {
        property: "og:description",
        content: "Registro de profesores, datos de contacto y vinculación de tarjetas RFID.",
      },
    ],
  }),
  component: ProfesoresPage,
});

const empty = { nombres: "", apellidos: "", dni: "", correo: "", celular: "" };

function ProfesoresPage() {
  const { professors, cards } = useTeckey();
  const [filter, setFilter] = useState<"todos" | "con" | "sin">("todos");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const rows = professors
    .filter((p) =>
      filter === "todos" ? true : filter === "con" ? !!p.cardId : !p.cardId,
    )
    .filter((p) =>
      professorName(p).toLowerCase().includes(query.toLowerCase()) || p.dni.includes(query),
    );

  const submit = () => {
    if (!form.nombres || !form.apellidos || !form.dni) {
      toast.error("Complete nombres, apellidos y DNI");
      return;
    }
    actions.addProfessor(form);
    toast.success("Profesor registrado", { description: `${form.nombres} ${form.apellidos}` });
    setForm(empty);
    setOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gestión de Profesores</h2>
          <p className="text-sm text-muted-foreground">
            {professors.length} docentes registrados · {professors.filter((p) => !p.cardId).length} sin
            tarjeta
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Nuevo Profesor
        </Button>
      </div>

      <div className="surface-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-border bg-secondary p-1">
            {(
              [
                ["todos", "Todos"],
                ["con", "Con Tarjeta"],
                ["sin", "Sin Tarjeta"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  filter === k
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o DNI"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesor</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Tarjeta RFID</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const card = cards.find((c) => c.id === p.cardId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{professorName(p)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.dni}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="text-xs">{p.correo}</div>
                      <div className="text-xs">{p.celular}</div>
                    </TableCell>
                    <TableCell>
                      {card ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-scheduled/15 px-2.5 py-1 text-xs font-semibold text-scheduled">
                          <CreditCard className="h-3.5 w-3.5" /> {card.code}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-available/25 px-2.5 py-1 text-xs font-semibold text-available-foreground">
                          Sin Tarjeta
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!card}
                          onClick={() => {
                            actions.unlinkCard(p.id);
                            toast.success("Tarjeta deshabilitada", {
                              description: `${professorName(p)} quedó sin tarjeta.`,
                            });
                          }}
                        >
                          Deshabilitar Tarjeta
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            actions.removeProfessor(p.id);
                            toast.error("Profesor eliminado", { description: professorName(p) });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No hay profesores para este filtro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar nuevo profesor</DialogTitle>
            <DialogDescription>Los datos quedarán disponibles para asignar una tarjeta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["nombres", "Nombres"],
                ["apellidos", "Apellidos"],
                ["dni", "DNI"],
                ["celular", "Celular"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="correo">Correo institucional</Label>
              <Input
                id="correo"
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>Guardar profesor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
