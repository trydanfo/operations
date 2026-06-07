import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useVehicles, VEHICLES_PAGE_SIZE } from "../lib/vehicles"
import { useVehicleCounts } from "../lib/stats"
import { ApiError } from "../lib/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { StatusBadge } from "../components/StatusBadge"
import { Pagination } from "../components/Pagination"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

export function Vehicles() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const navigate = useNavigate()
  const { data, isLoading, error } = useVehicles(search, page)
  const counts = useVehicleCounts()

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const vehicles = data ?? []

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Vehicles</h1>
        <Button onClick={() => navigate("/vehicles/new")}>+ Register</Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CountCard label="Total" value={counts.data?.total} />
        <CountCard label="Active" value={counts.data?.active} accent />
        <CountCard label="Suspended" value={counts.data?.suspended} />
        <CountCard label="Retired" value={counts.data?.retired} />
      </div>

      <div className="mt-6">
        <Input
          placeholder="Search by plate…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
          }}
          className="max-w-xs"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius)] border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 font-medium">Plate</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center font-mono text-ink-faint">
                  loading…
                </td>
              </tr>
            )}
            {!isLoading && vehicles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-ink-faint">
                  No vehicles yet. Register the first one.
                </td>
              </tr>
            )}
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-b border-line last:border-0 hover:bg-paper-deep/50">
                <td className="px-4 py-3">
                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className="font-medium text-ink hover:text-danfo-deep"
                  >
                    {vehicle.plateNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-ink-soft">{vehicle.publicCode}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={vehicle.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} hasNext={vehicles.length === VEHICLES_PAGE_SIZE} onChange={setPage} />
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
