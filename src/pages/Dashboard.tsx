import { useStats } from "../lib/stats"
import { ApiError } from "../lib/api"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

type Metric = {
  label: string
  value?: number
  planned?: boolean
}

export function Dashboard() {
  const { data, isLoading, error } = useStats()

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const metrics: Metric[] = [
    { label: "Vehicles", value: data?.vehicles },
    { label: "Users", value: data?.users },
    { label: "Scans", planned: true },
    { label: "Live shares", planned: true },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">The danfo network at a glance.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} loading={isLoading} />
        ))}
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
