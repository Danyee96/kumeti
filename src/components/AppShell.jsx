import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Layers, Globe, Settings, UserCircle, LogOut, PlusCircle, Wallet } from 'lucide-react'
import Logo from './Logo'
import LangSwitch from './LangSwitch'
import ThemeSwitch from './ThemeSwitch'
import { Avatar, cx } from './ui'
import { useAuth } from '../lib/auth'
import { useLang } from '../lib/i18n'

const NAV = {
  superadmin: [
    ['/admin', 'dashboard', LayoutDashboard, true], ['/admin/users', 'users', Users], ['/admin/kametis', 'allKametis', Layers],
    ['/admin/landing', 'landingPage', Globe], ['/admin/settings', 'settings', Settings], ['/profile', 'profile', UserCircle],
  ],
  organizer: [
    ['/org', 'dashboard', LayoutDashboard, true], ['/org/kametis', 'myKametis', Wallet], ['/org/new', 'newKameti', PlusCircle], ['/profile', 'profile', UserCircle],
  ],
  member: [
    ['/me', 'myKametis', Wallet, true], ['/profile', 'profile', UserCircle],
  ],
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const items = NAV[user.role] || []
  const doLogout = async () => { await logout(); nav('/login') }

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-ink p-5 text-white lg:flex">
        <div className="mesh pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative px-2 pb-8 pt-2"><Logo light /></div>
        <nav className="relative flex-1 space-y-1.5">
          {items.map(([to, key, Icon, end]) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cx('flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition', isActive ? 'bg-baari text-white shadow-glow' : 'text-white/65 hover:bg-white/10 hover:text-white')}>
              <Icon className="h-5 w-5" />{t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="relative glass rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} id={user.id} />
            <div className="min-w-0">
              <div className="truncate font-bold">{user.name}</div>
              <div className="text-xs text-white/60">{t(user.role)}</div>
            </div>
          </div>
          <button onClick={doLogout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-sm font-bold hover:bg-white/20">
            <LogOut className="h-4 w-4 flip-rtl" />{t('logout')}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-lilac/85 px-4 py-3 backdrop-blur-xl sm:px-8">
          <div className="lg:hidden"><Logo size={32} /></div>
          <div className="hidden text-sm font-semibold text-fg/50 lg:block">{t('hello')}, <span className="text-fg">{user.name.split(' ')[0]}</span></div>
          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <LangSwitch />
            <button onClick={doLogout} className="grid h-10 w-10 place-items-center rounded-xl border border-violet-100 bg-surface lg:hidden" aria-label={t('logout')}>
              <LogOut className="h-5 w-5 flip-rtl" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-8 lg:pb-12"><Outlet /></main>
      </div>

      {/* Bottom nav (mobile) — big icons, easy to tap */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-[1.75rem] bg-ink p-2 shadow-2xl lg:hidden">
        {items.map(([to, key, Icon, end]) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cx('flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[11px] font-bold transition', isActive ? 'bg-baari text-white' : 'text-white/60')}>
            <Icon className="h-6 w-6" /><span className="max-w-full truncate">{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
