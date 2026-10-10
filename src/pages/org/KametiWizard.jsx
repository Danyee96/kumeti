import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Trash2, UserPlus, ListPlus, Sparkles, AlertTriangle, CheckCircle2, Dices, Phone, SlidersHorizontal, CalendarRange } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/i18n'
import { TYPES, TYPE_KEYS, TYPE_DEFAULTS, money, lakh, roundDate, fmtDate, n, monthSpan, addMonths, monthName, roundLabel, buildSlots, shuffleArr, numbersLabel } from '../../lib/kameti'
import { Button, Card, Field, Input, Textarea, Segmented, Toggle, Select, Spinner, useToast, cx, Modal } from '../../components/ui'
import SlotEditor from '../../components/SlotEditor'

const thisMonth = () => new Date().toISOString().slice(0, 7)
let KEY = 1
const person = (name = '', numbers = 1, phone = '') => ({ key: KEY++, name, numbers, phone, showPhone: false })

export default function KametiWizard() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { t, err } = useLang()
  const nav = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState(() => {
    const start = thisMonth()
    return { type: '', title: '', amount: 10000, frequency: 'monthly', slots: 10, startMonth: start, start_date: `${start}-01`, notes: '', status: 'active', config: { ...TYPE_DEFAULTS.common } }
  })
  const [people, setPeople] = useState([person(), person(), person()])
  const [groups, setGroups] = useState([])
  const [builtFor, setBuiltFor] = useState('')
  const [bulk, setBulk] = useState(null)
  const top = useRef(null)

  useEffect(() => {
    if (!editing) return
    api('kametis/get', { id }).then((d) => {
      const k = d.kameti
      setF({ type: k.type, title: k.title, amount: n(k.amount), frequency: k.frequency, slots: n(k.slots), startMonth: k.start_date.slice(0, 7), start_date: k.start_date, notes: k.notes || '', status: k.status, config: { ...TYPE_DEFAULTS.common, ...TYPE_DEFAULTS[k.type], ...k.config } })
      setStep(1)
    }).catch((x) => toast(err(x.code), 'err')).finally(() => setLoading(false))
  }, [editing, id]) // eslint-disable-line react-hooks/exhaustive-deps

  const steps = editing ? ['type', 'when', 'amount', 'review'] : ['type', 'when', 'amount', 'people', 'numbers', 'review']
  const key = steps[step]
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setCfg = (k, v) => setF((x) => ({ ...x, config: { ...x.config, [k]: v } }))
  const go = (s) => { setStep(s); top.current?.scrollIntoView({ behavior: 'smooth' }) }

  const filled = people.filter((p) => p.name.trim())
  const totalNumbers = filled.reduce((a, p) => a + n(p.numbers), 0)
  const numbersOk = Math.abs(totalNumbers - n(f.slots)) < 0.01
  const sig = JSON.stringify(filled.map((p) => [p.key, p.numbers])) + f.slots

  // (Re)build numbers whenever the people/number counts change.
  useEffect(() => {
    if (key !== 'numbers' || builtFor === sig) return
    let g = buildSlots(filled).map((s) => ({ slot_no: s.slot_no, holders: s.holders.map((h) => ({ id: h.key, portion: h.portion })) }))
    if (f.type === 'qurandazi') g = shuffleArr(g.map((x) => x.holders)).map((holders, i) => ({ slot_no: i + 1, holders }))
    while (g.length < n(f.slots)) g.push({ slot_no: g.length + 1, holders: [] })
    setGroups(g.slice(0, n(f.slots)))
    setBuiltFor(sig)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const kLike = { ...f, start_date: f.frequency === 'monthly' ? `${f.startMonth}-01` : f.start_date }
  const label = (r) => roundLabel(kLike, r)
  const slotsOk = groups.every((g) => Math.abs(g.holders.reduce((a, h) => a + n(h.portion), 0) - 1) < 0.01)

  const canNext = () => {
    if (key === 'type') return !!f.type
    if (key === 'when') return f.title.trim() && n(f.slots) >= 2
    if (key === 'amount') return n(f.amount) > 0
    if (key === 'people') return filled.length >= 1 && numbersOk
    if (key === 'numbers') return slotsOk
    return true
  }

  const submit = async () => {
    setSaving(true)
    try {
      const payload = { ...f, start_date: kLike.start_date, amount: n(f.amount), slots: n(f.slots) }
      if (editing) payload.id = Number(id)
      else {
        const index = Object.fromEntries(filled.map((p, i) => [p.key, i]))
        payload.members = filled.map((p) => ({ name: p.name.trim(), phone: p.phone.trim() }))
        payload.numbers = groups.map((g) => ({ slot_no: g.slot_no, holders: g.holders.map((h) => ({ m: index[h.id], portion: h.portion })) }))
      }
      const d = await api('kametis/save', payload)
      toast(editing ? t('saved') : t('kametiCreated'))
      nav(`/kameti/${d.id}${editing ? '' : '?new=1'}`)
    } catch (x) { toast(err(x.code), 'err') } finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div ref={top} className="mx-auto max-w-2xl scroll-mt-24 pb-28 lg:pb-0">
      {/* progress */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-fg/50">
          <span>{t('stepOf', { s: step + 1, t: steps.length })}</span>
          {f.type && <span className="flex items-center gap-1.5 text-fg">{(() => { const I = TYPES[f.type].icon; return <I className="h-4 w-4 text-violet-500" /> })()}{t(`type_${f.type}`)}</span>}
        </div>
        <div className="flex gap-1.5">{steps.map((s, i) => <div key={s} className={cx('h-2 flex-1 rounded-full transition', i <= step ? 'bg-baari' : 'bg-violet-100')} />)}</div>
      </div>

      {key === 'type' && <TypeStep value={f.type} onPick={(type) => { setF((x) => ({ ...x, type, config: { ...TYPE_DEFAULTS.common, ...TYPE_DEFAULTS[type], ...pickCommon(x.config) } })); go(1) }} />}
      {key === 'when' && <WhenStep f={f} set={set} />}
      {key === 'amount' && <AmountStep f={f} set={set} setCfg={setCfg} editing={editing} />}
      {key === 'people' && <PeopleStep f={f} people={people} setPeople={setPeople} total={totalNumbers} ok={numbersOk} setSlots={(v) => set('slots', v)} openBulk={() => setBulk('')} />}
      {key === 'numbers' && (
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t('slotsTitle')}</h1>
          <p className="mb-4 mt-1 text-fg/60">{f.type === 'boli' ? t('slotsHintBoli') : f.type === 'zaroorat' ? t('slotsHintZaroorat') : t('slotsHint')}</p>
          {f.type === 'qurandazi' && (
            <Button size="lg" className="mb-4 w-full" icon={Dices} onClick={() => setGroups((g) => shuffleArr(g.map((x) => x.holders)).map((holders, i) => ({ slot_no: i + 1, holders })))}>{t('shuffleAll')}</Button>
          )}
          <SlotEditor groups={groups} people={filled.map((p) => ({ id: p.key, name: p.name.trim() }))} label={label} onChange={setGroups} amountFor={() => n(f.amount) * n(f.slots)} />
        </div>
      )}
      {key === 'review' && <ReviewStep f={kLike} people={filled} groups={groups} editing={editing} />}

      {/* action bar */}
      {key !== 'type' && (
        <div className="fixed inset-x-3 bottom-[92px] z-30 flex gap-2 rounded-[1.6rem] bg-surface/90 p-2 shadow-soft backdrop-blur-xl lg:static lg:mt-6 lg:bg-transparent lg:p-0 lg:shadow-none">
          <Button variant="outline" size="lg" onClick={() => go(step - 1)} className="!px-4"><ChevronLeft className="h-6 w-6 flip-rtl" /></Button>
          {step < steps.length - 1 ? (
            <Button size="lg" className="flex-1 text-lg" disabled={!canNext()} onClick={() => go(step + 1)}>{t('next')}<ChevronRight className="h-6 w-6 flip-rtl" /></Button>
          ) : (
            <Button size="lg" className="flex-1 text-lg" loading={saving} icon={Sparkles} onClick={submit}>{editing ? t('save') : t('create')}</Button>
          )}
        </div>
      )}

      <Modal open={bulk !== null} onClose={() => setBulk(null)} title={t('pasteList')}>
        <p className="mb-3 text-sm text-fg/60">{t('bulkHint')}</p>
        <Textarea rows={8} value={bulk || ''} onChange={(e) => setBulk(e.target.value)} placeholder={'Ayesha Khan, 03001234567\nUsman Ali\nFatima Noor'} />
        <Button className="mt-4 w-full" size="lg" icon={ListPlus} onClick={() => {
          const rows = String(bulk).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
            const [name, phone = ''] = l.split(',').map((x) => x.trim())
            return person(name, 1, phone)
          })
          setPeople((m) => [...m.filter((x) => x.name.trim()), ...rows])
          setBulk(null)
        }}>{t('add')}</Button>
      </Modal>
    </div>
  )
}

