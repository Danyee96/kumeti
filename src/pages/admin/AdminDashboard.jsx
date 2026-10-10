import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Layers, Activity, Landmark, Crown, Briefcase, User, Globe, ArrowRight } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/i18n'
import { TYPES, TYPE_KEYS, money, lakh, fmtDate } from '../../lib/kameti'
import { Card, Stat, Spinner, Avatar, Badge, Button, cx } from '../../components/ui'

export default function AdminDashboard() {
  const { t, lang } = useLang()
  const [s, setS] = useState(null)
  useEffect(() => { api('admin/stats').then(setS).catch(() => setS({ roles: {}, types: {}, recent_users: [] })) }, [])
  if (!s) return <Spinner />
  const totalUsers = Object.values(s.roles).reduce((a, b) => a + b, 0)
  const maxType = Math.max(1, ...Object.values(s.types))

  return (
    <div className="space-y-6">
      <div className="mesh relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/70"><Crown className="h-4 w-4 text-amber-300" />{t('superadmin')}</div>
            <div className="mt-3 text-white/70">{t('totalVolume')}</div>
            <div className="num text-4xl font-bold sm:text-5xl">{money(s.volume)}</div>
            <div className="num mt-1 text-xl font-bold text-white sm:text-2xl">{lakh(s.volume, lang)}</div>
          </div>
          <Link to="/admin/landing"><Button variant="white" icon={Globe}>{t('landingEditor')}</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label={t('totalUsers')} value={totalUsers} />
        <Stat icon={Layers} label={t('totalKametis')} value={s.kametis} tone="dark" />
        <Stat icon={Activity} label={t('activeKametis')} value={s.active} tone="trust" />
        <Stat icon={Landmark} label={t('collected')} value={money(s.collected)} tone="gold" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="mb-4 font-extrabold">{t('users')}</h2>
          {[['superadmin', Crown, 'from-amber-400 to-amber-500'], ['organizer', Briefcase, 'from-violet-400 to-violet-600'], ['member', User, 'from-emerald-400 to-emerald-500']].map(([r, Icon, g]) => (
            <div key={r} className="flex items-center gap-3 py-2">
              <div className={cx('grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white', g)}><Icon className="h-5 w-5" /></div>
              <div className="flex-1 font-bold">{t(r)}</div>
              <div className="num text-2xl font-bold">{s.roles[r] || 0}</div>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-extrabold">{t('byType')}</h2>
          <div className="space-y-3">
            {TYPE_KEYS.map((k) => {
              const T = TYPES[k]
              const v = s.types[k] || 0
              return (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-sm font-bold"><span className="flex items-center gap-2"><T.icon className="h-4 w-4" />{t(`type_${k}`)}</span><span className="num">{v}</span></div>
                  <div className="h-2.5 rounded-full bg-violet-50"><div className={cx('h-full rounded-full bg-gradient-to-r', T.grad)} style={{ width: `${(v / maxType) * 100}%` }} /></div>
                </div>
              )
            })}
          </div>
        </Card>
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-extrabold">{t('recentUsers')}</h2><Link to="/admin/users" className="text-violet-600"><ArrowRight className="h-5 w-5 flip-rtl" /></Link></div>
          <div className="space-y-2.5">
            {s.recent_users.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar name={u.name} id={u.id} size="sm" />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{u.name}</div><div className="text-xs text-fg/50">{fmtDate(u.created_at, lang)}</div></div>
                <Badge tone={u.role === 'superadmin' ? 'amber' : u.role === 'organizer' ? 'violet' : 'cyan'}>{t(u.role)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
