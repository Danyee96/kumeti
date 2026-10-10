import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Wallet, Users, TrendingUp, Clock, Layers, Sparkles } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useLang } from '../../lib/i18n'
import { money, n, currentRound, lakh } from '../../lib/kameti'
import { Stat, Spinner, Empty, Button } from '../../components/ui'
import KametiCard from '../../components/KametiCard'
import { LogoMark } from '../../components/Logo'

export default function OrgDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLang()
  const [list, setList] = useState(null)
  useEffect(() => { api('kametis').then((d) => setList(d.kametis)).catch(() => setList([])) }, [])
  if (!list) return <Spinner />

  const active = list.filter((k) => k.status === 'active')
  const members = list.reduce((s, k) => s + n(k.member_count), 0)
  const collected = list.reduce((s, k) => s + n(k.collected), 0)
  const expected = active.reduce((s, k) => s + n(k.amount) * n(k.member_count) * Math.min(currentRound(k), n(k.slots)), 0)
  const volume = list.reduce((s, k) => s + n(k.amount) * n(k.slots), 0)

  return (
    <div className="space-y-6">
      <div className="mesh relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <LogoMark size={180} spin className="pointer-events-none absolute -bottom-10 -end-10 opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/70"><Sparkles className="h-4 w-4 text-amber-300" />{t('hello')}</div>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{user.name}</h1>
          <div className="mt-4 text-white/70">{t('totalVolume')}</div>
          <div className="num text-4xl font-bold">{money(volume)}</div>
          <div className="text-sm text-white/60">{lakh(volume, lang)}</div>
          <Link to="/org/new"><Button size="lg" variant="white" icon={PlusCircle} className="mt-6">{t('newKameti')}</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Layers} label={t('activeKametis')} value={active.length} />
        <Stat icon={Users} label={t('members')} value={members} tone="dark" />
        <Stat icon={TrendingUp} label={t('collected')} value={money(collected)} tone="trust" />
        <Stat icon={Clock} label={t('pending')} value={money(Math.max(0, expected - collected))} tone="gold" />
      </div>

      {list.length === 0 ? (
        <Empty icon={Wallet} title={t('emptyKametis')} sub={t('emptyKametisSub')} action={<Link to="/org/new"><Button icon={PlusCircle}>{t('newKameti')}</Button></Link>} />
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">{t('myKametis')}</h2>
            <Link to="/org/kametis" className="text-sm font-bold text-fuchsia-600">{t('all')}</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.slice(0, 6).map((k) => <KametiCard key={k.id} k={k} />)}</div>
        </div>
      )}
    </div>
  )
}
