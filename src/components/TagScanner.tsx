import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Html5Qrcode } from "html5-qrcode"
import { X } from "lucide-react"

const SCAN_REGION_ID = "tag-scan-region"

// Full-screen camera overlay that decodes a tag QR and hands back the raw text. Mounts the camera
// once; the parent closes it after a hit. Portaled to body so it sits above the form.
export function TagScanner({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const handledRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode(SCAN_REGION_ID, false)
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          if (handledRef.current) return
          handledRef.current = true
          onResultRef.current(decodedText)
        },
        () => {},
      )
      .catch(() => {
        // camera blocked or unavailable — the operator can close and type the code instead
      })

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {})
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-mono text-sm text-white">Scan tag QR</span>
        <button type="button" onClick={onClose} aria-label="Close scanner" className="text-white/80 hover:text-white">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-10">
        <div id={SCAN_REGION_ID} className="w-full max-w-sm overflow-hidden rounded-[var(--radius)]" />
      </div>
      <p className="px-5 pb-8 text-center text-sm text-white/70">Point the camera at the sticker QR.</p>
    </div>,
    document.body,
  )
}
