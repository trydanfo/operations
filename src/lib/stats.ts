import { useQuery } from "@tanstack/react-query"
import { api } from "./api"

export type StatsRange = "today" | "week" | "month" | "all"

export type Stats = {
  range: StatsRange
  rides: number
  rideShares: number
}

export function useStats(range: StatsRange) {
  return useQuery({
    queryKey: ["stats", range],
    queryFn: () => api<Stats>(`/api/v1/ops/stats?range=${range}`),
    placeholderData: (previous) => previous,
  })
}

export type VehicleCounts = {
  active: number
  suspended: number
  retired: number
  total: number
}

export function useVehicleCounts() {
  return useQuery({
    queryKey: ["vehicle-counts"],
    queryFn: () => api<VehicleCounts>("/api/v1/ops/vehicle-counts"),
  })
}
