import { useNavigate } from "react-router-dom"

// Goes back through history rather than a fixed path — a page can be reached many ways.
export function BackLink({ label = "back" }: { label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      className="font-mono text-xs text-ink-faint transition-colors hover:text-ink"
    >
      ← {label}
    </button>
  )
}
