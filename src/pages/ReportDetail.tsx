import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useReport, useUpdateReportStatus, useUpdateReportVisibility, formatReportKind } from "../lib/feedback"
import { formatDateTime, formatDistance } from "../lib/rides"
import { StatusPill } from "../components/StatusPill"
import { Button } from "../components/ui/Button"
import { Dialog } from "../components/ui/Dialog"
import { BackLink } from "../components/BackLink"
import { useToast } from "../lib/toast"

const actionVerb: Record<string, string> = {
  resolved: "Mark resolved",
  dismissed: "Dismiss",
  open: "Reopen",
}

export function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: report, isLoading } = useReport(id ?? "")
  const update = useUpdateReportStatus()
  const visibility = useUpdateReportVisibility()
  const toast = useToast()
  const [pending, setPending] = useState<string | null>(null)
  const [note, setNote] = useState("")

  // seed the note editor from the report once it loads
  useEffect(() => {
    if (report) setNote(report.publicNote ?? "")
  }, [report?.id])

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-faint">loading…</p>
  }
  if (!report) {
    return <p className="text-sm text-ink-soft">Report not found.</p>
  }

  function applyStatus() {
    if (!pending || !report) return
    const status = pending
    update.mutate(
      { id: report.id, status },
      {
        onSuccess: () => {
          toast(`Report ${status === "open" ? "reopened" : status}`, "success")
          setPending(null)
        },
        onError: (mutationError) => {
          toast((mutationError as Error).message || "Could not update report", "error")
          setPending(null)
        },
      },
    )
  }

  function setPublished(next: boolean) {
    if (!report) return
    const trimmed = note.trim()
    if (next && !trimmed) {
      toast("Add a public note before publishing", "error")
      return
    }
    visibility.mutate(
      { id: report.id, public: next, publicNote: trimmed },
      {
        onSuccess: () => toast(next ? "Published to vehicle profile" : "Unpublished", "success"),
        onError: (mutationError) => toast((mutationError as Error).message || "Could not update", "error"),
      },
    )
  }

  function saveNote() {
    if (!report) return
    visibility.mutate(
      { id: report.id, public: report.public, publicNote: note.trim() },
      {
        onSuccess: () => toast("Public note saved", "success"),
        onError: (mutationError) => toast((mutationError as Error).message || "Could not save note", "error"),
      },
    )
  }

  return (
    <div className="max-w-2xl">
      <BackLink />

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {formatReportKind(report.kind)}
        </h1>
        <StatusPill status={report.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {formatDateTime(report.createdAt)} · reported by{" "}
        {report.reporterId ? (
          <Link to={`/users/${report.reporterId}`} className="text-ink hover:text-danfo-deep">
            {report.reporter || "—"}
          </Link>
        ) : (
          report.reporter || "—"
        )}{" "}
        ·{" "}
        <Link to={`/vehicles/${report.vehicleId}`} className="font-mono text-ink hover:text-danfo-deep">
          {report.plate}
        </Link>
      </p>

      {report.body && (
        <p className="mt-5 rounded-[var(--radius)] border border-line p-4 text-sm text-ink">{report.body}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {report.status !== "resolved" && (
          <Button size="sm" disabled={update.isPending} onClick={() => setPending("resolved")}>
            Mark resolved
          </Button>
        )}
        {report.status !== "dismissed" && (
          <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => setPending("dismissed")}>
            Dismiss
          </Button>
        )}
        {report.status !== "open" && (
          <Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => setPending("open")}>
            Reopen
          </Button>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">The ride</h2>
        <Link
          to={`/rides/${report.ride.id}`}
          className="mt-3 block rounded-[var(--radius)] border border-line p-4 transition-colors hover:bg-paper-deep/50"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-ink">{report.ride.passenger || "—"}</span>
            <StatusPill status={report.ride.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {formatDateTime(report.ride.startedAt)} · {formatDistance(report.ride.distanceMeters)}
          </p>
          <p className="mt-1 font-mono text-xs text-danfo-deep">view ride →</p>
        </Link>
      </section>

      <section className="mt-8 rounded-[var(--radius)] border border-line p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">Public profile</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {report.public
                ? "Visible to riders on this vehicle's public page."
                : "Private — only the team can see this report."}
            </p>
          </div>
          <span
            className={
              "shrink-0 rounded-sm border px-2 py-0.5 text-[11px] font-bold uppercase " +
              (report.public
                ? "border-danfo/40 bg-danfo/10 text-danfo-deep"
                : "border-line bg-ink/5 text-ink-faint")
            }
          >
            {report.public ? "Public" : "Private"}
          </span>
        </div>

        <label className="mt-4 block text-xs font-medium text-ink-soft">
          Public note — shown to riders instead of the raw report
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Write a short, factual note for riders…"
          className="mt-1.5 w-full resize-none rounded-[var(--radius)] border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-danfo/50 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-ink-faint">
          The rider&rsquo;s raw words are never shown publicly — only this note.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {report.public ? (
            <>
              <Button size="sm" variant="outline" disabled={visibility.isPending} onClick={saveNote}>
                Save note
              </Button>
              <Button size="sm" variant="ghost" disabled={visibility.isPending} onClick={() => setPublished(false)}>
                Unpublish
              </Button>
            </>
          ) : (
            <Button size="sm" disabled={visibility.isPending} onClick={() => setPublished(true)}>
              Publish to profile
            </Button>
          )}
        </div>
      </section>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? `${actionVerb[pending]} this report?` : ""}
        description="This is recorded in the audit log against your account."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button disabled={update.isPending} onClick={applyStatus}>
            {update.isPending ? "Saving…" : "Confirm"}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
