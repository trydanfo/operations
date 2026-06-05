import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "../../lib/cn"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-[var(--radius)] border border-ink/15 bg-transparent px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danfo",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"
