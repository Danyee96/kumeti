import { Link } from 'react-router-dom'
import { Users, CalendarDays, ChevronRight } from 'lucide-react'
import { TYPES, money, n, roundDate, fmtDate, currentRound } from '../lib/kameti'
import { useLang } from '../lib/i18n'
import { Badge, Progress, cx } from './ui'

export const statusTone = { active: 'green', completed: 'violet', paused: 'amber' }

export default function KametiCard({ k, extra }) {
  const { t, lang } = useLang()
  const T = TYPES[k.type] || TYPES.fixed
  const done = n(k.payouts_done)
  const cur = Math.min(currentRound(k), n(k.slots))
  return (
    <Link to={`/kameti/${k.id}`} className="card group block overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-glow">
      <div className={cx('relative bg-gradient-to-br p-5 text-white', T.grad)}>
        <T.icon className="absolute -end-4 -top-4 h-28 w-28 rotate-12 opacity-15" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">{t(`type_${k.type}`)}</div>
            <h3 className="mt-1 truncate text-lg font-extrabold">{k.title}</h3>
          </div>
          <Badge tone={statusTone[k.status] || 'gray'} className="shrink-0">{t(k.status)}</Badge>
        </div>
        <div className="num mt-4 text-3xl font-bold">{money(n(k.amount) * n(k.slots))}</div>
        <div className="num text-sm text-white/85">{money(k.amount)} × {k.slots} · {t(k.frequency)}</div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-ink/60"><Users className="h-4 w-4" /><span className="num">{n(k.member_count)}</span> {t('members')}</span>
          <span className="flex items-center gap-1.5 text-ink/60"><CalendarDays className="h-4 w-4" />{fmtDate(roundDate(k, n(k.slots)), lang, { month: 'short', year: 'numeric' })}</span>
        </div>
        <Progress value={(done / n(k.slots)) * 100} />
        <div className="flex items-center justify-between text-sm font-bold">
          <span>{t('roundOf', { r: cur, t: k.slots })}</span>
          <span className="flex items-center gap-1 text-fuchsia-600">{t('view')}<ChevronRight className="h-4 w-4 flip-rtl transition group-hover:translate-x-0.5" /></span>
        </div>
        {extra}
      </div>
    </Link>
  )
}
