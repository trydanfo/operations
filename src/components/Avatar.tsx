function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0][0]!.toUpperCase()
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase()
}

export function Avatar({ src, name, size = 36 }: { src?: string; name: string; size?: number }) {
  const dimension = { width: size, height: size }
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={dimension}
        className="shrink-0 rounded-full border border-line object-cover"
      />
    )
  }
  return (
    <div
      style={dimension}
      className="flex shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-medium text-paper"
    >
      {initials(name)}
    </div>
  )
}
