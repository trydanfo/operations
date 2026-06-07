import { useQuery } from "@tanstack/react-query"
import { api } from "./api"

export type VehicleReviews = {
  average: number
  count: number
  reviews: { rating: number; body: string; reviewer: string; createdAt: string }[]
}

export function useVehicleReviews(code: string) {
  return useQuery({
    queryKey: ["vehicle-reviews", code],
    queryFn: () => api<VehicleReviews>(`/api/v1/vehicles/by-code/${code}/reviews`),
    enabled: !!code,
  })
}

export type Report = {
  id: number
  kind: string
  status: string
  body: string
  tripId: number
  createdAt: string
}

export function useVehicleReports(vehicleId: number) {
  return useQuery({
    queryKey: ["vehicle-reports", vehicleId],
    queryFn: () => api<Report[]>(`/api/v1/ops/reports?vehicleId=${vehicleId}`),
    enabled: !!vehicleId,
  })
}

export const moodEmoji = ["", "😞", "🙁", "😐", "🙂", "😄"]
