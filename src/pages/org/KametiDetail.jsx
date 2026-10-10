import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  ArrowLeft, Pencil, Trash2, Dices, ListOrdered, Wallet, HandCoins, Info, Users, Check, X, MessageCircle, KeyRound,
  UserPlus, ArrowUp, ArrowDown, Save, Crown, CalendarDays, TrendingUp, Clock, Trophy, Gavel, Copy,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useLang } from '../../lib/i18n'
import { TYPES, calc, money, n, roundDate, fmtDate, waLink, lakh } from '../../lib/kameti'
import { Avatar, Badge, Button, Card, Confirm, Field, Input, Modal, Progress, Segmented, Spinner, Stat, Textarea, Toggle, useToast, cx } from '../../components/ui'
import { statusTone } from '../../components/KametiCard'

export default function KametiDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t, err, lang } = useLang()
  const toast = useToast()
  const nav = useNavigate()
  const [d, setD] = useState(null)
  const [tab, setTab] = useState('turns')
  const [del, setDel] = useState(false)

  const load = useCallback(() => api('kametis/get', { id }).then(setD).catch((x) => { toast(err(x.code), 'err'); nav(-1) }), [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const c = useMemo(() => (d ? calc(d.kameti, d.members, d.payments, d.payouts) : null), [d])
  if (!d) return <Spinner />

  const k = d.kameti
  const T = TYPES[k.type] || TYPES.fixed
  const canEdit = d.can_edit
  const me = d.members.find((m) => n(m.user_id) === n(user.id) || (user.email && m.email && m.email.toLowerCase() === user.email.toLowerCase()))
  const run = async (route, body, msg) => {
    try { const r = await api(route, { kameti_id: k.id, ...body }); await load(); if (msg) toast(msg); return r } catch (x) { toast(err(x.code), 'err'); throw x }
  }
  const backTo = user.role === 'superadmin' ? '/admin/kametis' : user.role === 'organizer' ? '/org/kametis' : '/me'
  const nextReceivers = c.receiversOf(c.cur)

  const tabs = [
    ['turns', t('turns'), ListOrdered],
    ['payments', t('payments'), Wallet],
    ['payouts', t('payouts'), HandCoins],
    ['members', t('members'), Users],
    ['info', t('rulesStep'), Info],
  ]

  return (
    <div className="space-y-5">
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-ink/60 hover:text-ink"><ArrowLeft className="h-4 w-4 flip-rtl" />{t('back')}</Link>

      {/* Hero */}
      <div className={cx('relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-white shadow-glow sm:p-8', T.grad)}>
        <T.icon className="pointer-events-none absolute -end-6 -top-6 h-48 w-48 rotate-12 opacity-15" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-white/20 text-white">{t(`type_${k.type}`)}</span>
              <Badge tone={statusTone[k.status] || 'gray'}>{t(k.status)}</Badge>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{k.title}</h1>
            <div className="mt-1 text-sm text-white/80">{t('organizedBy')}: {k.organizer?.name}</div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Link to={`/org/edit/${k.id}`}><Button variant="white" size="icon" aria-label={t('edit')}><Pencil className="h-5 w-5" /></Button></Link>
              <Button variant="white" size="icon" onClick={() => setDel(true)} aria-label={t('delete')}><Trash2 className="h-5 w-5 text-red-500" /></Button>
            </div>
          )}
        </div>
        <div className="relative mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="text-sm text-white/80">{t('pot')}</div>
            <div className="num text-4xl font-bold sm:text-5xl">{money(c.pot)}</div>
            <div className="num text-sm text-white/85">{money(k.amount)} × {k.slots} · {t(k.frequency)} · {lakh(c.pot, lang)}</div>
          </div>
          <div className="min-w-[220px]">
            <div className="mb-1.5 flex justify-between text-sm font-bold"><span>{t('roundOf', { r: c.cur, t: k.slots })}</span><span className="num">{c.progress}%</span></div>
            <div className="h-3 rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${c.progress}%` }} /></div>
            <div className="mt-1.5 text-xs text-white/80">{fmtDate(k.start_date, lang)} → {fmtDate(c.endDate, lang)}</div>
          </div>
        </div>
      </div>

      {/* Member's personal card */}
      {!canEdit && me && <MyCard k={k} c={c} me={me} payouts={d.payouts} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={TrendingUp} label={t('collected')} value={money(c.collected)} tone="trust" />
        <Stat icon={Clock} label={t('pending')} value={money(c.pending)} tone="gold" />
        <Stat icon={Users} label={t('thisRound')} value={t('paidCount', { p: c.roundPaidCount(c.cur), t: d.members.length })} tone="dark" />
        <Stat icon={Crown} label={t('nextReceiver')} value={nextReceivers.length ? nextReceivers.map((m) => m.name.split(' ')[0]).join(' + ') : t('noTurn')} />
      </div>

      {/* Tabs */}
      <div className="sticky top-[65px] z-20 -mx-4 bg-lilac/90 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {tabs.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={cx('flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition', tab === key ? 'bg-ink text-white shadow-soft' : 'bg-white text-ink/60 hover:text-ink')}>
              <Icon className="h-5 w-5" />{label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'turns' && <TurnsTab d={d} c={c} canEdit={canEdit} run={run} me={me} />}
      {tab === 'payments' && <PaymentsTab d={d} c={c} canEdit={canEdit} run={run} me={me} />}
      {tab === 'payouts' && <PayoutsTab d={d} c={c} canEdit={canEdit} run={run} me={me} />}
      {tab === 'members' && <MembersTab d={d} c={c} canEdit={canEdit} run={run} me={me} />}
      {tab === 'info' && <InfoTab d={d} c={c} />}

      <Confirm open={del} onClose={() => setDel(false)} title={t('deleteKameti')} onConfirm={async () => {
        try { await api('kametis/delete', { id: k.id }); nav(backTo) } catch (x) { toast(err(x.code), 'err') }
      }} />
    </div>
  )
}

