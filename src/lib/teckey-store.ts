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

export const CARD_TECHS = ["MIFARE Classic 1K (13.56 MHz)", "MIFARE DESFire EV2 (13.56 MHz)", "EM4100 (125 kHz)"] as const;
export type CardTech = (typeof CARD_TECHS)[number];

export type Card = {
  id: string;
  code: string;
  /** UID físico leído por el lector (8 caracteres hexadecimales). */
  uid: string;
  tech: CardTech;
  status: "Activa" | "Inactiva";
  professorId: string | null;
  registeredAt: string;
  note?: string;
};

export type AccessResult = "CONCEDIDO" | "FUERA DE HORARIO" | "DENEGADO";

export type NotificationItem = {
  id: string;
  audience: "admin" | "profesor";
  professorId?: string;
  kind: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

/** Ajuste manual sobre la autorización de una tarjeta en un día/bloque. */
export type SlotOverride = { classroomId: string; enabled: boolean };

/** Semana actual del ciclo usada para validar accesos en vivo. */
export const CURRENT_WEEK = 6;

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
  result: AccessResult;
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
  uid: `${h}${(hash(h) % 65536).toString(16).toUpperCase().padStart(4, "0")}`,
  tech: CARD_TECHS[i % 3 === 2 ? 1 : 0]!,
  status: i === 3 ? "Inactiva" : "Activa",
  professorId: null,
  registeredAt: "17/08/2026",
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

// ---------------- Cronograma semanal ----------------

export type Block = { index: number; start: number; end: number; label: string };

function hm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

const blockStarts = [7 * 60, 8 * 60 + 50, 10 * 60 + 40, 12 * 60 + 30, 14 * 60 + 20, 16 * 60 + 10, 18 * 60, 19 * 60 + 50];
export const BLOCKS: Block[] = blockStarts.map((start, index) => ({
  index,
  start,
  end: start + 100,
  label: `${hm(start)} - ${hm(start + 100)}`,
}));

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const WEEKS = Array.from({ length: 16 }, (_, i) => i + 1);

export type ScheduleEntry = {
  course: string;
  career: string;
  professorId: string;
  emergency?: boolean;
  minutes?: number;
};

export type Emergency = {
  id: string;
  classroomId: string;
  week: number;
  day: number;
  blockIndex: number;
  professorId: string;
  minutes: number;
};

export type LockState = "cerrado" | "abierto" | "tolerancia";
export type Lock = {
  state: LockState;
  openedAt: number;
  endsAt: number;
  toleranceEndsAt: number;
};

/** Horario base: se repite igual todas las semanas del ciclo. */
export function baseSchedule(classroomId: string, day: number, blockIndex: number): ScheduleEntry | null {
  const seed = hash(`${classroomId}-${day}-${blockIndex}`);
  if (seed % 10 < 5) return null;
  const [course, career] = courses[seed % courses.length]!;
  return { course, career, professorId: professors[seed % professors.length]!.id };
}

export function todayIndex(d = new Date()) {
  const js = d.getDay();
  return js === 0 ? 5 : js - 1; // domingo se muestra como sábado
}

export function minutesNow(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

export function currentBlock(mins = minutesNow()): Block | null {
  return BLOCKS.find((b) => mins >= b.start && mins < b.end) ?? null;
}

export function gapMinutes(blockIndex: number) {
  return BLOCKS[blockIndex]!.end - BLOCKS[blockIndex]!.start;
}

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
  ["26/09/2026 07:41", "B103", "P5", "RFID-77A0", "FUERA DE HORARIO"],
  ["26/09/2026 09:12", "F305", "P4", "RFID-2E55", "DENEGADO"],
  ["26/09/2026 09:58", "B201", "P7", "RFID-5F94", "FUERA DE HORARIO"],
  ["26/09/2026 10:31", "F102", "P3", "RFID-9BD7", "CONCEDIDO"],
  ["26/09/2026 11:45", "B304", "P8", "RFID-E0D2", "CONCEDIDO"],
  ["26/09/2026 12:20", "F203", "P6", "RFID-C31B", "FUERA DE HORARIO"],
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

const notifications: NotificationItem[] = [
  {
    id: "N1",
    audience: "admin",
    kind: "warning",
    title: "Nueva solicitud de acceso especial",
    message:
      "La docente Lucía Vargas Tello solicita acceso al aula F203 por 1h 40min para recuperar la clase del feriado del 08 de setiembre.",
    time: "26/09/2026 08:12",
    read: false,
  },
  {
    id: "N2",
    audience: "admin",
    kind: "warning",
    title: "Nueva solicitud de acceso especial",
    message: "El docente Diego Ramírez Peña solicita el aula B105 por 40min para una asesoría grupal de Redes.",
    time: "26/09/2026 09:45",
    read: false,
  },
  {
    id: "N3",
    audience: "admin",
    kind: "danger",
    title: "Acceso denegado por tarjeta deshabilitada",
    message:
      "La tarjeta RFID-2E55 de Jorge Luis Huamán Castro intentó abrir el aula F305 a las 09:12, pero se encuentra deshabilitada.",
    time: "26/09/2026 09:12",
    read: false,
  },
  {
    id: "N4",
    audience: "profesor",
    professorId: "P4",
    kind: "danger",
    title: "Su tarjeta está deshabilitada",
    message:
      "Estimado docente, su tarjeta RFID-2E55 fue deshabilitada por la administración. Acérquese a la Oficina de Servicios para su reactivación o reemplazo; sus horarios se conservan.",
    time: "25/09/2026 18:00",
    read: false,
  },
  {
    id: "N5",
    audience: "profesor",
    professorId: "P3",
    kind: "info",
    title: "Solicitud recibida",
    message:
      "Su solicitud de acceso al aula F203 (1h 40min) fue recibida y está pendiente de revisión por la administración.",
    time: "26/09/2026 08:12",
    read: true,
  },
];

type State = {
  professors: Professor[];
  cards: Card[];
  classrooms: Classroom[];
  requests: RequestItem[];
  logs: LogItem[];
  emergencies: Emergency[];
  locks: Record<string, Lock>;
  notifications: NotificationItem[];
  /** cardId -> "dia-bloque" -> ajuste manual de autorización */
  cardSlots: Record<string, Record<string, SlotOverride>>;
};

let state: State = {
  professors,
  cards,
  classrooms,
  requests,
  logs,
  emergencies: [],
  locks: {},
  notifications,
  cardSlots: {},
};

let seq = 0;
function uid(prefix: string) {
  seq += 1;
  return `${prefix}${Date.now()}-${seq}`;
}

function notif(n: Omit<NotificationItem, "id" | "time" | "read">): NotificationItem {
  return { ...n, id: uid("N"), time: logStamp(), read: false };
}

function cardCodeOf(professorId: string | undefined) {
  const prof = state.professors.find((p) => p.id === professorId);
  return prof?.cardId ? state.cards.find((c) => c.id === prof.cardId)?.code ?? "SIN-TARJETA" : "SIN-TARJETA";
}

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
    const card = state.cards.find((c) => c.id === cardId);
    const prof = state.professors.find((p) => p.id === professorId);
    set({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, professorId, status: "Activa" } : c)),
      professors: state.professors.map((p) => (p.id === professorId ? { ...p, cardId } : p)),
      notifications: [
        notif({
          audience: "profesor",
          professorId,
          kind: "success",
          title: "Tarjeta RFID asignada",
          message: `Se le asignó la tarjeta ${card?.code}. Ya puede abrir las aulas de su horario académico; cualquier cambio de autorización le será notificado.`,
        }),
        notif({
          audience: "admin",
          kind: "info",
          title: "Tarjeta vinculada",
          message: `La tarjeta ${card?.code} quedó vinculada a ${prof ? professorName(prof) : "—"} con su horario académico autorizado.`,
        }),
        ...state.notifications,
      ],
    });
  },
  removeCard(cardId: string) {
    const slots = { ...state.cardSlots };
    delete slots[cardId];
    set({
      cards: state.cards.filter((c) => c.id !== cardId),
      professors: state.professors.map((p) => (p.cardId === cardId ? { ...p, cardId: null } : p)),
      cardSlots: slots,
    });
  },
  /** Registra una tarjeta nueva en stock (opcionalmente la vincula de inmediato). */
  addCard(input: { uid: string; tech: CardTech; note?: string; professorId?: string }) {
    const id = uid("C");
    const code = `RFID-${input.uid.slice(0, 4).toUpperCase()}`;
    set({
      cards: [
        ...state.cards,
        {
          id,
          code,
          uid: input.uid.toUpperCase(),
          tech: input.tech,
          status: "Activa",
          professorId: null,
          registeredAt: logStamp().slice(0, 10),
          note: input.note || undefined,
        },
      ],
    });
    if (input.professorId) actions.assignCard(id, input.professorId);
    return code;
  },
  /** Deshabilita: conserva vínculo y datos, pero deniega todo acceso. */
  disableCard(cardId: string) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const prof = state.professors.find((p) => p.id === card.professorId);
    set({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, status: "Inactiva" } : c)),
      notifications: [
        ...(prof
          ? [
              notif({
                audience: "profesor",
                professorId: prof.id,
                kind: "danger",
                title: "Su tarjeta fue deshabilitada",
                message: `Su tarjeta ${card.code} fue deshabilitada por la administración. No podrá abrir ninguna aula hasta su reactivación o reemplazo; sus datos y horarios se conservan.`,
              }),
            ]
          : []),
        notif({
          audience: "admin",
          kind: "warning",
          title: "Tarjeta deshabilitada",
          message: `La tarjeta ${card.code}${prof ? ` de ${professorName(prof)}` : ""} quedó deshabilitada. Todo intento de acceso se registrará como DENEGADO.`,
        }),
        ...state.notifications,
      ],
    });
  },
  enableCard(cardId: string) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    set({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, status: "Activa" } : c)),
      notifications: card.professorId
        ? [
            notif({
              audience: "profesor",
              professorId: card.professorId,
              kind: "success",
              title: "Su tarjeta fue reactivada",
              message: `Su tarjeta ${card.code} vuelve a estar activa con el mismo horario autorizado que tenía antes de la deshabilitación.`,
            }),
            ...state.notifications,
          ]
        : state.notifications,
    });
  },
  /** Pasa docente y horarios autorizados de una tarjeta a otra nueva del stock. */
  transferCard(fromId: string, toId: string) {
    const from = state.cards.find((c) => c.id === fromId);
    const to = state.cards.find((c) => c.id === toId);
    if (!from?.professorId || !to || to.professorId) return;
    const pid = from.professorId;
    const slots = { ...state.cardSlots };
    if (slots[fromId]) slots[toId] = { ...slots[fromId] };
    delete slots[fromId];
    set({
      cards: state.cards.map((c) =>
        c.id === fromId
          ? { ...c, professorId: null, status: "Inactiva", note: `Reemplazada por ${to.code}` }
          : c.id === toId
            ? { ...c, professorId: pid, status: "Activa" }
            : c,
      ),
      professors: state.professors.map((p) => (p.id === pid ? { ...p, cardId: toId } : p)),
      cardSlots: slots,
      notifications: [
        notif({
          audience: "profesor",
          professorId: pid,
          kind: "success",
          title: "Nueva tarjeta asignada",
          message: `Su tarjeta ${from.code} fue reemplazada por ${to.code}. Todos sus horarios y aulas autorizadas se transfirieron sin cambios.`,
        }),
        notif({
          audience: "admin",
          kind: "info",
          title: "Transferencia de tarjeta completada",
          message: `Los datos y horarios de ${from.code} se transfirieron a ${to.code}. La tarjeta anterior quedó inactiva en stock.`,
        }),
        ...state.notifications,
      ],
    });
  },
  /** Habilita o deshabilita la autorización de una tarjeta en un día/bloque. */
  setCardSlot(cardId: string, day: number, blockIndex: number, override: SlotOverride | null) {
    const key = `${day}-${blockIndex}`;
    const current = { ...(state.cardSlots[cardId] ?? {}) };
    if (override) current[key] = override;
    else delete current[key];
    const card = state.cards.find((c) => c.id === cardId);
    const block = BLOCKS[blockIndex]!;
    const room = override?.classroomId ?? "";
    set({
      cardSlots: { ...state.cardSlots, [cardId]: current },
      notifications: card?.professorId
        ? [
            notif({
              audience: "profesor",
              professorId: card.professorId,
              kind: override && !override.enabled ? "warning" : "info",
              title: override && !override.enabled ? "Acceso retirado en su horario" : "Horario de acceso actualizado",
              message:
                override && !override.enabled
                  ? `Su tarjeta ${card.code} ya no podrá abrir el aula ${room} el ${DAYS[day]} de ${block.label}.`
                  : `Su tarjeta ${card.code} queda autorizada el ${DAYS[day]} de ${block.label}${room ? ` en el aula ${room}` : ""}.`,
            }),
            ...state.notifications,
          ]
        : state.notifications,
    });
  },
  /** Simula la lectura de una tarjeta en el lector de un aula. */
  swipeCard(cardId: string, classroomId: string): AccessResult {
    const card = state.cards.find((c) => c.id === cardId);
    const prof = state.professors.find((p) => p.id === card?.professorId);
    const result = evaluateAccess(state, cardId, classroomId, CURRENT_WEEK, todayIndex(), minutesNow());
    pushAccess(classroomId, prof ? professorName(prof) : "Sin docente", card?.code ?? "DESCONOCIDA", result);
    return result;
  },
  resolveRequest(id: string, status: "aprobada" | "rechazada") {
    const r = state.requests.find((x) => x.id === id);
    set({
      requests: state.requests.map((x) => (x.id === id ? { ...x, status } : x)),
      notifications: r
        ? [
            notif({
              audience: "profesor",
              professorId: r.professorId,
              kind: status === "aprobada" ? "success" : "danger",
              title: status === "aprobada" ? "Solicitud aprobada" : "Solicitud rechazada",
              message:
                status === "aprobada"
                  ? `Su solicitud de acceso al aula ${r.classroom} por ${r.duration} fue aprobada. Su tarjeta quedará habilitada durante ese periodo.`
                  : `Su solicitud de acceso al aula ${r.classroom} por ${r.duration} fue rechazada por la administración. Puede presentar una nueva solicitud con otro horario.`,
            }),
            ...state.notifications,
          ]
        : state.notifications,
    });
  },
  markNotificationRead(id: string) {
    set({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) });
  },
  markAllRead(audience: "admin" | "profesor", professorId?: string) {
    set({
      notifications: state.notifications.map((n) =>
        n.audience === audience && (!professorId || n.professorId === professorId) ? { ...n, read: true } : n,
      ),
    });
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

  /** Valida el ingreso con tarjeta: el aula queda ABIERTA (Modo Clase). */
  openClassroom(classroomId: string, professorId: string | undefined, endsAtMinutes: number) {
    const prof = state.professors.find((p) => p.id === professorId);
    const now = Date.now();
    const endsAt = now + Math.max(1, endsAtMinutes - minutesNow()) * 60_000;
    set({
      locks: {
        ...state.locks,
        [classroomId]: {
          state: "abierto",
          openedAt: now,
          endsAt,
          toleranceEndsAt: endsAt + 10 * 60_000,
        },
      },
      logs: [
        {
          id: `L${now}`,
          datetime: logStamp(),
          classroom: classroomId,
          professorName: prof ? professorName(prof) : "Administrador",
          tag: prof?.cardId ? state.cards.find((c) => c.id === prof.cardId)?.code ?? "SIN-TARJETA" : "SIN-TARJETA",
          result: "CONCEDIDO",
        },
        ...state.logs,
      ],
    });
  },

  /** Cierre manual del docente con su tarjeta. */
  closeClassroom(classroomId: string, professorId: string | undefined, auto = false) {
    const prof = state.professors.find((p) => p.id === professorId);
    const locks = { ...state.locks };
    delete locks[classroomId];
    set({
      locks,
      logs: [
        {
          id: `L${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
          datetime: logStamp(),
          classroom: classroomId,
          professorName: auto ? "Cierre Automático (sistema)" : prof ? professorName(prof) : "Administrador",
          tag: auto ? "AUTO-CIERRE" : prof?.cardId ? state.cards.find((c) => c.id === prof.cardId)?.code ?? "SIN-TARJETA" : "SIN-TARJETA",
          result: "CONCEDIDO",
        },
        ...state.logs,
      ],
    });
  },

  /** Avanza el reloj de cerraduras: fin de clase → tolerancia 10 min → cierre automático. */
  tickLocks() {
    const now = Date.now();
    let changed = false;
    const locks: Record<string, Lock> = {};
    const closed: string[] = [];
    Object.entries(state.locks).forEach(([id, lock]) => {
      if (now >= lock.toleranceEndsAt) {
        closed.push(id);
        changed = true;
        return;
      }
      if (lock.state === "abierto" && now >= lock.endsAt) {
        locks[id] = { ...lock, state: "tolerancia" };
        changed = true;
        return;
      }
      locks[id] = lock;
    });
    if (!changed) return;
    set({
      locks,
      logs: [
        ...closed.map((id) => ({
          id: `L${now}-${id}`,
          datetime: logStamp(),
          classroom: id,
          professorName: "Cierre Automático (sistema)",
          tag: "AUTO-CIERRE",
          result: "CONCEDIDO" as const,
        })),
        ...state.logs,
      ],
    });
  },

  /** Clase de emergencia restringida al hueco libre seleccionado. */
  grantEmergencyBlock(e: Omit<Emergency, "id">) {
    const prof = state.professors.find((p) => p.id === e.professorId);
    set({
      emergencies: [...state.emergencies, { ...e, id: `E${Date.now()}` }],
      logs: [
        {
          id: `L${Date.now()}`,
          datetime: logStamp(),
          classroom: e.classroomId,
          professorName: prof ? professorName(prof) : "—",
          tag: prof?.cardId ? state.cards.find((c) => c.id === prof.cardId)?.code ?? "SIN-TARJETA" : "SIN-TARJETA",
          result: "CONCEDIDO",
        },
        ...state.logs,
      ],
    });
  },
};

function logStamp() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${d.toTimeString().slice(0, 5)}`;
}

/** Entrada del cronograma considerando emergencias otorgadas. */
export function scheduleEntry(
  emergencies: Emergency[],
  classroomId: string,
  week: number,
  day: number,
  blockIndex: number,
): ScheduleEntry | null {
  const em = emergencies.find(
    (e) => e.classroomId === classroomId && e.week === week && e.day === day && e.blockIndex === blockIndex,
  );
  if (em)
    return {
      course: "Clase de emergencia",
      career: "Acceso extraordinario",
      professorId: em.professorId,
      emergency: true,
      minutes: em.minutes,
    };
  return baseSchedule(classroomId, day, blockIndex);
}

/** Estado en vivo de un aula para el día y minuto actuales. */
export function liveStatus(
  emergencies: Emergency[],
  classroomId: string,
  week: number,
  day: number,
  mins: number,
): { status: SlotStatus; entry: ScheduleEntry | null; block: Block | null } {
  const cur = BLOCKS.find((b) => mins >= b.start && mins < b.end);
  if (cur) {
    const entry = scheduleEntry(emergencies, classroomId, week, day, cur.index);
    if (entry) return { status: "ocupado", entry, block: cur };
  }
  const next = BLOCKS.find((b) => b.start > mins && scheduleEntry(emergencies, classroomId, week, day, b.index));
  if (next)
    return {
      status: "programado",
      entry: scheduleEntry(emergencies, classroomId, week, day, next.index),
      block: next,
    };
  return { status: "disponible", entry: null, block: cur ?? null };
}
