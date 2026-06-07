import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { api } from "./api"

export const RIDES_PAGE_SIZE = 50

export type RideListItem = {
  id: number
  status: string
  distanceMeters: number | null
  startedAt: string
  endedAt: string | null
  rider: string
  plate: string
  vehicleCode: string
}

export type RideDetail = RideListItem & {
  routePolyline: string
}

export function useRides() {
  return useInfiniteQuery({
    queryKey: ["rides"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<RideListItem[]>(`/api/v1/ops/rides?limit=${RIDES_PAGE_SIZE}&offset=${pageParam}`),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === RIDES_PAGE_SIZE ? allPages.length * RIDES_PAGE_SIZE : undefined,
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
