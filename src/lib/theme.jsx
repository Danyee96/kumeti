import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ThemeCtx = createContext(null)
const KEY = 'kumeti_theme'

function saved() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B0716' : '#F5F3FF')
}

export function ThemeProvider({ children }) {
  // First visit opens in light mode; explicit choices are remembered.
  const [theme, setThemeState] = useState(() => saved() === 'dark' ? 'dark' : 'light')
  useEffect(() => { applyTheme(theme === 'dark') }, [theme])
  const setTheme = useCallback((t) => {
    setThemeState(t)
    try { localStorage.setItem(KEY, t) } catch { /* storage unavailable */ }
  }, [])
  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme])
  return <ThemeCtx.Provider value={{ theme, isDark: theme === 'dark', setTheme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
