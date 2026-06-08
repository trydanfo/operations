import { useState } from "react"
import { Link } from "react-router-dom"
import { useUsers, useUserCounts, userDisplayName, USERS_PAGE_SIZE } from "../lib/users"
import { ApiError } from "../lib/api"
import { Input } from "../components/ui/Input"
import { Pagination } from "../components/Pagination"
import { Avatar } from "../components/Avatar"
import { OperatorAccessRequired } from "../components/OperatorAccessRequired"

export function Users() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useUsers(search, page)
  const counts = useUserCounts()

  if (error instanceof ApiError && error.status === 403) {
    return <OperatorAccessRequired />
  }

  const users = data ?? []

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Users</h1>
          <p className="mt-1 text-sm text-ink-soft">Riders and staff on the network.</p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-ink">
            {(counts.data?.total ?? 0).toLocaleString()}
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">total users</div>
        </div>
      </div>

      <div className="mt-6">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
          }}
          className="max-w-xs"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius)] border border-line">
        {isLoading && <p className="px-4 py-10 text-center font-mono text-sm text-ink-faint">loading…</p>}
        {!isLoading && users.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-ink-faint">No users match.</p>
        )}
        {users.map((user, index) => (
          <Link
            key={user.id}
            to={`/users/${user.id}`}
            className={
              (index === users.length - 1 ? "" : "border-b border-line ") +
              "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper-deep/50"
            }
          >
            <Avatar src={user.profilePicture} name={userDisplayName(user)} size={36} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">{userDisplayName(user)}</div>
              <div className="truncate font-mono text-xs text-ink-faint">{user.email}</div>
            </div>
          </Link>
        ))}
      </div>

      <Pagination page={page} hasNext={users.length === USERS_PAGE_SIZE} onChange={setPage} />
    </div>
  )
}