function pickCommon(cfg) {
  const out = {}
  for (const k of Object.keys(TYPE_DEFAULTS.common)) if (k in cfg) out[k] = cfg[k]
  return out
}

// ---------------------------------------------------------------- steps
function TypeStep({ value, onPick }) {
  const { t } = useLang()
  return (
    <div>
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t('chooseType')}</h1>
      <div className="mt-5 grid gap-3">
        {TYPE_KEYS.map((k) => {
          const T = TYPES[k]
          return (
            <button key={k} onClick={() => onPick(k)}
              className={cx('card flex items-center gap-4 p-4 text-start transition active:scale-[.98] sm:p-5', value === k && 'ring-4 ring-violet-300')}>
              <div className={cx('grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-lg', T.grad)}><T.icon className="h-8 w-8" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-xl font-extrabold">{t(`type_${k}`)}</div>
                <div className="text-sm font-bold text-violet-600">{t(`type_${k}_ur`)}</div>
                <p className="mt-0.5 text-sm text-fg/60">{t(`type_${k}_desc`)}</p>
              </div>
              <ChevronRight className="h-6 w-6 shrink-0 text-violet-300 flip-rtl" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BigStepper({ value, onChange, min = 1, max = 120, step = 1, display }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, +(n(value) - step).toFixed(2)))} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 active:scale-95"><Minus className="h-6 w-6" /></button>
      <div className="num grid h-14 flex-1 place-items-center rounded-2xl border border-violet-200 bg-surface text-2xl font-bold">{display ?? value}</div>
      <button type="button" onClick={() => onChange(Math.min(max, +(n(value) + step).toFixed(2)))} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-baari text-white active:scale-95"><Plus className="h-6 w-6" /></button>
    </div>
  )
}

function WhenStep({ f, set }) {
  const { t, lang } = useLang()
  const endMonth = addMonths(f.startMonth, n(f.slots) - 1)
  const unit = { monthly: t('months'), weekly: t('weeks'), daily: t('days') }[f.frequency]
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t('whatName')}</h1>
      <Card className="space-y-4 p-4 sm:p-6">
        <Field label={t('kametiName')}><Input className="h-14 text-lg font-bold" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Mohalla Committee 2026" /></Field>
        <Segmented value={f.frequency} onChange={(v) => set('frequency', v)} options={['monthly', 'weekly', 'daily'].map((v) => ({ value: v, label: t(v) }))} />
      </Card>
      {f.frequency === 'monthly' ? (
        <Card className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('startMonth')}><input type="month" className="input h-14 font-bold" value={f.startMonth} onChange={(e) => e.target.value && set('startMonth', e.target.value)} /></Field>
            <Field label={t('endMonth')}><input type="month" className="input h-14 font-bold" value={endMonth} min={addMonths(f.startMonth, 1)} onChange={(e) => e.target.value && set('slots', Math.max(2, monthSpan(f.startMonth, e.target.value)))} /></Field>
          </div>
          <Field label={t('howManyTurns')}><BigStepper value={f.slots} min={2} onChange={(v) => set('slots', v)} display={`${f.slots} ${unit}`} /></Field>
          <div className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
            <CalendarRange className="h-6 w-6 shrink-0 text-violet-400" />
            <div className="text-sm font-bold">{monthName(`${f.startMonth}-01`, lang)} → {monthName(`${endMonth}-01`, lang)}<div className="text-white/60">{t('turnsEqual', { n: f.slots })}</div></div>
          </div>
        </Card>
      ) : (
        <Card className="space-y-4 p-4 sm:p-6">
          <Field label={t('startDate')}><Input type="date" className="h-14 font-bold" value={f.start_date} onChange={(e) => set('start_date', e.target.value)} /></Field>
          <Field label={t('howManyTurns')}><BigStepper value={f.slots} min={2} onChange={(v) => set('slots', v)} display={`${f.slots} ${unit}`} /></Field>
          <div className="rounded-2xl bg-ink p-4 text-sm font-bold text-white">{fmtDate(f.start_date, lang)} → {fmtDate(roundDate(f, n(f.slots)), lang)}<div className="text-white/60">{t('turnsEqual', { n: f.slots })}</div></div>
        </Card>
      )}
    </div>
  )
}

