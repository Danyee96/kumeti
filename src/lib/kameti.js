// Kameti domain logic shared by every screen.
import { ListOrdered, Dices, Gavel, HeartHandshake } from 'lucide-react'

export const TYPES = {
  fixed: { icon: ListOrdered, grad: 'from-violet-400 to-violet-600' },
  qurandazi: { icon: Dices, grad: 'from-indigo-400 to-indigo-600' },
  boli: { icon: Gavel, grad: 'from-amber-400 to-amber-500' },
  zaroorat: { icon: HeartHandshake, grad: 'from-purple-400 to-purple-600' },
}
export const TYPE_KEYS = Object.keys(TYPES)

// Default extended-form values for each kameti type.
export const TYPE_DEFAULTS = {
  common: { due_day: 5, late_fee: 0, grace_days: 3, organizer_fee: 0, rules: '' },
  fixed: { order_basis: 'manual' },
  qurandazi: { draw_mode: 'all_at_once', draw_in_front: true },
  boli: { min_bid: 0, max_bid_percent: 30, bid_step: 500, profit_sharing: 'all_members', last_no_bid: true },
  zaroorat: { require_reason: true, emergency_priority: true },
}

export const FREQS = ['monthly', 'weekly', 'daily']

export const n = (v) => Number(v || 0)

export function money(v, cur = 'Rs') {
  const num = Math.round(n(v))
  return `${cur} ${num.toLocaleString('en-IN')}`
}

// "1.5 lakh", "2 crore" helper for people who think in lakh/crore.
export function lakh(v, lang = 'en') {
  const x = n(v)
  if (x >= 1e7) return `${+(x / 1e7).toFixed(2)} ${lang === 'ur' ? 'کروڑ' : 'crore'}`
  if (x >= 1e5) return `${+(x / 1e5).toFixed(2)} ${lang === 'ur' ? 'لاکھ' : 'lakh'}`
  if (x >= 1e3) return `${+(x / 1e3).toFixed(1)} ${lang === 'ur' ? 'ہزار' : 'thousand'}`
  return String(Math.round(x))
}

