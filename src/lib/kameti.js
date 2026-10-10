// Kameti domain logic shared by every screen.
import { ListOrdered, Dices, Gavel, Split, HeartHandshake } from 'lucide-react'

export const TYPES = {
  fixed: { icon: ListOrdered, grad: 'from-violet-500 to-fuchsia-500' },
  qurandazi: { icon: Dices, grad: 'from-pink-500 to-orange-400' },
  boli: { icon: Gavel, grad: 'from-amber-400 to-orange-500' },
  half: { icon: Split, grad: 'from-cyan-500 to-emerald-500' },
  zaroorat: { icon: HeartHandshake, grad: 'from-rose-500 to-pink-500' },
}
export const TYPE_KEYS = Object.keys(TYPES)

// Default extended-form values for each kameti type.
export const TYPE_DEFAULTS = {
  common: { due_day: 5, late_fee: 0, grace_days: 3, organizer_fee: 0, rules: '' },
  fixed: { order_basis: 'manual' },
  qurandazi: { draw_mode: 'all_at_once', draw_in_front: true },
  boli: { min_bid: 0, max_bid_percent: 30, bid_step: 500, profit_sharing: 'all_members', last_no_bid: true },
  half: { pairing: 'auto' },
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

export function calc(k, members = [], payments = [], payouts = []) {
  const cfg = { ...TYPE_DEFAULTS.common, ...(TYPE_DEFAULTS[k.type] || {}), ...(k.config || {}) }
  const slots = n(k.slots)
  const amount = n(k.amount)
  const pot = amount * slots
  const fee = Math.round((pot * n(cfg.organizer_fee)) / 100)
  const shares = members.reduce((s, m) => s + n(m.share || 1), 0)
  const payoutMap = Object.fromEntries(payouts.map((p) => [n(p.round_no), p]))
  const paid = new Set(payments.map((p) => `${p.member_id}:${p.round_no}`))
  const cur = Math.min(currentRound(k), slots || 1)

  const dividend = (r) => {
    const p = payoutMap[r]
    if (k.type !== 'boli' || !p || !n(p.bid_amount) || cfg.profit_sharing === 'organizer') return 0
    return n(p.bid_amount) / slots
  }
  const dueFor = (m, r) => Math.max(0, Math.round(amount * n(m.share || 1) - dividend(r) * n(m.share || 1)))
  const payoutFor = (r) => {
    const p = payoutMap[r]
    if (p && n(p.amount)) return n(p.amount)
    return pot - fee - n(p?.bid_amount)
  }
  const isPaid = (mid, r) => paid.has(`${mid}:${r}`)
  const roundCollected = (r) => payments.filter((p) => n(p.round_no) === r).reduce((s, p) => s + n(p.amount), 0)
  const roundPaidCount = (r) => members.filter((m) => isPaid(m.id, r)).length
  const receiversOf = (r) => members.filter((m) => n(m.turn_no) === r)
  const collected = payments.reduce((s, p) => s + n(p.amount), 0)
  const given = payouts.filter((p) => n(p.given)).length
  const expectedToDate = members.reduce((s, m) => {
    let t = 0
    for (let r = 1; r <= cur; r++) t += dueFor(m, r)
    return s + t
  }, 0)
  const pending = Math.max(0, expectedToDate - collected)
  const unpaidThisRound = members.filter((m) => !isPaid(m.id, cur))
  const withoutTurn = members.filter((m) => !m.turn_no)

  return {
    cfg, slots, amount, pot, fee, shares, cur, collected, given, pending, expectedToDate,
    endDate: roundDate(k, slots), unpaidThisRound, withoutTurn,
    dividend, dueFor, payoutFor, isPaid, roundCollected, roundPaidCount, receiversOf, payoutMap,
    progress: slots ? Math.round((given / slots) * 100) : 0,
    sharesOk: Math.abs(shares - slots) < 0.01,
  }
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

const AVATAR = ['from-violet-500 to-fuchsia-500', 'from-pink-500 to-orange-400', 'from-cyan-500 to-emerald-500', 'from-amber-400 to-orange-500', 'from-indigo-500 to-violet-500', 'from-rose-500 to-pink-500', 'from-emerald-500 to-teal-500']
export const avatarGrad = (id) => AVATAR[n(id) % AVATAR.length]

export function waLink(phone, text) {
  let p = String(phone || '').replace(/\D/g, '')
  if (p.startsWith('0')) p = '92' + p.slice(1)
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`
}
