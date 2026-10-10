// Tiny fetch wrapper for the PHP API (api/index.php?r=route).
const BASE = './api/index.php'

export class ApiError extends Error {
  constructor(code, status) { super(code); this.code = code; this.status = status }
}

export function getToken() {
  try { return localStorage.getItem('kumeti_token') } catch { return null }
}
export function setToken(t) {
  try { t ? localStorage.setItem('kumeti_token', t) : localStorage.removeItem('kumeti_token') } catch { /* ignore */ }
}

export async function api(route, body, method) {
  const opts = { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json' } }
  const t = getToken()
  if (t) opts.headers['X-Auth-Token'] = t
  let url = `${BASE}?r=${route}`
  if (body && opts.method === 'GET') {
    url += '&' + new URLSearchParams(body).toString()
  } else if (body) {
    opts.body = JSON.stringify(body)
  }
  let res
  try { res = await fetch(url, opts) } catch { throw new ApiError('NETWORK', 0) }
  let data = null
  try { data = await res.json() } catch { throw new ApiError(res.status === 404 ? 'NOT_INSTALLED' : 'NETWORK', res.status) }
  if (!res.ok || data?.error) {
    if (res.status === 401 && route !== 'auth/login') {
      setToken(null)
      window.dispatchEvent(new Event('kumeti:logout'))
    }
    throw new ApiError(data?.error || 'SERVER_ERROR', res.status)
  }
  return data
}
