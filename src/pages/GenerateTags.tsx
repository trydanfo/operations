import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Trash2, Printer } from "lucide-react"
import { BackLink } from "../components/BackLink"
import { VehicleQR } from "../components/VehicleQR"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { useTags, useGenerateTags, useDeleteTag, MAX_TAG_BATCH, type Tag } from "../lib/tags"
import { formatDateTime } from "../lib/rides"
import { useToast } from "../lib/toast"

export function GenerateTags() {
  const [count, setCount] = useState(24)
  const [batch, setBatch] = useState("")
  const navigate = useNavigate()
  const toast = useToast()

  const tags = useTags()
  const generate = useGenerateTags()
  const remove = useDeleteTag()

  function doGenerate() {
    const safeCount = Math.max(1, Math.min(MAX_TAG_BATCH, Math.round(count) || 0))
    generate.mutate(
      { count: safeCount, batch: batch.trim() || undefined },
      {
        onSuccess: (created) => toast(`Generated ${created.length} tag${created.length === 1 ? "" : "s"}`, "success"),
        onError: (error) => toast((error as Error).message || "Could not generate tags", "error"),
      },
    )
  }

  function printCodes(codes: string[]) {
    if (codes.length === 0) return
    navigate(`/print-tags?codes=${codes.join(",")}`)
  }

  function printAll() {
    printCodes((tags.data ?? []).map((tag) => tag.code))
  }

  const list = tags.data ?? []

  return (
    <div className="max-w-3xl">
      <BackLink />
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">Generate tags</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Pre-mint QR codes to print as stickers before a registration drive. Attach a code to a vehicle in
        the field and the sticker goes live.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-[var(--radius)] border border-line p-4">
        <div className="w-24">
          <label className="font-mono text-xs uppercase tracking-wider text-ink-faint">Count</label>
          <Input
            type="number"
            min={1}
            max={MAX_TAG_BATCH}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="mt-1.5"
          />
        </div>
        <div className="min-w-40 flex-1">
          <label className="font-mono text-xs uppercase tracking-wider text-ink-faint">Batch label (optional)</label>
          <Input
            value={batch}
            onChange={(event) => setBatch(event.target.value)}
            placeholder="e.g. yaba-jun"
            className="mt-1.5"
          />
        </div>
        <Button onClick={doGenerate} disabled={generate.isPending}>
          {generate.isPending ? "Generating…" : "Generate"}
        </Button>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">
          Unassigned tags · {list.length}
        </h2>
        {list.length > 0 && (
          <Button variant="outline" size="sm" onClick={printAll}>
            <Printer className="h-4 w-4" />
            Print sheet
          </Button>
        )}
      </div>

      {tags.isLoading ? (
        <p className="mt-4 font-mono text-sm text-ink-faint">loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-4 rounded-[var(--radius)] border border-dashed border-line px-4 py-10 text-center text-sm text-ink-faint">
          No unassigned tags. Generate a batch to get started.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-[var(--radius)] border border-line">
          {list.map((tag) => (
            <TagRow
              key={tag.id}
              tag={tag}
              onDelete={() => remove.mutate({ id: tag.id, code: tag.code })}
              onPrint={() => printCodes([tag.code])}
              deleting={remove.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function TagRow({
  tag,
  onDelete,
  onPrint,
  deleting,
}: {
  tag: Tag
  onDelete: () => void
  onPrint: () => void
  deleting: boolean
}) {
  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <VehicleQR publicCode={tag.code} size={48} />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm font-semibold text-ink">{tag.code}</div>
        <div className="font-mono text-xs text-ink-faint">
          {tag.batch ? `${tag.batch} · ` : ""}
          {formatDateTime(tag.createdAt)}
        </div>
      </div>
      <button
        type="button"
        onClick={onPrint}
        aria-label={`Print tag ${tag.code}`}
        className="text-ink-faint transition-colors hover:text-ink"
      >
        <Printer className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Discard tag"
        className="text-ink-faint transition-colors hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}
