import { Link } from "react-router-dom"
import { formatReportKind, type ReportListItem } from "../lib/feedback"
import { formatDateTime } from "../lib/rides"
import { StatusPill } from "./StatusPill"

// showPlate is for contexts (a user's reports) where the vehicle matters; on a vehicle page it's redundant.
export function ReportCard({ report, showPlate = false }: { report: ReportListItem; showPlate?: boolean }) {
  return (
    <Link
      to={`/reports/${report.id}`}
      className="block rounded-[var(--radius)] border border-line p-4 transition-colors hover:bg-paper-deep/50"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">{formatReportKind(report.kind)}</span>
        <StatusPill status={report.status} />
      </div>
      {report.body && <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{report.body}</p>}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-faint">
        <span>by {report.passenger || "—"}</span>
        <span>·</span>
        <span>{formatDateTime(report.createdAt)}</span>
        {showPlate && (
          <>
            <span>·</span>
            <span className="text-ink-soft">{report.plate}</span>
          </>
        )}
      </div>
    </Link>
  )
}
