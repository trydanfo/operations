import { useState } from "react"
import { Link } from "react-router-dom"
import { useReports, useReportCounts, REPORTS_PAGE_SIZE, formatReportKind } from "../lib/feedback"
import { ApiError } from "../lib/api"
import { Pagination } from "../components/Pagination"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

export function Reports() {
  const [page, setPage] = useState(0)
  const counts = useReportCounts()
  const { data, isLoading, error } = useReports("open", page)

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const reports = data ?? []

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Reports</h1>
      <p className="mt-1 text-sm text-ink-soft">Safety and accountability flags from riders.</p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <CountCard label="Open" value={counts.data?.open} accent />
        <CountCard label="Resolved" value={counts.data?.resolved} />
        <CountCard label="Dismissed" value={counts.data?.dismissed} />
      </div>

      <h2 className="mt-10 font-mono text-xs uppercase tracking-wider text-ink-faint">Open reports</h2>
      <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Plate</th>
              <th className="px-4 py-3 font-medium">Passenger</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-10 text-center font-mono text-ink-faint">loading…</td></tr>
            )}
            {!isLoading && reports.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-ink-faint">No open reports. 🎉</td></tr>
            )}
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-line last:border-0 hover:bg-paper-deep/50">
                <td className="px-4 py-3">
                  <Link to={`/reports/${report.id}`} className="font-medium text-ink hover:text-danfo-deep">
                    {formatReportKind(report.kind)}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-ink-soft">{report.plate}</td>
                <td className="px-4 py-3 text-ink-soft">{report.passenger || "—"}</td>
                <td className="px-4 py-3 text-ink-faint">{new Date(report.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} hasNext={reports.length === REPORTS_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

function CountCard({ label, value, accent }: { label: string; value?: number; accent?: boolean }) {
  return (
    <div className="rounded-[var(--radius)] border border-line p-5">
      <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">{label}</div>
      <div className={accent ? "mt-3 font-display text-3xl font-bold text-danfo-deep" : "mt-3 font-display text-3xl font-bold text-ink"}>
        {value ?? 0}
      </div>
    </div>
  )
}
