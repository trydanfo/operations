import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Camera } from "lucide-react"
import { useScanPlate, useRegisterVehicle, type Vehicle } from "../lib/vehicles"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { cn } from "../lib/cn"

type SessionEntry = { id: number; plateNumber: string; publicCode: string }

export function RegisterVehicle() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState("")
  const [scanned, setScanned] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [confidence, setConfidence] = useState("")
  const [plateState, setPlateState] = useState("")
  const [registered, setRegistered] = useState<SessionEntry[]>([])

  const scan = useScanPlate()
  const register = useRegisterVehicle()

  function onPickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setScanned(false)
    setImageUrl("")
    setPlateNumber("")
    setConfidence("")
    setPlateState("")

    scan.mutate(file, {
      onSuccess: (result) => {
        setPlateNumber(result.plateNumber)
        setConfidence(result.confidence)
        setPlateState(result.plateState)
        setImageUrl(result.imageUrl)
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
    scan.reset()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const plate = plateNumber.trim()
    if (!plate) return

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

      {scan.isPending && (
        <p className="mt-4 font-mono text-sm text-ink-faint">reading plate…</p>
      )}

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
              onChange={(event) => setPlateNumber(event.target.value)}
              placeholder="LND-123-XY"
              className="mt-1.5"
            />
            {plateState && <p className="mt-1 font-mono text-xs text-ink-faint">state: {plateState}</p>}
          </div>

          {register.isError && (
            <p className="text-sm text-danfo-deep">{(register.error as Error).message}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={!plateNumber.trim() || register.isPending}>
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
