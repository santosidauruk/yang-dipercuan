const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function fetchApi<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error ?? 'API request failed')
  }
  return res.json()
}
