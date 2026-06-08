import type { ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { useRide, formatDistance, formatDateTime, formatDuration } from "../lib/rides"
import { formatReportKind } from "../lib/feedback"
import { StatusPill } from "../components/StatusPill"
import { RouteMap, parsePolyline } from "../components/RouteMap"
import { BackLink } from "../components/BackLink"

export function RideDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: ride, isLoading } = useRide(id ?? "")

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-faint">loading…</p>
  }
  if (!ride) {
    return <p className="text-sm text-ink-soft">Ride not found.</p>
  }

  const points = parsePolyline(ride.routePolyline)

  return (
    <div>
      <BackLink />

      <div className="mt-4 flex items-center justify-between gap-4">
        <Link
          to={`/vehicles/${ride.vehicleId}`}
          className="font-display text-2xl font-bold tracking-tight text-ink transition-colors hover:text-danfo-deep"
        >
          {ride.plate || ride.vehicleCode}
        </Link>
        <StatusPill status={ride.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">{formatDateTime(ride.startedAt)}</p>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <Field
          label="Passenger"
          value={
            ride.passengerId ? (
              <Link to={`/users/${ride.passengerId}`} className="text-ink hover:text-danfo-deep">
                {ride.passenger || "—"}
              </Link>
            ) : (
              ride.passenger || "—"
            )
          }
        />
        <Field label="Distance" value={formatDistance(ride.distanceMeters)} />
        <Field label="Duration" value={formatDuration(ride.startedAt, ride.endedAt)} />
      </dl>

      <div className="mt-6">
        <RouteMap points={points} empty="No route recorded for this ride." />
      </div>

      {ride.reports && ride.reports.length > 0 && (
        <div className="mt-6">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">
            Reports on this ride
          </h2>
          <ul className="mt-2 space-y-2">
            {ride.reports.map((report) => (
              <li key={report.id}>
                <Link
                  to={`/reports/${report.id}`}
                  className="flex items-center justify-between rounded-[var(--radius)] border border-line p-3 text-sm transition-colors hover:bg-paper-deep/50"
                >
                  <span className="font-medium text-ink">{formatReportKind(report.kind)}</span>
                  <StatusPill status={report.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-line p-3">
      <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-1 text-ink">{value}</div>
    </div>
  )
}
