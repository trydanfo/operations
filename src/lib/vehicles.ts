import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"

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

export function useRegisterVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (plateNumber: string) =>
      api<Vehicle>("/api/v1/ops/vehicles", {
        method: "POST",
        body: JSON.stringify({ plateNumber }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
  })
}

export function useUpdateVehicleStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: VehicleStatus }) =>
      api<Vehicle>(`/api/v1/ops/vehicles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      queryClient.invalidateQueries({ queryKey: ["vehicle", String(vehicle.id)] })
    },
  })
}
