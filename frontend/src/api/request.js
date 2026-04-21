const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? ''

export async function request(path, options = {}) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (response.status === 204) return null

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const errorCode = data?.error ?? 'unknown_error'
    const error = new Error(errorCode)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}