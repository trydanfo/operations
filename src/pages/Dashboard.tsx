import { useState } from "react"
import { useAudit, activityVerb, relativeTime, AUDIT_PAGE_SIZE, type Activity } from "../lib/activities"
import { ApiError } from "../lib/api"
import { Pagination } from "../components/Pagination"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

export function Dashboard() {
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useAudit(page)

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const entries = data ?? []

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Activity</h1>
      <p className="mt-1 text-sm text-ink-soft">Every staff action across the console, newest first.</p>

      <div className="mt-6 rounded-[var(--radius)] border border-line">
        {isLoading && <p className="px-5 py-10 text-center font-mono text-sm text-ink-faint">loading…</p>}
        {!isLoading && entries.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">Nothing recorded yet.</p>
        )}
        {entries.map((entry, index) => (
          <ActivityRow key={entry.id} entry={entry} last={index === entries.length - 1} />
        ))}
      </div>

      <Pagination page={page} hasNext={entries.length === AUDIT_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

function ActivityRow({ entry, last }: { entry: Activity; last: boolean }) {
  const isDelete = entry.action === "vehicle.deleted"
  return (
    <div className={last ? "px-5 py-3.5" : "border-b border-line px-5 py-3.5"}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-ink">{entry.actorName}</span> {activityVerb(entry.action)}{" "}
          <span className={isDelete ? "font-mono text-ink-faint line-through" : "font-mono text-ink"}>
            {entry.targetLabel}
          </span>
        </p>
        <span className="shrink-0 font-mono text-xs text-ink-faint">{relativeTime(entry.createdAt)}</span>
      </div>
      {entry.detail && <p className="mt-0.5 font-mono text-xs text-ink-faint">{entry.detail}</p>}
    </div>
  )
}
