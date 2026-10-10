import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Check, X, ChevronRight, Wallet, Sparkles } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useLang } from '../../lib/i18n'
import { TYPES, money, n, currentRound, roundLabel, frac } from '../../lib/kameti'
import { Spinner, Empty, Badge, cx } from '../../components/ui'
import { LogoMark } from '../../components/Logo'

export default function MemberDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLang()
  const [list, setList] = useState(null)
  useEffect(() => { api('kametis').then((d) => setList(d.kametis)).catch(() => setList([])) }, [])
  if (!list) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="mesh relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8">
        <LogoMark size={160} spin className="pointer-events-none absolute -bottom-8 -end-8 opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/70"><Sparkles className="h-4 w-4 text-amber-300" />{t('hello')}</div>
          <h1 className="mt-1 text-3xl font-extrabold">{user.name}</h1>
          <p className="mt-2 text-white/70">{t('appTagline')}</p>
        </div>
      </div>

      {list.length === 0 ? <Empty icon={Wallet} title={t('memberEmpty')} sub={t('memberEmptySub')} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((k) => {
            const T = TYPES[k.type] || TYPES.fixed
            const cur = Math.min(currentRound(k), n(k.slots))
            const mine = (k.my_slots || []).map((x) => ({ slot_no: n(x.slot_no), portion: n(x.portion) }))
            const share = mine.reduce((a, x) => a + x.portion, 0)
            const nextNum = mine.find((x) => x.slot_no >= cur) || mine[mine.length - 1]
            const paid = (k.my_paid_rounds || []).includes(cur)
            return (
              <Link key={k.id} to={`/kameti/${k.id}`} className="card group overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-glow">
                <div className={cx('relative bg-gradient-to-br p-5 text-white', T.grad)}>
                  <T.icon className="absolute -end-4 -top-4 h-28 w-28 rotate-12 opacity-15" />
                  <div className="text-xs font-bold uppercase text-white/80">{t(`type_${k.type}`)}</div>
                  <h3 className="text-xl font-extrabold">{k.title}</h3>
                  <div className="mt-1 text-sm text-white/80">{t('organizedBy')}: {k.organizer_name}</div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-violet-50 rtl:divide-x-reverse">
                  <div className="p-4 text-center">
                    <Crown className="mx-auto h-6 w-6 text-amber-500" />
                    <div className="num mt-1 flex flex-wrap justify-center gap-1 text-2xl font-bold">{mine.length ? mine.map((x) => <span key={x.slot_no}>#{x.slot_no}{x.portion < 0.99 && <small className="text-sm">{frac(x.portion)}</small>}</span>) : '—'}</div>
                    <div className="text-xs font-semibold text-ink/50">{t('yourTurn')}</div>
                  </div>
                  <div className="p-4 text-center">
                    <Wallet className="mx-auto h-6 w-6 text-violet-500" />
                    <div className="num mt-1 text-lg font-bold">{money(n(k.amount) * share)}</div>
                    <div className="text-xs font-semibold text-ink/50">{t('youPay')}</div>
                  </div>
                  <div className={cx('p-4 text-center', paid ? 'bg-emerald-50' : 'bg-red-50')}>
                    <div className={cx('mx-auto grid h-9 w-9 place-items-center rounded-xl text-white', paid ? 'bg-emerald-500' : 'bg-red-500')}>{paid ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}</div>
                    <div className="mt-1 text-xs font-bold">{paid ? t('paid') : t('payNow')}</div>
                    <div className="num text-xs text-ink/50">{t('round')} {cur}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-violet-50 px-5 py-3 text-sm">
                  <span className="text-ink/60">{nextNum ? `#${nextNum.slot_no} · ${roundLabel(k, nextNum.slot_no, lang)}` : t('noTurn')}</span>
                  <Badge tone="violet">{t('view')}<ChevronRight className="h-3 w-3 flip-rtl" /></Badge>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
