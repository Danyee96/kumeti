import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { initials, avatarGrad } from '../lib/kameti'
import { useLang } from '../lib/i18n'

const cx = (...a) => a.filter(Boolean).join(' ')
export { cx }

const VARIANTS = {
  grad: 'bg-baari text-white shadow-glow hover:brightness-110',
  trust: 'bg-trust text-white shadow-[0_15px_40px_-15px_rgba(16,185,129,.7)] hover:brightness-110',
  dark: 'bg-ink text-white hover:bg-ink-3',
  outline: 'border-2 border-violet-200 bg-white text-ink hover:border-fuchsia-300 hover:bg-violet-50',
  ghost: 'text-ink/70 hover:bg-violet-100/70 hover:text-ink',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  soft: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
  white: 'bg-white text-ink hover:bg-lilac',
}
const SIZES = { sm: 'h-9 px-3 text-sm rounded-xl gap-1.5', md: 'h-11 px-5 text-[15px] rounded-2xl gap-2', lg: 'h-14 px-7 text-base rounded-2xl gap-2.5', icon: 'h-10 w-10 rounded-xl' }

export function Button({ variant = 'grad', size = 'md', loading, icon: Icon, className, children, ...p }) {
  return (
    <button
      {...p}
      disabled={loading || p.disabled}
      className={cx('inline-flex items-center justify-center font-bold transition active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none select-none', VARIANTS[variant], SIZES[size], className)}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : Icon ? <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} /> : null}
      {children}
    </button>
  )
}

export function Card({ className, children, ...p }) {
  return <div {...p} className={cx('card', className)}>{children}</div>
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  )
}

export const Input = (p) => <input {...p} className={cx('input', p.className)} />
export const Textarea = (p) => <textarea {...p} className={cx('input min-h-[96px]', p.className)} />
export const Select = ({ options, ...p }) => (
  <select {...p} className={cx('input appearance-none', p.className)}>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-start">
      <span className="text-sm font-semibold">{label}</span>
      <span className={cx('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-baari' : 'bg-violet-200')}>
        <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'start-6' : 'start-1')} />
      </span>
    </button>
  )
}

export function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cx('grid gap-2', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx('rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition', value === o.value ? 'border-transparent bg-baari text-white shadow-glow' : 'border-violet-100 bg-white text-ink/70 hover:border-violet-200')}
        >
          {o.icon && <o.icon className="mx-auto mb-1 h-5 w-5" />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Badge({ tone = 'violet', children, className }) {
  const tones = {
    violet: 'bg-violet-100 text-violet-700', green: 'bg-emerald-100 text-emerald-700', red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-700', cyan: 'bg-cyan-100 text-cyan-700', pink: 'bg-pink-100 text-pink-700', gray: 'bg-gray-100 text-gray-600',
  }
  return <span className={cx('chip', tones[tone], className)}>{children}</span>
}

export function Avatar({ name, id, size = 'md', className }) {
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-lg' }[size]
  return <div className={cx('grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br font-num font-bold text-white', avatarGrad(id), s, className)}>{initials(name)}</div>
}

export function Spinner({ className }) {
  return <div className={cx('grid place-items-center py-20', className)}><Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" /></div>
}

export function Empty({ icon: Icon, title, sub, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-baari text-white shadow-glow"><Icon className="h-8 w-8" /></div>}
      <h3 className="text-lg font-extrabold">{title}</h3>
      {sub && <p className="mt-1 max-w-sm text-ink/60">{sub}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Stat({ icon: Icon, label, value, tone = 'baari', sub }) {
  const bg = { baari: 'bg-baari', trust: 'bg-trust', dark: 'bg-ink', gold: 'bg-gradient-to-br from-amber-400 to-orange-500' }[tone]
  return (
    <div className="card flex items-center gap-3 p-3.5 sm:gap-4 sm:p-5">
      {Icon && <div className={cx('grid h-10 w-10 shrink-0 sm:h-12 sm:w-12 place-items-center rounded-2xl text-white', bg)}><Icon className="h-6 w-6" /></div>}
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</div>
        <div className="num break-words text-lg font-bold leading-tight sm:text-2xl" dir="auto">{value}</div>
        {sub && <div className="truncate text-xs text-ink/50">{sub}</div>}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl animate-pop sm:rounded-[2rem] sm:p-7', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-xl font-extrabold">{title}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 hover:bg-violet-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Confirm({ open, onClose, onConfirm, title, text, loading }) {
  const { t } = useLang()
  return (
    <Modal open={open} onClose={onClose} title={title || t('areYouSure')}>
      <p className="text-ink/70">{text || t('cannotUndo')}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{t('confirm')}</Button>
      </div>
    </Modal>
  )
}

// ---------- toasts ----------
const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((msg, tone = 'ok') => {
    const id = Math.random()
    setItems((x) => [...x, { id, msg, tone }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {items.map((i) => (
          <div key={i.id} className={cx('pointer-events-auto flex items-center gap-2 rounded-2xl px-5 py-3 font-bold text-white shadow-2xl animate-pop', i.tone === 'ok' ? 'bg-ink' : 'bg-red-500')}>
            {i.tone === 'ok' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5" />}
            {i.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

export function PageHeader({ title, sub, action, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-ink/60">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Progress({ value, tone = 'baari' }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-violet-100">
      <div className={cx('h-full rounded-full transition-all duration-700', tone === 'trust' ? 'bg-trust' : 'bg-baari')} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}
