import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
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

// forgetTag drops everything cached about one scanned code. Called wherever a tag stops being
// available: consumed by a registration, deleted by hand, or claimed by another operator between the
// register form's lookup and its submit.
//
// The single lookup is REMOVED rather than invalidated, and the difference matters on the kind of
// connection these phones actually have. An invalidated query keeps serving its last value until a
// refetch succeeds — and with retry off, one failed request is enough — so a sticker that is already
// on a vehicle goes on showing a green ✓ on the form. Removed, there is nothing to fall back on.
export function forgetTag(queryClient: QueryClient, code?: string) {
  queryClient.invalidateQueries({ queryKey: ["tags"] })
  const trimmed = code?.trim().toLowerCase()
  if (trimmed) queryClient.removeQueries({ queryKey: ["tag-by-code", trimmed] })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    // the code travels with the id purely so the cached lookup for it can be dropped too
    mutationFn: ({ id }: { id: number; code: string }) => api(`/api/v1/ops/tags/${id}`, { method: "DELETE" }),
    onSuccess: (_result, { code }) => forgetTag(queryClient, code),
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
