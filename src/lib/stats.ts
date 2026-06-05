import { useQuery } from "@tanstack/react-query"
import { api } from "./api"

export type Stats = {
  vehicles: number
  users: number
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/v1/ops/stats"),
  })
}
