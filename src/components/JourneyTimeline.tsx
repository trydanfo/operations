import { Link } from "react-router-dom"
import { useJourney, stageLabel, outcomeLabels } from "../lib/scans"
import { feedbackKindLabels } from "../lib/feedback"
import { formatDateTime } from "../lib/rides"
import { cn } from "../lib/cn"

// One person's history: every step they took with the time it happened, and any feedback they sent,
// newest first. Used in three places — the feedback inbox, the scans table, and a user's page.
export function JourneyTimeline({ scanId, userId }: { scanId?: number; userId?: number }) {
  const { data, isLoading } = useJourney(scanId ? { scanId } : userId ? { userId } : null)

  if (isLoading) {
    return <p className="px-4 py-6 text-center font-mono text-xs text-ink-faint">loading…</p>
  }
  if (!data || data.entries.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-ink-faint">
        Nothing recorded for this person yet.
      </p>
    )
  }

  return (
    <ol className="space-y-2.5">
      {data.entries.map((entry, index) => (
        <li key={index} className="flex gap-3">
          <div className="flex flex-col items-center pt-1.5">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                entry.type === "feedback" ? "bg-danfo" : "bg-ink/25",
              )}
            />
            {index < data.entries.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
          </div>

          <div className="min-w-0 flex-1 pb-1.5">
            {entry.type === "stage" ? (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm text-ink">
                    <span className="font-medium">{stageLabel(entry.stage ?? "scanned")}</span>
                    {entry.plate ? (
                      <>
                        {" · "}
                        <span className="font-mono text-ink-soft">{entry.plate}</span>
                      </>
                    ) : (
                      <>
                        {" · "}
                        <span className="font-mono text-ink-faint">{entry.code}</span>
                      </>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-ink-faint">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                {entry.outcome && entry.outcome !== "resolved" && (
                  <p className="mt-0.5 font-mono text-xs text-ink-faint">
                    {outcomeLabels[entry.outcome]}
                  </p>
                )}
                {entry.tripId ? (
                  <Link
                    to={`/rides/${entry.tripId}`}
                    className="mt-0.5 inline-block font-mono text-xs text-ink-faint transition-colors hover:text-danfo-deep"
                  >
                    view ride →
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-medium text-danfo-deep">
                    Sent feedback · {feedbackKindLabels[entry.kind ?? ""] ?? entry.kind}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-ink-faint">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">“{entry.body}”</p>
                {entry.screen && (
                  <p className="mt-0.5 font-mono text-xs text-ink-faint">on {entry.screen}</p>
                )}
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
