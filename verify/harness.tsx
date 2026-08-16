import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { TagScanner } from "../src/components/TagScanner"

// Mounts the real TagScanner and lets the runner open and close it. Query params:
//
//   strict=off   render without StrictMode, which is how production behaves (React only
//                double-invokes effects in development)
//   decode=on    fire the scanner's onResult on a timer, modelling the real success path where a
//                decoded QR unmounts the overlay from inside its own callback
const params = new URLSearchParams(location.search)
const strict = params.get("strict") !== "off"
const decode = params.get("decode") === "on"

function Harness() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    const onClose = () => setOpen(false)
    window.addEventListener("harness:open", onOpen)
    window.addEventListener("harness:close", onClose)
    return () => {
      window.removeEventListener("harness:open", onOpen)
      window.removeEventListener("harness:close", onClose)
    }
  }, [])

  useEffect(() => {
    if (!open || !decode) return
    // a hit arrives shortly after the camera is up, exactly as RegisterVehicle sees it
    const hit = setTimeout(() => setOpen(false), 900)
    return () => clearTimeout(hit)
  }, [open])

  return open ? <TagScanner onResult={() => setOpen(false)} onClose={() => setOpen(false)} /> : null
}

const tree = <Harness />
createRoot(document.getElementById("root")!).render(strict ? <StrictMode>{tree}</StrictMode> : tree)
