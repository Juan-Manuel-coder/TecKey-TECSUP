import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { GraduationCap, LogIn, ShieldCheck, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_PASS, ADMIN_USER, setSession } from "@/lib/auth";
import { useTeckey } from "@/lib/teckey-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar Sesión — TECKEY System" },
      { name: "description", content: "Acceso para administradores y docentes al sistema de control RFID TECKEY." },
      { property: "og:title", content: "Iniciar Sesión — TECKEY System" },
      { property: "og:description", content: "Acceso para administradores y docentes al sistema de control RFID TECKEY." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { professors } = useTeckey();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const enterAdmin = () => {
    setSession({ role: "admin" });
    toast.success("Bienvenido, Administrador");
    navigate({ to: "/", replace: true });
  };
  const enterProf = (id: string) => {
    setSession({ role: "profesor", professorId: id });
    toast.success("Bienvenido, docente");
    navigate({ to: "/profesor", replace: true });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = user.trim().toLowerCase();
    if (u === ADMIN_USER && pass === ADMIN_PASS) return enterAdmin();
    const prof = professors.find((p) => p.correo.toLowerCase() === u || p.dni === u);
    if (prof && pass === prof.dni) return enterProf(prof.id);
    toast.error("Usuario o contraseña incorrectos");
  };

  const demoProf = professors[2] ?? professors[0];

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold tracking-wide text-sidebar-accent-foreground">TECKEY</p>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight text-sidebar-accent-foreground">
            Control de acceso RFID para aulas universitarias
          </h1>
          <p className="mt-4 max-w-md text-sidebar-foreground/75">
            Pabellones F y B, horarios del ciclo 2026-II, tarjetas y solicitudes en un solo lugar.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">Oficina de Servicios · Semestre 2026-II</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-muted-foreground">Ingrese con su cuenta institucional.</p>
          </div>
          <form onSubmit={submit} className="surface-card space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="user">Usuario / Correo Institucional</Label>
              <Input id="user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="nombre@universidad.edu.pe" autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Contraseña</Label>
              <Input id="pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
            </Button>
            <p className="text-xs text-muted-foreground">
              Docentes: correo institucional o DNI, y su DNI como contraseña.
            </p>
          </form>

          <div className="surface-card space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acceso rápido (Demo)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={enterAdmin}>
                <UserCog className="mr-2 h-4 w-4" /> Entrar como Administrador
              </Button>
              <Button variant="outline" onClick={() => demoProf && enterProf(demoProf.id)}>
                <GraduationCap className="mr-2 h-4 w-4" /> Entrar como Profesor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
