import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Camera } from "lucide-react"
import { useScanPlate, useRegisterVehicle, useVehicleByPlate, type Vehicle } from "../lib/vehicles"
import { useDebouncedValue } from "../lib/useDebouncedValue"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { cn } from "../lib/cn"

type SessionEntry = { id: number; plateNumber: string; publicCode: string }

// NOTE: phone photos are several MB; a plate reads fine at ~1280px and this cuts upload, OCR, and storage cost
async function downscaleImage(file: File, maxDimension: number): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    if (scale === 1) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext("2d")
    if (!context) return file
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    )
    if (!blob) return file
    return new File([blob], "plate.jpg", { type: "image/jpeg" })
  } catch {
    return file
  }
}

export function RegisterVehicle() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState("")
  const [scanned, setScanned] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [confidence, setConfidence] = useState("")
  const [plateState, setPlateState] = useState("")
  const [ocrError, setOcrError] = useState("")
  const [plateChecked, setPlateChecked] = useState(false)
  const [registered, setRegistered] = useState<SessionEntry[]>([])

  const navigate = useNavigate()
  const scan = useScanPlate()
  const register = useRegisterVehicle()

  const debouncedPlate = useDebouncedValue(plateNumber, 400)
  const plateLookup = useVehicleByPlate(debouncedPlate)
  const existing = plateLookup.data?.existingVehicle ?? null

  // NOTE: a low-confidence read must be eyeballed — editing the plate or ticking the box clears the gate
  const needsCheck = confidence === "low" && !plateChecked

  async function onPickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const optimized = await downscaleImage(file, 1280)

    setPreview(URL.createObjectURL(optimized))
    setScanned(false)
    setImageUrl("")
    setPlateNumber("")
    setConfidence("")
    setPlateState("")
    setOcrError("")
    setPlateChecked(false)

    scan.mutate(optimized, {
      onSuccess: (result) => {
        setPlateNumber(result.plateNumber)
        setConfidence(result.confidence)
        setPlateState(result.plateState)
        setImageUrl(result.imageUrl)
        setOcrError(result.ocrError ?? "")
        setScanned(true)
      },
    })
  }

  function reset() {
    setPreview("")
    setScanned(false)
    setImageUrl("")
    setPlateNumber("")
    setConfidence("")
    setPlateState("")
    setOcrError("")
    setPlateChecked(false)
    scan.reset()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const plate = plateNumber.trim()
    if (!plate || existing || needsCheck) return

    register.mutate(
      { plateNumber: plate, plateState: plateState || undefined, imageUrl: imageUrl || undefined },
      {
        onSuccess: (vehicle: Vehicle) => {
          setRegistered((current) => [
            { id: vehicle.id, plateNumber: vehicle.plateNumber, publicCode: vehicle.publicCode },
            ...current,
          ])
          reset()
        },
      },
    )
  }

  return (
    <div className="max-w-md">
      <Link to="/vehicles" className="font-mono text-xs text-ink-faint hover:text-ink">
        ← vehicles
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">Register vehicles</h1>
      <p className="mt-1 text-sm text-ink-soft">Snap the plate, confirm the read, register. Repeat.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPickImage}
        className="hidden"
      />

      <div className="mt-6">
        {preview ? (
          <img
            src={preview}
            alt="plate"
            className="h-44 w-full rounded-[var(--radius)] border border-line object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-ink/20 text-ink-soft transition-colors hover:border-danfo hover:text-ink"
          >
            <Camera className="h-6 w-6" />
            <span className="text-sm">Snap the plate</span>
          </button>
        )}
      </div>

      {scan.isPending && <p className="mt-4 font-mono text-sm text-ink-faint">reading plate…</p>}

      {scan.isError && (
        <div className="mt-4">
          <p className="text-sm text-danfo-deep">Couldn't read the image. Try again.</p>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
            Retake
          </Button>
        </div>
      )}

      {scanned && (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs uppercase tracking-wider text-ink-faint">
                Plate number
              </label>
              {confidence && <ConfidenceTag confidence={confidence} />}
            </div>
            <Input
              autoFocus
              value={plateNumber}
              onChange={(event) => {
                setPlateNumber(event.target.value)
                setPlateChecked(true)
              }}
              placeholder="LND-123-XY"
              className="mt-1.5"
            />
            {plateState && <p className="mt-1 font-mono text-xs text-ink-faint">state: {plateState}</p>}
          </div>

          {ocrError && (
            <div className="rounded-[var(--radius)] border border-red-600/30 bg-red-600/5 p-3">
              <p className="text-sm text-ink">
                Couldn't read the plate automatically — enter it manually.
              </p>
              <p className="mt-1 font-mono text-xs text-red-600">{ocrError}</p>
            </div>
          )}

          {existing && (
            <div className="rounded-[var(--radius)] border border-danfo/50 bg-danfo/10 p-3">
              <p className="text-sm text-ink">
                <span className="font-medium">Already registered.</span> This plate is on file as{" "}
                <span className="font-mono">{existing.plateNumber}</span> · {existing.publicCode}.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-2.5"
                onClick={() => navigate(`/vehicles/${existing.id}`)}
              >
                Open vehicle page
              </Button>
            </div>
          )}

          {confidence === "low" && (
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={plateChecked}
                onChange={(event) => setPlateChecked(event.target.checked)}
                className="accent-ink"
              />
              I've checked this plate is correct
            </label>
          )}

          {register.isError && (
            <p className="text-sm text-danfo-deep">{(register.error as Error).message}</p>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!plateNumber.trim() || register.isPending || !!existing || needsCheck}
            >
              {register.isPending ? "Registering…" : "Register"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
              Retake
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Clear
            </Button>
          </div>
        </form>
      )}

      {registered.length > 0 && (
        <div className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">
            Registered this session · {registered.length}
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-[var(--radius)] border border-line">
            {registered.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="font-medium text-ink">{entry.plateNumber}</span>
                <span className="font-mono text-ink-soft">{entry.publicCode}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ConfidenceTag({ confidence }: { confidence: string }) {
  const isLow = confidence === "low"
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          confidence === "high" && "bg-danfo",
          confidence === "medium" && "bg-ink-faint",
          isLow && "bg-red-500",
        )}
      />
      <span className={isLow ? "text-red-600" : "text-ink-faint"}>
        {isLow ? "low — check" : confidence}
      </span>
    </span>
  )
}
