import { useQuery } from "@tanstack/react-query"
import { api, apiBase } from "./api"

export type CurrentUser = {
  id: number
  email: string
  firstName: string
  lastName: string
  profilePicture: string
  isOperator: boolean
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => api<CurrentUser>("/auth/me"),
    retry: false,
  })
}

export function signIn() {
  const returnTo = `${window.location.origin}/`
  window.location.href = `${apiBase}/auth/google?return=${encodeURIComponent(returnTo)}`
}

export async function signOut() {
  await api("/auth/google/signout", { method: "POST" })
}
