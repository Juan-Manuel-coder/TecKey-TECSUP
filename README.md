# TECKEY Access Control

Create a complete, responsive, and modern web application prototype for "TECKEY", an automated RFID access control system for university classrooms. Use React, Tailwind CSS, and Lucide Icons with a clean institutional palette (navy blue, slate gray, emerald green, crimson red, and amber).

GLOBAL TOPBAR:

- Title: "TECKEY System".

- Current date widget (e.g., "Saturday, September 26, 2026") and Cycle Week dropdown ("Semester 2026-II: Aug 17 - Dec 05", default "Week 6").

- Admin Profile badge with notification bell icon showing pending alerts count badge.

- (NOTE: Do NOT include any Department selector. Pavilion management is global).

SIDEBAR NAVIGATION:

1. Dashboard

2. Aulas y Pabellones

3. Gestión de Profesores

4. Tarjetas RFID

5. Solicitudes y Notificaciones

6. Registro de Accesos (Logs)

1. DASHBOARD MODULE:

- Top Metrics Row (4 Cards): Aulas Ocupadas Hoy (14/40), Profesores Activos (45), Tarjetas RFID Asignadas (42), Alertas de Acceso Denegado (3).

- Center Section: Live status summary widget showing current active classes across pavilions.

- Bottom Section: Actionable notification list showing pending special access requests from professors. Includes professor's name, requested classroom, reason, and a "Ver y Responder" button.

2. AULAS Y PABELLONES MODULE:

- Pavilion Tabs: Toggle between "Pabellón F" and "Pabellón B".

- Visual Building Layout: Display floors sequentially (Piso 1, Piso 2, Piso 3). Each floor contains circular status badges with classroom numbers (e.g., 101 to 105 for Floor 1; 201 to 205 for Floor 2).

- Status Colors:

  * RED: Ocupado (Currently occupied).

  * GREEN: Programado (Scheduled class today in blocks of 40min, 1h 40min, or 2h 40min).

  * AMBER/YELLOW: Disponible (Unassigned/Free space).

- Classroom Detail Modal (Clicking any circle, e.g., "F104"):

  * If Occupied/Programmed: Displays Course name, Career, Professor Name, and time range.

  * If Disponible (Yellow): Shows "Habilitar Clase de Emergencia" form with fields to select Professor, Duration (40m, 1h40m, 2h40m), and button "Otorgar Permiso Inmediato".

3. GESTIÓN DE PROFESORES MODULE:

- Top Right Button: "+ Agregar Nuevo Profesor" (Modal: Nombres, Apellidos, DNI, Correo, Celular).

- Top Filter: Toggle buttons / Dropdown to filter table by "Todos", "Con Tarjeta", and "Sin Tarjeta".

- Data Table: Displays Name, DNI, Contact, Assigned RFID Code (or "Sin Tarjeta" badge).

- Actions: "Deshabilitar Tarjeta" (unlinks card, moving professor to "Sin Tarjeta" status) and "Eliminar Profesor".

4. TARJETAS RFID MODULE:

- Two Tabs: "Tarjetas Asignadas" and "Stock Disponible (Sin Asignar)".

- Assigned Cards Tab: Table showing Card Code (e.g., "RFID-8A3F"), Assigned Professor, Status (Activa/Inactiva), "Ver Aulas Autorizadas" button (opens weekly schedule grid), and an "Eliminar Tarjeta" button.

- Stock Disponible Tab (Unassigned Cards):

  * Lists available unassigned RFID chips.

  * Includes an "Asignar a Profesor" button on each row.

  * Clicking "Asignar a Profesor" opens a modal with a Dropdown Select populated ONLY with professors currently in "Sin Tarjeta" status. Confirming links the card immediately.

5. SOLICITUDES Y NOTIFICACIONES MODULE:

- Inbox for Administrator to approve or reject professor access requests with "Aprobar" / "Rechazar" action buttons.

6. REGISTRO DE ACCESOS (LOGS) MODULE:

- Detailed audit log table: Date/Time, Classroom, Professor Name, RFID Tag ID, and Access Result ("CONCEDIDO" / "DENEGADO"). Filter controls and "Exportar Reporte" button.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://teck-access-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/260ec441-e964-5cf1-bd2c-8eac6908e585).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
