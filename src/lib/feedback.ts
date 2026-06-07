import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"

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

export function useVehicleReviews(code: string) {
  return useQuery({
    queryKey: ["vehicle-reviews", code],
    queryFn: () => api<VehicleReviews>(`/api/v1/vehicles/by-code/${code}/reviews`),
    enabled: !!code,
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

export const REPORTS_PAGE_SIZE = 50

export function useVehicleReports(vehicleId: number) {
  return useQuery({
    queryKey: ["vehicle-reports", vehicleId],
    queryFn: () => api<ReportListItem[]>(`/api/v1/ops/reports?vehicleId=${vehicleId}`),
    enabled: !!vehicleId,
  })
}

export function useReports(status?: string) {
  return useInfiniteQuery({
    queryKey: ["reports", status ?? ""],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(REPORTS_PAGE_SIZE), offset: String(pageParam) })
      if (status) params.set("status", status)
      return api<ReportListItem[]>(`/api/v1/ops/reports?${params.toString()}`)
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === REPORTS_PAGE_SIZE ? allPages.length * REPORTS_PAGE_SIZE : undefined,
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
