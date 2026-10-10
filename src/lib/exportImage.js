// Draws shareable PNG cards (member card + full chart) on a canvas.
// Pure canvas — no external libraries, works offline and on every phone.
import { n, money, roundLabel, frac, numbersLabel } from './kameti'

const W = 1080
const PAD = 64
const C = { ink: '#0F0A1F', ink2: '#1A1330', violet: '#7C3AED', pink: '#EC4899', orange: '#F97316', white: '#FFFFFF', mute: 'rgba(255,255,255,.62)', faint: 'rgba(255,255,255,.08)', line: 'rgba(255,255,255,.12)', green: '#10B981', gold: '#FBBF24' }

async function loadFonts(lang) {
  const list = ['800 40px "Plus Jakarta Sans"', '600 40px "Plus Jakarta Sans"', '700 40px "Space Grotesk"']
  if (lang === 'ur') list.push('700 40px "Noto Nastaliq Urdu"', '400 40px "Noto Nastaliq Urdu"')
  try { await Promise.all(list.map((f) => document.fonts.load(f, 'Aa1اب'))) } catch { /* fallback fonts are fine */ }
}

function painter(ctx, lang) {
  const rtl = lang === 'ur'
  const X = (x) => (rtl ? W - x : x)
  const flip = (a) => (!rtl ? a : a === 'left' ? 'right' : a === 'right' ? 'left' : a)
  const face = (kind, weight) => {
    if (kind === 'num') return `${weight || 700} SIZEpx "Space Grotesk", "Plus Jakarta Sans", sans-serif`
    if (rtl) return `${weight >= 700 ? 700 : 400} SIZEpx "Noto Nastaliq Urdu", "Plus Jakarta Sans", serif`
    return `${weight || 600} SIZEpx "Plus Jakarta Sans", system-ui, sans-serif`
  }
  // text(str, x, y, {size, weight, color, align, kind:'sans'|'num', max, gradient})
  const text = (str, x, y, o = {}) => {
    const size = o.size || 32
    ctx.font = face(o.kind, o.weight).replace('SIZE', o.kind !== 'num' && rtl ? Math.round(size * 0.86) : size)
    ctx.direction = o.kind === 'num' || o.ltr ? 'ltr' : rtl ? 'rtl' : 'ltr'
    ctx.textAlign = o.raw ? o.align || 'left' : flip(o.align || 'left')
    ctx.textBaseline = 'alphabetic'
    let s = String(str ?? '')
    if (o.max) { while (s.length > 1 && ctx.measureText(s).width > o.max) s = s.slice(0, -2) + '…' }
    if (o.gradient) {
      const w = ctx.measureText(s).width
      const xx = o.raw ? x : X(x)
      const al = ctx.textAlign
      const left = al === 'right' || (al === 'start' && rtl) || (al === 'end' && !rtl) ? xx - w : al === 'center' ? xx - w / 2 : xx
      const g = ctx.createLinearGradient(left, 0, left + w, 0)
      g.addColorStop(0, '#C4B5FD'); g.addColorStop(0.5, C.pink); g.addColorStop(1, C.orange)
      ctx.fillStyle = g
    } else ctx.fillStyle = o.color || C.white
    ctx.fillText(s, o.raw ? x : X(x), y)
    return ctx.measureText(s).width
  }
  const rr = (x, y, w, h, r, fill, stroke) => {
    const xx = rtl ? W - x - w : x
    ctx.beginPath(); ctx.roundRect(xx, y, w, h, r)
    if (fill) { ctx.fillStyle = fill; ctx.fill() }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke() }
  }
  const grad = (x, y, w, h) => {
    const xx = rtl ? W - x - w : x
    const g = ctx.createLinearGradient(xx, y, xx + w, y + h)
    g.addColorStop(0, C.violet); g.addColorStop(0.55, C.pink); g.addColorStop(1, C.orange)
    return g
  }
  const circle = (cx, cy, r, fill) => { ctx.beginPath(); ctx.arc(X(cx), cy, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill() }
  return { X, text, rr, grad, circle, rtl }
}

