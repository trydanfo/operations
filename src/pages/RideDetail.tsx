import { Link, useParams } from "react-router-dom"
import { MapContainer, TileLayer, Polyline } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useRide, formatDistance } from "../lib/rides"

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
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">
        {ride.plate || ride.vehicleCode}
      </h1>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Field label="Rider" value={ride.rider || "—"} />
        <Field label="Status" value={ride.status} />
        <Field label="Distance" value={formatDistance(ride.distanceMeters)} />
        <Field label="When" value={new Date(ride.startedAt).toLocaleString()} />
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
