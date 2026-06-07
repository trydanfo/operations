import { useState } from "react"
import { Link } from "react-router-dom"
import { useStats, type StatsRange } from "../lib/stats"
import { useActivities, activityVerb, relativeTime, type Activity } from "../lib/activities"
import { ApiError } from "../lib/api"
import { cn } from "../lib/cn"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

const ranges: { value: StatsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
]

type Metric = { label: string; value?: number; suffix?: string }

export function Dashboard() {
  const [range, setRange] = useState<StatsRange>("week")
  const { data: stats, isLoading: statsLoading, error } = useStats(range)
  const { data: activities, isLoading: activitiesLoading } = useActivities()

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const metrics: Metric[] = [
    { label: "Rides", value: stats?.rides },
    { label: "Ride shares", value: stats?.rideShares },
    { label: "Passengers", value: stats?.passengers },
    { label: "Distance", value: stats ? Math.round(stats.distanceMeters / 1000) : undefined, suffix: "km" },
    { label: "Reviews", value: stats?.reviews },
    { label: "Reports filed", value: stats?.reports },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-soft">The danfo network at a glance.</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line p-0.5">
          {ranges.map((option) => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                range === option.value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} loading={statsLoading} />
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">Recent activity</h2>
          <Link to="/audit" className="font-mono text-xs text-ink-faint transition-colors hover:text-danfo-deep">
            view all →
          </Link>
        </div>
        <div className="mt-4 rounded-[var(--radius)] border border-line">
          {activitiesLoading && (
            <p className="px-5 py-8 text-center font-mono text-sm text-ink-faint">loading…</p>
          )}
          {!activitiesLoading && activities?.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-faint">Nothing yet.</p>
          )}
          {activities?.slice(0, 12).map((activity, index, shown) => (
            <ActivityRow key={activity.id} activity={activity} last={index === shown.length - 1} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ metric, loading }: { metric: Metric; loading: boolean }) {
  return (
    <div className="rounded-[var(--radius)] border border-line p-5">
      <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">{metric.label}</div>
      <div className="mt-3 font-display text-3xl font-bold text-ink">
        {loading && metric.value === undefined ? (
          <span className="text-ink/20">—</span>
        ) : (
          <>
            {(metric.value ?? 0).toLocaleString()}
            {metric.suffix && <span className="ml-1 text-base font-medium text-ink-faint">{metric.suffix}</span>}
          </>
        )}
      </div>
    </div>
  )
}

function ActivityRow({ activity, last }: { activity: Activity; last: boolean }) {
  const isDelete = activity.action === "vehicle.deleted"
  return (
    <div className={last ? "px-5 py-3" : "border-b border-line px-5 py-3"}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-ink">{activity.actorName}</span> {activityVerb(activity.action)}{" "}
          <span className={isDelete ? "font-mono text-ink-faint line-through" : "font-mono text-ink"}>
            {activity.targetLabel}
          </span>
        </p>
        <span className="shrink-0 font-mono text-xs text-ink-faint">{relativeTime(activity.createdAt)}</span>
      </div>
      {activity.detail && <p className="mt-0.5 font-mono text-xs text-ink-faint">{activity.detail}</p>}
    </div>
  )
}
