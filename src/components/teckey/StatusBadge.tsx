import { cn } from "@/lib/utils";
import type { SlotStatus } from "@/lib/teckey-store";

export const statusLabel: Record<SlotStatus, string> = {
  ocupado: "Ocupado",
  programado: "Programado",
  disponible: "Disponible",
};

export const statusDot: Record<SlotStatus, string> = {
  ocupado: "bg-occupied",
  programado: "bg-scheduled",
  disponible: "bg-available",
};

export const statusCircle: Record<SlotStatus, string> = {
  ocupado: "bg-occupied text-occupied-foreground ring-occupied/25",
  programado: "bg-scheduled text-scheduled-foreground ring-scheduled/25",
  disponible: "bg-available text-available-foreground ring-available/30",
};

export function StatusPill({ status, className }: { status: SlotStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", statusDot[status])} />
      {statusLabel[status]}
    </span>
  );
}
