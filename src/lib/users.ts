import { useQuery } from "@tanstack/react-query"
import { api } from "./api"

export const USERS_PAGE_SIZE = 10

export type UserListItem = {
  id: number
  firstName: string
  lastName: string
  email: string
  profilePicture: string
}

export type UserDetail = UserListItem & {
  createdAt: string
  rides: number
  reviews: number
  reports: number
}

export function userDisplayName(user: { firstName: string; lastName: string; email: string }) {
  const name = `${user.firstName} ${user.lastName}`.trim()
  return name || user.email
}

export function useUsers(search: string, page: number) {
  return useQuery({
    queryKey: ["users", search, page],
    queryFn: () =>
      api<UserListItem[]>(
        `/api/v1/ops/users?search=${encodeURIComponent(search)}&limit=${USERS_PAGE_SIZE}&offset=${page * USERS_PAGE_SIZE}`,
      ),
    placeholderData: (previous) => previous,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => api<UserDetail>(`/api/v1/ops/users/${id}`),
  })
}
