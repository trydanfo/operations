import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { cn } from "./cn"

type ToastKind = "success" | "error" | "info"
type Toast = { id: number; message: string; kind: ToastKind }
type ToastContextValue = { toast: (message: string, kind?: ToastKind) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

let nextToastId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextToastId++
    setToasts((current) => [...current, { id, message, kind }])
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-[var(--radius)] border-l-2 bg-ink px-4 py-2.5 text-sm text-paper shadow-lg",
              item.kind === "success" && "border-danfo",
              item.kind === "error" && "border-red-500",
              item.kind === "info" && "border-ink-faint",
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context.toast
}
