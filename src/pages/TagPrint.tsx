import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { BackLink } from "../components/BackLink"
import { TagSticker } from "../components/TagSticker"
import { Button } from "../components/ui/Button"

// Each sticker keeps the Figma frame's 830:1196 ratio, so we set a width and let the height follow.
// The tall ratio is what drives the orientation choice below:
//   4-up  portrait A4 (210x297): 92mm wide -> 132.6mm tall. 2x2 = 190x271mm. Fits.
//   2-up  landscape A4 (297x210): 135mm wide -> 194.5mm tall. 2 side-by-side = 276x194.5mm. Fits.
//         Portrait can't do a real 2-up — two stacked stickers need 375mm of height — so the
//         2-up sheet turns the page instead of shrinking the sticker.
//   1-up  portrait A4: 180mm wide -> 259.3mm tall. The biggest the sticker gets on one sheet.
const LAYOUTS = {
  4: { perPage: 4, tagWidth: "92mm", label: "4 per page", sizeLabel: "small", orientation: "portrait" },
  2: { perPage: 2, tagWidth: "135mm", label: "2 per page", sizeLabel: "medium", orientation: "landscape" },
  1: { perPage: 1, tagWidth: "180mm", label: "1 per page", sizeLabel: "large", orientation: "portrait" },
} as const

type LayoutKey = keyof typeof LAYOUTS

// Printing a single tag is about how big the sticker comes out, not how many fit on a sheet — so
// the toggle switches vocabulary rather than offering counts that would all mean "one page".
const SINGLE_TAG_OPTIONS: LayoutKey[] = [4, 2, 1]
const BATCH_OPTIONS: LayoutKey[] = [4, 2]

export function TagPrint() {
  const [params] = useSearchParams()
  const [ready, setReady] = useState(false)

  const codes = useMemo(
    () => (params.get("codes") ?? "").split(",").filter(Boolean),
    [params],
  )

  // One tag prints large by default — you reached this page to produce that single sticker, not to
  // ration paper. A batch defaults to the densest layout for the opposite reason.
  const isSingle = codes.length === 1
  const options = isSingle ? SINGLE_TAG_OPTIONS : BATCH_OPTIONS
  const [layout, setLayout] = useState<LayoutKey>(isSingle ? 1 : 4)

  // 1-up is only offered for a single tag, so a batch arriving while it's selected would print one
  // sticker per sheet. Fall back to the densest layout the current selection actually offers.
  const activeLayout = options.includes(layout) ? layout : options[0]
  const config = LAYOUTS[activeLayout]

  const pages = useMemo(() => {
    const chunks: string[][] = []
    for (let index = 0; index < codes.length; index += config.perPage) {
      chunks.push(codes.slice(index, index + config.perPage))
    }
    return chunks
  }, [codes, config.perPage])

  // Printing before the sticker faces load would lay the design out on fallback metrics, so hold
  // the auto-print until the browser confirms every @font-face is resolved.
  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (codes.length === 0) {
    return <p className="p-10 font-mono text-sm text-ink-faint">No codes to print.</p>
  }

  return (
    <div className="min-h-screen bg-paper-deep">
      <div className="no-print border-b border-line bg-paper px-8 pb-5 pt-6">
        {/* reached from the tags page, a vehicle, or registration — BackLink walks history, so the
            label stays neutral rather than naming a screen the operator may not have come from */}
        <BackLink />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-lg font-semibold text-ink">
              {isSingle ? `Print tag · ${codes[0]}` : `Print tag stickers · ${codes.length}`}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">
              {pages.length} A4 {pages.length === 1 ? "page" : "pages"} ·{" "}
              {config.orientation} · {config.tagWidth} wide
              {!ready && " · loading fonts…"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-[var(--radius)] border border-line p-0.5">
              {options.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLayout(key)}
                  className={`rounded-[calc(var(--radius)-2px)] px-3 py-1.5 font-mono text-xs transition-colors ${
                    activeLayout === key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {isSingle ? LAYOUTS[key].sizeLabel : LAYOUTS[key].label}
                </button>
              ))}
            </div>
            <Button size="sm" disabled={!ready} onClick={() => window.print()}>
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* @page can't be driven by inline styles, so the chosen orientation is injected here. */}
      <style>{`@media print { @page { size: A4 ${config.orientation}; margin: 0; } }`}</style>

      {/* Screen-only padding and a soft shadow so each sheet reads as a page resting on a surface
          rather than being welded to the header. Both are stripped for the actual print. */}
      <div
        className="tag-sheet overflow-x-auto px-4 py-10 print:overflow-visible print:p-0"
        style={{ ["--tag-w" as string]: config.tagWidth }}
      >
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="tag-sheet-page mx-auto flex flex-wrap content-center justify-center gap-[6mm] bg-white shadow-[0_2px_16px_rgba(26,23,16,0.13)] print:shadow-none"
            style={{
              width: config.orientation === "portrait" ? "210mm" : "297mm",
              height: config.orientation === "portrait" ? "297mm" : "210mm",
              marginBottom: pageIndex < pages.length - 1 ? "8mm" : undefined,
            }}
          >
            {page.map((code) => (
              <TagSticker key={code} code={code} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
