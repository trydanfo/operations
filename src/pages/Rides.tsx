import { useState } from "react"
import { Link } from "react-router-dom"
import { useRides, RIDES_PAGE_SIZE, formatDistance } from "../lib/rides"
import { ApiError } from "../lib/api"
import { StatusPill } from "../components/StatusPill"
import { Pagination } from "../components/Pagination"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

export function Rides() {
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useRides(page)

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const rides = data ?? []

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Rides</h1>
      <p className="mt-1 text-sm text-ink-soft">Every trip taken on the network.</p>

      <div className="mt-6 overflow-hidden rounded-[var(--radius)] border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 font-medium">Plate</th>
              <th className="px-4 py-3 font-medium">Passenger</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Distance</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-mono text-ink-faint">loading…</td>
              </tr>
            )}
            {!isLoading && rides.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-faint">No rides yet.</td>
              </tr>
            )}
            {rides.map((ride) => (
              <tr key={ride.id} className="border-b border-line last:border-0 hover:bg-paper-deep/50">
                <td className="px-4 py-3">
                  <Link to={`/rides/${ride.id}`} className="font-medium text-ink hover:text-danfo-deep">
                    {ride.plate || ride.vehicleCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{ride.passenger || "—"}</td>
                <td className="px-4 py-3"><StatusPill status={ride.status} /></td>
                <td className="px-4 py-3 text-ink-soft">{formatDistance(ride.distanceMeters)}</td>
                <td className="px-4 py-3 text-ink-faint">{new Date(ride.startedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} hasNext={rides.length === RIDES_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}
