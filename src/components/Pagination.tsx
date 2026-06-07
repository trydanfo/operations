import { Button } from "./ui/Button"

export function Pagination({
  page,
  hasNext,
  onChange,
}: {
  page: number
  hasNext: boolean
  onChange: (page: number) => void
}) {
  if (page === 0 && !hasNext) return null
  return (
    <div className="mt-4 flex items-center justify-between">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="font-mono text-xs text-ink-faint">Page {page + 1}</span>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  )
}
