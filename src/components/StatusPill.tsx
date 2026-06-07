import { cn } from "../lib/cn"

// covers trip statuses and report statuses; lowercase, lightly rounded, colour per status
const colors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  tracking: "bg-danfo/25 text-danfo-deep",
  boarded: "bg-blue-100 text-blue-700",
  paused: "bg-blue-100 text-blue-700",
  routing: "bg-blue-100 text-blue-700",
  ended: "bg-ink/10 text-ink-soft",
  abandoned: "bg-ink/10 text-ink-faint",
  open: "bg-danfo/25 text-danfo-deep",
  resolved: "bg-green-100 text-green-700",
  dismissed: "bg-ink/10 text-ink-faint",
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-medium lowercase",
        colors[status] ?? "bg-ink/10 text-ink-soft",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}
