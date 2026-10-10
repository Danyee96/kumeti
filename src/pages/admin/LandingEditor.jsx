import { useEffect, useState } from 'react'
import { Eye, Save, ChevronDown, Plus, Trash2, X, RotateCcw, ExternalLink } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/i18n'
import { mergeLanding, LANDING_DEFAULTS, LANDING_ICONS } from '../../lib/landingDefaults'
import { Button, Card, Field, Input, Textarea, Toggle, PageHeader, Spinner, useToast, Confirm, cx } from '../../components/ui'
import Landing, { ICONS } from '../Landing'

// Immutable set by path: setAt(obj, ['hero','title','en'], 'x')
function setAt(obj, path, value) {
  if (!path.length) return value
  const [k, ...rest] = path
  const copy = Array.isArray(obj) ? [...obj] : { ...obj }
  copy[k] = setAt(obj?.[k], rest, value)
  return copy
}

const SECTIONS = [
  ['hero', 'Hero', [['badge', 'L'], ['title', 'L'], ['highlight', 'L'], ['subtitle', 'LT'], ['ctaPrimary', 'L'], ['ctaSecondary', 'L']]],
  ['stats', 'Stats', [], { list: 'items', fields: [['value', 'S'], ['label', 'L']], blank: { value: '', label: { en: '', ur: '', roman: '' } } }],
  ['trust', 'Cities ticker', [['title', 'L'], ['items', 'S']]],
  ['features', 'Features', [['title', 'L'], ['subtitle', 'LT']], { list: 'items', fields: [['icon', 'ICON'], ['title', 'L'], ['desc', 'LT']], blank: { icon: 'Sparkles', title: { en: '', ur: '', roman: '' }, desc: { en: '', ur: '', roman: '' } } }],
  ['types', 'Kameti types', [['title', 'L'], ['subtitle', 'LT']]],
  ['steps', 'How it works', [['title', 'L']], { list: 'items', fields: [['title', 'L'], ['desc', 'LT']], blank: { title: { en: '', ur: '', roman: '' }, desc: { en: '', ur: '', roman: '' } } }],
  ['testimonials', 'Testimonials', [['title', 'L']], { list: 'items', fields: [['name', 'S'], ['city', 'S'], ['quote', 'LT']], blank: { name: '', city: '', quote: { en: '', ur: '', roman: '' } } }],
  ['faq', 'FAQ', [['title', 'L']], { list: 'items', fields: [['q', 'L'], ['a', 'LT']], blank: { q: { en: '', ur: '', roman: '' }, a: { en: '', ur: '', roman: '' } } }],
  ['cta', 'Call to action', [['title', 'L'], ['subtitle', 'LT'], ['button', 'L']]],
  ['footer', 'Footer', [['about', 'L'], ['phone', 'S'], ['email', 'S'], ['address', 'L']], null, true],
]

function LocalizedField({ label, value, onChange, area }) {
  const C = area ? Textarea : Input
  return (
    <div>
      <span className="label">{label}</span>
      <div className="grid gap-2 lg:grid-cols-3">
        <div className="relative"><span className="absolute end-3 top-2 text-[10px] font-bold text-violet-400">EN</span><C dir="ltr" className="latin-input" aria-label={`${label} — English`} value={value?.en || ''} onChange={(e) => onChange({ ...value, en: e.target.value })} /></div>
        <div className="relative"><span className="absolute start-3 top-2 text-[10px] font-bold text-violet-400">UR</span><C dir="rtl" className="font-urdu" aria-label={`${label} — Urdu`} value={value?.ur || ''} onChange={(e) => onChange({ ...value, ur: e.target.value })} /></div>
        <div className="relative"><span className="absolute end-3 top-2 text-[10px] font-bold text-violet-400">Roman Urdu</span><C dir="ltr" className="latin-input" aria-label={`${label} — Roman Urdu`} value={value?.roman || ''} onChange={(e) => onChange({ ...value, roman: e.target.value })} /></div>
      </div>
    </div>
  )
}

