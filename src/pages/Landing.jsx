import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Dices, ShieldCheck, BellRing, Languages, Smartphone, Wallet, Users, Gavel, Sparkles, BarChart3, Lock, HeartHandshake,
  Calculator, MessageCircle, ArrowRight, Check, ChevronDown, Menu, X, Star, Phone, Mail, MapPin, Quote, Crown,
} from 'lucide-react'
import Logo, { LogoMark } from '../components/Logo'
import LangSwitch from '../components/LangSwitch'
import { useLang } from '../lib/i18n'
import { useAuth, homeFor } from '../lib/auth'
import { api } from '../lib/api'
import { mergeLanding } from '../lib/landingDefaults'
import { TYPES, TYPE_KEYS, money, lakh } from '../lib/kameti'
import { cx } from '../components/ui'

export const ICONS = { Dices, ShieldCheck, BellRing, Languages, Smartphone, Wallet, Users, Gavel, Sparkles, BarChart3, Lock, HeartHandshake, Calculator, MessageCircle }

export default function Landing({ previewData }) {
  const { t, pick, lang } = useLang()
  const { user } = useAuth()
  const [data, setData] = useState(() => mergeLanding(previewData))
  const [site, setSite] = useState({ name: 'Kumeti', whatsapp: '' })
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    if (previewData) { setData(mergeLanding(previewData)); return }
    api('public/landing').then((d) => { setData(mergeLanding(d.landing)); if (d.site) setSite(d.site) }).catch(() => {})
  }, [previewData])

  const ctaTo = user ? homeFor(user.role) : '/register'
  const links = [['features', data.features.title], ['types', data.types.title], ['how', data.steps.title], ['faq', data.faq.title]]

  return (
    <div className="overflow-x-hidden bg-ink text-white">
      {/* ================= NAV ================= */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-[1.6rem] border border-white/10 bg-ink/70 px-4 py-3 backdrop-blur-xl sm:mx-6 lg:mx-auto lg:px-6">
          <Link to="/"><Logo light size={34} /></Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map(([id, label]) => (
              <a key={id} href={`#/`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">{pick(label)}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><LangSwitch dark /></div>
            {user ? (
              <Link to={homeFor(user.role)} className="hidden rounded-2xl bg-baari px-5 py-2.5 text-sm font-bold shadow-glow sm:inline-flex">{t('dashboard')}</Link>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-2xl px-4 py-2.5 text-sm font-bold text-white/80 hover:text-white sm:inline-flex">{t('login')}</Link>
                <Link to="/register" className="hidden rounded-2xl bg-baari px-5 py-2.5 text-sm font-bold shadow-glow sm:inline-flex">{t('getStarted')}</Link>
              </>
            )}
            <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 lg:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="mx-3 mt-2 space-y-1 rounded-[1.6rem] border border-white/10 bg-ink/95 p-4 backdrop-blur-xl animate-pop lg:hidden">
            {links.map(([id, label]) => (
              <button key={id} onClick={() => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }}
                className="block w-full rounded-xl px-4 py-3 text-start font-semibold text-white/80 hover:bg-white/10">{pick(label)}</button>
            ))}
            <div className="flex items-center justify-between gap-2 pt-3">
              <LangSwitch dark />
              <div className="flex gap-2">
                <Link to="/login" className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold">{t('login')}</Link>
                <Link to={ctaTo} className="rounded-xl bg-baari px-4 py-2.5 text-sm font-bold">{t('getStarted')}</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      {data.hero.show && (
        <section className="mesh relative min-h-screen pt-32 lg:pt-36">
          <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <div className="pointer-events-none absolute -top-40 start-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-[120px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
            <div className="text-center lg:text-start">
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/90 animate-pop">
                <Sparkles className="h-4 w-4 text-amber-300" />{pick(data.hero.badge)}
              </span>
              <h1 className={cx('mt-7 font-extrabold tracking-tight', lang === 'ur' ? 'text-5xl leading-[1.6] sm:text-6xl' : 'text-5xl leading-[1.02] sm:text-7xl xl:text-[5.5rem]')}>
                {pick(data.hero.title)}{' '}
                <span className="text-gradient animate-shine bg-[length:200%_auto]" style={{ backgroundImage: 'linear-gradient(90deg,#A78BFA,#EC4899,#F97316,#EC4899,#A78BFA)' }}>
                  {pick(data.hero.highlight)}
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/70 lg:mx-0">{pick(data.hero.subtitle)}</p>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link to={ctaTo} className="group inline-flex h-14 items-center gap-2 rounded-2xl bg-baari px-8 text-base font-bold shadow-glow transition hover:brightness-110">
                  {pick(data.hero.ctaPrimary)}<ArrowRight className="h-5 w-5 transition group-hover:translate-x-1 flip-rtl" />
                </Link>
                <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                  className="glass inline-flex h-14 items-center gap-2 rounded-2xl px-7 font-bold text-white/90 hover:bg-white/15">
                  {pick(data.hero.ctaSecondary)}
                </button>
              </div>
              <div className="mt-10 flex items-center justify-center gap-4 lg:justify-start">
                <div className="flex -space-x-3 rtl:space-x-reverse">
                  {['AK', 'SP', 'HR', 'FN', 'UA'].map((s, i) => (
                    <div key={s} className={cx('grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-gradient-to-br text-xs font-bold', ['from-violet-500 to-fuchsia-500', 'from-pink-500 to-orange-400', 'from-cyan-500 to-emerald-500', 'from-amber-400 to-orange-500', 'from-indigo-500 to-violet-500'][i])}>{s}</div>
                  ))}
                </div>
                <div className="text-start text-sm">
                  <div className="flex text-amber-300">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                  <div className="text-white/60">{pick(data.trust.title)}</div>
                </div>
              </div>
            </div>
            <HeroPhone />
          </div>
        </section>
      )}

      {/* ================= STATS ================= */}
      {data.stats.show && (
        <section className="relative -mt-12 px-5">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 rounded-[2rem] border border-white/10 bg-ink-2/80 p-3 backdrop-blur-xl sm:grid-cols-4">
            {data.stats.items.map((s, i) => (
              <div key={i} className="rounded-3xl bg-white/[.04] p-5 text-center">
                <div className="num text-gradient text-3xl font-bold sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-sm text-white/60">{pick(s.label)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= MARQUEE ================= */}
      {data.trust.show && (
        <section className="py-14">
          <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]" dir="ltr">
            <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-2xl font-extrabold text-white/25">
              {[0, 1].map((k) => (
                <div key={k} className="flex gap-10">
                  {String(data.trust.items).split('·').map((c, i) => (
                    <span key={i} className="flex items-center gap-10">{c.trim()}<LogoMark size={22} /></span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= FEATURES ================= */}
      {data.features.show && (
        <section id="features" className="px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHead title={pick(data.features.title)} sub={pick(data.features.subtitle)} />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.features.items.map((f, i) => {
                const Icon = ICONS[f.icon] || Sparkles
                return (
                  <div key={i} className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] p-7 transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/40 hover:bg-white/[.07]">
                    <div className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/0 blur-3xl transition group-hover:bg-fuchsia-500/30" />
                    <div className={cx('grid h-14 w-14 place-items-center rounded-2xl', i % 2 ? 'bg-trust' : 'bg-baari')}><Icon className="h-7 w-7" /></div>
                    <h3 className="mt-6 text-xl font-bold">{pick(f.title)}</h3>
                    <p className="mt-2 text-white/60">{pick(f.desc)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= TYPES ================= */}
      {data.types.show && (
        <section id="types" className="relative px-5 py-20">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-96 -translate-y-1/2 bg-gradient-to-r from-violet-700/20 via-pink-600/20 to-orange-500/20 blur-[100px]" />
          <div className="relative mx-auto max-w-7xl">
            <SectionHead title={pick(data.types.title)} sub={pick(data.types.subtitle)} />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {TYPE_KEYS.map((k) => {
                const T = TYPES[k]
                return (
                  <div key={k} className="rounded-[2rem] border border-white/10 bg-ink-2/80 p-6 backdrop-blur transition hover:-translate-y-1">
                    <div className={cx('grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br', T.grad)}><T.icon className="h-7 w-7" /></div>
                    <h3 className="mt-5 text-lg font-bold">{t(`type_${k}`)}</h3>
                    <div className="text-sm font-semibold text-pink-300">{t(`type_${k}_ur`)}</div>
                    <p className="mt-3 text-sm text-white/60">{t(`type_${k}_desc`)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= CALCULATOR ================= */}
      <MiniCalculator />

      {/* ================= STEPS ================= */}
      {data.steps.show && (
        <section id="how" className="px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead title={pick(data.steps.title)} />
            <div className="relative mt-14 grid gap-6 md:grid-cols-4">
              <div className="absolute inset-x-[12%] top-8 hidden h-0.5 bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 md:block" />
              {data.steps.items.map((s, i) => (
                <div key={i} className="relative text-center">
                  <div className="num relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-ink text-2xl font-bold ring-4 ring-fuchsia-500/60">
                    <span className="text-gradient">{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{pick(s.title)}</h3>
                  <p className="mt-2 text-sm text-white/60">{pick(s.desc)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= TESTIMONIALS ================= */}
      {data.testimonials.show && (
        <section className="px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHead title={pick(data.testimonials.title)} />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {data.testimonials.items.map((q, i) => (
                <figure key={i} className={cx('relative rounded-[2rem] p-[1.5px]', i === 1 ? 'bg-baari md:-translate-y-4' : 'bg-white/10')}>
                  <div className="h-full rounded-[calc(2rem-1.5px)] bg-ink-2 p-7">
                    <Quote className="h-8 w-8 text-pink-400" />
                    <blockquote className="mt-4 text-lg text-white/85">{pick(q.quote)}</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-baari text-sm font-bold">{q.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
                      <div><div className="font-bold">{q.name}</div><div className="text-sm text-white/50">{q.city}</div></div>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= FAQ ================= */}
      {data.faq.show && (
        <section id="faq" className="px-5 py-20">
          <div className="mx-auto max-w-3xl">
            <SectionHead title={pick(data.faq.title)} />
            <div className="mt-12 space-y-3">{data.faq.items.map((f, i) => <Faq key={i} q={pick(f.q)} a={pick(f.a)} open={i === 0} />)}</div>
          </div>
        </section>
      )}

      {/* ================= CTA ================= */}
      {data.cta.show && (
        <section className="px-5 py-16">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-baari px-6 py-16 text-center sm:px-12">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
            <div className="pointer-events-none absolute -bottom-24 -end-24 opacity-30"><LogoMark size={320} spin /></div>
            <div className="relative">
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{pick(data.cta.title)}</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">{pick(data.cta.subtitle)}</p>
              <Link to={ctaTo} className="mt-9 inline-flex h-14 items-center gap-2 rounded-2xl bg-ink px-8 font-bold shadow-2xl transition hover:scale-[1.03]">
                {pick(data.cta.button)}<ArrowRight className="h-5 w-5 flip-rtl" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 px-5 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo light />
            <p className="mt-4 text-white/60">{pick(data.footer.about)}</p>
          </div>
          <div className="space-y-3 text-white/70">
            {data.footer.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-pink-400" /><span dir="ltr">{data.footer.phone}</span></div>}
            {data.footer.email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-pink-400" />{data.footer.email}</div>}
            {pick(data.footer.address) && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-pink-400" />{pick(data.footer.address)}</div>}
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl text-sm text-white/40">© {new Date().getFullYear()} {site.name || 'Kumeti'}</div>
      </footer>

      {site.whatsapp && (
        <a href={`https://wa.me/${String(site.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
          className="fixed bottom-5 end-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 shadow-[0_10px_40px_-5px_rgba(16,185,129,.8)] transition hover:scale-110" aria-label="WhatsApp">
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  )
}

function SectionHead({ title, sub }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-white/60">{sub}</p>}
    </div>
  )
}

function Faq({ q, a, open: initial }) {
  const [open, setOpen] = useState(initial)
  return (
    <div className={cx('rounded-3xl border transition', open ? 'border-fuchsia-400/40 bg-white/[.06]' : 'border-white/10 bg-white/[.03]')}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 p-5 text-start text-lg font-bold">
        {q}<ChevronDown className={cx('h-5 w-5 shrink-0 transition', open && 'rotate-180')} />
      </button>
      {open && <p className="px-5 pb-5 text-white/65">{a}</p>}
    </div>
  )
}

// Floating phone mockup that shows the product.
function HeroPhone() {
  const { t } = useLang()
  const people = [['Ayesha Khan', 1, true], ['Fatima Noor', 2, true], ['Bilal Ahmed', 3, false], ['Sana Iqbal', 4, false]]
  return (
    <div className="relative mx-auto w-full max-w-[360px] animate-float" dir="ltr">
      <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-violet-600/40 via-pink-500/30 to-orange-400/30 blur-3xl" />
      <div className="relative rounded-[3rem] border border-white/15 bg-ink-2 p-3 shadow-[0_40px_120px_-20px_rgba(124,58,237,.6)]">
        <div className="overflow-hidden rounded-[2.4rem] bg-lilac text-ink">
          <div className="flex items-center justify-between px-6 pb-2 pt-4 text-xs font-bold"><span>9:41</span><span className="h-5 w-20 rounded-full bg-ink" /><span>100%</span></div>
          <div className="px-5 pb-6">
            <div className="flex items-center justify-between py-2"><Logo size={26} /><span className="chip bg-emerald-100 text-emerald-700">● Live</span></div>
            <div className="relative mt-2 overflow-hidden rounded-3xl bg-baari p-5 text-white shadow-glow">
              <div className="text-xs font-semibold text-white/80">Mohalla Committee</div>
              <div className="num mt-1 text-3xl font-bold">{money(600000)}</div>
              <div className="mt-1 text-xs text-white/80">Rs 50,000 × 12 · {lakh(600000)}</div>
              <div className="mt-4 h-2 rounded-full bg-white/25"><div className="h-full w-1/3 rounded-full bg-white" /></div>
              <div className="mt-2 flex justify-between text-[11px] font-semibold text-white/85"><span>Round 4 of 12</span><span>33%</span></div>
              <Crown className="absolute -end-3 -top-3 h-20 w-20 rotate-12 text-white/15" />
            </div>
            <div className="mt-4 space-y-2">
              {people.map(([nm, turn, got]) => (
                <div key={nm} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm">
                  <div className="num grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-bold text-white">{turn}</div>
                  <div className="flex-1 text-sm font-bold">{nm}</div>
                  {got ? <span className="chip bg-emerald-100 text-emerald-700"><Check className="h-3 w-3" />{t('given')}</span> : <span className="chip bg-violet-100 text-violet-700">{t('round')} {turn}</span>}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-sm font-bold text-white"><Dices className="h-4 w-4" />{t('shuffle')}</div>
          </div>
        </div>
      </div>
      <div className="glass absolute -start-6 top-24 hidden items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold sm:flex animate-pop" style={{ animationDelay: '.6s' }}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500"><Check className="h-4 w-4" /></span>Ayesha paid Rs 50,000
      </div>
      <div className="glass absolute -end-8 bottom-28 hidden items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold sm:flex animate-pop" style={{ animationDelay: '.9s' }}>
        <BellRing className="h-4 w-4 text-amber-300" />Reminder sent
      </div>
    </div>
  )
}

function MiniCalculator() {
  const { t, lang } = useLang()
  const [amount, setAmount] = useState(10000)
  const [members, setMembers] = useState(10)
  const pot = amount * members
  const end = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() + members - 1)
    return d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-GB', { month: 'long', year: 'numeric' })
  }, [members, lang])
  return (
    <section className="px-5 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] p-6 sm:p-10 lg:grid-cols-2">
        <div>
          <span className="chip bg-white/10 text-pink-300"><Calculator className="h-3.5 w-3.5" />{t('calcTitle')}</span>
          <div className="mt-6 space-y-7">
            <div>
              <div className="mb-2 flex justify-between font-semibold"><span>{t('amountPerRound')}</span><span className="num text-gradient">{money(amount)}</span></div>
              <input type="range" min="1000" max="100000" step="1000" value={amount} onChange={(e) => setAmount(+e.target.value)} className="w-full accent-pink-500" />
            </div>
            <div>
              <div className="mb-2 flex justify-between font-semibold"><span>{t('howManyMembers')}</span><span className="num text-gradient">{members}</span></div>
              <input type="range" min="2" max="30" value={members} onChange={(e) => setMembers(+e.target.value)} className="w-full accent-pink-500" />
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] bg-baari p-8 shadow-glow">
          <div className="text-sm font-semibold text-white/80">{t('eachGets')}</div>
          <div className="num mt-1 text-5xl font-bold">{money(pot)}</div>
          <div className="mt-1 text-white/80">{lakh(pot, lang)}</div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-4"><div className="text-xs text-white/80">{t('duration')}</div><div className="num text-xl font-bold">{members} {t('months')}</div></div>
            <div className="rounded-2xl bg-white/15 p-4"><div className="text-xs text-white/80">{t('lastPayout')}</div><div className="text-lg font-bold">{end}</div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
