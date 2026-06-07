import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"

export const REPORTS_PAGE_SIZE = 10
export const REVIEWS_PAGE_SIZE = 10
export const VEHICLE_REPORTS_PAGE_SIZE = 10

export type ReviewItem = {
  rating: number
  body: string
  reviewer: string
  anonymous: boolean
  createdAt: string
}

export type VehicleReviews = {
  average: number
  count: number
  reviews: ReviewItem[]
}

export type ReviewSort = "newest" | "oldest" | "highest" | "lowest"

export function useVehicleReviews(code: string, page: number, sort: ReviewSort) {
  return useQuery({
    queryKey: ["vehicle-reviews", code, page, sort],
    queryFn: () =>
      api<VehicleReviews>(
        `/api/v1/vehicles/by-code/${code}/reviews?limit=${REVIEWS_PAGE_SIZE}&offset=${page * REVIEWS_PAGE_SIZE}&sort=${sort}`,
      ),
    enabled: !!code,
    placeholderData: (previous) => previous,
  })
}

export type ReportListItem = {
  id: number
  kind: string
  status: string
  createdAt: string
  plate: string
  vehicleId: number
  passenger: string
}

export function useVehicleReports(vehicleId: number, page: number, status: string) {
  return useQuery({
    queryKey: ["vehicle-reports", vehicleId, page, status],
    queryFn: () => {
      const params = new URLSearchParams({
        vehicleId: String(vehicleId),
        limit: String(VEHICLE_REPORTS_PAGE_SIZE),
        offset: String(page * VEHICLE_REPORTS_PAGE_SIZE),
      })
      if (status) params.set("status", status)
      return api<ReportListItem[]>(`/api/v1/ops/reports?${params.toString()}`)
    },
    enabled: !!vehicleId,
    placeholderData: (previous) => previous,
  })
}

export function useReports(status: string, page: number) {
  return useQuery({
    queryKey: ["reports", status, page],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(REPORTS_PAGE_SIZE),
        offset: String(page * REPORTS_PAGE_SIZE),
      })
      if (status) params.set("status", status)
      return api<ReportListItem[]>(`/api/v1/ops/reports?${params.toString()}`)
    },
    placeholderData: (previous) => previous,
  })
}

export type ReportCounts = { open: number; resolved: number; dismissed: number }

export function useReportCounts() {
  return useQuery({
    queryKey: ["report-counts"],
    queryFn: () => api<ReportCounts>("/api/v1/ops/report-counts"),
  })
}

export type ReportDetail = {
  id: number
  kind: string
  status: string
  body: string
  createdAt: string
  reporter: string
  vehicleId: number
  plate: string
  ride: { id: number; passenger: string; startedAt: string; distanceMeters: number | null; status: string }
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => api<ReportDetail>(`/api/v1/ops/reports/${id}`),
  })
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(`/api/v1/ops/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["report", String(variables.id)] })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      queryClient.invalidateQueries({ queryKey: ["report-counts"] })
      queryClient.invalidateQueries({ queryKey: ["vehicle-reports"] })
    },
  })
}

export function formatReportKind(kind: string): string {
  return kind.replace(/_/g, " ")
}
