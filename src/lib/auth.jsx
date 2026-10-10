import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, setToken, getToken } from './api'
import { useLang } from './i18n'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const { setLang } = useLang()

  useEffect(() => {
    if (!getToken()) { setReady(true); return }
    api('auth/me').then((d) => { setUser(d.user); setLang(d.user.lang, { persist: false }) }).catch(() => setToken(null)).finally(() => setReady(true))
    const onOut = () => setUser(null)
    window.addEventListener('kumeti:logout', onOut)
    return () => window.removeEventListener('kumeti:logout', onOut)
  }, [setLang])

  const login = useCallback(async (email, password) => {
    const d = await api('auth/login', { email, password })
    setToken(d.token)
    setUser(d.user)
    setLang(d.user.lang, { persist: false })
    return d.user
  }, [setLang])

  const register = useCallback(async (payload) => {
    const d = await api('auth/register', payload)
    setToken(d.token)
    setUser(d.user)
    setLang(d.user.lang, { persist: false })
    return d.user
  }, [setLang])

  const logout = useCallback(async () => {
    try { await api('auth/logout', {}) } catch { /* ignore */ }
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const d = await api('auth/profile', payload)
    setUser(d.user)
    if (d.user.lang) setLang(d.user.lang, { persist: false })
    return d.user
  }, [setLang])

  return <AuthCtx.Provider value={{ user, ready, login, register, logout, updateProfile }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
export const homeFor = (role) => (role === 'superadmin' ? '/admin' : role === 'organizer' ? '/org' : '/me')
