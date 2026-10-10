import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../components/ui'
import { AuthLayout } from './Login'
import { useAuth, homeFor } from '../lib/auth'
import { useLang } from '../lib/i18n'

export default function Register() {
  const { user, register } = useAuth()
  const { t, err, lang } = useLang()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  if (user) return <Navigate to={homeFor(user.role)} replace />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try { const u = await register({ ...f, lang }); nav(homeFor(u.role)) } catch (x) { setError(err(x.code)) } finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('registerTitle')}</h1>
      <p className="mt-2 text-ink/60">{t('registerSub')}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label={t('name')}><Input required value={f.name} onChange={set('name')} /></Field>
        <Field label={t('email')}><Input type="email" dir="ltr" value={f.email} onChange={set('email')} /></Field>
        <Field label={t('phone')}><Input dir="ltr" inputMode="tel" placeholder="03xx xxxxxxx" value={f.phone} onChange={set('phone')} /></Field>
        <Field label={t('password')}><Input type="password" dir="ltr" required minLength={6} value={f.password} onChange={set('password')} /></Field>
        {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
        <Button type="submit" size="lg" loading={loading} className="w-full">{t('register')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">{t('haveAccount')} <Link to="/login" className="font-bold text-fuchsia-600">{t('login')}</Link></p>
    </AuthLayout>
  )
}
