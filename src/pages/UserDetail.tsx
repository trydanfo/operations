import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useUser, userDisplayName } from "../lib/users"
import { useRides, useRide, RIDES_PAGE_SIZE, formatDistance, formatDateTime } from "../lib/rides"
import {
  useUserReviews,
  useReports,
  REVIEWS_PAGE_SIZE,
  REPORTS_PAGE_SIZE,
  type ReviewSort,
  type ReviewSince,
} from "../lib/feedback"
import { ApiError } from "../lib/api"
import { Avatar } from "../components/Avatar"
import { BackLink } from "../components/BackLink"
import { StarRating } from "../components/StarRating"
import { StatusPill } from "../components/StatusPill"
import { Pagination } from "../components/Pagination"
import { ReportCard } from "../components/ReportCard"
import { RouteMap, parsePolyline } from "../components/RouteMap"
import { FilterChips, timeWindowOptions, type ChipOption } from "../components/FilterChips"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"
import { JourneyTimeline } from "../components/JourneyTimeline"
import { cn } from "../lib/cn"

type Tab = "rides" | "reviews" | "reports" | "journey"
type TimeWindow = "all" | "today" | "week" | "month"

const rideStatusOptions: ChipOption<string>[] = [
  { value: "", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
  { value: "live", label: "Live" },
]

const reportStatusOptions: ChipOption<string>[] = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
]

const reviewSorts: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
]

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: user, isLoading, error } = useUser(id ?? "")
  const [tab, setTab] = useState<Tab>("rides")

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }
  if (isLoading) {
    return <p className="font-mono text-sm text-ink-faint">loading…</p>
  }
  if (!user) {
    return <p className="text-sm text-ink-soft">User not found.</p>
  }

  return (
    <div>
      <BackLink />

      <div className="mt-4 flex items-center gap-4">
        <Avatar src={user.profilePicture} name={userDisplayName(user)} size={56} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink">
            {userDisplayName(user)}
          </h1>
          <p className="truncate font-mono text-sm text-ink-soft">{user.email}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6 border-b border-line">
        <TabButton label={`Rides (${user.rides})`} active={tab === "rides"} onClick={() => setTab("rides")} />
        <TabButton label={`Reviews (${user.reviews})`} active={tab === "reviews"} onClick={() => setTab("reviews")} />
        <TabButton label={`Reports (${user.reports})`} active={tab === "reports"} onClick={() => setTab("reports")} />
        <TabButton label="Journey" active={tab === "journey"} onClick={() => setTab("journey")} />
      </div>

      {tab === "rides" && <RidesTab userId={user.id} />}
      {tab === "reviews" && <ReviewsTab userId={user.id} />}
      {tab === "reports" && <ReportsTab userId={user.id} />}
      {tab === "journey" && (
        <div className="mt-6 rounded-[var(--radius)] border border-line px-5 py-4">
          <JourneyTimeline userId={user.id} />
        </div>
      )}
    </div>
  )
}

function RidesTab({ userId }: { userId: number }) {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState("")
  const [since, setSince] = useState<TimeWindow>("all")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data } = useRides(page, status, since, userId)
  const rides = data ?? []
  const selected = useRide(selectedId ? String(selectedId) : "")
  const points = parsePolyline(selected.data?.routePolyline)

  // keep a sensible default selection as the list/filters change
  useEffect(() => {
    if (rides.length === 0) {
      setSelectedId(null)
    } else if (!rides.some((ride) => ride.id === selectedId)) {
      setSelectedId(rides[0].id)
    }
  }, [rides, selectedId])

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips options={rideStatusOptions} value={status} onChange={(value) => { setStatus(value); setPage(0) }} />
        <FilterChips options={timeWindowOptions} value={since} onChange={(value) => { setSince(value); setPage(0) }} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="space-y-2 sm:col-span-3">
          {rides.length === 0 && (
            <p className="rounded-[var(--radius)] border border-line px-4 py-10 text-center text-sm text-ink-faint">
              No rides match these filters.
            </p>
          )}
          {rides.map((ride) => (
            <div
              key={ride.id}
              onClick={() => setSelectedId(ride.id)}
              className={cn(
                "cursor-pointer rounded-[var(--radius)] border p-3 transition-colors",
                selectedId === ride.id ? "border-ink bg-paper-deep/50" : "border-line hover:bg-paper-deep/30",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-ink">{ride.plate || ride.vehicleCode}</span>
                <StatusPill status={ride.status} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 font-mono text-xs text-ink-faint">
                <span>{formatDateTime(ride.startedAt)}</span>
                <span>{formatDistance(ride.distanceMeters)}</span>
              </div>
              <Link
                to={`/rides/${ride.id}`}
                onClick={(event) => event.stopPropagation()}
                className="mt-1.5 inline-block font-mono text-xs text-ink-faint transition-colors hover:text-danfo-deep"
              >
                view ride →
              </Link>
            </div>
          ))}
          <Pagination page={page} hasNext={rides.length === RIDES_PAGE_SIZE} onChange={setPage} />
        </div>

        <div className="sm:col-span-1">
          <div className="sm:sticky sm:top-6">
            <RouteMap key={selectedId ?? 0} points={points} height="460px" empty="Select a ride to see its route." />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewsTab({ userId }: { userId: number }) {
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<ReviewSort>("newest")
  const [since, setSince] = useState<ReviewSince>("all")
  const { data } = useUserReviews(userId, page, sort, since)

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips options={timeWindowOptions} value={since} onChange={(value) => { setSince(value); setPage(0) }} />
        <select
          value={sort}
          onChange={(event) => { setSort(event.target.value as ReviewSort); setPage(0) }}
          className="rounded-[var(--radius)] border border-line bg-paper px-3 py-1.5 text-sm text-ink"
        >
          {reviewSorts.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {data && data.reviews.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {data.reviews.map((review, index) => (
            <li key={index} className="rounded-[var(--radius)] border border-line p-3">
              <div className="flex items-center justify-between gap-3">
                <Link to={`/vehicles/${review.vehicleId}`} className="font-mono text-sm font-medium text-ink hover:text-danfo-deep">
                  {review.plate}
                </Link>
                <StarRating value={review.rating} />
              </div>
              {review.body && <p className="mt-1.5 text-sm text-ink-soft">{review.body}</p>}
              <div className="mt-2 flex items-center gap-3 font-mono text-xs text-ink-faint">
                <span>{formatDateTime(review.createdAt)}</span>
                <Link to={`/rides/${review.tripId}`} className="transition-colors hover:text-danfo-deep">
                  view ride →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-faint">No reviews.</p>
      )}

      <Pagination page={page} hasNext={(data?.reviews.length ?? 0) === REVIEWS_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

function ReportsTab({ userId }: { userId: number }) {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState("")
  const [since, setSince] = useState<TimeWindow>("all")
  const { data } = useReports(status, since, page, userId)
  const reports = data ?? []

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips options={reportStatusOptions} value={status} onChange={(value) => { setStatus(value); setPage(0) }} />
        <FilterChips options={timeWindowOptions} value={since} onChange={(value) => { setSince(value); setPage(0) }} />
      </div>

      {reports.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {reports.map((report) => (
            <li key={report.id}>
              <ReportCard report={report} showPlate />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-faint">No reports.</p>
      )}

      <Pagination page={page} hasNext={reports.length === REPORTS_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 pb-2 text-sm transition-colors",
        active ? "border-danfo text-ink" : "border-transparent text-ink-soft hover:text-ink",
      )}
    >
      {label}
    </button>
  )
}
