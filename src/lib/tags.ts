import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"

// A Tag is a pre-minted public code printed as a QR sticker before any vehicle is registered. Once a
// vehicle is registered against it, the backend deletes the tag — so this list only ever holds the
// codes still waiting in the field.
export type Tag = {
  id: number
  createdAt: string
  code: string
  batch: string
}

export const MAX_TAG_BATCH = 200

export function useTags(batch?: string) {
  return useQuery({
    queryKey: ["tags", batch ?? ""],
    queryFn: () => api<Tag[]>(`/api/v1/ops/tags${batch ? `?batch=${encodeURIComponent(batch)}` : ""}`),
  })
}

export function useGenerateTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ count, batch }: { count: number; batch?: string }) =>
      api<Tag[]>("/api/v1/ops/tags/generate", {
        method: "POST",
        body: JSON.stringify({ count, batch: batch ?? "" }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/v1/ops/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  })
}

// parseTagCode pulls the bare code out of a scanned QR, which encodes the full /v/<code> scan URL.
// Falls back to the trimmed text so a plain code scans fine too.
export function parseTagCode(text: string): string {
  const trimmed = text.trim()
  const marker = "/v/"
  const index = trimmed.lastIndexOf(marker)
  const raw = index >= 0 ? trimmed.slice(index + marker.length) : trimmed
  return raw.split(/[/?#]/)[0].trim()
}

// useLookupTag confirms a typed/scanned code is a real, unused tag — drives the live ✓/✗ on the form.
export function useLookupTag(code: string) {
  const trimmed = code.trim()
  return useQuery({
    queryKey: ["tag-by-code", trimmed],
    queryFn: () => api<Tag>(`/api/v1/ops/tags/by-code/${encodeURIComponent(trimmed)}`),
    enabled: trimmed.length > 0,
    retry: false,
  })
}
