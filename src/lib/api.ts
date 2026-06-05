const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const body = await response.json()
      message = body.error ?? message
    } catch {
      // NOTE: body was not json, fall back to the status text
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }
  return (await response.json()) as TResponse
}

export const apiBase = apiBaseUrl
