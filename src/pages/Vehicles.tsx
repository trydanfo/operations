import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useVehicles, type Vehicle } from "../lib/vehicles"
import { ApiError } from "../lib/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { StatusBadge } from "../components/StatusBadge"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

export function Vehicles() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const navigate = useNavigate()
  const { data: vehicles, isLoading, error } = useVehicles(search)

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Vehicles</h1>
        <Button onClick={() => navigate("/vehicles/new")}>+ Register</Button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Input
          placeholder="Search by plate…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        {selected.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/print?ids=${selected.join(",")}`)}
          >
            Print {selected.length}
          </Button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius)] border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-wider text-ink-faint">
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 font-medium">Plate</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center font-mono text-ink-faint">
                  loading…
                </td>
              </tr>
            )}
            {vehicles?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-faint">
                  No vehicles yet. Register the first one.
                </td>
              </tr>
            )}
            {vehicles?.map((vehicle) => (
              <Row
                key={vehicle.id}
                vehicle={vehicle}
                checked={selected.includes(vehicle.id)}
                onToggle={() => toggle(vehicle.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({
  vehicle,
  checked,
  onToggle,
}: {
  vehicle: Vehicle
  checked: boolean
  onToggle: () => void
}) {
  return (
    <tr className="border-b border-line last:border-0 hover:bg-paper-deep/50">
      <td className="px-4 py-3">
        <input type="checkbox" checked={checked} onChange={onToggle} className="accent-ink" />
      </td>
      <td className="px-4 py-3">
        <Link to={`/vehicles/${vehicle.id}`} className="font-medium text-ink hover:text-danfo-deep">
          {vehicle.plateNumber}
        </Link>
      </td>
      <td className="px-4 py-3 font-mono text-ink-soft">{vehicle.publicCode}</td>
      <td className="px-4 py-3">
        <StatusBadge status={vehicle.status} />
      </td>
    </tr>
  )
}
