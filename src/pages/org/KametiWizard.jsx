import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Trash2, UserPlus, ListPlus, Sparkles, CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/i18n'
import { TYPES, TYPE_KEYS, TYPE_DEFAULTS, money, lakh, roundDate, fmtDate, n } from '../../lib/kameti'
import { Button, Card, Field, Input, Textarea, Segmented, Toggle, Select, Spinner, useToast, cx, Modal } from '../../components/ui'

const today = () => new Date().toISOString().slice(0, 10)
const blankMember = () => ({ key: Math.random(), name: '', phone: '', email: '', share: 1, turn_no: '' })

export default function KametiWizard() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { t, err, lang } = useLang()
  const nav = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState({ type: '', title: '', amount: 10000, frequency: 'monthly', slots: 10, start_date: today(), notes: '', status: 'active', config: { ...TYPE_DEFAULTS.common } })
  const [members, setMembers] = useState([blankMember(), blankMember(), blankMember()])
  const [bulk, setBulk] = useState(null)

  useEffect(() => {
    if (!editing) return
    api('kametis/get', { id }).then((d) => {
      const k = d.kameti
      setF({ type: k.type, title: k.title, amount: n(k.amount), frequency: k.frequency, slots: n(k.slots), start_date: k.start_date, notes: k.notes || '', status: k.status, config: { ...TYPE_DEFAULTS.common, ...TYPE_DEFAULTS[k.type], ...k.config } })
      setStep(1)
    }).catch((x) => toast(err(x.code), 'err')).finally(() => setLoading(false))
  }, [editing, id]) // eslint-disable-line react-hooks/exhaustive-deps

  const steps = editing ? ['chooseType', 'basics', 'rulesStep', 'review'] : ['chooseType', 'basics', 'rulesStep', 'membersStep', 'review']
  const stepKey = steps[step]
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setCfg = (k, v) => setF((x) => ({ ...x, config: { ...x.config, [k]: v } }))
  const pickType = (type) => {
    setF((x) => ({ ...x, type, config: { ...TYPE_DEFAULTS.common, ...TYPE_DEFAULTS[type], ...pickCommon(x.config) } }))
    setStep(1)
  }

  const filled = members.filter((m) => m.name.trim())
  const shares = filled.reduce((s, m) => s + n(m.share), 0)

  const canNext = () => {
    if (stepKey === 'chooseType') return !!f.type
    if (stepKey === 'basics') return f.title.trim() && n(f.amount) > 0 && n(f.slots) >= 2 && f.start_date
    return true
  }

  const submit = async () => {
    setSaving(true)
    try {
      let list = filled.map((m) => ({ name: m.name.trim(), phone: m.phone.trim(), email: m.email.trim(), share: f.type === 'half' ? n(m.share) : 1, turn_no: m.turn_no }))
      if (f.type === 'fixed' && f.config.order_basis === 'joining') list = autoTurns(list)
      const payload = { ...f, amount: n(f.amount), slots: n(f.slots), ...(editing ? { id: Number(id) } : { members: list }) }
      const d = await api('kametis/save', payload)
      toast(editing ? t('saved') : t('kametiCreated'))
      nav(`/kameti/${d.id}`)
    } catch (x) { toast(err(x.code), 'err') } finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div>
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {steps.map((s, i) => (
          <button key={s} type="button" disabled={i > step && !canNext()} onClick={() => (i <= step || canNext()) && f.type && setStep(i)}
            className={cx('flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold transition', i === step ? 'bg-ink text-white' : i < step ? 'bg-violet-100 text-violet-700' : 'bg-white text-ink/40')}>
            <span className={cx('num grid h-6 w-6 place-items-center rounded-lg text-xs', i === step ? 'bg-baari' : i < step ? 'bg-violet-500 text-white' : 'bg-violet-50')}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
            {t(s)}
          </button>
        ))}
      </div>

      <div className={cx('grid gap-6', stepKey !== 'chooseType' && 'lg:grid-cols-[1fr_340px]')}>
        <div className="min-w-0">
          {stepKey === 'chooseType' && <TypeStep value={f.type} onPick={pickType} />}
          {stepKey === 'basics' && <BasicsStep f={f} set={set} />}
          {stepKey === 'rulesStep' && <RulesStep f={f} setCfg={setCfg} set={set} editing={editing} />}
          {stepKey === 'membersStep' && <MembersStep f={f} members={members} setMembers={setMembers} shares={shares} setSlots={(v) => set('slots', v)} openBulk={() => setBulk('')} />}
          {stepKey === 'review' && <ReviewStep f={f} members={filled} editing={editing} />}

          {stepKey !== 'chooseType' && (
            <div className="mt-6 flex gap-3">
              <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}><ChevronLeft className="h-5 w-5 flip-rtl" />{t('back')}</Button>
              {step < steps.length - 1 ? (
                <Button size="lg" className="flex-1" disabled={!canNext()} onClick={() => setStep(step + 1)}>{t('next')}<ChevronRight className="h-5 w-5 flip-rtl" /></Button>
              ) : (
                <Button size="lg" className="flex-1" loading={saving} icon={Sparkles} onClick={submit}>{editing ? t('save') : t('createKameti')}</Button>
              )}
            </div>
          )}
        </div>
        {stepKey !== 'chooseType' && <CalcPanel f={f} lang={lang} />}
      </div>

      <Modal open={bulk !== null} onClose={() => setBulk(null)} title={t('bulkAdd')}>
        <p className="mb-3 text-sm text-ink/60">{t('bulkHint')}</p>
        <Textarea rows={8} value={bulk || ''} onChange={(e) => setBulk(e.target.value)} placeholder={'Ayesha Khan, 03001234567\nUsman Ali\nFatima Noor'} />
        <Button className="mt-4 w-full" icon={ListPlus} onClick={() => {
          const rows = String(bulk).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
            const [name, phone = ''] = l.split(',').map((x) => x.trim())
            return { ...blankMember(), name, phone }
          })
          setMembers((m) => [...m.filter((x) => x.name.trim()), ...rows])
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