function background(ctx, H) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H)
  const blob = (x, y, r, color) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(15,10,31,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H) }
  blob(120, 80, 700, 'rgba(124,58,237,.55)')
  blob(1000, 220, 600, 'rgba(236,72,153,.40)')
  blob(700, H, 700, 'rgba(249,115,22,.30)')
  ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1
  for (let x = 0; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
}

function logo(ctx, p, x, y, size = 64) {
  const s = size / 64
  const xx = p.rtl ? W - x - size : x
  ctx.save(); ctx.translate(xx, y); ctx.scale(s, s)
  ctx.beginPath(); ctx.roundRect(0, 0, 64, 64, 18); ctx.fillStyle = '#1F1640'; ctx.fill()
  const g = ctx.createLinearGradient(0, 0, 64, 64); g.addColorStop(0, C.violet); g.addColorStop(0.55, C.pink); g.addColorStop(1, C.orange)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath(); ctx.arc(32 + Math.cos(a) * 20, 32 + Math.sin(a) * 20, i === 5 ? 6.5 : 4.2, 0, Math.PI * 2)
    ctx.fillStyle = i === 5 ? g : 'rgba(255,255,255,.4)'; ctx.fill()
  }
  ctx.beginPath(); ctx.arc(32, 32, 7, 0, Math.PI * 2); ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.stroke()
  ctx.restore()
  // wordmark always LTR
  ctx.font = '800 44px "Plus Jakarta Sans", sans-serif'; ctx.direction = 'ltr'; ctx.textBaseline = 'alphabetic'
  ctx.textAlign = p.rtl ? 'right' : 'left'
  ctx.fillStyle = C.white
  const tx = p.rtl ? W - x - size - 18 : x + size + 18
  ctx.fillText('kumeti', tx - (p.rtl ? ctx.measureText('.').width : 0), y + size * 0.68)
  ctx.fillStyle = C.pink
  ctx.fillText('.', p.rtl ? tx : tx + ctx.measureText('kumeti').width, y + size * 0.68)
}

function header(ctx, p, k, t, y0) {
  logo(ctx, p, PAD, y0, 64)
  const typeLabel = t(`type_${k.type}`)
  ctx.font = '700 26px "Plus Jakarta Sans", "Noto Nastaliq Urdu", sans-serif'
  const w = Math.max(160, ctx.measureText(typeLabel).width + 48)
  p.rr(W - PAD - w, y0 + 8, w, 50, 25, 'rgba(255,255,255,.12)')
  p.text(typeLabel, W - PAD - w / 2, y0 + 42, { size: 26, weight: 700, align: 'center' })
  p.text(k.title, PAD, y0 + 160, { size: 64, weight: 800, max: W - PAD * 2 })
  if (k.organizer?.name) p.text(`${t('organizedBy')}: ${k.organizer.name}`, PAD, y0 + 212, { size: 28, color: C.mute, max: W - PAD * 2 })
  return y0 + 250
}

function infoGrid(ctx, p, items, y) {
  const gap = 20
  const w = (W - PAD * 2 - gap) / 2
  const h = 150
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = PAD + col * (w + gap), yy = y + row * (h + gap)
    p.rr(x, yy, w, h, 32, it.hot ? p.grad(x, yy, w, h) : C.faint, it.hot ? null : C.line)
    p.text(it.label, x + 32, yy + 54, { size: 26, color: it.hot ? 'rgba(255,255,255,.85)' : C.mute, max: w - 64 })
    p.text(it.value, x + 32, yy + 112, { size: it.big ? 44 : 40, weight: 800, kind: it.num ? 'num' : 'sans', max: w - 64 })
  })
  return y + Math.ceil(items.length / 2) * (h + gap)
}

