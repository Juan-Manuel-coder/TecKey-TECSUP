import { useEffect, useState } from "react";

/** Sesión de demostración (prototipo sin servidor): se guarda en el navegador. */
export type Session = { role: "admin" } | { role: "profesor"; professorId: string };

export const ADMIN_USER = "admin@universidad.edu.pe";
export const ADMIN_PASS = "admin123";
const KEY = "teckey-session";

let session: Session | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    session = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session = null;
  }
}

export function setSession(s: Session | null) {
  session = s;
  if (typeof window !== "undefined") {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  }
  listeners.forEach((l) => l());
}

/** Devuelve { ready, session }; ready=false hasta leer el navegador (evita parpadeos en SSR). */
export function useSession() {
  const [state, setState] = useState<{ ready: boolean; session: Session | null }>({ ready: false, session: null });
  useEffect(() => {
    load();
    const update = () => setState({ ready: true, session });
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return state;
}
