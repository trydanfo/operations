// Temporary harness: mounts TagPrint outside RequireAuth so the sticker can be screenshotted and
// diffed against the Figma frame. Not part of the app; delete when the design is signed off.
import { createRoot } from "react-dom/client"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { TagPrint } from "./pages/TagPrint"
import "./index.css"

const codes = new URLSearchParams(location.search).get("codes") ?? "DANFO123"

createRoot(document.getElementById("root")!).render(
  <MemoryRouter initialEntries={[`/print-tags?codes=${codes}`]}>
    <Routes>
      <Route path="/print-tags" element={<TagPrint />} />
    </Routes>
  </MemoryRouter>,
)
