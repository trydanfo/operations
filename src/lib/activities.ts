import { useQuery } from "@tanstack/react-query"
import { api } from "./api"

export type Activity = {
  id: number
  createdAt: string
  actorUserId: number
  actorName: string
  action: string
  targetType: string
  targetId: number
  targetLabel: string
  detail: string
}

export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: () => api<Activity[]>("/api/v1/ops/activities"),
  })
}

const actionVerbs: Record<string, string> = {
  "vehicle.registered": "registered",
  "vehicle.edited": "edited",
  "vehicle.deleted": "deleted",
}

export function activityVerb(action: string) {
  return actionVerbs[action] ?? action
}

export function relativeTime(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
