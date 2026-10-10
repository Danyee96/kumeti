import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  ArrowLeft, Pencil, Trash2, Dices, Hash, Wallet, HandCoins, Info, Users, Check, X, MessageCircle, KeyRound,
  UserPlus, Save, Crown, TrendingUp, Clock, Trophy, Copy, Share2, Download, Image as ImageIcon, PartyPopper, Undo2, Loader2,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useLang } from '../../lib/i18n'
import { TYPES, calc, money, n, fmtDate, waLink, lakh, roundLabel, frac, numbersLabel } from '../../lib/kameti'
import { memberCardImage, chartImage, shareOrDownload, safeName, siteInfo } from '../../lib/exportImage'
import { Avatar, Badge, Button, Card, Confirm, Field, Input, Modal, Progress, Spinner, Stat, Toggle, useToast, cx } from '../../components/ui'
import { statusTone } from '../../components/KametiCard'
import SlotEditor from '../../components/SlotEditor'

export default function KametiDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { t, err, lang } = useLang()
  const toast = useToast()
  const nav = useNavigate()
  const [d, setD] = useState(null)
  const isNew = params.get('new') === '1'
  const [tab, setTab] = useState(isNew ? 'share' : 'numbers')
  const [del, setDel] = useState(false)

  const load = useCallback(() => api('kametis/get', { id }).then(setD).catch((x) => { toast(err(x.code), 'err'); nav(-1) }), [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  useEffect(() => { if (isNew) confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 }, colors: ['#A99BF8', '#8576F2', '#6C5CE7', '#FBBF24'] }) }, [isNew])

  const c = useMemo(() => (d ? calc(d.kameti, d.members, d.payments, d.payouts, d.slots) : null), [d])
  if (!d) return <Spinner />

  const k = d.kameti
  const T = TYPES[k.type] || TYPES.fixed
  const canEdit = d.can_edit
  const me = d.members.find((m) => n(m.user_id) === n(user.id) || (user.email && m.email && m.email.toLowerCase() === user.email.toLowerCase()))
  const run = async (route, body, msg) => {
    try { const r = await api(route, { kameti_id: k.id, ...body }); await load(); if (msg) toast(msg); return r } catch (x) { toast(err(x.code), 'err'); throw x }
  }
  const backTo = user.role === 'superadmin' ? '/admin/kametis' : user.role === 'organizer' ? '/org/kametis' : '/me'
  const next = c.receiversOf(c.cur)
  const everyRound = k.type === 'qurandazi' && c.cfg.draw_mode === 'every_round'
  const nextName = everyRound && !c.isDecided(c.cur) ? t('undecided') : next.length ? next.map((h) => h.member.name.split(' ')[0]).join(' + ') : '—'

  const tabs = [
    ['numbers', t('numbers'), Hash],
    ['share', t('exportTab'), Share2],
    ['payments', t('payments'), Wallet],
    ['payouts', t('payouts'), HandCoins],
    ['members', t('members'), Users],
    ['info', t('rulesStep'), Info],
  ]

  return (
    <div className="space-y-4">
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-fg/60 hover:text-fg"><ArrowLeft className="h-4 w-4 flip-rtl" />{t('back')}</Link>

      {isNew && (
        <div className="flex items-center gap-3 rounded-3xl bg-emerald-500 p-4 font-extrabold text-white animate-pop">
          <PartyPopper className="h-7 w-7 shrink-0" />{t('doneTitle')}
        </div>
      )}

      <div className={cx('relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-5 text-white shadow-glow sm:p-8', T.grad)}>
        <T.icon className="pointer-events-none absolute -end-6 -top-6 h-40 w-40 rotate-12 opacity-15" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-white/20 text-white">{t(`type_${k.type}`)}</span>
              <Badge tone={statusTone[k.status] || 'gray'}>{t(k.status)}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">{k.title}</h1>
          </div>
          {canEdit && (
            <div className="flex shrink-0 gap-2">
              <Link to={`/org/edit/${k.id}`}><Button variant="white" size="icon" aria-label={t('edit')}><Pencil className="h-5 w-5" /></Button></Link>
              <Button variant="white" size="icon" onClick={() => setDel(true)} aria-label={t('delete')}><Trash2 className="h-5 w-5 text-red-500" /></Button>
            </div>
          )}
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            [t('totalPerMonth', { f: t(`perF_${k.frequency}`) }), money(c.pot)],
            [t('cardPerNumber'), money(k.amount)],
            [t('startMonth'), roundLabel(k, 1, lang)],
            [t('endMonth'), roundLabel(k, c.slots, lang)],
          ].map(([a, b]) => (
            <div key={a} className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <div className="truncate text-[11px] font-semibold text-white/80">{a}</div>
              <div className="num truncate text-base font-bold sm:text-lg">{b}</div>
            </div>
          ))}
        </div>
        <div className="relative mt-4">
          <div className="mb-1.5 flex justify-between text-sm font-bold"><span>{t('roundOf', { r: c.cur, t: c.slots })}</span><span className="num">{c.progress}%</span></div>
          <div className="h-2.5 rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${c.progress}%` }} /></div>
        </div>
      </div>

      {!canEdit && me && <MyCard k={k} c={c} me={me} everyRound={everyRound} />}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat icon={TrendingUp} label={t('collected')} value={money(c.collected)} tone="trust" />
        <Stat icon={Clock} label={t('pending')} value={money(c.pending)} tone="gold" />
        <Stat icon={Users} label={t('thisRound')} value={`${c.roundPaidCount(c.cur)}/${c.payers.length}`} tone="dark" />
        <Stat icon={Crown} label={t('nextReceiver')} value={nextName} />
      </div>

      <div className="sticky top-[65px] z-20 -mx-4 bg-lilac/90 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:px-0">
        <div className="grid grid-cols-3 gap-2 sm:flex">
          {tabs.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={cx('flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-xs font-bold transition sm:flex-row sm:gap-2 sm:px-4 sm:text-sm', tab === key ? 'bg-ink text-white shadow-soft' : key === 'share' ? 'bg-surface text-violet-600' : 'bg-surface text-fg/60')}>
              <Icon className="h-5 w-5" />{label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'numbers' && <NumbersTab d={d} c={c} canEdit={canEdit} run={run} me={me} everyRound={everyRound} />}
      {tab === 'share' && <ShareTab d={d} c={c} canEdit={canEdit} me={me} />}
      {tab === 'payments' && <PaymentsTab d={d} c={c} canEdit={canEdit} run={run} />}
      {tab === 'payouts' && <PayoutsTab d={d} c={c} canEdit={canEdit} run={run} />}
      {tab === 'members' && <MembersTab d={d} c={c} canEdit={canEdit} run={run} me={me} />}
      {tab === 'info' && <InfoTab d={d} c={c} />}

      <Confirm open={del} onClose={() => setDel(false)} title={t('deleteKameti')} onConfirm={async () => {
        try { await api('kametis/delete', { id: k.id }); nav(backTo) } catch (x) { toast(err(x.code), 'err') }
      }} />
    </div>
  )
}

