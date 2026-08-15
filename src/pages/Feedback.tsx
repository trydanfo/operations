import { useState } from "react"
import { Link } from "react-router-dom"
import {
  useFeedback,
  useFeedbackCounts,
  useUpdateFeedbackStatus,
  feedbackKindLabels,
  FEEDBACK_PAGE_SIZE,
  type FeedbackItem,
} from "../lib/feedback"
import { stageLabel } from "../lib/scans"
import { formatDateTime } from "../lib/rides"
import { ApiError } from "../lib/api"
import { CountCard } from "../components/CountCard"
import { StatusPill } from "../components/StatusPill"
import { Pagination } from "../components/Pagination"
import { StarRating } from "../components/StarRating"
import { JourneyTimeline } from "../components/JourneyTimeline"
import { FilterChips, timeWindowOptions, type ChipOption } from "../components/FilterChips"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"
import { Button } from "../components/ui/Button"

type TimeWindow = "all" | "today" | "week" | "month"

const statusOptions: ChipOption<string>[] = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "closed", label: "Closed" },
]

const kindOptions: ChipOption<string>[] = [
  { value: "", label: "Everything" },
  { value: "bug", label: "Broken" },
  { value: "idea", label: "Ideas" },
  { value: "confusing", label: "Confusing" },
  { value: "praise", label: "Praise" },
]

export function Feedback() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState("new")
  const [kind, setKind] = useState("")
  const [since, setSince] = useState<TimeWindow>("all")
  const [open, setOpen] = useState<number | null>(null)

  const counts = useFeedbackCounts()
  const { data, isLoading, error } = useFeedback(status, kind, since, page)

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const items = data ?? []

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Feedback</h1>
      <p className="mt-1 text-sm text-ink-soft">
        What riders say about the app itself. Driver and ride complaints live in Reports.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <CountCard label="New" value={counts.data?.new} accent />
        <CountCard label="Reviewed" value={counts.data?.reviewed} />
        <CountCard label="Closed" value={counts.data?.closed} />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          options={statusOptions}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(0)
          }}
        />
        <FilterChips
          options={timeWindowOptions}
          value={since}
          onChange={(value) => {
            setSince(value)
            setPage(0)
          }}
        />
      </div>
      <div className="mt-3">
        <FilterChips
          options={kindOptions}
          value={kind}
          onChange={(value) => {
            setKind(value)
            setPage(0)
          }}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-line">
        {isLoading && (
          <p className="px-5 py-10 text-center font-mono text-sm text-ink-faint">loading…</p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">
            No feedback matches these filters.
          </p>
        )}
        {items.map((item, index) => (
          <Row
            key={item.id}
            item={item}
            last={index === items.length - 1}
            open={open === item.id}
            onToggle={() => setOpen(open === item.id ? null : item.id)}
          />
        ))}
      </div>

      <Pagination page={page} hasNext={items.length === FEEDBACK_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

function Row({
  item,
  last,
  open,
  onToggle,
}: {
  item: FeedbackItem
  last: boolean
  open: boolean
  onToggle: () => void
}) {
  const update = useUpdateFeedbackStatus()

  return (
    <div className={last && !open ? "" : "border-b border-line"}>
      <button
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left transition-colors hover:bg-paper-deep/50"
      >
        <span className="w-36 shrink-0 text-sm font-medium text-ink">
          {feedbackKindLabels[item.kind] ?? item.kind}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{item.body}</span>
        <StatusPill status={item.status} />
        <span className="shrink-0 font-mono text-xs text-ink-faint">
          {formatDateTime(item.createdAt)}
        </span>
      </button>

      {open && (
        <div className="border-t border-line bg-paper-deep/30 px-5 py-4">
          <p className="text-sm leading-relaxed text-ink">{item.body}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-ink-faint">
            <span>
              from{" "}
              {item.senderId ? (
                <Link to={`/users/${item.senderId}`} className="text-ink-soft hover:text-danfo-deep">
                  {item.sender}
                </Link>
              ) : (
                <span className="text-ink-soft">{item.sender}</span>
              )}
            </span>
            {item.screen && <span>on {item.screen}</span>}
            {item.rating > 0 && <StarRating value={item.rating} />}
          </div>

          {/* how far this person actually got — worth knowing before acting on what they wrote */}
          <div className="mt-3 rounded-[var(--radius)] border border-line bg-paper px-3 py-2 text-xs text-ink-soft">
            <span className="font-semibold text-ink">{item.usage?.scans ?? 0}</span> scan
            {(item.usage?.scans ?? 0) === 1 ? "" : "s"}
            {item.usage?.stage && (
              <>
                {" · got as far as "}
                <span className="font-semibold text-ink">{stageLabel(item.usage.stage)}</span>
              </>
            )}
            {item.usage?.lastSeen && <> · last seen {formatDateTime(item.usage.lastSeen)}</>}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Their journey</p>
              <div className="mt-2">
                {item.scanId ? (
                  <JourneyTimeline scanId={item.scanId} />
                ) : item.senderId ? (
                  <JourneyTimeline userId={item.senderId} />
                ) : (
                  <p className="py-4 text-sm text-ink-faint">
                    No scan history left for this sender — their device id has aged out.
                  </p>
                )}
              </div>
            </div>

            <div className="sm:justify-self-end">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Triage</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["new", "reviewed", "closed"].map((status) => (
                  <Button
                    key={status}
                    variant={item.status === status ? "primary" : "outline"}
                    size="sm"
                    disabled={update.isPending || item.status === status}
                    onClick={() => update.mutate({ id: item.id, status })}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
