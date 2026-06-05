import type { ReactNode } from "react"
import { useCurrentUser, signIn } from "../lib/auth"
import { Button } from "./ui/Button"

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-sm text-ink-faint">
        loading…
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <div>
          <div className="font-display text-2xl font-bold tracking-tight text-ink">danfo ops</div>
          <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">
            The operator console. Sign in with an authorised account to continue.
          </p>
        </div>
        <Button onClick={signIn}>Continue with Google</Button>
      </div>
    )
  }

  return <>{children}</>
}
