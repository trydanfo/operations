import { useQuery } from "@tanstack/react-query"
import { api } from "./api"

export const SCANS_PAGE_SIZE = 10

// The funnel stages, in reading order. Mirrors the server's list — the labels are what ops reads.
export const stageLabels: Record<string, string> = {
  scanned: "Scanned a code",
  viewed: "Saw the danfo",
  board_tapped: "Tapped Board",
  signin_shown: "Sent to sign-in",
  signed_in: "Signed in",
  boarded: "Started a ride",
  ride_ended: "Finished a ride",
}

export const outcomeLabels: Record<string, string> = {
  resolved: "Known danfo",
  unregistered_tag: "Sticker not yet linked",
  unknown: "Unrecognised code",
}

export function stageLabel(stage: string) {
  return stageLabels[stage] ?? stage.replace(/_/g, " ")
}

export type ScanListItem = {
  id: number
  code: string
  outcome: string
  source: string
  createdAt: string
  reached: string[]
  stage: string
  vehicleId: number | null
  plate: string
  passenger: string
  passengerId: number | null
  tripId: number | null
}

export function useScans(page: number, stage: string, outcome: string, since: string, userId?: number) {
  return useQuery({
    queryKey: ["scans", page, stage, outcome, since, userId ?? null],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(SCANS_PAGE_SIZE),
        offset: String(page * SCANS_PAGE_SIZE),
      })
      if (stage) params.set("stage", stage)
      if (outcome) params.set("outcome", outcome)
      if (since && since !== "all") params.set("since", since)
      if (userId) params.set("userId", String(userId))
      return api<ScanListItem[]>(`/api/v1/ops/scans?${params.toString()}`)
    },
    placeholderData: (previous) => previous,
  })
}

export type ScanFunnel = {
  range: string
  total: number
  devices: number
  users: number
  outcomes: Record<string, number>
  stages: { stage: string; count: number; stoppedHere: number }[]
}

export function useScanFunnel(range: string) {
  return useQuery({
    queryKey: ["scan-funnel", range],
    queryFn: () => api<ScanFunnel>(`/api/v1/ops/scan-funnel?range=${range}`),
    placeholderData: (previous) => previous,
  })
}

export type JourneyEntry = {
  // "stage" is one step with the time it actually happened
  type: "stage" | "feedback"
  createdAt: string
  scanId?: number
  code?: string
  plate?: string
  outcome?: string
  reached?: string[]
  stage?: string
  tripId?: number | null
  lastSeen?: string
  kind?: string
  body?: string
  rating?: number
  screen?: string
}

export type Journey = { entries: JourneyEntry[]; identified: boolean }

// Keyed by a scan or a user, never by device — the device id is a server-side join key that is never
// sent to the console.
export function useJourney(key: { scanId?: number; userId?: number } | null) {
  const query = key?.scanId ? `scanId=${key.scanId}` : key?.userId ? `userId=${key.userId}` : ""
  return useQuery({
    queryKey: ["journey", query],
    queryFn: () => api<Journey>(`/api/v1/ops/journey?${query}`),
    enabled: !!query,
  })
}
