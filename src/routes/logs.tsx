import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useTeckey } from "@/lib/teckey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Registro de Accesos — TECKEY System" },
      {
        name: "description",
        content: "Auditoría de accesos RFID con fecha, aula, docente, tag y resultado del intento.",
      },
      { property: "og:title", content: "Registro de Accesos — TECKEY System" },
      {
        property: "og:description",
        content: "Auditoría de accesos RFID con fecha, aula, docente, tag y resultado del intento.",
      },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const { logs } = useTeckey();
  const [result, setResult] = useState("todos");
  const [query, setQuery] = useState("");

  const rows = logs
    .filter((l) => (result === "todos" ? true : l.result === result))
    .filter(
      (l) =>
        l.professorName.toLowerCase().includes(query.toLowerCase()) ||
        l.classroom.toLowerCase().includes(query.toLowerCase()) ||
        l.tag.toLowerCase().includes(query.toLowerCase()),
    );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Registro de Accesos</h2>
          <p className="text-sm text-muted-foreground">
            Auditoría completa de lecturas RFID en los pabellones.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => toast.success("Reporte exportado", { description: `${rows.length} registros en CSV.` })}
        >
          <Download className="mr-2 h-4 w-4" /> Exportar Reporte
        </Button>
      </div>

      <div className="surface-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={result} onValueChange={setResult}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los resultados</SelectItem>
              <SelectItem value="CONCEDIDO">Concedido</SelectItem>
              <SelectItem value="DENEGADO">Denegado</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar aula, docente o tag"
              className="pl-9"
            />
          </div>
          <p className="ml-auto text-xs text-muted-foreground">{rows.length} registros</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha / Hora</TableHead>
                <TableHead>Aula</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>RFID Tag ID</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{l.datetime}</TableCell>
                  <TableCell className="font-medium">{l.classroom}</TableCell>
                  <TableCell>{l.professorName}</TableCell>
                  <TableCell className="font-mono text-xs">{l.tag}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        l.result === "CONCEDIDO"
                          ? "bg-scheduled/15 text-scheduled"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {l.result}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Sin resultados para el filtro aplicado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
