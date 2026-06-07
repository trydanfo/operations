import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, NavLink } from "react-router-dom"
import { useCurrentUser, signOut } from "../lib/auth"
import { Button } from "./ui/Button"
import { Avatar } from "./Avatar"
import { cn } from "../lib/cn"

export function Shell({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser()

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
              <NavItem to="/rides" label="Rides" />
              <NavItem to="/reports" label="Reports" />
              <NavItem to="/vehicles" label="Vehicles" />
              <NavItem to="/users" label="Users" />
            </nav>
          </div>
          {user && <ProfileMenu name={`${user.firstName} ${user.lastName}`.trim() || user.email} email={user.email} picture={user.profilePicture} />}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}

function ProfileMenu({ name, email, picture }: { name: string; email: string; picture: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  async function handleSignOut() {
    await signOut()
    window.location.href = "/"
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center rounded-full ring-offset-2 ring-offset-paper transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        aria-label="Account menu"
      >
        <Avatar src={picture} name={name} size={32} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-[var(--radius)] border border-line bg-paper p-3 shadow-lg">
          <div className="border-b border-line pb-2">
            <div className="truncate text-sm font-medium text-ink">{name}</div>
            <div className="truncate font-mono text-xs text-ink-faint">{email}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="mt-2 w-full justify-start">
            Sign out
          </Button>
        </div>
      )}
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