// Give turns 1..N in joining order. Two half shares share one turn.
function autoTurns(list) {
  let turn = 0, halfOpen = false
  return list.map((m) => {
    if (m.share < 1) {
      if (!halfOpen) { turn++; halfOpen = true } else halfOpen = false
    } else { turn++; halfOpen = false }
    return { ...m, turn_no: turn }
  })
}

function TypeStep({ value, onPick }) {
  const { t } = useLang()
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">{t('chooseType')}</h1>
      <p className="mb-6 text-ink/60">{t('appTagline')}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_KEYS.map((k) => {
          const T = TYPES[k]
          return (
            <button key={k} onClick={() => onPick(k)}
              className={cx('card group relative overflow-hidden p-6 text-start transition hover:-translate-y-1 hover:shadow-glow', value === k && 'ring-4 ring-fuchsia-300')}>
              <div className={cx('grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-lg', T.grad)}><T.icon className="h-8 w-8" /></div>
              <h3 className="mt-5 text-xl font-extrabold">{t(`type_${k}`)}</h3>
              <div className="text-sm font-bold text-fuchsia-600">{t(`type_${k}_ur`)}</div>
              <p className="mt-2 text-sm text-ink/60">{t(`type_${k}_desc`)}</p>
              <ChevronRight className="absolute end-5 top-6 h-6 w-6 text-violet-300 transition group-hover:text-fuchsia-500 flip-rtl" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stepper({ value, onChange, min = 2, max = 120 }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, n(value) - 1))} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 active:scale-95"><Minus className="h-6 w-6" /></button>
      <input className="input num h-14 text-center text-2xl font-bold" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} onBlur={() => onChange(Math.min(max, Math.max(min, n(value))))} />
      <button type="button" onClick={() => onChange(Math.min(max, n(value) + 1))} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-baari text-white active:scale-95"><Plus className="h-6 w-6" /></button>
    </div>
  )
}

