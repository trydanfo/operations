import { useStats } from "../lib/stats"
import { useActivities, activityVerb, relativeTime, type Activity } from "../lib/activities"
import { ApiError } from "../lib/api"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

type Metric = {
  label: string
  value?: number
  planned?: boolean
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading, error } = useStats()
  const { data: activities, isLoading: activitiesLoading } = useActivities()

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const metrics: Metric[] = [
    { label: "Vehicles", value: stats?.vehicles },
    { label: "Users", value: stats?.users },
    { label: "Scans", planned: true },
    { label: "Live shares", planned: true },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">The danfo network at a glance.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} loading={statsLoading} />
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">Recent activity</h2>
        <div className="mt-4 rounded-[var(--radius)] border border-line">
          {activitiesLoading && (
            <p className="px-5 py-8 text-center font-mono text-sm text-ink-faint">loading…</p>
          )}
          {!activitiesLoading && activities?.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-faint">Nothing yet.</p>
          )}
          {activities?.map((activity, index) => (
            <ActivityRow key={activity.id} activity={activity} last={index === activities.length - 1} />
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
      {metric.planned ? (
        <>
          <div className="mt-3 font-display text-3xl font-bold text-ink/20">—</div>
          <div className="mt-1 text-xs text-ink-faint">not yet tracked</div>
        </>
      ) : (
        <div className="mt-3 font-display text-3xl font-bold text-ink">
          {loading ? <span className="text-ink/20">—</span> : (metric.value ?? 0).toLocaleString()}
        </div>
      )}
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
