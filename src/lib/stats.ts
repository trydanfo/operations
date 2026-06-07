import { useQuery } from "@tanstack/react-query"
import { api } from "./api"

export type StatsRange = "today" | "week" | "month" | "all"

export type Stats = {
  range: StatsRange
  rides: number
  rideShares: number
}

export function useStats(range: StatsRange, status = "") {
  return useQuery({
    queryKey: ["stats", range, status],
    queryFn: () => {
      const params = new URLSearchParams({ range })
      if (status) params.set("status", status)
      return api<Stats>(`/api/v1/ops/stats?${params.toString()}`)
    },
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
