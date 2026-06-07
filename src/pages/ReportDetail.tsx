import { Link, useParams } from "react-router-dom"
import { useReport, useUpdateReportStatus, formatReportKind } from "../lib/feedback"
import { formatDateTime, formatDistance } from "../lib/rides"
import { StatusPill } from "../components/StatusPill"
import { Button } from "../components/ui/Button"

export function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: report, isLoading } = useReport(id ?? "")
  const update = useUpdateReportStatus()

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-faint">loading…</p>
  }
  if (!report) {
    return <p className="text-sm text-ink-soft">Report not found.</p>
  }

  return (
    <div className="max-w-2xl">
      <Link to="/reports" className="font-mono text-xs text-ink-faint hover:text-ink">
        ← reports
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {formatReportKind(report.kind)}
        </h1>
        <StatusPill status={report.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {formatDateTime(report.createdAt)} · reported by {report.reporter || "—"} ·{" "}
        <Link to={`/vehicles/${report.vehicleId}`} className="font-mono text-ink hover:text-danfo-deep">
          {report.plate}
        </Link>
      </p>

      {report.body && (
        <p className="mt-5 rounded-[var(--radius)] border border-line p-4 text-sm text-ink">{report.body}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {report.status !== "resolved" && (
          <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: report.id, status: "resolved" })}>
            Mark resolved
          </Button>
        )}
        {report.status !== "dismissed" && (
          <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: report.id, status: "dismissed" })}>
            Dismiss
          </Button>
        )}
        {report.status !== "open" && (
          <Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => update.mutate({ id: report.id, status: "open" })}>
            Reopen
          </Button>
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">The ride</h2>
        <Link
          to={`/rides/${report.ride.id}`}
          className="mt-3 block rounded-[var(--radius)] border border-line p-4 transition-colors hover:bg-paper-deep/50"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-ink">{report.ride.passenger || "—"}</span>
            <StatusPill status={report.ride.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {formatDateTime(report.ride.startedAt)} · {formatDistance(report.ride.distanceMeters)}
          </p>
          <p className="mt-1 font-mono text-xs text-danfo-deep">view ride →</p>
        </Link>
      </section>
    </div>
  )
}
