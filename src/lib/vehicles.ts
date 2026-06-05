import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, apiUpload } from "./api"

export type VehicleStatus = "active" | "suspended" | "retired"

export type Vehicle = {
  id: number
  createdAt: string
  updatedAt: string
  publicCode: string
  plateNumber: string
  status: VehicleStatus
}

export function useVehicles(search: string) {
  return useQuery({
    queryKey: ["vehicles", search],
    queryFn: () =>
      api<Vehicle[]>(`/api/v1/ops/vehicles${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => api<Vehicle>(`/api/v1/ops/vehicles/${id}`),
  })
}

function invalidateVehicleViews(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["vehicles"] })
  queryClient.invalidateQueries({ queryKey: ["stats"] })
  queryClient.invalidateQueries({ queryKey: ["activities"] })
}

export type PlateScan = {
  plateNumber: string
  confidence: string
  plateState: string
  imageUrl: string
}

export function useScanPlate() {
  return useMutation({
    mutationFn: (image: File) => {
      const form = new FormData()
      form.append("image", image)
      return apiUpload<PlateScan>("/api/v1/ops/vehicles/scan", form)
    },
  })
}

export function useRegisterVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ plateNumber, imageUrl }: { plateNumber: string; imageUrl?: string }) =>
      api<Vehicle>("/api/v1/ops/vehicles", {
        method: "POST",
        body: JSON.stringify({ plateNumber, imageUrl }),
      }),
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
