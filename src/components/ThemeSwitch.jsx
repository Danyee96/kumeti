import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/theme'
import { useLang } from '../lib/i18n'

export default function ThemeSwitch({ className = '' }) {
  const { isDark, toggle } = useTheme()
  const { t } = useLang()
  return (
    <button onClick={toggle} aria-label={isDark ? t('lightMode') : t('darkMode')} title={isDark ? t('lightMode') : t('darkMode')}
      className={`relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface text-fg transition active:scale-90 ${className}`}>
      <Sun className={`absolute h-5 w-5 text-amber-500 transition duration-300 ${isDark ? 'translate-y-0 rotate-0 opacity-100' : 'translate-y-6 rotate-90 opacity-0'}`} />
      <Moon className={`absolute h-5 w-5 text-violet-500 transition duration-300 ${isDark ? '-translate-y-6 -rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100'}`} />
    </button>
  )
}
