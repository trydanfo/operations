import { Link, useParams } from "react-router-dom"
import { MapContainer, TileLayer, Polyline } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useRide, formatDistance, formatDateTime, formatDuration } from "../lib/rides"
import { StatusPill } from "../components/StatusPill"

export function RideDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: ride, isLoading } = useRide(id ?? "")

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-faint">loading…</p>
  }
  if (!ride) {
    return <p className="text-sm text-ink-soft">Ride not found.</p>
  }

  let points: [number, number][] = []
  try {
    if (ride.routePolyline) {
      points = (JSON.parse(ride.routePolyline) as { lat: number; lng: number }[]).map((point) => [
        point.lat,
        point.lng,
      ])
    }
  } catch {
    points = []
  }

  return (
    <div>
      <Link to="/rides" className="font-mono text-xs text-ink-faint hover:text-ink">
        ← rides
      </Link>

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
        <Field label="Passenger" value={ride.passenger || "—"} />
        <Field label="Distance" value={formatDistance(ride.distanceMeters)} />
        <Field label="Duration" value={formatDuration(ride.startedAt, ride.endedAt)} />
      </dl>

      <div className="mt-6">
        {points.length > 1 ? (
          <MapContainer
            bounds={points}
            style={{ height: "440px", width: "100%" }}
            className="overflow-hidden rounded-[var(--radius)] border border-line"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={points} pathOptions={{ color: "#1a1710", weight: 4 }} />
          </MapContainer>
        ) : (
          <div className="rounded-[var(--radius)] border border-line p-10 text-center text-sm text-ink-faint">
            No route recorded for this ride.
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-line p-3">
      <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-1 text-ink">{value}</div>
    </div>
  )
}