function AmountStep({ f, set, setCfg, editing }) {
  const { t, lang } = useLang()
  const [more, setMore] = useState(editing)
  const per = t(`perF_${f.frequency}`)
  const pot = n(f.amount) * n(f.slots)
  const c = f.config
  const num = (k) => (e) => setCfg(k, e.target.value.replace(/[^\d.]/g, ''))
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t('perNumber', { f: per })}</h1>
      <Card className="p-4 sm:p-6">
        <div className="relative">
          <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-xl font-bold text-fg/40">Rs</span>
          <input className="input num h-20 ps-14 text-4xl font-bold" inputMode="numeric" dir="ltr" value={f.amount} onChange={(e) => set('amount', e.target.value.replace(/\D/g, ''))} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1000, 2000, 5000, 10000, 20000, 50000].map((v) => (
            <button type="button" key={v} onClick={() => set('amount', v)} className={cx('num h-12 rounded-2xl text-base font-bold', n(f.amount) === v ? 'bg-ink text-white' : 'bg-violet-50 text-violet-700')}>{v.toLocaleString('en-IN')}</button>
          ))}
        </div>
      </Card>

      <div className="mesh overflow-hidden rounded-[2rem] p-5 text-white">
        <div className="text-sm font-semibold text-white/70">{t('totalPerMonth', { f: per })}</div>
        <div className="num text-4xl font-bold">{money(pot)}</div>
        <div className="text-sm text-white/60">{money(f.amount)} × {f.slots} {t('numbers')} · {lakh(pot, lang)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="glass rounded-2xl p-3"><div className="text-xs text-white/60">{t('eachNumberGets')}</div><div className="num text-lg font-bold">{money(pot - Math.round((pot * n(c.organizer_fee)) / 100))}</div></div>
          <div className="glass rounded-2xl p-3"><div className="text-xs text-white/60">{t('totalEach')}</div><div className="num text-lg font-bold">{money(pot)}</div></div>
        </div>
      </div>

      <button onClick={() => setMore(!more)} className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-4 font-bold">
        <span className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-violet-500" />{t('moreSettings')}</span>
        <ChevronRight className={cx('h-5 w-5 transition', more ? 'rotate-90' : 'flip-rtl')} />
      </button>
      {more && (
        <Card className="space-y-4 p-4 sm:p-6">
          {f.type === 'qurandazi' && <Field label={t('drawMode')}><Segmented value={c.draw_mode} onChange={(v) => setCfg('draw_mode', v)} options={['all_at_once', 'every_round'].map((v) => ({ value: v, label: t(`draw_${v}`) }))} /></Field>}
          {f.type === 'boli' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('minBid')}><Input inputMode="numeric" dir="ltr" value={c.min_bid} onChange={num('min_bid')} /></Field>
                <Field label={t('maxBidPercent')}><Input inputMode="numeric" dir="ltr" value={c.max_bid_percent} onChange={num('max_bid_percent')} /></Field>
              </div>
              <Field label={t('profitSharing')}><Segmented value={c.profit_sharing} onChange={(v) => setCfg('profit_sharing', v)} options={['all_members', 'organizer'].map((v) => ({ value: v, label: t(`share_${v}`) }))} /></Field>
            </>
          )}
          {f.type === 'zaroorat' && <Toggle checked={!!c.require_reason} onChange={(v) => setCfg('require_reason', v)} label={t('requireReason')} />}
          <div className="grid grid-cols-2 gap-3">
            {f.frequency === 'monthly' && <Field label={t('dueDay')}><Select value={c.due_day} onChange={(e) => setCfg('due_day', Number(e.target.value))} options={Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))} /></Field>}
            <Field label={t('lateFee')}><Input inputMode="numeric" dir="ltr" value={c.late_fee} onChange={num('late_fee')} /></Field>
            <Field label={t('organizerFee')}><Input inputMode="decimal" dir="ltr" value={c.organizer_fee} onChange={num('organizer_fee')} /></Field>
            <Field label={t('graceDays')}><Input inputMode="numeric" dir="ltr" value={c.grace_days} onChange={num('grace_days')} /></Field>
          </div>
          <Field label={t('rulesNotes')}><Textarea value={c.rules} onChange={(e) => setCfg('rules', e.target.value)} placeholder={t('rulesPlaceholder')} /></Field>
          {editing && <Field label={t('status')}><Segmented value={f.status} onChange={(v) => set('status', v)} options={['active', 'paused', 'completed'].map((v) => ({ value: v, label: t(v) }))} /></Field>}
        </Card>
      )}
    </div>
  )
}

