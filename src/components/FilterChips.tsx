import { cn } from "../lib/cn"

export type ChipOption<T extends string> = { value: T; label: string }

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            value === option.value
              ? "border-ink bg-ink text-paper"
              : "border-line text-ink-soft hover:border-ink/40",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export const timeWindowOptions: ChipOption<"all" | "today" | "week" | "month">[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
]
