import { cn } from "../lib/cn"

// minimalist rating: filled/unfilled dashes, fits the ops theme
export function DashRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={cn("h-0.5 w-3.5 rounded-full", index < value ? "bg-ink" : "bg-ink/15")}
        />
      ))}
    </span>
  )
}
