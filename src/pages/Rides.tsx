import { useState } from "react"
import { Link } from "react-router-dom"
import { useRides, RIDES_PAGE_SIZE, formatDistance, formatDateTime } from "../lib/rides"
import { useStats, type StatsRange } from "../lib/stats"
import { ApiError } from "../lib/api"
import { StatusPill } from "../components/StatusPill"
import { Pagination } from "../components/Pagination"
import { FilterChips, timeWindowOptions, type ChipOption } from "../components/FilterChips"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"
import { CountCard } from "../components/CountCard"

const statusOptions: ChipOption<string>[] = [
  { value: "", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
  { value: "live", label: "Live" },
]

export function Rides() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState("")
  const [since, setSince] = useState<StatsRange>("all")
  const { data, isLoading, error } = useRides(page, status, since)
  const stats = useStats(since, status)

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const rides = data ?? []

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Rides</h1>
      <p className="mt-1 text-sm text-ink-soft">Every trip taken on the network.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <CountCard label="Rides" value={stats.data?.rides} accent />
        <CountCard label="Ride shares" value={stats.data?.rideShares} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          options={statusOptions}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(0)
          }}
        />
        <FilterChips
          options={timeWindowOptions}
          value={since}
          onChange={(value) => {
            setSince(value)
            setPage(0)
          }}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-line">
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
                <td colSpan={5} className="px-4 py-10 text-center text-ink-faint">No rides match these filters.</td>
              </tr>
            )}
            {rides.map((ride) => (
              <tr key={ride.id} className="border-b border-line last:border-0 hover:bg-paper-deep/50">
                <td className="px-4 py-3">
                  <Link to={`/rides/${ride.id}`} className="font-medium text-ink hover:text-danfo-deep">
                    {ride.plate || ride.vehicleCode}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {ride.passengerId ? (
                    <Link to={`/users/${ride.passengerId}`} className="text-ink-soft hover:text-danfo-deep">
                      {ride.passenger || "—"}
                    </Link>
                  ) : (
                    <span className="text-ink-soft">{ride.passenger || "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3"><StatusPill status={ride.status} /></td>
                <td className="px-4 py-3 text-ink-soft">{formatDistance(ride.distanceMeters)}</td>
                <td className="px-4 py-3 text-ink-faint">{formatDateTime(ride.startedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} hasNext={rides.length === RIDES_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}