const toGroups = (c) => Array.from({ length: c.slots }, (_, i) => ({ slot_no: i + 1, holders: (c.bySlot[i + 1] || []).map((h) => ({ id: h.member_id, portion: h.portion })) }))

function MyCard({ k, c, me, everyRound }) {
  const { t, lang } = useLang()
  const nums = c.numbersOf(me.id)
  const paidNow = c.isPaid(me.id, c.cur)
  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      <div className="card relative overflow-hidden bg-ink p-5 text-white sm:col-span-2">
        <div className="mesh absolute inset-0 opacity-70" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/70"><Crown className="h-4 w-4 text-amber-300" />{t('yourTurn')}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {nums.length === 0 && <span className="text-white/60">{t('zeroNumbers')}</span>}
            {nums.map((x) => (
              <div key={x.slot_no} className={cx('rounded-2xl px-3 py-2', c.isLocked(x.slot_no) ? 'bg-trust' : 'bg-white/15')}>
                <div className="num text-2xl font-bold">#{x.slot_no}{x.portion < 0.99 && <span className="text-base"> {frac(x.portion)}</span>}</div>
                <div className="text-xs text-white/80">{everyRound && !c.isDecided(x.slot_no) ? t('undecided') : roundLabel(k, x.slot_no, lang)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={cx('card flex items-center gap-4 p-5', paidNow ? 'bg-emerald-50' : 'bg-red-50')}>
        <div className={cx('grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white', paidNow ? 'bg-emerald-500' : 'bg-red-500')}>{paidNow ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}</div>
        <div>
          <div className="num text-xl font-bold">{money(c.dueFor(me, c.cur))}</div>
          <div className="text-sm font-bold">{paidNow ? t('paidThisRound') : t('notPaidThisRound')}</div>
        </div>
      </div>
    </div>
  )
}

function NumbersTab({ d, c, canEdit, run, me, everyRound }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const [draft, setDraft] = useState(null)
  const [anim, setAnim] = useState(null)
  const [winner, setWinner] = useState(null)
  const [saving, setSaving] = useState(false)
  const groups = draft || toGroups(c)
  const people = d.members.map((m) => ({ id: n(m.id), name: m.name }))
  const draftOk = groups.every((g) => Math.abs(g.holders.reduce((a, h) => a + n(h.portion), 0) - 1) < 0.01)
  const nextUndrawn = Array.from({ length: c.slots }, (_, i) => i + 1).find((r) => !c.isDecided(r))
  const mask = (r) => (everyRound && !c.isDecided(r) && !canEdit ? t('undecided') : null)

  const animate = (fn) => new Promise((resolve, reject) => {
    const names = d.members.map((m) => m.name)
    const iv = setInterval(() => setAnim({ name: names[Math.floor(Math.random() * names.length)], num: 1 + Math.floor(Math.random() * c.slots) }), 80)
    setTimeout(async () => { clearInterval(iv); try { resolve(await fn()) } catch (e) { reject(e) } finally { setAnim(null) } }, 1600)
  })
  const boom = () => confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, colors: ['#A99BF8', '#8576F2', '#6C5CE7', '#FBBF24', '#10B981'] })

  const save = async () => {
    setSaving(true)
    try {
      await run('slots/save', { numbers: groups.map((g) => ({ slot_no: g.slot_no, holders: g.holders.map((h) => ({ member_id: h.id, portion: h.portion })) })) }, t('saved'))
      setDraft(null)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      {canEdit && k.type === 'qurandazi' && !draft && (
        everyRound ? (
          nextUndrawn ? <Button size="lg" className="w-full text-lg" icon={Dices} loading={!!anim} onClick={async () => {
            const r = await animate(() => run('slots/draw', { round_no: nextUndrawn })).catch(() => null)
            if (r) { setWinner(r); boom() }
          }}>{t('drawThisRound', { r: nextUndrawn })}</Button> : null
        ) : (
          <Button size="lg" className="w-full text-lg" icon={Dices} loading={!!anim} onClick={async () => { const ok = await animate(() => run('slots/shuffle', {}, t('shuffleDone'))).catch(() => null); if (ok) boom() }}>{t('shuffleAll')}</Button>
        )
      )}
      {canEdit && <p className="text-sm text-fg/60">{k.type === 'boli' ? t('slotsHintBoli') : k.type === 'zaroorat' ? t('slotsHintZaroorat') : t('slotsHint')}</p>}

      <SlotEditor groups={groups} people={people} label={(r) => roundLabel(k, r, lang)} locked={c.isLocked} readOnly={!canEdit}
        onChange={setDraft} amountFor={c.payoutFor} highlight={me ? n(me.id) : null} mask={mask} />

      {draft && (
        <div className="fixed inset-x-3 bottom-[92px] z-30 flex gap-2 rounded-[1.6rem] bg-ink p-2 shadow-2xl lg:static lg:bg-transparent lg:p-0 lg:shadow-none">
          <Button variant="outline" size="lg" icon={Undo2} onClick={() => setDraft(null)}>{t('cancel')}</Button>
          <Button size="lg" className="flex-1" icon={Save} loading={saving} disabled={!draftOk} onClick={save}>{draftOk ? t('save') : t('slotsFixFirst')}</Button>
        </div>
      )}

      {anim && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/85 backdrop-blur-md">
          <div className="px-6 text-center text-white">
            <div className="num text-gradient text-[7rem] font-bold leading-none">{anim.num}</div>
            <div className="mt-4 text-3xl font-extrabold">{anim.name}</div>
            <div className="mt-2 text-white/60">{t('shuffling')}</div>
          </div>
        </div>
      )}
      <Modal open={!!winner} onClose={() => setWinner(null)} title={t('winnerIs')}>
        {winner && (
          <div className="text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white"><Trophy className="h-10 w-10" /></div>
            <div className="mt-4 text-3xl font-extrabold">{winner.names.join(' + ')}</div>
            <div className="mt-1 text-fg/60">{t('number')} {winner.round} · {roundLabel(k, winner.round, lang)}</div>
            <Button className="mt-6 w-full" size="lg" onClick={() => setWinner(null)}>{t('close')}</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ShareTab({ d, c, canEdit, me }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const [busy, setBusy] = useState(null)
  const [preview, setPreview] = useState(null)
  const list = canEdit ? c.payers : me ? [me] : []
  const shareText = t('shareText', { title: k.title, url: siteInfo().url })

  const make = async (key, fn, filename) => {
    setBusy(key)
    try {
      const blob = await fn()
      setPreview({ url: URL.createObjectURL(blob), blob, filename })
    } finally { setBusy(null) }
  }
  const close = () => { if (preview) URL.revokeObjectURL(preview.url); setPreview(null) }

  return (
    <div className="space-y-3">
      <div className="mesh overflow-hidden rounded-[2rem] p-5 text-white">
        <div className="flex items-center gap-2 text-lg font-extrabold"><ImageIcon className="h-6 w-6 text-violet-300" />{t('exportTitle')}</div>
        <p className="mt-1 text-white/70">{t('exportSub')}</p>
      </div>

      <button disabled={!!busy} onClick={() => make('chart', () => chartImage({ k, c, t, lang }), `${safeName(k.title)}-chart.png`)}
        className="card flex w-full items-center gap-4 p-4 text-start transition active:scale-[.98]">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-baari text-white shadow-glow">{busy === 'chart' ? <Loader2 className="h-8 w-8 animate-spin" /> : <ImageIcon className="h-8 w-8" />}</div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-extrabold">{t('fullChart')}</div>
          <div className="text-sm text-fg/60">{t('fullChartSub')}</div>
        </div>
        <Share2 className="h-6 w-6 shrink-0 text-violet-500" />
      </button>

      <div className="pt-2 text-sm font-bold uppercase tracking-wide text-fg/50">{t('memberCard')}</div>
      {list.map((m) => {
        const nums = c.numbersOf(m.id)
        return (
          <div key={m.id} className="card flex items-center gap-3 p-3">
            <Avatar name={m.name} id={m.id} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-extrabold">{m.name}</div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {nums.map((x) => <span key={x.slot_no} className="num rounded-lg bg-ink px-2 py-0.5 text-xs font-bold text-white">#{x.slot_no}{x.portion < 0.99 ? ` ${frac(x.portion)}` : ''}</span>)}
              </div>
            </div>
            <button disabled={!!busy} onClick={() => make(m.id, () => memberCardImage({ k, c, member: m, t, lang }), `${safeName(m.name)}-${safeName(k.title)}.png`)}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-[0_8px_25px_-8px_rgba(16,185,129,.9)] active:scale-90" aria-label={t('shareImage')}>
              {busy === m.id ? <Loader2 className="h-7 w-7 animate-spin" /> : <MessageCircle className="h-7 w-7" />}
            </button>
          </div>
        )
      })}

      <Modal open={!!preview} onClose={close} title={t('exportTitle')}>
        {preview && (
          <div>
            <img src={preview.url} alt="" className="max-h-[55vh] w-full rounded-2xl bg-ink object-contain" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" icon={Download} onClick={() => shareOrDownload(preview.blob, preview.filename, null, true)}>{t('download')}</Button>
              <Button variant="trust" size="lg" icon={Share2} onClick={() => shareOrDownload(preview.blob, preview.filename, shareText)}>{t('shareImage')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function PaymentsTab({ d, c, canEdit, run }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const [r, setR] = useState(c.cur)
  const [busy, setBusy] = useState(null)
  const payers = c.payers
  const paidCount = c.roundPaidCount(r)
  const expected = payers.reduce((s, m) => s + c.dueFor(m, r), 0)
  const allPaid = paidCount === payers.length && payers.length > 0

  const toggle = async (m) => {
    if (!canEdit) return
    setBusy(m.id)
    try { await run('payments/toggle', { member_id: m.id, round_no: r, paid: !c.isPaid(m.id, r), amount: c.dueFor(m, r) }) } catch { /* toast shown */ } finally { setBusy(null) }
  }
  const markAll = async () => {
    setBusy('all')
    const amounts = Object.fromEntries(payers.map((m) => [m.id, c.dueFor(m, r)]))
    try { await run('payments/round', { round_no: r, paid: !allPaid, amounts }, t('saved')) } catch { /* toast shown */ } finally { setBusy(null) }
  }

  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        {Array.from({ length: c.slots }, (_, i) => i + 1).map((x) => {
          const full = c.roundPaidCount(x) === payers.length && payers.length > 0
          return (
            <button key={x} onClick={() => setR(x)} className={cx('num flex h-14 min-w-[3.5rem] shrink-0 flex-col items-center justify-center rounded-2xl px-2 font-bold transition', x === r ? 'bg-ink text-white' : full ? 'bg-emerald-100 text-emerald-700' : x <= c.cur ? 'bg-surface text-fg' : 'bg-surface/60 text-fg/40')}>
              <span className="text-lg leading-none">{x}</span>
              {x === c.cur && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500" />}
            </button>
          )
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-fg/50">{t('round')} {r} · {roundLabel(k, r, lang)}</div>
            <div className="num text-2xl font-bold">{money(c.roundCollected(r))} <span className="text-base text-fg/40">/ {money(expected)}</span></div>
          </div>
          {canEdit && <Button variant={allPaid ? 'outline' : 'trust'} icon={allPaid ? X : Check} loading={busy === 'all'} onClick={markAll}>{allPaid ? t('unpaid') : t('markAllPaid')}</Button>}
        </div>
        <div className="mt-3"><Progress value={(paidCount / Math.max(1, payers.length)) * 100} tone="trust" /></div>
        <div className="mt-1.5 text-sm font-semibold text-fg/50">{t('paidCount', { p: paidCount, t: payers.length })}</div>
        {k.type === 'boli' && c.dividend(r) > 0 && <div className="mt-1 text-sm font-bold text-amber-600">{t('dividend')}: {money(c.dividend(r))}</div>}
      </Card>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {payers.map((m) => {
          const paid = c.isPaid(m.id, r)
          return (
            <div key={m.id} className={cx('card flex items-center gap-3 p-3 transition', paid && 'bg-emerald-50/60')}>
              <Avatar name={m.name} id={m.id} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-extrabold">{m.name}</div>
                <div className="num text-sm text-fg/50">{money(c.dueFor(m, r))} · {numbersLabel(c.shareOf(m.id))} {t('numbers')}</div>
              </div>
              {canEdit && !paid && m.phone && (
                <a href={waLink(m.phone, t('reminderText', { name: m.name, title: k.title, r, amount: money(c.dueFor(m, r)) }))} target="_blank" rel="noreferrer"
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600" aria-label={t('remind')}><MessageCircle className="h-6 w-6" /></a>
              )}
              <button onClick={() => toggle(m)} disabled={!canEdit || busy === m.id} aria-label={paid ? t('paid') : t('markPaid')}
                className={cx('grid h-14 w-14 place-items-center rounded-2xl transition active:scale-90', paid ? 'bg-emerald-500 text-white shadow-[0_8px_25px_-8px_rgba(16,185,129,.9)]' : 'bg-red-100 text-red-500', !canEdit && 'cursor-default')}>
                {paid ? <Check className="h-8 w-8" strokeWidth={3} /> : <X className="h-7 w-7" strokeWidth={3} />}
              </button>
            </div>
          )
        })}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-violet-50 px-5 py-3 font-extrabold">{t('history')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-lilac">
              <th className="sticky start-0 z-10 bg-lilac px-4 py-2 text-start">{t('name')}</th>
              {Array.from({ length: c.slots }, (_, i) => <th key={i} className="num px-2 py-2 text-center">{i + 1}</th>)}
            </tr></thead>
            <tbody>
              {payers.map((m) => (
                <tr key={m.id} className="border-t border-violet-50">
                  <td className="sticky start-0 z-10 max-w-[130px] truncate bg-surface px-4 py-2 font-bold">{m.name}</td>
                  {Array.from({ length: c.slots }, (_, i) => {
                    const p = c.isPaid(m.id, i + 1)
                    const late = !p && i + 1 <= c.cur
                    return <td key={i} className="px-2 py-2 text-center"><span className={cx('mx-auto block h-5 w-5 rounded-md', p ? 'bg-emerald-500' : late ? 'bg-red-300' : 'bg-violet-100')} /></td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function PayoutsTab({ d, c, canEdit, run }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const [edit, setEdit] = useState(null)
  const choose = k.type === 'boli' || k.type === 'zaroorat'
  const holdersText = (r) => c.receiversOf(r).map((h) => `${h.member.name}${h.portion < 0.99 ? ` ${frac(h.portion)}` : ''}`).join(' + ') || '—'

  const open = (r) => {
    const p = c.payoutMap[r]
    setEdit({ round_no: r, swap_from: r, bid_amount: n(p?.bid_amount) || '', amount: n(p?.amount) || '', given: n(p?.given) === 1 || !p || p.note === 'draw', note: p?.note === 'draw' ? '' : p?.note || '' })
  }
  const save = async () => {
    const bid = n(edit.bid_amount)
    const amount = n(edit.amount) || (c.pot - c.fee - bid)
    try { await run('payouts/save', { ...edit, amount, bid_amount: bid }, t('saved')); setEdit(null) } catch { /* toast shown */ }
  }
  const options = edit ? Array.from({ length: c.slots }, (_, i) => i + 1).filter((r) => !c.isLocked(r) && r >= edit.round_no) : []

  return (
    <div className="space-y-2.5">
      {Array.from({ length: c.slots }, (_, i) => i + 1).map((r) => {
        const p = c.payoutMap[r]
        const given = n(p?.given) === 1
        return (
          <div key={r} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={cx('num grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-bold', given ? 'bg-trust text-white' : r === c.cur ? 'bg-baari text-white' : 'bg-violet-100 text-violet-700')}>{r}</div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-fg/50">{roundLabel(k, r, lang)}</div>
                <div className="truncate font-extrabold">{holdersText(r)}</div>
                {n(p?.bid_amount) > 0 && <div className="text-xs font-bold text-amber-600">{t('bidAmount')}: {money(p.bid_amount)}</div>}
                {p?.note && p.note !== 'draw' && <div className="truncate text-xs font-bold text-violet-600">{p.note}</div>}
              </div>
              <div className="num text-end font-bold">{money(c.payoutFor(r))}{given && <div><Badge tone="green"><Check className="h-3 w-3" />{t('given')}</Badge></div>}</div>
            </div>
            {canEdit && (
              <Button size="sm" variant={given ? 'outline' : 'grad'} className="mt-3 h-11 w-full" icon={HandCoins} onClick={() => open(r)}>
                {given ? t('edit') : choose ? (k.type === 'boli' ? t('recordBid') : t('chooseReceiver')) : t('markGiven')}
              </Button>
            )}
          </div>
        )
      })}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `${t('number')} ${edit.round_no} · ${roundLabel(k, edit.round_no, lang)}` : ''}>
        {edit && (
          <div className="space-y-4">
            {choose && !c.isLocked(edit.round_no) ? (
              <Field label={t('chooseNumber')}>
                <div className="max-h-56 space-y-1.5 overflow-y-auto">
                  {options.map((r) => (
                    <button key={r} onClick={() => setEdit({ ...edit, swap_from: r })} className={cx('flex w-full items-center gap-3 rounded-2xl p-2.5 text-start', edit.swap_from === r ? 'bg-baari text-white' : 'bg-lilac')}>
                      <span className={cx('num grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold', edit.swap_from === r ? 'bg-white/25' : 'bg-surface')}>{r}</span>
                      <span className="truncate font-bold">{holdersText(r)}</span>
                    </button>
                  ))}
                </div>
              </Field>
            ) : (
              <div className="rounded-2xl bg-lilac p-4 font-extrabold">{holdersText(edit.round_no)}</div>
            )}
            {k.type === 'boli' && (
              <Field label={t('bidAmount')} hint={`${t('minBid')}: ${money(c.cfg.min_bid)} · max ${money(Math.round((c.pot * n(c.cfg.max_bid_percent || 100)) / 100))}`}>
                <Input inputMode="numeric" dir="ltr" value={edit.bid_amount} onChange={(e) => setEdit({ ...edit, bid_amount: e.target.value.replace(/\D/g, ''), amount: '' })} />
              </Field>
            )}
            {k.type === 'zaroorat' && <Field label={t('reason')}><Input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>}
            <Field label={t('payoutAmount')}>
              <Input inputMode="numeric" dir="ltr" placeholder={String(c.pot - c.fee - n(edit.bid_amount))} value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Toggle checked={edit.given} onChange={(v) => setEdit({ ...edit, given: v })} label={t('markGiven')} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              {c.payoutMap[edit.round_no] ? <Button variant="outline" onClick={async () => { await run('payouts/delete', { round_no: edit.round_no }); setEdit(null) }}>{t('delete')}</Button> : <Button variant="outline" onClick={() => setEdit(null)}>{t('cancel')}</Button>}
              <Button icon={Save} onClick={save}>{t('save')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function MembersTab({ d, c, canEdit, run, me }) {
  const { t, err } = useLang()
  const toast = useToast()
  const k = d.kameti
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const [cred, setCred] = useState(null)

  const save = async () => { try { await run('members/save', edit, t('saved')); setEdit(null) } catch { /* toast shown */ } }
  const giveLogin = async (m) => {
    if (!m.email && !m.phone) { toast(t('needEmailPhone'), 'err'); return }
    try { const r = await run('members/login', { id: m.id }); setCred({ ...r, name: m.name }) } catch { /* toast shown */ }
  }

  return (
    <div className="space-y-3">
      {canEdit && <Button size="lg" className="w-full" icon={UserPlus} onClick={() => setEdit({ name: '', phone: '', email: '' })}>{t('addPerson')}</Button>}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {d.members.map((m) => {
          const nums = c.numbersOf(m.id)
          return (
            <Card key={m.id} className={cx('p-4', me?.id === m.id && 'ring-2 ring-violet-300')}>
              <div className="flex items-center gap-3">
                <Avatar name={m.name} id={m.id} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-extrabold">{m.name}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {nums.length === 0 && <Badge tone="gray">{t('zeroNumbers')}</Badge>}
                    {nums.map((x) => <span key={x.slot_no} className="num rounded-lg bg-ink px-2 py-0.5 text-xs font-bold text-white">#{x.slot_no}{x.portion < 0.99 ? ` ${frac(x.portion)}` : ''}</span>)}
                    {m.user_id && <Badge tone="green"><KeyRound className="h-3 w-3" /></Badge>}
                  </div>
                </div>
                {nums.length > 0 && <div className="num shrink-0 text-end text-sm font-bold">{money(c.amount * c.shareOf(m.id))}</div>}
              </div>
              {canEdit && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <button onClick={() => setEdit({ id: m.id, name: m.name, phone: m.phone || '', email: m.email || '' })} className="grid h-12 place-items-center rounded-xl bg-violet-50 text-violet-700" aria-label={t('edit')}><Pencil className="h-5 w-5" /></button>
                  {m.phone ? (
                    <a href={waLink(m.phone, t('reminderText', { name: m.name, title: k.title, r: c.cur, amount: money(c.dueFor(m, c.cur)) }))} target="_blank" rel="noreferrer" className="grid h-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600" aria-label="WhatsApp"><MessageCircle className="h-5 w-5" /></a>
                  ) : <span className="grid h-12 place-items-center rounded-xl bg-gray-50 text-gray-300"><MessageCircle className="h-5 w-5" /></span>}
                  <button onClick={() => giveLogin(m)} className="grid h-12 place-items-center rounded-xl bg-amber-50 text-amber-600" aria-label={t('giveLogin')}><KeyRound className="h-5 w-5" /></button>
                  <button onClick={() => setDel(m)} className="grid h-12 place-items-center rounded-xl bg-red-50 text-red-500" aria-label={t('delete')}><Trash2 className="h-5 w-5" /></button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t('edit') : t('addPerson')}>
        {edit && (
          <div className="space-y-4">
            <Field label={t('name')}><Input className="h-14 text-lg font-bold" autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={`${t('phone')} (${t('optional')})`}><Input dir="ltr" inputMode="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label={`${t('email')} (${t('optional')})`}><Input dir="ltr" type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            {!edit.id && <p className="text-sm text-fg/60">{t('slotsHint')}</p>}
            <Button size="lg" className="w-full" icon={Save} disabled={!edit.name.trim()} onClick={save}>{t('save')}</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!cred} onClose={() => setCred(null)} title={cred?.linked ? t('loginLinked') : t('loginCreated')}>
        {cred && (
          <div className="space-y-3">
            <div className="text-lg font-extrabold">{cred.name}</div>
            <div className="rounded-2xl bg-lilac p-4 font-num text-lg" dir="ltr">
              <div>{cred.login}</div>
              {cred.password && <div className="mt-1 text-2xl font-bold">{t('tempPassword')}: {cred.password}</div>}
            </div>
            {cred.password && (
              <Button variant="dark" className="w-full" icon={Copy} onClick={() => { navigator.clipboard?.writeText(`${siteInfo().url}\n${cred.login}\n${cred.password}`); toast(t('saved')) }}>Copy</Button>
            )}
          </div>
        )}
      </Modal>

      <Confirm open={!!del} onClose={() => setDel(null)} text={del?.name} onConfirm={async () => {
        try { await run('members/delete', { id: del.id }, t('saved')) } catch (x) { toast(err(x.code), 'err') }
        setDel(null)
      }} />
    </div>
  )
}

function InfoTab({ d, c }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const cfg = c.cfg
  const rows = [
    [t('type'), t(`type_${k.type}`)],
    [t('cardPerNumber'), money(k.amount)],
    [t('pot'), `${money(c.pot)} · ${lakh(c.pot, lang)}`],
    [t('frequency'), t(k.frequency)],
    [t('numbers'), k.slots],
    [t('startMonth'), roundLabel(k, 1, lang)],
    [t('endMonth'), roundLabel(k, c.slots, lang)],
    ...(k.frequency === 'monthly' ? [[t('dueDay'), cfg.due_day]] : []),
    [t('graceDays'), cfg.grace_days],
    [t('lateFee'), money(cfg.late_fee)],
    [t('organizerFee'), `${n(cfg.organizer_fee)}%`],
    ...(k.type === 'qurandazi' ? [[t('drawMode'), t(`draw_${cfg.draw_mode}`)]] : []),
    ...(k.type === 'boli' ? [[t('minBid'), money(cfg.min_bid)], [t('maxBidPercent'), `${cfg.max_bid_percent}%`], [t('profitSharing'), t(`share_${cfg.profit_sharing}`)]] : []),
    ...(k.type === 'zaroorat' ? [[t('requireReason'), cfg.require_reason ? t('yes') : t('no')]] : []),
    [t('organizer'), `${k.organizer?.name || ''}${k.organizer?.phone ? ' · ' + k.organizer.phone : ''}`],
  ]
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="divide-y divide-violet-50 p-0">
        {rows.map(([a, b]) => <div key={a} className="flex items-center justify-between gap-4 px-5 py-3.5"><span className="text-fg/60">{a}</span><span className="num text-end font-bold">{b}</span></div>)}
      </Card>
      {(cfg.rules || k.notes) && (
        <Card className="h-fit p-5">
          <h3 className="mb-2 font-extrabold">{t('rulesNotes')}</h3>
          <p className="whitespace-pre-wrap text-fg/70">{cfg.rules || k.notes}</p>
        </Card>
      )}
      <div className="text-xs text-fg/40">{fmtDate(k.created_at, lang)}</div>
    </div>
  )
}
