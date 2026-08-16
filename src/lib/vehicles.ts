import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, apiUpload } from "./api"
import { forgetTag } from "./tags"

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
      tagCode,
    }: {
      plateNumber: string
      plateState?: string
      image?: File
      tagCode?: string
    }) => {
      const form = new FormData()
      form.append("plateNumber", plateNumber)
      if (plateState) form.append("plateState", plateState)
      if (image) form.append("image", image)
      if (tagCode) form.append("tagCode", tagCode)
      return apiUpload<Vehicle>("/api/v1/ops/vehicles", form)
    },
    onSuccess: (_vehicle, { tagCode }) => {
      invalidateVehicleViews(queryClient)
      // Registering consumes the tag — the server deletes it in the same transaction — so every
      // cached view of that scanned code is wrong the moment this lands: the "still in the field"
      // list would keep printing it, and the form's lookup would keep answering ✓ for a code that
      // no longer exists.
      if (tagCode) forgetTag(queryClient, tagCode)
    },
    onError: (_error, { tagCode }) => {
      // The failure we most expect here is the tag being claimed by another operator between this
      // form's lookup and this submit — the server answers 409 for exactly that. Since the cached ✓
      // is what let the operator submit a dead code, drop it on any failed registration rather than
      // reading the status: forgetting only forces the next check to ask the server, so it is safe
      // when the error had nothing to do with the tag.
      if (tagCode) forgetTag(queryClient, tagCode)
    },
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
