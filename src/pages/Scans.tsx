import { Fragment, useState } from "react"
import { Link } from "react-router-dom"
import {
  useScans,
  useScanFunnel,
  stageLabel,
  outcomeLabels,
  SCANS_PAGE_SIZE,
  type ScanFunnel,
} from "../lib/scans"
import { formatDateTime } from "../lib/rides"
import { ApiError } from "../lib/api"
import { CountCard } from "../components/CountCard"
import { Pagination } from "../components/Pagination"
import { JourneyTimeline } from "../components/JourneyTimeline"
import { FilterChips, timeWindowOptions, type ChipOption } from "../components/FilterChips"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"
import { cn } from "../lib/cn"

type TimeWindow = "all" | "today" | "week" | "month"

const outcomeOptions: ChipOption<string>[] = [
  { value: "", label: "All codes" },
  { value: "resolved", label: "Known" },
  { value: "unregistered_tag", label: "Not linked" },
  { value: "unknown", label: "Unrecognised" },
]

export function Scans() {
  const [page, setPage] = useState(0)
  const [stage, setStage] = useState("")
  const [outcome, setOutcome] = useState("")
  const [since, setSince] = useState<TimeWindow>("week")
  const [openScan, setOpenScan] = useState<number | null>(null)

  const funnel = useScanFunnel(since)
  const { data, isLoading, error } = useScans(page, stage, outcome, since)

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const scans = data ?? []

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Scans</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Every sticker scan, signed in or not — and where riders stop.
      </p>

      <div className="mt-6 flex justify-end">
        <FilterChips options={timeWindowOptions} value={since} onChange={setSince} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CountCard label="Scans" value={funnel.data?.total} accent />
        <CountCard label="Devices" value={funnel.data?.devices} />
        <CountCard label="Signed in" value={funnel.data?.users} />
        <CountCard label="Unrecognised" value={funnel.data?.outcomes?.unknown} />
      </div>

      <Funnel data={funnel.data} onPick={(value) => { setStage(value); setPage(0) }} active={stage} />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          options={outcomeOptions}
          value={outcome}
          onChange={(value) => {
            setOutcome(value)
            setPage(0)
          }}
        />
        {stage && (
          <button
            onClick={() => {
              setStage("")
              setPage(0)
            }}
            className="font-mono text-xs text-ink-faint transition-colors hover:text-ink"
          >
            clear stage filter ({stageLabel(stage)}) ×
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Danfo</th>
              <th className="px-4 py-3 font-medium">Got as far as</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-mono text-ink-faint">loading…</td>
              </tr>
            )}
            {!isLoading && scans.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-faint">No scans match these filters.</td>
              </tr>
            )}
            {scans.map((scan) => (
              <Fragment key={scan.id}>
                <tr
                  onClick={() => setOpenScan(openScan === scan.id ? null : scan.id)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-paper-deep/50"
                >
                  <td className="px-4 py-3 font-mono text-ink">{scan.code}</td>
                  <td className="px-4 py-3">
                    {scan.vehicleId ? (
                      <Link
                        to={`/vehicles/${scan.vehicleId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-mono text-ink-soft hover:text-danfo-deep"
                      >
                        {scan.plate}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">{outcomeLabels[scan.outcome] ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{stageLabel(scan.stage)}</td>
                  <td className="px-4 py-3">
                    {scan.passengerId ? (
                      <Link
                        to={`/users/${scan.passengerId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="text-ink-soft hover:text-danfo-deep"
                      >
                        {scan.passenger}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">Anonymous</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-faint">{formatDateTime(scan.createdAt)}</td>
                </tr>
                {openScan === scan.id && (
                  <tr className="border-b border-line last:border-0">
                    <td colSpan={5} className="bg-paper-deep/30 px-4 py-4">
                      <JourneyTimeline scanId={scan.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} hasNext={scans.length === SCANS_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

// The drop-off, stage by stage. The bar is the share of all scans that got this far; the number on
// the right is how many stopped HERE — counted from where each scan actually ended, not by
// subtracting one row from the next, which would quietly swallow a stage riders skipped.
function Funnel({
  data,
  active,
  onPick,
}: {
  data?: ScanFunnel
  active: string
  onPick: (stage: string) => void
}) {
  if (!data || data.stages.length === 0) return null
  const top = data.stages[0]?.count || 1

  return (
    <div className="mt-8 overflow-hidden rounded-[var(--radius)] border border-line">
      <div className="border-b border-line px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink-faint">
        Where riders stop
      </div>
      <div className="divide-y divide-line">
        {data.stages.map((step) => {
          const share = Math.round((step.count / top) * 100)
          return (
            <button
              key={step.stage}
              onClick={() => onPick(active === step.stage ? "" : step.stage)}
              className={cn(
                "flex w-full items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-paper-deep/50",
                active === step.stage && "bg-paper-deep/60",
              )}
            >
              <span className="w-40 shrink-0 text-sm text-ink">{stageLabel(step.stage)}</span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-danfo"
                  style={{ width: `${share}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums text-ink">
                {step.count}
              </span>
              <span className="w-28 shrink-0 text-right font-mono text-xs tabular-nums text-ink-faint">
                {step.stoppedHere > 0 ? `${step.stoppedHere} stopped here` : ""}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
