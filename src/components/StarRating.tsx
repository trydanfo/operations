import { Star } from "lucide-react"
import { cn } from "../lib/cn"

// filled / unfilled black stars — minimal, on-theme
export function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, index) => (
        <Star
          key={index}
          className={cn("h-3.5 w-3.5", index < value ? "fill-ink text-ink" : "fill-none text-ink/25")}
        />
      ))}
    </span>
  )
}
