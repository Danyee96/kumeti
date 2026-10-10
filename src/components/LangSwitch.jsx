import { ChevronDown, Languages } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { LANGUAGES } from '../lib/languages'

export default function LangSwitch({ dark = false, value, onChange, className = '' }) {
  const { lang, setLang, t } = useLang()
  return (
    <div className={`relative inline-flex items-center rounded-2xl border shadow-sm transition focus-within:ring-2 focus-within:ring-violet-400 ${dark ? 'border-white/20 bg-white/10 text-white' : 'border-line bg-surface text-fg'} ${className}`} dir="ltr">
      <Languages className={`pointer-events-none absolute left-2.5 h-4 w-4 sm:left-3 ${dark ? 'text-white/75' : 'text-violet-500'}`} />
      <select aria-label={t('language')} value={value ?? lang} onChange={(event) => (onChange || setLang)(event.target.value)}
        className="language-select h-11 w-full min-w-[120px] cursor-pointer appearance-none rounded-2xl bg-transparent pl-8 pr-7 text-xs font-bold outline-none sm:min-w-[142px] sm:pl-10 sm:pr-9 sm:text-sm">
        {LANGUAGES.map((language) => <option key={language.value} value={language.value} className="bg-surface text-fg" lang={language.htmlLang}>{language.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 opacity-60 sm:right-3" />
    </div>
  )
}
