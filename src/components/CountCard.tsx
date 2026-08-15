// The stat tile used across the console. Lifted out of Reports/Rides, which each had their own copy.
export function CountCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value?: number
  accent?: boolean
  hint?: string
}) {
  return (
    <div className="rounded-[var(--radius)] border border-line p-5">
      <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className={
          accent
            ? "mt-3 font-display text-3xl font-bold text-danfo-deep"
            : "mt-3 font-display text-3xl font-bold text-ink"
        }
      >
        {(value ?? 0).toLocaleString()}
      </div>
      {hint && <div className="mt-1 font-mono text-xs text-ink-faint">{hint}</div>}
    </div>
  )
}
