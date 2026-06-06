import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useVehicles } from "../lib/vehicles"
import { ApiError } from "../lib/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { StatusBadge } from "../components/StatusBadge"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

export function Vehicles() {
  const [search, setSearch] = useState("")
  const navigate = useNavigate()
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useVehicles(search)

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const vehicles = data?.pages.flat() ?? []

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Vehicles</h1>
        <Button onClick={() => navigate("/vehicles/new")}>+ Register</Button>
      </div>

      <div className="mt-6">
        <Input
          placeholder="Search by plate…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  )
}
