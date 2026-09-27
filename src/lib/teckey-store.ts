import { useEffect, useState } from "react";

export type Professor = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  celular: string;
  cardId: string | null;
};

export type Card = {
  id: string;
  code: string;
  status: "Activa" | "Inactiva";
  professorId: string | null;
};

export type SlotStatus = "ocupado" | "programado" | "disponible";

export type Classroom = {
  id: string;
  pavilion: "F" | "B";
  floor: number;
  number: string;
  status: SlotStatus;
  course?: string;
  career?: string;
  professorId?: string;
  time?: string;
};

export type RequestItem = {
  id: string;
  professorId: string;
  classroom: string;
  reason: string;
  requestedAt: string;
  duration: string;
  status: "pendiente" | "aprobada" | "rechazada";
};

export type LogItem = {
  id: string;
  datetime: string;
  classroom: string;
  professorName: string;
  tag: string;
  result: "CONCEDIDO" | "DENEGADO";
};

const names: Array<[string, string]> = [
  ["María Fernanda", "Quispe Rojas"],
  ["Carlos Alberto", "Mendoza Paredes"],
  ["Lucía", "Vargas Tello"],
  ["Jorge Luis", "Huamán Castro"],
  ["Ana Patricia", "Salazar Ríos"],
  ["Diego", "Ramírez Peña"],
  ["Rosa Elena", "Ccahuana Flores"],
  ["Víctor Hugo", "Nuñez Baldeón"],
  ["Sofía", "León Miranda"],
  ["Ricardo", "Ortega Pinto"],
  ["Paola", "Chávez Aguirre"],
  ["Miguel Ángel", "Torres Vela"],
];

const courses: Array<[string, string]> = [
  ["Cálculo Diferencial", "Ingeniería Industrial"],
  ["Bases de Datos II", "Ingeniería de Sistemas"],
  ["Anatomía Humana", "Medicina Humana"],
  ["Contabilidad General", "Administración"],
  ["Redes y Comunicaciones", "Ingeniería de Sistemas"],
  ["Física Aplicada", "Ingeniería Civil"],
  ["Derecho Procesal", "Derecho"],
  ["Estadística Inferencial", "Economía"],
];

const timeRanges = ["07:00 - 09:40", "09:50 - 11:30", "11:40 - 14:20", "14:30 - 15:10", "15:20 - 18:00"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

const professors: Professor[] = names.map(([nombres, apellidos], i) => ({
  id: `P${i + 1}`,
  nombres,
  apellidos,
  dni: String(40000000 + hash(nombres + apellidos) * 7).slice(0, 8),
  correo: `${nombres.split(" ")[0]!.toLowerCase()}.${apellidos.split(" ")[0]!.toLowerCase()}@universidad.edu.pe`,
  celular: `9${String(10000000 + hash(apellidos) * 3).slice(0, 8)}`,
  cardId: null,
}));

const hexes = ["8A3F", "4C21", "9BD7", "2E55", "77A0", "C31B", "5F94", "E0D2", "1A6C", "B482", "3D19", "6E7F"];
const cards: Card[] = hexes.map((h, i) => ({
  id: `C${i + 1}`,
  code: `RFID-${h}`,
  status: i % 7 === 3 ? "Inactiva" : "Activa",
  professorId: null,
}));

// Assign 9 of 12 cards to 9 of 12 professors
for (let i = 0; i < 9; i++) {
  cards[i]!.professorId = professors[i]!.id;
  professors[i]!.cardId = cards[i]!.id;
}

const classrooms: Classroom[] = [];
(["F", "B"] as const).forEach((pav) => {
  for (let floor = 1; floor <= 3; floor++) {
    for (let n = 1; n <= 5; n++) {
      const number = `${floor}0${n}`;
      const seed = hash(pav + number);
      const mod = seed % 3;
      const status: SlotStatus = mod === 0 ? "ocupado" : mod === 1 ? "programado" : "disponible";
      const [course, career] = courses[seed % courses.length]!;
      classrooms.push({
        id: `${pav}${number}`,
        pavilion: pav,
        floor,
        number,
        status,
        ...(status === "disponible"
          ? {}
          : {
              course,
              career,
              professorId: professors[seed % professors.length]!.id,
              time: timeRanges[seed % timeRanges.length],
            }),
      });
    }
  }
});

const requests: RequestItem[] = [
  {
    id: "R1",
    professorId: "P3",
    classroom: "F203",
    reason: "Recuperación de clase por feriado del 08 de setiembre.",
    requestedAt: "Hoy, 08:12",
    duration: "1h 40min",
    status: "pendiente",
  },
  {
    id: "R2",
    professorId: "P6",
    classroom: "B105",
    reason: "Asesoría grupal para proyecto final de Redes.",
    requestedAt: "Hoy, 09:45",
    duration: "40min",
    status: "pendiente",
  },
  {
    id: "R3",
    professorId: "P9",
    classroom: "F302",
    reason: "Examen sustitutorio del curso de Estadística.",
    requestedAt: "Ayer, 17:30",
    duration: "2h 40min",
    status: "pendiente",
  },
];

const logs: LogItem[] = [
  ["26/09/2026 07:02", "F101", "P1", "RFID-8A3F", "CONCEDIDO"],
  ["26/09/2026 07:05", "F204", "P2", "RFID-4C21", "CONCEDIDO"],
  ["26/09/2026 07:41", "B103", "P5", "RFID-77A0", "DENEGADO"],
  ["26/09/2026 09:12", "F305", "P4", "RFID-2E55", "CONCEDIDO"],
  ["26/09/2026 09:58", "B201", "P7", "RFID-5F94", "DENEGADO"],
  ["26/09/2026 10:31", "F102", "P3", "RFID-9BD7", "CONCEDIDO"],
  ["26/09/2026 11:45", "B304", "P8", "RFID-E0D2", "CONCEDIDO"],
  ["26/09/2026 12:20", "F203", "P6", "RFID-C31B", "DENEGADO"],
  ["26/09/2026 14:33", "B102", "P9", "RFID-1A6C", "CONCEDIDO"],
  ["26/09/2026 15:07", "F301", "P2", "RFID-4C21", "CONCEDIDO"],
].map((row, i) => {
  const [datetime, classroom, pid, tag, result] = row as string[];
  return {
    id: `L${i + 1}`,
    datetime: datetime!,
    classroom: classroom!,
    professorName: professorName(professors.find((p) => p.id === pid)!),
    tag: tag!,
    result: result as LogItem["result"],
  };
});

export function professorName(p: Professor) {
  return `${p.nombres} ${p.apellidos}`;
}

type State = {
  professors: Professor[];
  cards: Card[];
  classrooms: Classroom[];
  requests: RequestItem[];
  logs: LogItem[];
};

let state: State = { professors, cards, classrooms, requests, logs };

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return state;
}

