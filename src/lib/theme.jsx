import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ThemeCtx = createContext(null)
const KEY = 'kumeti_theme'

function systemDark() {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
}
function saved() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B0716' : '#F5F3FF')
}

export function ThemeProvider({ children }) {
  // First visit follows the phone/computer setting; after a tap the choice is remembered.
  const [theme, setThemeState] = useState(() => saved() || (systemDark() ? 'dark' : 'light'))
  useEffect(() => { applyTheme(theme === 'dark') }, [theme])
  useEffect(() => {
    if (saved()) return
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const on = (e) => { if (!saved()) setThemeState(e.matches ? 'dark' : 'light') }
    mq?.addEventListener?.('change', on)
    return () => mq?.removeEventListener?.('change', on)
  }, [])
  const setTheme = useCallback((t) => {
    setThemeState(t)
    try { localStorage.setItem(KEY, t) } catch { /* storage unavailable */ }
  }, [])
  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme])
  return <ThemeCtx.Provider value={{ theme, isDark: theme === 'dark', setTheme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