function PeopleStep({ f, people, setPeople, total, ok, setSlots, openBulk }) {
  const { t } = useLang()
  const upd = (key, k, v) => setPeople((list) => list.map((m) => (m.key === key ? { ...m, [k]: v } : m)))
  const need = n(f.slots)
  const diff = +(need - total).toFixed(2)
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t('whoIsIn')}</h1>
      <p className="text-fg/60">{t('numbersHint')}</p>

      <div className={cx('sticky top-[65px] z-20 rounded-3xl p-4 shadow-soft', ok ? 'bg-emerald-500 text-white' : 'bg-ink text-white')}>
        <div className="flex items-center justify-between gap-3 font-extrabold">
          <span className="flex items-center gap-2">{ok ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6 text-amber-300" />}{t('numbersCount', { have: numbersLabel(total), need })}</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, (total / need) * 100)}%` }} /></div>
        {!ok && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
            <span className="text-white/80">{diff > 0 ? t('numbersLeft', { n: numbersLabel(diff) }) : t('numbersExtra', { n: numbersLabel(-diff) })}</span>
            {Number.isInteger(total) && total >= 2 && <button onClick={() => setSlots(total)} className="rounded-xl bg-white px-3 py-1.5 text-[#0F0A1F]">{t('setTurnsTo', { n: total })}</button>}
          </div>
        )}
      </div>

      {people.map((m, i) => (
        <Card key={m.key} className="p-3">
          <div className="flex items-center gap-2">
            <div className="num grid h-12 w-10 shrink-0 place-items-center rounded-2xl bg-violet-100 font-bold text-violet-700">{i + 1}</div>
            <input className="input h-12 min-w-0 flex-1 text-lg font-bold" placeholder={t('personName')} value={m.name} onChange={(e) => upd(m.key, 'name', e.target.value)} />
            <button type="button" onClick={() => upd(m.key, 'showPhone', !m.showPhone)} className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', m.phone ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-50 text-violet-500')} aria-label={t('phone')}><Phone className="h-5 w-5" /></button>
            <button type="button" onClick={() => setPeople((l) => l.filter((x) => x.key !== m.key))} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-500" aria-label={t('delete')}><Trash2 className="h-5 w-5" /></button>
          </div>
          {m.showPhone && <input className="input mt-2 h-12" dir="ltr" inputMode="tel" placeholder="03xx xxxxxxx" value={m.phone} onChange={(e) => upd(m.key, 'phone', e.target.value)} />}
          <div className="mt-2 flex items-center gap-2">
            <span className="w-24 shrink-0 text-sm font-bold text-fg/60">{t('numbersShort')}</span>
            <div className="flex-1"><BigStepper value={m.numbers} min={0.5} max={50} step={0.5} display={numbersLabel(n(m.numbers))} onChange={(v) => upd(m.key, 'numbers', v)} /></div>
          </div>
        </Card>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="soft" size="lg" className="whitespace-nowrap !px-3" icon={UserPlus} onClick={() => setPeople((l) => [...l, person()])}>{t('addPerson')}</Button>
        <Button variant="outline" size="lg" className="whitespace-nowrap !px-3" icon={ListPlus} onClick={openBulk}>{t('pasteList')}</Button>
      </div>
    </div>
  )
}

