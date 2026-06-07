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

export const AUDIT_PAGE_SIZE = 10

export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: () => api<Activity[]>("/api/v1/ops/activities"),
  })
}

export function useAudit(page: number) {
  return useQuery({
    queryKey: ["audit", page],
    queryFn: () =>
      api<Activity[]>(
        `/api/v1/ops/activities?limit=${AUDIT_PAGE_SIZE}&offset=${page * AUDIT_PAGE_SIZE}`,
      ),
    placeholderData: (previous) => previous,
  })
}

const actionVerbs: Record<string, string> = {
  "vehicle.registered": "registered",
  "vehicle.edited": "edited",
  "vehicle.deleted": "deleted",
  "report.resolved": "resolved a report on",
  "report.dismissed": "dismissed a report on",
  "report.reopened": "reopened a report on",
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