function BasicsStep({ f, set }) {
  const { t, lang } = useLang()
  const T = TYPES[f.type]
  const unit = { monthly: t('months'), weekly: t('weeks'), daily: t('days') }[f.frequency]
  return (
    <Card className="space-y-5 p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className={cx('grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white', T.grad)}><T.icon className="h-6 w-6" /></div>
        <div><div className="text-xs font-bold uppercase text-ink/50">{t('type')}</div><div className="font-extrabold">{t(`type_${f.type}`)}</div></div>
      </div>
      <Field label={t('title')}><Input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Mohalla Committee 2026" autoFocus /></Field>
      <Field label={t('amountPerRound')} hint={n(f.amount) ? `= ${lakh(f.amount, lang)}` : ''}>
        <div className="relative">
          <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 font-bold text-ink/40">Rs</span>
          <input className="input num h-16 ps-12 text-3xl font-bold" inputMode="numeric" dir="ltr" value={f.amount} onChange={(e) => set('amount', e.target.value.replace(/\D/g, ''))} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1000, 5000, 10000, 20000, 50000, 100000].map((v) => (
            <button type="button" key={v} onClick={() => set('amount', v)} className={cx('num rounded-xl px-3 py-1.5 text-sm font-bold', n(f.amount) === v ? 'bg-ink text-white' : 'bg-violet-50 text-violet-700')}>{v.toLocaleString('en-IN')}</button>
          ))}
        </div>
      </Field>
      <Field label={t('frequency')}>
        <Segmented value={f.frequency} onChange={(v) => set('frequency', v)} options={['monthly', 'weekly', 'daily'].map((v) => ({ value: v, label: t(v) }))} />
      </Field>
      <Field label={`${t('howManyMembers')} · ${t('duration')} (${unit})`}><Stepper value={f.slots} onChange={(v) => set('slots', v)} /></Field>
      <Field label={t('startDate')}><Input type="date" value={f.start_date} onChange={(e) => set('start_date', e.target.value)} /></Field>
    </Card>
  )
}

function RulesStep({ f, setCfg, set, editing }) {
  const { t } = useLang()
  const c = f.config
  const num = (k) => (e) => setCfg(k, e.target.value.replace(/[^\d.]/g, ''))
  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">{(() => { const I = TYPES[f.type].icon; return <I className="h-5 w-5 text-fuchsia-500" /> })()}{t(`type_${f.type}`)}</h2>
        {f.type === 'fixed' && (
          <Field label={t('orderBasis')}><Segmented value={c.order_basis} onChange={(v) => setCfg('order_basis', v)} options={['manual', 'joining'].map((v) => ({ value: v, label: t(`order_${v}`) }))} /></Field>
        )}
        {f.type === 'qurandazi' && (
          <>
            <Field label={t('drawMode')}><Segmented value={c.draw_mode} onChange={(v) => setCfg('draw_mode', v)} options={['all_at_once', 'every_round'].map((v) => ({ value: v, label: t(`draw_${v}`) }))} /></Field>
            <Toggle checked={!!c.draw_in_front} onChange={(v) => setCfg('draw_in_front', v)} label={t('drawInFront')} />
          </>
        )}
        {f.type === 'boli' && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t('minBid')}><Input inputMode="numeric" dir="ltr" value={c.min_bid} onChange={num('min_bid')} /></Field>
              <Field label={t('maxBidPercent')}><Input inputMode="numeric" dir="ltr" value={c.max_bid_percent} onChange={num('max_bid_percent')} /></Field>
              <Field label={t('bidStep')}><Input inputMode="numeric" dir="ltr" value={c.bid_step} onChange={num('bid_step')} /></Field>
            </div>
            <Field label={t('profitSharing')}><Segmented value={c.profit_sharing} onChange={(v) => setCfg('profit_sharing', v)} options={['all_members', 'organizer'].map((v) => ({ value: v, label: t(`share_${v}`) }))} /></Field>
            <Toggle checked={!!c.last_no_bid} onChange={(v) => setCfg('last_no_bid', v)} label={t('lastNoBid')} />
          </>
        )}
        {f.type === 'half' && (
          <Field label={t('pairing')}><Segmented value={c.pairing} onChange={(v) => setCfg('pairing', v)} options={['auto', 'manual'].map((v) => ({ value: v, label: t(`pairing_${v}`) }))} /></Field>
        )}
        {f.type === 'zaroorat' && (
          <>
            <Toggle checked={!!c.require_reason} onChange={(v) => setCfg('require_reason', v)} label={t('requireReason')} />
            <Toggle checked={!!c.emergency_priority} onChange={(v) => setCfg('emergency_priority', v)} label={t('emergencyPriority')} />
          </>
        )}
      </Card>

      <Card className="space-y-4 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          {f.frequency === 'monthly' && (
            <Field label={t('dueDay')} hint={t('dueDayHint')}>
              <Select value={c.due_day} onChange={(e) => setCfg('due_day', Number(e.target.value))} options={Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))} />
            </Field>
          )}
          <Field label={t('graceDays')}><Input inputMode="numeric" dir="ltr" value={c.grace_days} onChange={num('grace_days')} /></Field>
          <Field label={t('lateFee')}><Input inputMode="numeric" dir="ltr" value={c.late_fee} onChange={num('late_fee')} /></Field>
          <Field label={t('organizerFee')} hint={t('organizerFeeHint')}><Input inputMode="decimal" dir="ltr" value={c.organizer_fee} onChange={num('organizer_fee')} /></Field>
        </div>
        <Field label={t('rulesNotes')}><Textarea value={c.rules} onChange={(e) => setCfg('rules', e.target.value)} placeholder={t('rulesPlaceholder')} /></Field>
        {editing && (
          <Field label={t('status')}><Segmented value={f.status} onChange={(v) => set('status', v)} options={['active', 'paused', 'completed'].map((v) => ({ value: v, label: t(v) }))} /></Field>
        )}
      </Card>
    </div>
  )
}