export function useTeckey() {
  const [snapshot, setSnapshot] = useState<State>(getSnapshot);
  useEffect(() => {
    const unsubscribe = subscribe(() => setSnapshot(getSnapshot()));
    setSnapshot(getSnapshot());
    return () => {
      unsubscribe();
    };
  }, []);
  return snapshot;
}

function set(partial: Partial<State>) {
  state = { ...state, ...partial };
  emit();
}

export const actions = {
  addProfessor(p: Omit<Professor, "id" | "cardId">) {
    set({
      professors: [...state.professors, { ...p, id: `P${Date.now()}`, cardId: null }],
    });
  },
  removeProfessor(id: string) {
    set({
      professors: state.professors.filter((p) => p.id !== id),
      cards: state.cards.map((c) => (c.professorId === id ? { ...c, professorId: null } : c)),
    });
  },
  unlinkCard(professorId: string) {
    set({
      professors: state.professors.map((p) => (p.id === professorId ? { ...p, cardId: null } : p)),
      cards: state.cards.map((c) => (c.professorId === professorId ? { ...c, professorId: null } : c)),
    });
  },
  assignCard(cardId: string, professorId: string) {
    set({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, professorId, status: "Activa" } : c)),
      professors: state.professors.map((p) => (p.id === professorId ? { ...p, cardId } : p)),
    });
  },
  removeCard(cardId: string) {
    set({
      cards: state.cards.filter((c) => c.id !== cardId),
      professors: state.professors.map((p) => (p.cardId === cardId ? { ...p, cardId: null } : p)),
    });
  },
  resolveRequest(id: string, status: "aprobada" | "rechazada") {
    set({ requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)) });
  },
  grantEmergency(classroomId: string, professorId: string, duration: string) {
    const prof = state.professors.find((p) => p.id === professorId);
    set({
      classrooms: state.classrooms.map((c) =>
        c.id === classroomId
          ? {
              ...c,
              status: "ocupado",
              course: "Clase de emergencia",
              career: "Acceso extraordinario",
              professorId,
              time: `Ahora · ${duration}`,
            }
          : c,
      ),
      logs: [
        {
          id: `L${Date.now()}`,
          datetime: "26/09/2026 " + new Date().toTimeString().slice(0, 5),
          classroom: classroomId,
          professorName: prof ? professorName(prof) : "—",
          tag: prof?.cardId ? state.cards.find((c) => c.id === prof.cardId)!.code : "SIN-TARJETA",
          result: "CONCEDIDO",
        },
        ...state.logs,
      ],
    });
  },
};