function FieldFor({ name, kind, value, onChange }) {
  const { t } = useLang()
  const label = t(`editor_${name}`)
  if (kind === 'L' || kind === 'LT') return <LocalizedField label={label} value={value} onChange={onChange} area={kind === 'LT'} />
  if (kind === 'ICON') {
    return (
      <div>
        <span className="label">{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {LANDING_ICONS.map((ic) => { const I = ICONS[ic]; return (
            <button type="button" key={ic} onClick={() => onChange(ic)} className={cx('grid h-10 w-10 place-items-center rounded-xl transition', value === ic ? 'bg-baari text-white' : 'bg-violet-50 text-violet-600')} title={ic}><I className="h-5 w-5" /></button>
          ) })}
        </div>
      </div>
    )
  }
  return <Field label={label}><Input dir="auto" value={value || ''} onChange={(e) => onChange(e.target.value)} /></Field>
}

export default function LandingEditor() {
  const { t, err } = useLang()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [open, setOpen] = useState('hero')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reset, setReset] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { api('public/landing').then((d) => setData(mergeLanding(d.landing))).catch(() => setData(mergeLanding(null))) }, [])
  const update = (path, v) => { setData((d) => setAt(d, path, v)); setDirty(true) }

  const save = async () => {
    setSaving(true)
    try { await api('admin/landing', { landing: data }); toast(t('saved')); setDirty(false) } catch (x) { toast(err(x.code), 'err') } finally { setSaving(false) }
  }

  if (!data) return <Spinner />

  return (
    <div>
      <PageHeader title={t('landingEditor')} sub={dirty ? '●' : ''}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={RotateCcw} onClick={() => setReset(true)}>Reset</Button>
            <Button variant="outline" icon={Eye} onClick={() => setPreview(true)}>{t('preview')}</Button>
            <a href="#/" target="_blank" rel="noreferrer"><Button variant="outline" size="icon" aria-label="Open"><ExternalLink className="h-5 w-5" /></Button></a>
            <Button icon={Save} loading={saving} onClick={save}>{t('save')}</Button>
          </div>
        } />

      <div className="space-y-3">
        {SECTIONS.map(([key, , fields, list, noToggle]) => {
          const sec = data[key]
          const isOpen = open === key
          return (
            <Card key={key} className="overflow-hidden p-0">
              <button onClick={() => setOpen(isOpen ? null : key)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start">
                <span className="flex items-center gap-3">
                  <span className={cx('h-3 w-3 rounded-full', noToggle || sec.show ? 'bg-emerald-500' : 'bg-gray-300')} />
                  <span className="text-lg font-extrabold">{t(`editor_section_${key}`)}</span>
                </span>
                <ChevronDown className={cx('h-5 w-5 transition', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="space-y-4 border-t border-violet-50 p-5">
                  {!noToggle && <Toggle checked={!!sec.show} onChange={(v) => update([key, 'show'], v)} label={t('sectionVisible')} />}
                  {fields.map(([f, kind]) => <FieldFor key={f} name={f} kind={kind} value={sec[f]} onChange={(v) => update([key, f], v)} />)}
                  {list && (
                    <div className="space-y-3">
                      {sec[list.list].map((item, i) => (
                        <div key={i} className="relative space-y-3 rounded-3xl border border-violet-100 bg-lilac/60 p-4">
                          <div className="flex items-center justify-between">
                            <span className="num grid h-8 w-8 place-items-center rounded-xl bg-ink text-sm font-bold text-white">{i + 1}</span>
                            <button onClick={() => update([key, list.list], sec[list.list].filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-500" aria-label={t('delete')}><Trash2 className="h-4 w-4" /></button>
                          </div>
                          {list.fields.map(([f, kind]) => <FieldFor key={f} name={f} kind={kind} value={item[f]} onChange={(v) => update([key, list.list, i, f], v)} />)}
                        </div>
                      ))}
                      <Button variant="soft" icon={Plus} onClick={() => update([key, list.list], [...sec[list.list], structuredClone(list.blank)])}>{t('add')}</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Sticky save bar on mobile */}
      {dirty && (
        <div className="fixed inset-x-3 bottom-24 z-40 lg:hidden">
          <Button className="w-full" size="lg" icon={Save} loading={saving} onClick={save}>{t('save')}</Button>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink">
          <button onClick={() => setPreview(false)} className="fixed bottom-6 start-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-surface px-5 py-3 font-bold text-fg shadow-2xl"><X className="h-5 w-5" />{t('close')} {t('preview')}</button>
          <Landing previewData={data} />
        </div>
      )}

      <Confirm open={reset} onClose={() => setReset(false)} onConfirm={() => { setData(structuredClone(LANDING_DEFAULTS)); setDirty(true); setReset(false) }} />
    </div>
  )
}