function MembersStep({ f, members, setMembers, shares, setSlots, openBulk }) {
  const { t } = useLang()
  const upd = (key, k, v) => setMembers((list) => list.map((m) => (m.key === key ? { ...m, [k]: v } : m)))
  const ok = Math.abs(shares - n(f.slots)) < 0.01
  const manualTurns = f.type === 'fixed' && f.config.order_basis === 'manual'
  return (
    <div className="space-y-4">
      <div className={cx('flex flex-wrap items-center justify-between gap-3 rounded-3xl px-5 py-4 font-bold', ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
        <span className="flex items-center gap-2">{ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}{ok ? t('sharesMatch') : t('sharesMismatch', { have: shares, need: f.slots })}</span>
        {!ok && shares >= 2 && Number.isInteger(shares) && <Button size="sm" variant="dark" onClick={() => setSlots(shares)}>{t('howManyMembers')} = {shares}</Button>}
      </div>
      <p className="text-sm text-ink/60">{t('memberNameOnly')}</p>
      <div className="space-y-3">
        {members.map((m, i) => (
          <Card key={m.key} className="p-4">
            <div className="flex items-center gap-3">
              <div className="num grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink font-bold text-white">{i + 1}</div>
              <input className="input h-12 flex-1 text-lg font-bold" placeholder={t('name')} value={m.name} onChange={(e) => upd(m.key, 'name', e.target.value)} />
              <button type="button" onClick={() => setMembers((l) => l.filter((x) => x.key !== m.key))} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-500" aria-label={t('delete')}><Trash2 className="h-5 w-5" /></button>
            </div>
            <div className={cx('mt-3 grid gap-2', 'sm:grid-cols-2', (f.type === 'half' || manualTurns) && 'lg:grid-cols-4')}>
              <input className="input h-11 text-sm" dir="ltr" inputMode="tel" placeholder={`${t('phone')} (${t('optional')})`} value={m.phone} onChange={(e) => upd(m.key, 'phone', e.target.value)} />
              <input className="input h-11 text-sm" dir="ltr" type="email" placeholder={`${t('email')} (${t('optional')})`} value={m.email} onChange={(e) => upd(m.key, 'email', e.target.value)} />
              {f.type === 'half' && (
                <select className="input h-11 text-sm" value={m.share} onChange={(e) => upd(m.key, 'share', Number(e.target.value))}>
                  <option value={1}>{t('share')}: {t('fullShare')}</option>
                  <option value={0.5}>{t('share')}: {t('halfShare')}</option>
                </select>
              )}
              {manualTurns && (
                <select className="input h-11 text-sm" value={m.turn_no} onChange={(e) => upd(m.key, 'turn_no', e.target.value)}>
                  <option value="">{t('turnNo')}: {t('noTurn')}</option>
                  {Array.from({ length: n(f.slots) }, (_, j) => <option key={j} value={j + 1}>{t('turnNo')} {j + 1}</option>)}
                </select>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="soft" size="lg" icon={UserPlus} onClick={() => setMembers((l) => [...l, blankMember()])}>{t('addMember')}</Button>
        <Button variant="outline" size="lg" icon={ListPlus} onClick={openBulk}>{t('bulkAdd')}</Button>
      </div>
    </div>
  )
}

function ReviewStep({ f, members, editing }) {
  const { t, lang } = useLang()
  const T = TYPES[f.type]
  return (
    <Card className="overflow-hidden p-0">
      <div className={cx('bg-gradient-to-br p-6 text-white', T.grad)}>
        <div className="text-sm font-bold text-white/80">{t(`type_${f.type}`)}</div>
        <h2 className="text-2xl font-extrabold">{f.title}</h2>
        <div className="num mt-3 text-4xl font-bold">{money(n(f.amount) * n(f.slots))}</div>
      </div>
      <div className="divide-y divide-violet-50">
        {[
          [t('amountPerRound'), money(f.amount)],
          [t('frequency'), t(f.frequency)],
          [t('rounds'), f.slots],
          [t('startDate'), fmtDate(f.start_date, lang)],
          [t('endDate'), fmtDate(roundDate(f, n(f.slots)), lang)],
          ...(n(f.config.organizer_fee) ? [[t('organizerFee'), `${f.config.organizer_fee}%`]] : []),
          ...(n(f.config.late_fee) ? [[t('lateFee'), money(f.config.late_fee)]] : []),
          ...(!editing ? [[t('members'), members.length]] : []),
        ].map(([a, b]) => (
          <div key={a} className="flex items-center justify-between px-6 py-3.5"><span className="text-ink/60">{a}</span><span className="num font-bold">{b}</span></div>
        ))}
      </div>
      {!editing && members.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-violet-50 p-6">
          {members.map((m, i) => <span key={i} className="chip bg-violet-50 text-violet-700">{m.name}{f.type === 'half' && m.share < 1 ? ' ½' : ''}</span>)}
        </div>
      )}
    </Card>
  )
}

function CalcPanel({ f, lang }) {
  const { t } = useLang()
  const amount = n(f.amount), slots = n(f.slots)
  const pot = amount * slots
  const fee = Math.round((pot * n(f.config.organizer_fee)) / 100)
  const rows = useMemo(() => Array.from({ length: Math.min(slots, 60) }, (_, i) => roundDate(f, i + 1)), [f.start_date, f.frequency, slots]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-[2rem] bg-ink text-white shadow-soft">
        <div className="mesh p-6">
          <div className="text-sm font-semibold text-white/70">{t('calcTitle')}</div>
          <div className="mt-3 text-xs text-white/60">{t('eachGets')}</div>
          <div className="num text-4xl font-bold">{money(pot - fee)}</div>
          <div className="text-sm text-white/60">{lakh(pot - fee, lang)}</div>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="glass rounded-2xl p-3"><div className="text-[11px] text-white/60">{t('everyone')}</div><div className="num font-bold">{money(amount)}</div></div>
            <div className="glass rounded-2xl p-3"><div className="text-[11px] text-white/60">{t('totalEach')}</div><div className="num font-bold">{money(amount * slots)}</div></div>
            <div className="glass rounded-2xl p-3"><div className="text-[11px] text-white/60">{t('duration')}</div><div className="num font-bold">{slots} {t(f.frequency === 'monthly' ? 'months' : f.frequency === 'weekly' ? 'weeks' : 'days')}</div></div>
            <div className="glass rounded-2xl p-3"><div className="text-[11px] text-white/60">{t('lastPayout')}</div><div className="font-bold">{fmtDate(roundDate(f, slots), lang, { day: 'numeric', month: 'short', year: '2-digit' })}</div></div>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-4">
          <div className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-white/50"><CalendarDays className="h-4 w-4" />{t('schedule')}</div>
          {rows.map((d, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm odd:bg-white/[.04]">
              <span className="num text-white/60">{t('round')} {i + 1}</span><span className="font-semibold">{fmtDate(d, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
