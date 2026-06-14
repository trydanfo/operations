import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { VehicleQR } from "../components/VehicleQR"
import { Button } from "../components/ui/Button"

// A clean, Shell-free sticker sheet for pre-minted tags — mirrors the vehicle Print page but keys off
// raw codes, since tags have no vehicle row yet.
export function TagPrint() {
  const [params] = useSearchParams()
  const codes = (params.get("codes") ?? "").split(",").filter(Boolean)

  useEffect(() => {
    if (codes.length > 0) {
      const timer = setTimeout(() => window.print(), 400)
      return () => clearTimeout(timer)
    }
  }, [codes.length])

  if (codes.length === 0) {
    return <p className="p-10 font-mono text-sm text-ink-faint">No codes to print.</p>
  }

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="no-print mb-8 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-ink">Print tag stickers · {codes.length}</h1>
        <Button size="sm" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {codes.map((code) => (
          <div
            key={code}
            className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-ink/15 p-5"
          >
            <VehicleQR publicCode={code} size={140} />
            <div className="font-mono text-sm font-semibold text-ink">{code}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
