import { Link, useNavigate, useParams } from "react-router-dom"
import { useVehicle, useUpdateVehicleStatus, type VehicleStatus } from "../lib/vehicles"
import { Button } from "../components/ui/Button"
import { StatusBadge } from "../components/StatusBadge"
import { VehicleQR, vehicleScanUrl } from "../components/VehicleQR"

const allStatuses: VehicleStatus[] = ["active", "suspended", "retired"]

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: vehicle, isLoading } = useVehicle(id ?? "")
  const updateStatus = useUpdateVehicleStatus()

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-faint">loading…</p>
  }
  if (!vehicle) {
    return <p className="text-sm text-ink-soft">Vehicle not found.</p>
  }

  const otherStatuses = allStatuses.filter((status) => status !== vehicle.status)

  return (
    <div>
      <Link to="/" className="font-mono text-xs text-ink-faint hover:text-ink">
        ← vehicles
      </Link>

      <div className="mt-4 grid gap-10 sm:grid-cols-2">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {vehicle.plateNumber}
          </h1>
          <div className="mt-2">
            <StatusBadge status={vehicle.status} />
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <dt className="text-ink-faint">Public code</dt>
              <dd className="font-mono text-ink">{vehicle.publicCode}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
              <dt className="text-ink-faint">Scan URL</dt>
              <dd className="truncate font-mono text-ink-soft">{vehicleScanUrl(vehicle.publicCode)}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-2">
              <dt className="text-ink-faint">Registered</dt>
              <dd className="text-ink-soft">{new Date(vehicle.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            {otherStatuses.map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: vehicle.id, status })}
              >
                Mark {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-[var(--radius)] border border-line p-6">
          <VehicleQR publicCode={vehicle.publicCode} />
          <div className="text-center">
            <div className="font-mono text-sm font-medium text-ink">{vehicle.plateNumber}</div>
            <div className="font-mono text-xs text-ink-faint">{vehicle.publicCode}</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/print?ids=${vehicle.id}`)}>
            Print sticker
          </Button>
        </div>
      </div>
    </div>
  )
}
