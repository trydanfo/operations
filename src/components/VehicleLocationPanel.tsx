import { Link } from "react-router-dom"
import { useVehicleLocation } from "../lib/vehicles"
import { relativeTime } from "../lib/activities"
import { formatDateTime } from "../lib/rides"
import { PointMap } from "./PointMap"

export function VehicleLocationPanel({ vehicleId }: { vehicleId: number }) {
  const { data, isLoading } = useVehicleLocation(String(vehicleId))

  if (isLoading) {
    return (
      <div className="mt-6 rounded-[var(--radius)] border border-line p-4 font-mono text-xs text-ink-faint">
        locating…
      </div>
    )
  }
  if (!data || data.source === "none" || data.lat == null || data.lng == null) {
    return (
      <div className="mt-6 rounded-[var(--radius)] border border-line p-4 text-sm text-ink-faint">
        No location on record yet.
      </div>
    )
  }

  const live = data.source === "live"

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">
          {live ? "Live location" : "Last known location"}
        </h2>
        {live ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danfo/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-danfo-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-danfo-deep" />
            live
          </span>
        ) : (
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            from last ride
          </span>
        )}
      </div>

      <div className="mt-3">
        <PointMap lat={data.lat} lng={data.lng} height="240px" />
      </div>

      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-ink-faint">
        {live ? (
          <span>pinged {data.at ? relativeTime(data.at) : "recently"}</span>
        ) : (
          <>
            <span>dropped off {data.at ? formatDateTime(data.at) : "—"}</span>
            {data.tripId && (
              <Link to={`/rides/${data.tripId}`} className="transition-colors hover:text-danfo-deep">
                view ride →
              </Link>
            )}
          </>
        )}
        <span className="text-ink-faint/70">
          {data.lat.toFixed(5)}, {data.lng.toFixed(5)}
        </span>
      </div>
    </div>
  )
}
