import { useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  useVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  type VehicleStatus,
} from "../lib/vehicles"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Dialog } from "../components/ui/Dialog"
import { StatusBadge } from "../components/StatusBadge"
import { StarRating } from "../components/StarRating"
import { Pagination } from "../components/Pagination"
import { ReportCard } from "../components/ReportCard"
import { BackLink } from "../components/BackLink"
import { VehicleLocationPanel } from "../components/VehicleLocationPanel"
import { VehicleQR, vehicleScanUrl } from "../components/VehicleQR"
import {
  useVehicleReviews,
  useVehicleReports,
  REVIEWS_PAGE_SIZE,
  VEHICLE_REPORTS_PAGE_SIZE,
  type ReviewSort,
  type ReviewSince,
} from "../lib/feedback"
import { useToast } from "../lib/toast"
import { formatDateTime } from "../lib/rides"
import { cn } from "../lib/cn"

const allStatuses: VehicleStatus[] = ["active", "suspended", "retired"]

type Tab = "general" | "reviews" | "reports"

const reviewSorts: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
]

const reviewWindows: { value: ReviewSince; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
]

const reportStatuses: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
]

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: vehicle, isLoading } = useVehicle(id ?? "")
  const updateVehicle = useUpdateVehicle()
  const deleteVehicle = useDeleteVehicle()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>("general")
  const [reviewPage, setReviewPage] = useState(0)
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest")
  const [reviewSince, setReviewSince] = useState<ReviewSince>("all")
  const [reportPage, setReportPage] = useState(0)
  const [reportStatus, setReportStatus] = useState("")

  const reviews = useVehicleReviews(vehicle?.id ?? 0, reviewPage, reviewSort, reviewSince)
  const reports = useVehicleReports(vehicle?.id ?? 0, reportPage, reportStatus)

  const [editingPlate, setEditingPlate] = useState(false)
  const [plateDraft, setPlateDraft] = useState("")
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<VehicleStatus | null>(null)
  const [showImage, setShowImage] = useState(false)

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-faint">loading…</p>
  }
  if (!vehicle) {
    return <p className="text-sm text-ink-soft">Vehicle not found.</p>
  }

  const otherStatuses = allStatuses.filter((status) => status !== vehicle.status)

  function savePlate(event: FormEvent) {
    event.preventDefault()
    const next = plateDraft.trim()
    if (!next || next === vehicle!.plateNumber) {
      setEditingPlate(false)
      return
    }
    updateVehicle.mutate(
      { id: vehicle!.id, plateNumber: next },
      {
        onSuccess: () => {
          setEditingPlate(false)
          toast(`Plate updated to ${next}`, "success")
        },
        onError: (error) => toast((error as Error).message || "Could not update plate", "error"),
      },
    )
  }

  function applyStatus() {
    if (!pendingStatus || !vehicle) return
    const status = pendingStatus
    updateVehicle.mutate(
      { id: vehicle.id, status },
      {
        onSuccess: () => {
          toast(`Marked ${status}`, "success")
          setPendingStatus(null)
        },
        onError: (error) => {
          toast((error as Error).message || "Could not update status", "error")
          setPendingStatus(null)
        },
      },
    )
  }

  function confirmDelete() {
    deleteVehicle.mutate(vehicle!.id, {
      onSuccess: () => {
        toast(`Deleted ${vehicle!.plateNumber}`, "success")
        navigate("/vehicles")
      },
      onError: (error) => toast((error as Error).message || "Could not delete vehicle", "error"),
    })
  }

  return (
    <div>
      <BackLink />

      <div className="mt-4 flex items-center gap-3">
        {editingPlate ? (
          <form onSubmit={savePlate} className="flex items-center gap-2">
            <Input
              autoFocus
              value={plateDraft}
              onChange={(event) => setPlateDraft(event.target.value)}
              className="max-w-[12rem]"
            />
            <Button type="submit" size="sm" disabled={updateVehicle.isPending}>
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingPlate(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              {vehicle.plateNumber}
            </h1>
            <button
              onClick={() => {
                setPlateDraft(vehicle.plateNumber)
                setEditingPlate(true)
              }}
              className="font-mono text-xs text-ink-faint hover:text-danfo-deep"
            >
              edit
            </button>
          </>
        )}
        <StatusBadge status={vehicle.status} />
      </div>

      {updateVehicle.isError && (
        <p className="mt-2 text-sm text-danfo-deep">{(updateVehicle.error as Error).message}</p>
      )}

      <div className="mt-6 flex items-center gap-6 border-b border-line">
        <TabButton label="General" active={tab === "general"} onClick={() => setTab("general")} />
        <TabButton
          label={`Reviews${reviews.data ? ` (${reviews.data.count})` : ""}`}
          active={tab === "reviews"}
          onClick={() => setTab("reviews")}
        />
        <TabButton label="Reports" active={tab === "reports"} onClick={() => setTab("reports")} />
      </div>

      {tab === "general" && <VehicleLocationPanel vehicleId={vehicle.id} />}

      {tab === "general" && (
        <div className="mt-6 grid gap-10 sm:grid-cols-2">
          <div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <dt className="text-ink-faint">Public code</dt>
                <dd className="font-mono text-ink">{vehicle.publicCode}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
                <dt className="text-ink-faint">Scan URL</dt>
                <dd className="truncate font-mono text-ink-soft">{vehicleScanUrl(vehicle.publicCode)}</dd>
              </div>
              {vehicle.plateState && (
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <dt className="text-ink-faint">State</dt>
                  <dd className="text-ink-soft">{vehicle.plateState}</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-line pb-2">
                <dt className="text-ink-faint">Registered</dt>
                <dd className="text-ink-soft">{new Date(vehicle.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>

            {vehicle.imageUrl && (
              <div className="mt-6">
                <button
                  onClick={() => setShowImage((value) => !value)}
                  className="font-mono text-xs text-ink-faint transition-colors hover:text-ink"
                >
                  {showImage ? "▾ hide plate photo" : "▸ show plate photo"}
                </button>
                {showImage && (
                  <img
                    src={vehicle.imageUrl}
                    alt="plate"
                    className="mt-3 w-full max-w-sm rounded-[var(--radius)] border border-line"
                  />
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {otherStatuses.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  disabled={updateVehicle.isPending}
                  onClick={() => setPendingStatus(status)}
                >
                  Mark {status}
                </Button>
              ))}
            </div>

            <div className="mt-10 border-t border-line pt-4">
              <button
                onClick={() => setConfirmingDelete(true)}
                className="text-sm text-ink-faint transition-colors hover:text-red-600"
              >
                Delete vehicle
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-[var(--radius)] border border-line p-6">
            <VehicleQR publicCode={vehicle.publicCode} />
            <div className="text-center">
              <div className="font-mono text-sm font-medium text-ink">{vehicle.plateNumber}</div>
              <div className="font-mono text-xs text-ink-faint">{vehicle.publicCode}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/print?ids=${vehicle.id}`)}>
              Print sticker
            </Button>
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {reviews.data && reviews.data.count > 0 ? (
                <>
                  <StarRating value={Math.round(reviews.data.average)} />
                  <span className="text-sm text-ink-soft">
                    {reviews.data.average.toFixed(1)} · {reviews.data.count} review
                    {reviews.data.count === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <span className="text-sm text-ink-faint">No reviews yet.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={reviewSince}
                onChange={(event) => {
                  setReviewSince(event.target.value as ReviewSince)
                  setReviewPage(0)
                }}
                className="rounded-[var(--radius)] border border-line bg-paper px-3 py-1.5 text-sm text-ink"
              >
                {reviewWindows.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={reviewSort}
                onChange={(event) => {
                  setReviewSort(event.target.value as ReviewSort)
                  setReviewPage(0)
                }}
                className="rounded-[var(--radius)] border border-line bg-paper px-3 py-1.5 text-sm text-ink"
              >
                {reviewSorts.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reviews.data && reviews.data.reviews.length > 0 && (
            <ul className="mt-4 space-y-2">
              {reviews.data.reviews.map((review, index) => (
                <li key={index} className="rounded-[var(--radius)] border border-line p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "text-sm font-medium text-ink",
                        review.anonymous && "select-none blur-[3px]",
                      )}
                    >
                      {review.reviewer}
                    </span>
                    <StarRating value={review.rating} />
                  </div>
                  {review.body && <p className="mt-1.5 text-sm text-ink-soft">{review.body}</p>}
                  <div className="mt-2 flex items-center gap-3 font-mono text-xs text-ink-faint">
                    <span>{formatDateTime(review.createdAt)}</span>
                    <Link to={`/rides/${review.tripId}`} className="text-ink-faint transition-colors hover:text-danfo-deep">
                      view ride →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={reviewPage}
            hasNext={(reviews.data?.reviews.length ?? 0) === REVIEWS_PAGE_SIZE}
            onChange={setReviewPage}
          />
        </div>
      )}

      {tab === "reports" && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            {reportStatuses.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setReportStatus(option.value)
                  setReportPage(0)
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  reportStatus === option.value
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft hover:border-ink/40",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {reports.data && reports.data.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {reports.data.map((report) => (
                <li key={report.id}>
                  <ReportCard report={report} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-faint">No reports.</p>
          )}

          <Pagination
            page={reportPage}
            hasNext={(reports.data?.length ?? 0) === VEHICLE_REPORTS_PAGE_SIZE}
            onChange={setReportPage}
          />
        </div>
      )}

      <Dialog
        open={pendingStatus !== null}
        onOpenChange={(open) => !open && setPendingStatus(null)}
        title={pendingStatus ? `Mark ${vehicle.plateNumber} ${pendingStatus}?` : ""}
        description="This is recorded in the audit log against your account."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingStatus(null)}>
            Cancel
          </Button>
          <Button disabled={updateVehicle.isPending} onClick={applyStatus}>
            {updateVehicle.isPending ? "Saving…" : "Confirm"}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this vehicle?"
        description="This permanently removes the vehicle and its public code. Any sticker already printed for it will stop resolving. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={deleteVehicle.isPending}
            onClick={confirmDelete}
            className="border-red-600/30 text-red-600 hover:bg-red-600 hover:text-paper"
          >
            {deleteVehicle.isPending ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </Dialog>
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
