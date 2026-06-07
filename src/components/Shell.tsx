import type { ReactNode } from "react"
import { Link, NavLink } from "react-router-dom"
import { useCurrentUser, signOut } from "../lib/auth"
import { Button } from "./ui/Button"
import { cn } from "../lib/cn"

export function Shell({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser()

  async function handleSignOut() {
    await signOut()
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-base font-bold tracking-tight text-ink">danfo</span>
              <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper">
                ops
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <NavItem to="/" label="Dashboard" />
              <NavItem to="/rides" label="Rides" />
              <NavItem to="/reports" label="Reports" />
              <NavItem to="/vehicles" label="Vehicles" />
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden font-mono text-xs text-ink-faint sm:inline">{user.email}</span>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "border-b-2 py-1 text-sm transition-colors",
          isActive ? "border-danfo text-ink" : "border-transparent text-ink-soft hover:text-ink",
        )
      }
    >
      {label}
    </NavLink>
  )
}
