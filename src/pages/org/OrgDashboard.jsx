import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Wallet, Users, TrendingUp, Clock, Layers, Sparkles, Plus, ChevronRight } from 'lucide-react'
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
  const volume = list.reduce((s, k) => s + n(k.amount) * n(k.slots), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-fg/50"><Sparkles className="h-4 w-4 text-amber-500" />{t('hello')}, <span className="text-fg">{user.name}</span></div>

      {/* The one big action */}
      <Link to="/org/new" className="group relative block overflow-hidden rounded-[2rem] bg-baari p-6 text-white shadow-glow transition active:scale-[.98] sm:p-8">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <LogoMark size={170} spin className="pointer-events-none absolute -bottom-10 -end-10 opacity-30" />
        <div className="relative flex items-center gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.6rem] bg-white text-violet-600 shadow-xl"><Plus className="h-11 w-11" strokeWidth={3} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-extrabold sm:text-3xl">{t('newKametiBig')}</div>
            <div className="mt-1 text-white/85">{t('newKametiBigSub')}</div>
          </div>
          <ChevronRight className="hidden h-8 w-8 shrink-0 flip-rtl sm:block" />
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Layers} label={t('activeKametis')} value={active.length} />
        <Stat icon={Users} label={t('members')} value={members} tone="dark" />
        <Stat icon={TrendingUp} label={t('collected')} value={money(collected)} tone="trust" />
        <Stat icon={Clock} label={t('totalVolume')} value={money(volume)} tone="gold" sub={lakh(volume, lang)} />
      </div>

      {list.length === 0 ? (
        <Empty icon={Wallet} title={t('emptyKametis')} sub={t('emptyKametisSub')} action={null} />
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">{t('myKametis')}</h2>
            <Link to="/org/kametis" className="text-sm font-bold text-violet-600">{t('all')}</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.slice(0, 6).map((k) => <KametiCard key={k.id} k={k} />)}</div>
        </div>
      )}
    </div>
  )
}
