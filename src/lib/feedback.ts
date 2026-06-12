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
  tripId: number
  vehicleId: number
  plate: string
}

export type VehicleReviews = {
  average: number
  count: number
  reviews: ReviewItem[]
}

export type ReviewSort = "newest" | "oldest" | "highest" | "lowest"
export type ReviewSince = "all" | "today" | "week" | "month"

function reviewsQueryString(page: number, sort: ReviewSort, since: ReviewSince) {
  const params = new URLSearchParams({
    limit: String(REVIEWS_PAGE_SIZE),
    offset: String(page * REVIEWS_PAGE_SIZE),
    sort,
  })
  if (since !== "all") params.set("since", since)
  return params.toString()
}

export function useVehicleReviews(vehicleId: number, page: number, sort: ReviewSort, since: ReviewSince) {
  return useQuery({
    queryKey: ["vehicle-reviews", vehicleId, page, sort, since],
    queryFn: () =>
      api<VehicleReviews>(`/api/v1/ops/vehicles/${vehicleId}/reviews?${reviewsQueryString(page, sort, since)}`),
    enabled: !!vehicleId,
    placeholderData: (previous) => previous,
  })
}

export function useUserReviews(userId: number, page: number, sort: ReviewSort, since: ReviewSince) {
  return useQuery({
    queryKey: ["user-reviews", userId, page, sort, since],
    queryFn: () =>
      api<VehicleReviews>(`/api/v1/ops/users/${userId}/reviews?${reviewsQueryString(page, sort, since)}`),
    enabled: !!userId,
    placeholderData: (previous) => previous,
  })
}

export type ReportListItem = {
  id: number
  kind: string
  status: string
  body: string
  public: boolean
  publicNote: string
  createdAt: string
  plate: string
  vehicleId: number
  passenger: string
  reporterId: number
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

export function useReports(status: string, since: string, page: number, userId?: number) {
  return useQuery({
    queryKey: ["reports", status, since, page, userId ?? null],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(REPORTS_PAGE_SIZE),
        offset: String(page * REPORTS_PAGE_SIZE),
      })
      if (status) params.set("status", status)
      if (since && since !== "all") params.set("since", since)
      if (userId) params.set("userId", String(userId))
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
  public: boolean
  publicNote: string
  createdAt: string
  reporter: string
  reporterId: number
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

// publish/unpublish a report to the vehicle's public profile + edit its ops-authored note
export function useUpdateReportVisibility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, public: isPublic, publicNote }: { id: number; public: boolean; publicNote: string }) =>
      api(`/api/v1/ops/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ public: isPublic, publicNote }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["report", String(variables.id)] })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      queryClient.invalidateQueries({ queryKey: ["vehicle-reports"] })
    },
  })
}

export function formatReportKind(kind: string): string {
  return kind.replace(/_/g, " ")
}
