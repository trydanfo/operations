import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, apiUpload } from "./api"

export const VEHICLES_PAGE_SIZE = 10

export type VehicleStatus = "active" | "suspended" | "retired"

export type Vehicle = {
  id: number
  createdAt: string
  updatedAt: string
  publicCode: string
  plateNumber: string
  plateState: string
  status: VehicleStatus
  imageUrl: string
}

export type ExistingVehicle = {
  id: number
  publicCode: string
  plateNumber: string
  status: VehicleStatus
}

export type PlateScan = {
  plateNumber: string
  confidence: string
  plateState: string
  ocrError?: string
  existingVehicle?: ExistingVehicle
}

export function useVehicles(search: string, page: number) {
  return useQuery({
    queryKey: ["vehicles", search, page],
    queryFn: () =>
      api<Vehicle[]>(
        `/api/v1/ops/vehicles?search=${encodeURIComponent(search)}&limit=${VEHICLES_PAGE_SIZE}&offset=${page * VEHICLES_PAGE_SIZE}`,
      ),
    placeholderData: (previous) => previous,
  })
}

export function useVehiclesByIds(ids: number[]) {
  return useQuery({
    queryKey: ["vehicles-by-ids", ids.join(",")],
    queryFn: () => api<Vehicle[]>(`/api/v1/ops/vehicles?ids=${ids.join(",")}`),
    enabled: ids.length > 0,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => api<Vehicle>(`/api/v1/ops/vehicles/${id}`),
  })
}

export type VehicleLocation = {
  source: "live" | "last_ride" | "none"
  lat?: number
  lng?: number
  at?: string
  tripId?: number
}

export function useVehicleLocation(id: string) {
  return useQuery({
    queryKey: ["vehicle-location", id],
    queryFn: () => api<VehicleLocation>(`/api/v1/ops/vehicles/${id}/location`),
    enabled: !!id,
  })
}

export function useVehicleByPlate(plate: string) {
  const trimmed = plate.trim()
  return useQuery({
    queryKey: ["vehicle-by-plate", trimmed.toLowerCase()],
    queryFn: () =>
      api<{ existingVehicle: ExistingVehicle | null }>(
        `/api/v1/ops/vehicle-by-plate?plate=${encodeURIComponent(trimmed)}`,
      ),
    enabled: trimmed.length > 0,
  })
}

function invalidateVehicleViews(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["vehicles"] })
  queryClient.invalidateQueries({ queryKey: ["vehicle-counts"] })
  queryClient.invalidateQueries({ queryKey: ["stats"] })
  queryClient.invalidateQueries({ queryKey: ["activities"] })
}

export function useScanPlate() {
  return useMutation({
    mutationFn: (image: File) => {
      const form = new FormData()
      form.append("image", image)
      return apiUpload<PlateScan>("/api/v1/ops/vehicles/scan", form)
    },
    retry: 1,
  })
}

export function useRegisterVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      plateNumber,
      plateState,
      image,
    }: {
      plateNumber: string
      plateState?: string
      image?: File
    }) => {
      const form = new FormData()
      form.append("plateNumber", plateNumber)
      if (plateState) form.append("plateState", plateState)
      if (image) form.append("image", image)
      return apiUpload<Vehicle>("/api/v1/ops/vehicles", form)
    },
    onSuccess: () => invalidateVehicleViews(queryClient),
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, plateNumber, status }: { id: number; plateNumber?: string; status?: VehicleStatus }) =>
      api<Vehicle>(`/api/v1/ops/vehicles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ plateNumber, status }),
      }),
    onSuccess: (vehicle) => {
      invalidateVehicleViews(queryClient)
      queryClient.invalidateQueries({ queryKey: ["vehicle", String(vehicle.id)] })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/v1/ops/vehicles/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateVehicleViews(queryClient),
  })
}
