import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useVehicles } from "../lib/vehicles"
import { VehicleQR } from "../components/VehicleQR"
import { Button } from "../components/ui/Button"

export function Print() {
  const [params] = useSearchParams()
  const ids = (params.get("ids") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number)

  const { data: vehicles, isLoading } = useVehicles("")
  const selected = (vehicles ?? []).filter((vehicle) => ids.includes(vehicle.id))

  useEffect(() => {
    if (!isLoading && selected.length > 0) {
      const timer = setTimeout(() => window.print(), 400)
      return () => clearTimeout(timer)
    }
  }, [isLoading, selected.length])

  if (isLoading) {
    return <p className="p-10 font-mono text-sm text-ink-faint">loading…</p>
  }

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="no-print mb-8 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-ink">
          Print stickers · {selected.length}
        </h1>
        <Button size="sm" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {selected.map((vehicle) => (
          <div
            key={vehicle.id}
            className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-ink/15 p-5"
          >
            <VehicleQR publicCode={vehicle.publicCode} size={140} />
            <div className="text-center">
              <div className="font-mono text-sm font-semibold text-ink">{vehicle.plateNumber}</div>
              <div className="font-mono text-xs text-ink-faint">{vehicle.publicCode}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