export function parseDate(s) {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function roundDate(k, r) {
  const d = parseDate(k.start_date)
  const i = r - 1
  if (k.frequency === 'daily') d.setDate(d.getDate() + i)
  else if (k.frequency === 'weekly') d.setDate(d.getDate() + i * 7)
  else d.setMonth(d.getMonth() + i)
  return d
}

export function fmtDate(d, lang = 'en', opts) {
  if (!d) return ''
  const date = d instanceof Date ? d : parseDate(d)
  return date.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' })
}

export function currentRound(k) {
  const today = new Date()
  today.setHours(23, 59, 59)
  let r = 1
  for (let i = 1; i <= n(k.slots); i++) if (roundDate(k, i) <= today) r = i
  return r
}

// Portion labels used everywhere (1, ½, ⅓ …)
export const PORTIONS = [1, 0.75, 2 / 3, 0.5, 1 / 3, 0.25]
export function frac(p) {
  const x = n(p)
  const map = [[1, '1'], [0.75, '¾'], [2 / 3, '⅔'], [0.5, '½'], [1 / 3, '⅓'], [0.25, '¼']]
  for (const [v, l] of map) if (Math.abs(x - v) < 0.01) return l
  return String(+x.toFixed(2))
}
// "2½" style total for a member holding several numbers
export function numbersLabel(total) {
  const whole = Math.floor(total + 0.001)
  const rest = total - whole
  if (rest < 0.01) return String(whole)
  return `${whole || ''}${frac(rest)}`
}

/**
 * slots = flat rows [{slot_no, member_id, portion}]
 * Several rows on one slot_no = split number. A member on several slot_no = several numbers.
 */
export function calc(k, members = [], payments = [], payouts = [], slots = []) {
  const cfg = { ...TYPE_DEFAULTS.common, ...(TYPE_DEFAULTS[k.type] || {}), ...(k.config || {}) }
  const total = n(k.slots)
  const amount = n(k.amount)
  const pot = amount * total
  const fee = Math.round((pot * n(cfg.organizer_fee)) / 100)
  const byId = Object.fromEntries(members.map((m) => [n(m.id), m]))
  const payoutMap = Object.fromEntries(payouts.map((p) => [n(p.round_no), p]))
  const paid = new Set(payments.map((p) => `${n(p.member_id)}:${n(p.round_no)}`))
  const cur = Math.min(currentRound(k), total || 1)

  const bySlot = {}
  for (const s of slots) (bySlot[n(s.slot_no)] ||= []).push({ ...s, member_id: n(s.member_id), portion: n(s.portion), member: byId[n(s.member_id)] })
  const shareOf = (mid) => slots.filter((s) => n(s.member_id) === n(mid)).reduce((a, s) => a + n(s.portion), 0)
  const numbersOf = (mid) => slots.filter((s) => n(s.member_id) === n(mid)).map((s) => ({ slot_no: n(s.slot_no), portion: n(s.portion) })).sort((a, b) => a.slot_no - b.slot_no)
  const slotSum = (r) => (bySlot[r] || []).reduce((a, h) => a + h.portion, 0)
  const isLocked = (r) => n(payoutMap[r]?.given) === 1
  const isDecided = (r) => !!payoutMap[r]

  const dividend = (r) => {
    const p = payoutMap[r]
    if (k.type !== 'boli' || !p || !n(p.bid_amount) || cfg.profit_sharing === 'organizer') return 0
    return n(p.bid_amount) / total
  }
  const dueFor = (m, r) => Math.max(0, Math.round((amount - dividend(r)) * shareOf(m.id)))
  const payoutFor = (r) => {
    const p = payoutMap[r]
    if (p && n(p.amount)) return n(p.amount)
    return pot - fee - n(p?.bid_amount)
  }
  const isPaid = (mid, r) => paid.has(`${n(mid)}:${r}`)
  const roundCollected = (r) => payments.filter((p) => n(p.round_no) === r).reduce((s, p) => s + n(p.amount), 0)
  const payers = members.filter((m) => shareOf(m.id) > 0)
  const roundPaidCount = (r) => payers.filter((m) => isPaid(m.id, r)).length
  const receiversOf = (r) => (bySlot[r] || []).filter((h) => h.member)
  const collected = payments.reduce((s, p) => s + n(p.amount), 0)
  const given = payouts.filter((p) => n(p.given)).length
  let expectedToDate = 0
  for (const m of payers) for (let r = 1; r <= cur; r++) expectedToDate += dueFor(m, r)
  const badSlots = Array.from({ length: total }, (_, i) => i + 1).filter((r) => Math.abs(slotSum(r) - 1) > 0.01)

  return {
    cfg, slots: total, amount, pot, fee, cur, collected, given, expectedToDate,
    pending: Math.max(0, expectedToDate - collected),
    endDate: roundDate(k, total), bySlot, payers,
    shareOf, numbersOf, slotSum, isLocked, isDecided, dividend, dueFor, payoutFor, isPaid,
    roundCollected, roundPaidCount, receiversOf, payoutMap, badSlots,
    progress: total ? Math.round((given / total) * 100) : 0,
    slotsOk: badSlots.length === 0,
  }
}

// Months between two "YYYY-MM" values, inclusive.
export function monthSpan(from, to) {
  if (!from || !to) return 0
  const [y1, m1] = from.split('-').map(Number)
  const [y2, m2] = to.split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1) + 1
}
export function addMonths(ym, k) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + k, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function monthName(d, lang = 'en') {
  const date = d instanceof Date ? d : parseDate(d)
  return date.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-GB', { month: 'long', year: 'numeric' })
}
export function roundLabel(k, r, lang) {
  return k.frequency === 'monthly' ? monthName(roundDate(k, r), lang) : fmtDate(roundDate(k, r), lang)
}

/**
 * Build slots from members with a "numbers" count (0.5 steps allowed).
 * Whole numbers get their own slot; leftover halves are paired into split slots.
 * Returns [{slot_no, holders: [{key, portion}]}]
 */
export function buildSlots(members) {
  const whole = []
  const parts = []
  members.forEach((m) => {
    const c = n(m.numbers)
    const w = Math.floor(c + 0.001)
    for (let i = 0; i < w; i++) whole.push([{ key: m.key, portion: 1 }])
    const rest = +(c - w).toFixed(4)
    if (rest > 0.001) parts.push({ key: m.key, portion: rest })
  })
  const groups = [...whole]
  let open = null
  for (const p of parts) {
    if (!open) { open = [p]; continue }
    const sum = open.reduce((a, x) => a + x.portion, 0)
    if (sum + p.portion <= 1.0001) open.push(p)
    else { groups.push(open); open = [p] }
    if (Math.abs(open.reduce((a, x) => a + x.portion, 0) - 1) < 0.01) { groups.push(open); open = null }
  }
  if (open) groups.push(open)
  return groups.map((holders, i) => ({ slot_no: i + 1, holders }))
}

export function shuffleArr(a) {
  const x = [...a]
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] }
  return x
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

const AVATAR = ['from-violet-400 to-violet-600', 'from-indigo-400 to-indigo-600', 'from-emerald-400 to-emerald-500', 'from-amber-400 to-amber-500', 'from-indigo-400 to-indigo-600', 'from-purple-400 to-purple-600', 'from-teal-400 to-teal-600']
export const avatarGrad = (id) => AVATAR[n(id) % AVATAR.length]

export function waLink(phone, text) {
  let p = String(phone || '').replace(/\D/g, '')
  if (p.startsWith('0')) p = '92' + p.slice(1)
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`
}
