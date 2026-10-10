import { api } from './api'

const KEY = 'kumeti_public_landing'
let request = null

export function readLandingCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(KEY))
    return cached && typeof cached === 'object' && cached.site ? cached : null
  } catch { return null }
}

export function fetchLanding() {
  if (!request) {
    request = api('public/landing').then((data) => {
      try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* Storage can be disabled. */ }
      return data
    }).finally(() => { request = null })
  }
  return request
}
