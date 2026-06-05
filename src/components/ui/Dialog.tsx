import * as RadixDialog from "@radix-ui/react-dialog"
import type { ReactNode } from "react"

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-ink/30 backdrop-blur-sm" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)] border border-ink/10 bg-paper p-6 shadow-xl focus:outline-none">
          <RadixDialog.Title className="font-display text-lg font-semibold text-ink">
            {title}
          </RadixDialog.Title>
          <RadixDialog.Description
            className={description ? "mt-1 text-sm text-ink-soft" : "sr-only"}
          >
            {description ?? title}
          </RadixDialog.Description>
          <div className="mt-4">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
