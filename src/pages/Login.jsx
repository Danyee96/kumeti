import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Crown, Briefcase, User, Mail, Lock, ArrowLeft } from 'lucide-react'
import Logo, { LogoMark } from '../components/Logo'
import LangSwitch from '../components/LangSwitch'
import ThemeSwitch from '../components/ThemeSwitch'
import { Button, cx } from '../components/ui'
import { useAuth, homeFor } from '../lib/auth'
import { useLang } from '../lib/i18n'

const DEMO = [
  ['superadmin', 'admin@kumeti.pk', 'admin123', Crown, 'from-amber-400 to-orange-500'],
  ['organizer', 'organizer@kumeti.pk', 'organizer123', Briefcase, 'from-violet-500 to-fuchsia-500'],
  ['member', 'member@kumeti.pk', 'member123', User, 'from-cyan-500 to-emerald-500'],
]

export function AuthLayout({ children }) {
  const { t } = useLang()
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="mesh relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" />
        <Link to="/" className="relative"><Logo light /></Link>
        <div className="relative">
          <LogoMark size={120} spin className="mb-10 drop-shadow-[0_20px_60px_rgba(236,72,153,.6)]" />
          <h2 className="text-5xl font-extrabold leading-tight">{t('appTagline')}</h2>
          <p className="mt-4 max-w-md text-lg text-white/70">{t('type_qurandazi_desc')}</p>
        </div>
        <div className="relative text-sm text-white/40">© {new Date().getFullYear()} Kumeti</div>
      </div>
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-fg/60 hover:text-fg"><ArrowLeft className="h-4 w-4 flip-rtl" /><span className="lg:hidden"><Logo size={28} /></span></Link>
          <div className="flex items-center gap-2"><ThemeSwitch /><LangSwitch /></div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </div>
  )
}

function IconInput({ icon: Icon, ...p }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-400" />
      <input {...p} className="input h-14 ps-12 text-base" />
    </div>
  )
}

export default function Login() {
  const { user, login } = useAuth()
  const { t, err } = useLang()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDemo, setShowDemo] = useState(true)
  useEffect(() => { api('public/landing').then((d) => setShowDemo(d.site?.show_demo !== false)).catch(() => {}) }, [])

  if (user) return <Navigate to={homeFor(user.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const u = await login(email.trim(), password)
      nav(homeFor(u.role))
    } catch (x) { setError(err(x.code)) } finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('welcomeBack')}</h1>
      <p className="mt-2 text-fg/60">{t('loginSub')}</p>

      {showDemo && <div className="mt-8">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-fg/50">{t('demoAccounts')}</div>
        <div className="grid grid-cols-3 gap-2.5">
          {DEMO.map(([role, e, p, Icon, grad]) => (
            <button key={role} type="button" onClick={() => { setEmail(e); setPassword(p); setPicked(role); setError('') }}
              className={cx('flex flex-col items-center gap-2 rounded-3xl border-2 bg-surface p-3 transition active:scale-95', picked === role ? 'border-fuchsia-400 shadow-glow' : 'border-violet-100 hover:border-violet-200')}>
              <span className={cx('grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white', grad)}><Icon className="h-6 w-6" /></span>
              <span className="text-xs font-bold sm:text-sm">{t(role)}</span>
            </button>
          ))}
        </div>
      </div>}

      <form onSubmit={submit} className="mt-8 space-y-4">
        <IconInput icon={Mail} placeholder={t('emailOrPhone')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" dir="ltr" />
        <IconInput icon={Lock} type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" dir="ltr" />
        {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
        <Button type="submit" size="lg" loading={loading} className="w-full">{t('login')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-fg/60">{t('noAccount')} <Link to="/register" className="font-bold text-fuchsia-600">{t('register')}</Link></p>
    </AuthLayout>
  )
}
