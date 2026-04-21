const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN ?? 'https://supabase-db-sync-test.onrender.com').replace(/\/+$/, '')

export async function request(path, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = {
    ...(options.headers ?? {}),
  }

  const hasBody = options.body !== undefined && options.body !== null
  if (hasBody && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    method,
    headers,
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