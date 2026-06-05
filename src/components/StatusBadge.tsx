import type { VehicleStatus } from "../lib/vehicles"
import { cn } from "../lib/cn"

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" && "bg-danfo",
          status === "suspended" && "bg-ink-faint",
          status === "retired" && "bg-ink/20",
        )}
      />
      <span className={cn(status === "retired" ? "text-ink-faint line-through" : "text-ink-soft")}>
        {status}
      </span>
    </span>
  )
}
