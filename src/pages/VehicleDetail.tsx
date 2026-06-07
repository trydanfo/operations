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
import { StatusPill } from "../components/StatusPill"
import { VehicleQR, vehicleScanUrl } from "../components/VehicleQR"
import { useVehicleReviews, useVehicleReports, moodEmoji } from "../lib/feedback"

const allStatuses: VehicleStatus[] = ["active", "suspended", "retired"]

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: vehicle, isLoading } = useVehicle(id ?? "")
  const updateVehicle = useUpdateVehicle()
  const deleteVehicle = useDeleteVehicle()
  const reviews = useVehicleReviews(vehicle?.publicCode ?? "")
  const reports = useVehicleReports(vehicle?.id ?? 0)

  const [editingPlate, setEditingPlate] = useState(false)
  const [plateDraft, setPlateDraft] = useState("")
  const [confirmingDelete, setConfirmingDelete] = useState(false)
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
      { onSuccess: () => setEditingPlate(false) },
    )
  }

  function confirmDelete() {
    deleteVehicle.mutate(vehicle!.id, { onSuccess: () => navigate("/vehicles") })
  }

  return (
    <div>
      <Link to="/vehicles" className="font-mono text-xs text-ink-faint hover:text-ink">
        ← vehicles
      </Link>

      <div className="mt-4 grid gap-10 sm:grid-cols-2">
        <div>
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
            <div className="flex items-center gap-3">
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
            </div>
          )}

          {updateVehicle.isError && (
            <p className="mt-2 text-sm text-danfo-deep">{(updateVehicle.error as Error).message}</p>
          )}

          <div className="mt-2">
            <StatusBadge status={vehicle.status} />
          </div>

          <dl className="mt-6 space-y-3 text-sm">
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
                onClick={() => updateVehicle.mutate({ id: vehicle.id, status })}
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

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">Reviews</h2>
          {reviews.data && reviews.data.count > 0 ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl">{moodEmoji[Math.round(reviews.data.average)] || "—"}</span>
                <span className="text-sm text-ink-soft">
                  {reviews.data.average.toFixed(1)} · {reviews.data.count} review
                  {reviews.data.count === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {reviews.data.reviews.map((review, index) => (
                  <li key={index} className="rounded-[var(--radius)] border border-line p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        {moodEmoji[review.rating]}{" "}
                        <span className="font-medium text-ink">{review.reviewer}</span>
                      </span>
                      <span className="font-mono text-xs text-ink-faint">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.body && <p className="mt-1 text-ink-soft">{review.body}</p>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-faint">No reviews yet.</p>
          )}
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">Reports</h2>
          {reports.data && reports.data.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {reports.data.map((report) => (
                <li key={report.id} className="rounded-[var(--radius)] border border-line p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink">{report.kind.replace(/_/g, " ")}</span>
                    <StatusPill status={report.status} />
                  </div>
                  {report.body && <p className="mt-1 text-ink-soft">{report.body}</p>}
                  <p className="mt-1 font-mono text-xs text-ink-faint">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-faint">No reports.</p>
          )}
        </section>
      </div>

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