function footer(ctx, p, t, y, url) {
  const h = 200
  p.rr(PAD, y, W - PAD * 2, h, 40, p.grad(PAD, y, W - PAD * 2, h))
  p.text(t('cardJoin'), PAD + 44, y + 78, { size: 38, weight: 800, max: W - PAD * 2 - 88 })
  p.text(url, PAD + 44, y + 140, { size: 34, weight: 700, kind: 'num', color: C.ink, max: W - PAD * 2 - 88 })
  p.text(t('appTagline'), W / 2, y + h + 70, { size: 26, color: C.mute, align: 'center', raw: true })
  return y + h + 110
}

function numberBall(ctx, p, x, cy, r, label, locked) {
  const g = ctx.createLinearGradient(p.X(x) - r, cy - r, p.X(x) + r, cy + r)
  if (locked) { g.addColorStop(0, '#06B6D4'); g.addColorStop(1, C.green) } else { g.addColorStop(0, C.violet); g.addColorStop(0.55, C.pink); g.addColorStop(1, C.orange) }
  p.circle(x, cy, r, g)
  ctx.font = `700 ${Math.round(r * 0.95)}px "Space Grotesk", sans-serif`
  ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.white
  ctx.fillText(String(label), p.X(x), cy + 2)
  ctx.textBaseline = 'alphabetic'
}

function toBlob(canvas, usedH) {
  let out = canvas
  if (usedH && usedH < canvas.height) {
    out = document.createElement('canvas')
    out.width = canvas.width; out.height = Math.ceil(usedH)
    out.getContext('2d').drawImage(canvas, 0, 0)
  }
  return new Promise((res) => out.toBlob((b) => res(b), 'image/png'))
}

export function siteInfo() {
  const url = `${window.location.origin}${window.location.pathname}`.replace(/index\.html$/, '')
  return { url, host: window.location.host + window.location.pathname.replace(/\/index\.html$|\/$/, '') }
}

/** Member card: their numbers, when each comes out and for how much. */
export async function memberCardImage({ k, c, member, t, lang }) {
  await loadFonts(lang)
  const nums = c.numbersOf(member.id)
  const per = t(`perF_${k.frequency}`)
  const rowH = 132
  const H = 250 + 40 + 260 + 2 * 170 + 120 + nums.length * rowH + 80 + 330 + 40
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const p = painter(ctx, lang)
  background(ctx, H)
  let y = header(ctx, p, k, t, PAD)

  // member block
  y += 20
  p.rr(PAD, y, W - PAD * 2, 230, 40, 'rgba(255,255,255,.06)', C.line)
  p.text(t('cardMember'), PAD + 40, y + 62, { size: 26, color: C.mute })
  p.text(member.name, PAD + 40, y + 140, { size: 68, weight: 800, gradient: true, max: W - PAD * 2 - 300 })
  p.text(`${numbersLabel(c.shareOf(member.id))} ${t('cardYourNumbers')}`, PAD + 40, y + 196, { size: 28, color: C.mute })
  // number balls on the far side
  const balls = nums.slice(0, 4)
  balls.forEach((b, i) => numberBall(ctx, p, W - PAD - 70 - (balls.length - 1 - i) * 92, y + 115, 42, b.slot_no, c.isLocked(b.slot_no)))
  y += 270

  const share = c.shareOf(member.id)
  y = infoGrid(ctx, p, [
    { label: t('cardStart'), value: roundLabel(k, 1, lang) },
    { label: t('cardEnd'), value: roundLabel(k, c.slots, lang) },
    { label: t('cardMonthly', { f: per }), value: money(c.amount * share), num: true, hot: true, big: true },
    { label: t('cardPot', { f: per }), value: money(c.pot), num: true },
  ], y)

  // rows
  y += 40
  p.text(t('cardWhen'), PAD, y + 40, { size: 34, weight: 800 })
  y += 80
  nums.forEach((b) => {
    const holders = c.receiversOf(b.slot_no)
    const others = holders.filter((h) => h.member_id !== n(member.id)).map((h) => h.member.name)
    const amount = Math.round(c.payoutFor(b.slot_no) * b.portion)
    p.rr(PAD, y, W - PAD * 2, rowH - 18, 30, C.faint, C.line)
    numberBall(ctx, p, PAD + 66, y + (rowH - 18) / 2, 40, b.slot_no, c.isLocked(b.slot_no))
    p.text(roundLabel(k, b.slot_no, lang), PAD + 134, y + 54, { size: 34, weight: 800, max: 470 })
    const sub = [b.portion < 0.99 ? `${frac(b.portion)} ${t('number')}` : '', others.length ? `${t('cardShared')} ${others.join(', ')}` : '', c.isLocked(b.slot_no) ? `✓ ${t('cardReceived')}` : ''].filter(Boolean).join(' · ')
    if (sub) p.text(sub, PAD + 134, y + 94, { size: 24, color: c.isLocked(b.slot_no) ? '#6EE7B7' : C.mute, max: 470 })
    p.text(money(amount), W - PAD - 40, y + 72, { size: 40, weight: 700, kind: 'num', align: 'right', gradient: true })
    y += rowH
  })

  y += 40
  return toBlob(canvas, footer(ctx, p, t, y, siteInfo().host))
}

