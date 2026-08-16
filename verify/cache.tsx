import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { useRegisterVehicle } from "../src/lib/vehicles"
import { useDeleteTag, useLookupTag } from "../src/lib/tags"

// Drives the real mutations against a stubbed server and reports what the cache says afterwards
// about the tag code that was just scanned. See ./README.md.
const CODE = "abc123"
const TAG = { id: 7, createdAt: "2026-01-01T00:00:00Z", code: CODE, batch: "b1" }
const VEHICLE = {
  id: 1,
  createdAt: "2026-01-01T00:00:00Z",
  plateNumber: "LAG-123-XY",
  plateState: "Lagos",
  status: "active",
  publicCode: CODE,
  imageUrl: "",
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

const serve = {
  vehicle: () => json(VEHICLE, 201),
  // what the server answers when another operator claimed the tag first
  conflict: () => json({ error: "that tag was just used by another registration" }, 409),
  deleted: () => new Response(null, { status: 204 }),
  offline: () => {
    throw new TypeError("Failed to fetch")
  },
}

type Act = (tools: {
  register: ReturnType<typeof useRegisterVehicle>
  remove: ReturnType<typeof useDeleteTag>
}) => Promise<unknown>

type Check = { label: string; pass: boolean }

type Case = {
  name: string
  serve: () => Response
  act: Act
  // a second phase, served differently, for the cases about what the form shows afterwards
  thenLookup?: { serve: () => Response; expectData: boolean }
  checks?: (state: { lookupCached: boolean; listInvalidated: boolean }) => Check[]
}

const cases: Record<string, Case> = {
  // The original bug: the tag is gone from the server, so nothing cached about it may survive.
  consumed: {
    name: "registration consumes the tag",
    serve: serve.vehicle,
    act: ({ register }) => register.mutateAsync({ plateNumber: "LAG-123-XY", tagCode: CODE }),
    checks: (state) => [
      { label: "lookup dropped", pass: !state.lookupCached },
      { label: "tag list invalidated", pass: state.listInvalidated },
    ],
  },

  // No tag means no tag was consumed — the list must not be disturbed.
  untagged: {
    name: "registration without a tag leaves the list alone",
    serve: serve.vehicle,
    act: ({ register }) => register.mutateAsync({ plateNumber: "LAG-123-XY" }),
    checks: (state) => [
      { label: "lookup untouched", pass: state.lookupCached },
      { label: "tag list untouched", pass: !state.listInvalidated },
    ],
  },

  // The collision the server answers 409 for: the cached ✓ is exactly what let the operator submit
  // a code another operator had already used, so the error path has to clear it too.
  conflict: {
    name: "409 collision clears the ✓",
    serve: serve.conflict,
    act: ({ register }) => register.mutateAsync({ plateNumber: "LAG-123-XY", tagCode: CODE }).catch(() => null),
    checks: (state) => [
      { label: "lookup dropped", pass: !state.lookupCached },
      { label: "tag list invalidated", pass: state.listInvalidated },
    ],
  },

  // A registration that failed on the connection rather than the tag. Forgetting is still right:
  // it only forces the next check to ask the server.
  dead_connection: {
    name: "failed registration on a dead connection clears the ✓",
    serve: serve.offline,
    act: ({ register }) => register.mutateAsync({ plateNumber: "LAG-123-XY", tagCode: CODE }).catch(() => null),
    checks: (state) => [{ label: "lookup dropped", pass: !state.lookupCached }],
  },

  // Same omission, other entry point: a tag deleted by hand on the tags page.
  deleted: {
    name: "deleting a tag clears its lookup",
    serve: serve.deleted,
    act: ({ remove }) => remove.mutateAsync({ id: TAG.id, code: CODE }),
    checks: (state) => [
      { label: "lookup dropped", pass: !state.lookupCached },
      { label: "tag list invalidated", pass: state.listInvalidated },
    ],
  },

  // Operators type as well as scan. Whatever they type has to resolve to the key the lookup wrote,
  // or the drop silently misses.
  normalised: {
    name: "typed code is normalised to the key the lookup wrote",
    serve: serve.vehicle,
    act: ({ register }) => register.mutateAsync({ plateNumber: "LAG-123-XY", tagCode: "  ABC123  " }),
    checks: (state) => [{ label: "lookup dropped", pass: !state.lookupCached }],
  },

  // The field case, and the reason the lookup is REMOVED rather than invalidated: an invalidated
  // query keeps serving its last value when the refetch fails, and with retry off one failed
  // request is enough. On a bus with no signal that is a consumed sticker still showing a green ✓.
  stale_tick_offline: {
    name: "consumed tag cannot show ✓ from cache when the network is down",
    serve: serve.vehicle,
    act: ({ register }) => register.mutateAsync({ plateNumber: "LAG-123-XY", tagCode: CODE }),
    thenLookup: { serve: serve.offline, expectData: false },
  },
}

const spec = cases[new URLSearchParams(location.search).get("case") ?? ""]

function Lookup({ expectData, onDone }: { expectData: boolean; onDone: (checks: Check[]) => void }) {
  const lookup = useLookupTag(CODE)
  useEffect(() => {
    if (lookup.isFetching || lookup.isPending) return
    const hasData = lookup.data !== undefined
    onDone([{ label: expectData ? "lookup still answers" : "lookup answers nothing", pass: hasData === expectData }])
  }, [lookup.isFetching, lookup.isPending, lookup.data, expectData, onDone])
  return null
}

function Runner() {
  const queryClient = useQueryClient()
  const register = useRegisterVehicle()
  const remove = useDeleteTag()
  const [lookingUp, setLookingUp] = useState(false)

  useEffect(() => {
    // seed the cache the way the register form does: a lookup of the scanned tag that came back
    // valid, plus the tag list the generate/print page renders
    queryClient.setQueryData(["tag-by-code", CODE], TAG)
    queryClient.setQueryData(["tags", ""], [TAG])

    window.fetch = spec.serve as typeof window.fetch
    void spec.act({ register, remove }).finally(() => {
      // let the mutation's own onSuccess/onError settle before reading the cache
      setTimeout(() => {
        if (spec.thenLookup) {
          window.fetch = spec.thenLookup.serve as typeof window.fetch
          setLookingUp(true)
          return
        }
        const state = {
          lookupCached: queryClient.getQueryState(["tag-by-code", CODE])?.data !== undefined,
          listInvalidated: queryClient.getQueryState(["tags", ""])?.isInvalidated === true,
        }
        window.__result = { name: spec.name, checks: spec.checks!(state) }
      }, 50)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!lookingUp || !spec.thenLookup) return null
  return (
    <Lookup
      expectData={spec.thenLookup.expectData}
      onDone={(checks) => {
        window.__result = { name: spec.name, checks }
      }}
    />
  )
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Runner />
  </QueryClientProvider>,
)
