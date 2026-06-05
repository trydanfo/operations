import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useRegisterVehicle } from "../lib/vehicles"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export function RegisterVehicle() {
  const [plateNumber, setPlateNumber] = useState("")
  const navigate = useNavigate()
  const register = useRegisterVehicle()

  function submit(event: FormEvent) {
    event.preventDefault()
    register.mutate(plateNumber.trim(), {
      onSuccess: (vehicle) => navigate(`/vehicles/${vehicle.id}`),
    })
  }

  return (
    <div className="max-w-md">
      <Link to="/vehicles" className="font-mono text-xs text-ink-faint hover:text-ink">
        ← vehicles
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">
        Register a vehicle
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Enter the plate. A unique code and its QR sticker are generated automatically.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-ink-faint">
            Plate number
          </label>
          <Input
            autoFocus
            value={plateNumber}
            onChange={(event) => setPlateNumber(event.target.value)}
            placeholder="LND-123-XY"
            className="mt-1.5"
          />
        </div>

        {register.isError && (
          <p className="text-sm text-danfo-deep">{(register.error as Error).message}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={!plateNumber.trim() || register.isPending}>
            {register.isPending ? "Registering…" : "Register vehicle"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate("/vehicles")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
