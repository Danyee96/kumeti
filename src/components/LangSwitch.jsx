import { useLang } from '../lib/i18n'

export default function LangSwitch({ dark = false }) {
  const { lang, setLang } = useLang()
  const base = dark ? 'bg-white/10 border-white/15' : 'bg-surface border-violet-100'
  return (
    <div className={`inline-flex rounded-2xl border p-1 ${base}`} dir="ltr">
      {[['en', 'EN'], ['ur', 'اردو']].map(([k, label]) => (
        <button
          key={k}
          onClick={() => setLang(k)}
          className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${lang === k ? 'bg-baari text-white shadow-glow' : dark ? 'text-white/70 hover:text-white' : 'text-fg/60 hover:text-fg'}`}
          style={k === 'ur' ? { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: 1.6 } : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
