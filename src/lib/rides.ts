import { useQuery } from "@tanstack/react-query"
import { api } from "./api"

export const RIDES_PAGE_SIZE = 15

export type RideListItem = {
  id: number
  status: string
  distanceMeters: number | null
  startedAt: string
  endedAt: string | null
  passenger: string
  vehicleId: number
  plate: string
  vehicleCode: string
}

export type RideDetail = RideListItem & {
  routePolyline: string
  reports: { id: number; kind: string; status: string }[]
}

export function useRides(page: number) {
  return useQuery({
    queryKey: ["rides", page],
    queryFn: () => api<RideListItem[]>(`/api/v1/ops/rides?limit=${RIDES_PAGE_SIZE}&offset=${page * RIDES_PAGE_SIZE}`),
    placeholderData: (previous) => previous,
  })
}

export function useRide(id: string) {
  return useQuery({
    queryKey: ["ride", id],
    queryFn: () => api<RideDetail>(`/api/v1/ops/rides/${id}`),
  })
}

export function formatDistance(meters: number | null): string {
  if (meters == null) return "—"
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`
}

function ordinal(day: number): string {
  const suffixes = ["th", "st", "nd", "rd"]
  const value = day % 100
  return day + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0])
}

// formats an ISO timestamp as e.g. "17th of June 2026 at 2:48 pm"
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const month = date.toLocaleString("en-US", { month: "long" })
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const meridiem = date.getHours() >= 12 ? "pm" : "am"
  const hour = date.getHours() % 12 || 12
  return `${ordinal(date.getDate())} of ${month} ${date.getFullYear()} at ${hour}:${minutes} ${meridiem}`
}

export function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "—"
  const minutes = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
  if (minutes < 1) return "< 1 min"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}