/** Full chart of all numbers for the WhatsApp group. */
export async function chartImage({ k, c, t, lang }) {
  await loadFonts(lang)
  const per = t(`perF_${k.frequency}`)
  const rowH = 112
  const H = 250 + 40 + 2 * 170 + 130 + c.slots * rowH + 60 + 330 + 40
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const p = painter(ctx, lang)
  background(ctx, H)
  let y = header(ctx, p, k, t, PAD)
  y += 20
  y = infoGrid(ctx, p, [
    { label: t('cardStart'), value: roundLabel(k, 1, lang) },
    { label: t('cardEnd'), value: roundLabel(k, c.slots, lang) },
    { label: `${t('cardPerNumber')} / ${per}`, value: money(c.amount), num: true },
    { label: t('cardPot', { f: per }), value: money(c.pot), num: true, hot: true, big: true },
  ], y)
  y += 40
  p.text(t('cardChart'), PAD, y + 40, { size: 34, weight: 800 })
  y += 80
  for (let r = 1; r <= c.slots; r++) {
    const holders = c.receiversOf(r)
    const names = holders.map((h) => `${h.member.name}${h.portion < 0.99 ? ` ${frac(h.portion)}` : ''}`).join(' + ') || '—'
    p.rr(PAD, y, W - PAD * 2, rowH - 14, 28, r % 2 ? C.faint : 'rgba(255,255,255,.04)', C.line)
    numberBall(ctx, p, PAD + 56, y + (rowH - 14) / 2, 34, r, c.isLocked(r))
    p.text(names, PAD + 116, y + 46, { size: 30, weight: 800, max: 560 })
    p.text(roundLabel(k, r, lang), PAD + 116, y + 84, { size: 24, color: c.isLocked(r) ? '#6EE7B7' : C.mute, max: 560 })
    p.text(money(c.payoutFor(r)), W - PAD - 36, y + 64, { size: 32, weight: 700, kind: 'num', align: 'right' })
    y += rowH
  }
  y += 40
  return toBlob(canvas, footer(ctx, p, t, y, siteInfo().host))
}

/** Share through the phone's share sheet (WhatsApp shows up there); download as fallback. */
export async function shareOrDownload(blob, filename, text, downloadOnly = false) {
  const file = new File([blob], filename, { type: 'image/png' })
  try {
    if (!downloadOnly && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share(text ? { files: [file], text } : { files: [file] })
      return 'shared'
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled'
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  return 'downloaded'
}

export const safeName = (s) => String(s).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'kumeti'