function ReviewStep({ f, people, groups, editing }) {
  const { t, lang } = useLang()
  const T = TYPES[f.type]
  const pot = n(f.amount) * n(f.slots)
  return (
    <div className="space-y-4">
      <div className={cx('rounded-[2rem] bg-gradient-to-br p-6 text-white shadow-glow', T.grad)}>
        <div className="flex items-center gap-2 text-sm font-bold text-white/85"><T.icon className="h-4 w-4" />{t(`type_${f.type}`)}</div>
        <h2 className="mt-1 text-3xl font-extrabold">{f.title}</h2>
        <div className="num mt-4 text-4xl font-bold">{money(pot)}</div>
        <div className="text-sm text-white/85">{t('totalPerMonth', { f: t(`perF_${f.frequency}`) })}</div>
      </div>
      <Card className="divide-y divide-violet-50 p-0">
        {[
          [t('perNumber', { f: t(`perF_${f.frequency}`) }), money(f.amount)],
          [t('startMonth'), roundLabel(f, 1, lang)],
          [t('endMonth'), roundLabel(f, n(f.slots), lang)],
          [t('numbers'), f.slots],
          ...(!editing ? [[t('members'), people.length]] : []),
        ].map(([a, b]) => <div key={a} className="flex items-center justify-between gap-3 px-5 py-4"><span className="text-fg/60">{a}</span><span className="num text-end font-extrabold">{b}</span></div>)}
      </Card>
      {!editing && (
        <Card className="p-4">
          <div className="space-y-2">
            {people.map((p) => {
              const nums = groups.filter((g) => g.holders.some((h) => h.id === p.key)).map((g) => g.slot_no)
              return (
                <div key={p.key} className="flex items-center justify-between gap-3">
                  <span className="truncate font-bold">{p.name}</span>
                  <span className="flex flex-wrap justify-end gap-1">{nums.map((x) => <span key={x} className="num grid h-8 min-w-[2rem] place-items-center rounded-lg bg-ink px-1.5 text-sm font-bold text-white">{x}</span>)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
