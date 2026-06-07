import { MapContainer, TileLayer, Polyline } from "react-leaflet"
import "leaflet/dist/leaflet.css"

export function parsePolyline(routePolyline: string | null | undefined): [number, number][] {
  if (!routePolyline) return []
  try {
    return (JSON.parse(routePolyline) as { lat: number; lng: number }[]).map((point) => [point.lat, point.lng])
  } catch {
    return []
  }
}

// RouteMap renders a trip's polyline. Remount it (via a React key) when the route changes so Leaflet
// re-fits its bounds — MapContainer only reads bounds on mount.
export function RouteMap({
  points,
  height = "440px",
  empty = "No route to show.",
}: {
  points: [number, number][]
  height?: string
  empty?: string
}) {
  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-[var(--radius)] border border-line p-6 text-center text-sm text-ink-faint"
        style={{ minHeight: height }}
      >
        {empty}
      </div>
    )
  }
  return (
    <MapContainer
      bounds={points}
      style={{ height, width: "100%" }}
      className="overflow-hidden rounded-[var(--radius)] border border-line"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={points} pathOptions={{ color: "#1a1710", weight: 4 }} />
    </MapContainer>
  )
}