// ---------------------------------------------------------------- member card
function MyCard({ k, c, me, payouts }) {
  const { t, lang } = useLang()
  const turn = n(me.turn_no)
  const received = payouts.some((p) => n(p.member_id) === n(me.id) && n(p.given))
  const paidNow = c.isPaid(me.id, c.cur)
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="card relative overflow-hidden bg-ink p-5 text-white">
        <div className="mesh absolute inset-0 opacity-70" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/70"><Crown className="h-4 w-4 text-amber-300" />{t('yourTurn')}</div>
          <div className="num mt-1 text-5xl font-bold">{turn || '—'}</div>
          <div className="text-sm text-white/70">{received ? t('youReceived') : turn ? fmtDate(roundDate(k, turn), lang) : t('noTurn')}</div>
        </div>
      </div>
      <div className="card p-5">
        <div className="text-sm font-semibold text-ink/50">{t('youPay')}</div>
        <div className="num mt-1 text-3xl font-bold">{money(c.dueFor(me, c.cur))}</div>
        <div className="text-sm text-ink/50">{t(k.frequency)}</div>
      </div>
      <div className={cx('card flex items-center gap-4 p-5', paidNow ? 'bg-emerald-50' : 'bg-red-50')}>
        <div className={cx('grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white', paidNow ? 'bg-emerald-500' : 'bg-red-500')}>{paidNow ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}</div>
        <div className="font-extrabold">{paidNow ? t('paidThisRound') : t('notPaidThisRound')}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- turns
function TurnsTab({ d, c, canEdit, run, me }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const [anim, setAnim] = useState(null)
  const [winner, setWinner] = useState(null)
  const [order, setOrder] = useState(null)
  const anyGiven = d.payouts.some((p) => n(p.given))
  const drawMode = c.cfg.draw_mode
  const nextUndrawn = Array.from({ length: c.slots }, (_, i) => i + 1).find((r) => c.receiversOf(r).length === 0)

  const animate = (fn) => new Promise((resolve) => {
    const names = d.members.map((m) => m.name)
    let i = 0
    const iv = setInterval(() => { setAnim({ name: names[Math.floor(Math.random() * names.length)], num: 1 + Math.floor(Math.random() * c.slots) }); i++ }, 80)
    setTimeout(async () => { clearInterval(iv); try { resolve(await fn()) } finally { setAnim(null) } }, 1600)
  })
  const boom = () => confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, colors: ['#7C3AED', '#EC4899', '#F97316', '#FBBF24', '#10B981'] })

  const shuffle = async () => { await animate(() => run('members/shuffle', {}, t('shuffleDone'))); boom() }
  const drawRound = async () => {
    const r = await animate(() => run('members/draw', { round_no: nextUndrawn }))
    if (r?.winners) { setWinner({ round: nextUndrawn, names: r.winners.map((w) => w.name) }); boom() }
  }

  // Manual ordering for fixed/half kametis (units ordered top to bottom)
  const startOrder = () => setOrder([...d.members].sort((a, b) => (n(a.turn_no) || 999) - (n(b.turn_no) || 999) || n(a.position) - n(b.position)))
  const move = (i, dir) => setOrder((o) => { const x = [...o]; const j = i + dir; if (j < 0 || j >= x.length) return o; [x[i], x[j]] = [x[j], x[i]]; return x })
  const saveOrder = async () => {
    const turns = {}
    let turn = 0, half = false
    for (const m of order) {
      if (n(m.share) < 1) { if (!half) { turn++; half = true } else half = false } else { turn++; half = false }
      turns[m.id] = turn
    }
    await run('members/order', { turns }, t('saved'))
    setOrder(null)
  }

  const canShuffle = canEdit && (k.type === 'qurandazi' && drawMode !== 'every_round' || k.type === 'half')
  const canDraw = canEdit && k.type === 'qurandazi' && drawMode === 'every_round' && nextUndrawn
  const canOrder = canEdit && (k.type === 'fixed' || k.type === 'half')

  return (
    <div className="space-y-4">
      {canEdit && (canShuffle || canDraw || canOrder) && !order && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-start">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-baari text-white shadow-glow"><Dices className={cx('h-8 w-8', anim && 'animate-spin')} /></div>
            <div className="flex-1">
              <div className="text-lg font-extrabold">{k.type === 'fixed' ? t('type_fixed') : t('type_qurandazi')}</div>
              <div className="text-sm text-ink/60">{k.type === 'fixed' ? t('type_fixed_desc') : t('type_qurandazi_desc')}</div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {canShuffle && <Button size="lg" icon={Dices} loading={!!anim} onClick={shuffle}>{c.withoutTurn.length === d.members.length ? t('shuffle') : t('shuffleAgain')}</Button>}
              {canDraw && <Button size="lg" icon={Dices} loading={!!anim} onClick={drawRound}>{t('drawThisRound', { r: nextUndrawn })}</Button>}
              {canOrder && <Button size="lg" variant="outline" icon={ListOrdered} onClick={startOrder}>{t('reorderTurns')}</Button>}
            </div>
          </div>
          {anyGiven && canShuffle && <div className="bg-violet-50 px-6 py-2 text-xs font-semibold text-violet-700">{t('lockedTurns')}: {d.payouts.filter((p) => n(p.given)).map((p) => `${t('round')} ${p.round_no}`).join(', ')}</div>}
        </Card>
      )}

      {anim && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 backdrop-blur-md">
          <div className="text-center text-white">
            <div className="num text-gradient text-[8rem] font-bold leading-none">{anim.num}</div>
            <div className="mt-4 text-3xl font-extrabold">{anim.name}</div>
            <div className="mt-2 text-white/60">{t('shuffling')}</div>
          </div>
        </div>
      )}

      <Modal open={!!winner} onClose={() => setWinner(null)} title={t('winnerIs')}>
        {winner && (
          <div className="text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Trophy className="h-10 w-10" /></div>
            <div className="mt-4 text-3xl font-extrabold">{winner.names.join(' + ')}</div>
            <div className="mt-1 text-ink/60">{t('round')} {winner.round} · {fmtDate(roundDate(k, winner.round), lang)}</div>
            <Button className="mt-6 w-full" onClick={() => setWinner(null)}>{t('close')}</Button>
          </div>
        )}
      </Modal>

      {order ? (
        <Card className="p-4">
          <div className="space-y-2">
            {order.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-lilac p-2.5">
                <Avatar name={m.name} id={m.id} size="sm" />
                <div className="flex-1 font-bold">{m.name}{n(m.share) < 1 && <Badge tone="cyan" className="ms-2">½</Badge>}</div>
                <button onClick={() => move(i, -1)} className="grid h-10 w-10 place-items-center rounded-xl bg-white" aria-label={t('moveUp')}><ArrowUp className="h-5 w-5" /></button>
                <button onClick={() => move(i, 1)} className="grid h-10 w-10 place-items-center rounded-xl bg-white" aria-label={t('moveDown')}><ArrowDown className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setOrder(null)}>{t('cancel')}</Button>
            <Button icon={Save} onClick={saveOrder}>{t('saveOrder')}</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {Array.from({ length: c.slots }, (_, i) => i + 1).map((r) => {
            const rec = c.receiversOf(r)
            const p = c.payoutMap[r]
            const isMe = me && rec.some((m) => m.id === me.id)
            const isCur = r === c.cur
            return (
              <div key={r} className={cx('card flex items-center gap-4 p-4', isCur && 'ring-2 ring-fuchsia-300', isMe && 'bg-gradient-to-r from-violet-50 to-pink-50')}>
                <div className={cx('num grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-bold', n(p?.given) ? 'bg-trust text-white' : isCur ? 'bg-baari text-white' : 'bg-violet-100 text-violet-700')}>{r}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink/50"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(roundDate(k, r), lang)}{isCur && <Badge tone="pink">{t('currentRound')}</Badge>}</div>
                  <div className="truncate text-lg font-extrabold">{rec.length ? rec.map((m) => m.name).join(' + ') : <span className="text-ink/30">{t('noTurn')}</span>}</div>
                  {k.type === 'boli' && n(p?.bid_amount) > 0 && <div className="text-xs font-semibold text-amber-600">{t('bidAmount')}: {money(p.bid_amount)}</div>}
                  {k.type === 'zaroorat' && p?.note && <div className="truncate text-xs font-semibold text-pink-600">{t('reason')}: {p.note}</div>}
                </div>
                <div className="text-end">
                  <div className="num font-bold">{money(c.payoutFor(r))}</div>
                  {n(p?.given) ? <Badge tone="green"><Check className="h-3 w-3" />{t('given')}</Badge> : <Badge tone="gray">{t('notGiven')}</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- payments
function PaymentsTab({ d, c, canEdit, run }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const [r, setR] = useState(c.cur)
  const [busy, setBusy] = useState(null)
  const paidCount = c.roundPaidCount(r)
  const expected = d.members.reduce((s, m) => s + c.dueFor(m, r), 0)
  const allPaid = paidCount === d.members.length && d.members.length > 0

  const toggle = async (m) => {
    if (!canEdit) return
    setBusy(m.id)
    try { await run('payments/toggle', { member_id: m.id, round_no: r, paid: !c.isPaid(m.id, r), amount: c.dueFor(m, r) }) } finally { setBusy(null) }
  }
  const markAll = async () => {
    setBusy('all')
    const amounts = Object.fromEntries(d.members.map((m) => [m.id, c.dueFor(m, r)]))
    try { await run('payments/round', { round_no: r, paid: !allPaid, amounts }, t('saved')) } finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {Array.from({ length: c.slots }, (_, i) => i + 1).map((x) => {
          const full = c.roundPaidCount(x) === d.members.length && d.members.length > 0
          return (
            <button key={x} onClick={() => setR(x)} className={cx('num flex h-12 min-w-[3rem] shrink-0 flex-col items-center justify-center rounded-2xl px-2 text-sm font-bold transition', x === r ? 'bg-ink text-white' : full ? 'bg-emerald-100 text-emerald-700' : x <= c.cur ? 'bg-white text-ink' : 'bg-white/60 text-ink/40')}>
              {x}{x === c.cur && <span className="h-1 w-1 rounded-full bg-fuchsia-500" />}
            </button>
          )
        })}
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-ink/50">{t('round')} {r} · {fmtDate(roundDate(k, r), lang)}</div>
            <div className="num text-2xl font-bold">{money(c.roundCollected(r))} <span className="text-base text-ink/40">/ {money(expected)}</span></div>
          </div>
          {canEdit && <Button variant={allPaid ? 'outline' : 'trust'} icon={allPaid ? X : Check} loading={busy === 'all'} onClick={markAll}>{allPaid ? t('unpaid') : t('markAllPaid')}</Button>}
        </div>
        <div className="mt-4"><Progress value={(paidCount / Math.max(1, d.members.length)) * 100} tone="trust" /></div>
        <div className="mt-1.5 text-sm font-semibold text-ink/50">{t('paidCount', { p: paidCount, t: d.members.length })}</div>
        {k.type === 'boli' && c.dividend(r) > 0 && <div className="mt-2 text-sm font-bold text-amber-600">{t('dividend')}: {money(c.dividend(r))}</div>}
      </Card>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {d.members.map((m) => {
          const paid = c.isPaid(m.id, r)
          return (
            <div key={m.id} className={cx('card flex items-center gap-3 p-3 transition', paid && 'bg-emerald-50/60')}>
              <Avatar name={m.name} id={m.id} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">{m.name}</div>
                <div className="num text-sm text-ink/50">{money(c.dueFor(m, r))}{n(m.share) < 1 && ' · ½'}</div>
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

      {/* Full grid */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-violet-50 px-5 py-3 font-extrabold">{t('history')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-lilac">
              <th className="sticky start-0 z-10 bg-lilac px-4 py-2 text-start">{t('name')}</th>
              {Array.from({ length: c.slots }, (_, i) => <th key={i} className="num px-2 py-2 text-center">{i + 1}</th>)}
            </tr></thead>
            <tbody>
              {d.members.map((m) => (
                <tr key={m.id} className="border-t border-violet-50">
                  <td className="sticky start-0 z-10 max-w-[140px] truncate bg-white px-4 py-2 font-bold">{m.name}</td>
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

// ---------------------------------------------------------------- payouts
function PayoutsTab({ d, c, canEdit, run }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const [edit, setEdit] = useState(null)
  const choose = k.type === 'boli' || k.type === 'zaroorat'

  const open = (r) => {
    const p = c.payoutMap[r]
    const rec = c.receiversOf(r)
    setEdit({ round_no: r, member_id: p?.member_id ?? rec[0]?.id ?? '', bid_amount: n(p?.bid_amount) || '', amount: n(p?.amount) || '', given: n(p?.given) === 1 || !p, note: p?.note || '' })
  }
  const save = async () => {
    const bid = n(edit.bid_amount)
    const amount = n(edit.amount) || (c.pot - c.fee - bid)
    await run('payouts/save', { ...edit, amount, bid_amount: bid }, t('saved'))
    setEdit(null)
  }
  const eligible = d.members.filter((m) => !m.turn_no || n(m.turn_no) === edit?.round_no)
  const maxBid = Math.round((c.pot * n(c.cfg.max_bid_percent || 100)) / 100)

  return (
    <div className="space-y-2.5">
      {Array.from({ length: c.slots }, (_, i) => i + 1).map((r) => {
        const p = c.payoutMap[r]
        const rec = c.receiversOf(r)
        return (
          <div key={r} className="card flex flex-wrap items-center gap-4 p-4">
            <div className={cx('num grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold', n(p?.given) ? 'bg-trust text-white' : 'bg-violet-100 text-violet-700')}>{r}</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink/50">{fmtDate(roundDate(k, r), lang)}</div>
              <div className="truncate font-extrabold">{rec.length ? rec.map((m) => m.name).join(' + ') : <span className="text-ink/30">{t('noTurn')}</span>}</div>
              {n(p?.bid_amount) > 0 && <div className="text-xs font-bold text-amber-600">{t('bidAmount')}: {money(p.bid_amount)}</div>}
            </div>
            <div className="num text-end font-bold">{money(c.payoutFor(r))}{n(p?.given) ? <div><Badge tone="green"><Check className="h-3 w-3" />{t('given')}</Badge></div> : null}</div>
            {canEdit && (
              <Button size="sm" variant={n(p?.given) ? 'outline' : 'grad'} icon={choose && !rec.length ? (k.type === 'boli' ? Gavel : Crown) : HandCoins} onClick={() => open(r)}
                disabled={!choose && !rec.length}>
                {choose && !rec.length ? (k.type === 'boli' ? t('recordBid') : t('chooseReceiver')) : n(p?.given) ? t('edit') : t('markGiven')}
              </Button>
            )}
          </div>
        )
      })}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={`${t('round')} ${edit?.round_no || ''}`}>
        {edit && (
          <div className="space-y-4">
            {choose ? (
              <Field label={t('chooseReceiver')}>
                <select className="input" value={edit.member_id} onChange={(e) => setEdit({ ...edit, member_id: e.target.value })}>
                  <option value="">—</option>
                  {eligible.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
            ) : (
              <div className="rounded-2xl bg-lilac p-4 font-extrabold">{c.receiversOf(edit.round_no).map((m) => m.name).join(' + ')}</div>
            )}
            {k.type === 'boli' && (
              <Field label={t('bidAmount')} hint={`${t('minBid')}: ${money(c.cfg.min_bid)} · max ${money(maxBid)}`}>
                <Input inputMode="numeric" dir="ltr" value={edit.bid_amount} onChange={(e) => setEdit({ ...edit, bid_amount: e.target.value.replace(/\D/g, ''), amount: '' })} />
              </Field>
            )}
            {k.type === 'zaroorat' && (
              <Field label={t('reason')}><Input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
            )}
            <Field label={t('payoutAmount')}>
              <Input inputMode="numeric" dir="ltr" placeholder={String(c.pot - c.fee - n(edit.bid_amount))} value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Toggle checked={edit.given} onChange={(v) => setEdit({ ...edit, given: v })} label={t('markGiven')} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              {c.payoutMap[edit.round_no] ? <Button variant="outline" onClick={async () => { await run('payouts/delete', { round_no: edit.round_no }); setEdit(null) }}>{t('delete')}</Button> : <Button variant="outline" onClick={() => setEdit(null)}>{t('cancel')}</Button>}
              <Button icon={Save} onClick={save} disabled={choose && !edit.member_id}>{t('save')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ---------------------------------------------------------------- members
function MembersTab({ d, c, canEdit, run, me }) {
  const { t, err } = useLang()
  const toast = useToast()
  const k = d.kameti
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const [cred, setCred] = useState(null)

  const save = async () => {
    await run('members/save', edit, t('saved'))
    setEdit(null)
  }
  const giveLogin = async (m) => {
    if (!m.email && !m.phone) { toast(t('needEmailPhone'), 'err'); return }
    try { const r = await run('members/login', { id: m.id }); setCred({ ...r, name: m.name }) } catch { /* toast shown */ }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={cx('chip', c.sharesOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{c.sharesOk ? t('sharesMatch') : t('sharesMismatch', { have: c.shares, need: c.slots })}</div>
          <Button icon={UserPlus} onClick={() => setEdit({ name: '', phone: '', email: '', share: 1, turn_no: '' })}>{t('addMember')}</Button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {d.members.map((m) => (
          <Card key={m.id} className={cx('p-4', me?.id === m.id && 'ring-2 ring-fuchsia-300')}>
            <div className="flex items-center gap-3">
              <Avatar name={m.name} id={m.id} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-extrabold">{m.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={m.turn_no ? 'violet' : 'gray'}>{t('turnNo')} {m.turn_no || '—'}</Badge>
                  {n(m.share) < 1 && <Badge tone="cyan">{t('halfShare')}</Badge>}
                  {m.user_id && <Badge tone="green"><KeyRound className="h-3 w-3" />{t('login')}</Badge>}
                </div>
              </div>
            </div>
            {canEdit && (
              <>
                {(m.phone || m.email) && <div className="mt-3 space-y-0.5 text-sm text-ink/60" dir="ltr">{m.phone && <div>{m.phone}</div>}{m.email && <div className="truncate">{m.email}</div>}</div>}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <button onClick={() => setEdit({ ...m, share: n(m.share), turn_no: m.turn_no ?? '' })} className="grid h-11 place-items-center rounded-xl bg-violet-50 text-violet-700" aria-label={t('edit')}><Pencil className="h-5 w-5" /></button>
                  {m.phone ? (
                    <a href={waLink(m.phone, t('reminderText', { name: m.name, title: k.title, r: c.cur, amount: money(c.dueFor(m, c.cur)) }))} target="_blank" rel="noreferrer" className="grid h-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600" aria-label="WhatsApp"><MessageCircle className="h-5 w-5" /></a>
                  ) : <span className="grid h-11 place-items-center rounded-xl bg-gray-50 text-gray-300"><MessageCircle className="h-5 w-5" /></span>}
                  <button onClick={() => giveLogin(m)} className="grid h-11 place-items-center rounded-xl bg-amber-50 text-amber-600" aria-label={t('giveLogin')}><KeyRound className="h-5 w-5" /></button>
                  <button onClick={() => setDel(m)} className="grid h-11 place-items-center rounded-xl bg-red-50 text-red-500" aria-label={t('delete')}><Trash2 className="h-5 w-5" /></button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t('edit') : t('addMember')}>
        {edit && (
          <div className="space-y-4">
            <Field label={t('name')}><Input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={`${t('phone')} (${t('optional')})`}><Input dir="ltr" inputMode="tel" value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label={`${t('email')} (${t('optional')})`}><Input dir="ltr" type="email" value={edit.email || ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            {k.type === 'half' && <Field label={t('share')}><Segmented value={edit.share} onChange={(v) => setEdit({ ...edit, share: v })} options={[{ value: 1, label: t('fullShare') }, { value: 0.5, label: t('halfShare') }]} /></Field>}
            <Field label={t('turnNo')}>
              <select className="input" value={edit.turn_no ?? ''} onChange={(e) => setEdit({ ...edit, turn_no: e.target.value })}>
                <option value="">{t('noTurn')}</option>
                {Array.from({ length: c.slots }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select>
            </Field>
            <Button className="w-full" icon={Save} disabled={!edit.name.trim()} onClick={save}>{t('save')}</Button>
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
              <Button variant="dark" className="w-full" icon={Copy} onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}\n${cred.login}\n${cred.password}`); toast(t('saved')) }}>Copy</Button>
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

// ---------------------------------------------------------------- info
function InfoTab({ d, c }) {
  const { t, lang } = useLang()
  const k = d.kameti
  const cfg = c.cfg
  const rows = [
    [t('type'), t(`type_${k.type}`)],
    [t('amountPerRound'), money(k.amount)],
    [t('frequency'), t(k.frequency)],
    [t('rounds'), k.slots],
    [t('startDate'), fmtDate(k.start_date, lang)],
    [t('endDate'), fmtDate(c.endDate, lang)],
    ...(k.frequency === 'monthly' ? [[t('dueDay'), cfg.due_day]] : []),
    [t('graceDays'), cfg.grace_days],
    [t('lateFee'), money(cfg.late_fee)],
    [t('organizerFee'), `${n(cfg.organizer_fee)}%`],
    ...(k.type === 'fixed' ? [[t('orderBasis'), t(`order_${cfg.order_basis}`)]] : []),
    ...(k.type === 'qurandazi' ? [[t('drawMode'), t(`draw_${cfg.draw_mode}`)], [t('drawInFront'), cfg.draw_in_front ? t('yes') : t('no')]] : []),
    ...(k.type === 'boli' ? [[t('minBid'), money(cfg.min_bid)], [t('maxBidPercent'), `${cfg.max_bid_percent}%`], [t('bidStep'), money(cfg.bid_step)], [t('profitSharing'), t(`share_${cfg.profit_sharing}`)], [t('lastNoBid'), cfg.last_no_bid ? t('yes') : t('no')]] : []),
    ...(k.type === 'half' ? [[t('pairing'), t(`pairing_${cfg.pairing}`)]] : []),
    ...(k.type === 'zaroorat' ? [[t('requireReason'), cfg.require_reason ? t('yes') : t('no')], [t('emergencyPriority'), cfg.emergency_priority ? t('yes') : t('no')]] : []),
    [t('organizer'), `${k.organizer?.name || ''}${k.organizer?.phone ? ' · ' + k.organizer.phone : ''}`],
  ]
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="divide-y divide-violet-50 p-0">
        {rows.map(([a, b]) => <div key={a} className="flex items-center justify-between gap-4 px-5 py-3.5"><span className="text-ink/60">{a}</span><span className="num text-end font-bold">{b}</span></div>)}
      </Card>
      {(cfg.rules || k.notes) && (
        <Card className="h-fit p-5">
          <h3 className="mb-2 font-extrabold">{t('rulesNotes')}</h3>
          <p className="whitespace-pre-wrap text-ink/70">{cfg.rules || k.notes}</p>
        </Card>
      )}
    </div>
  )
}
