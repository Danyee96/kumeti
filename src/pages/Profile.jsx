import { useState } from 'react'
import { UserCircle, KeyRound } from 'lucide-react'
import { Button, Card, Field, Input, PageHeader, Segmented, Avatar, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useLang } from '../lib/i18n'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { t, err, lang } = useLang()
  const toast = useToast()
  const [f, setF] = useState({ name: user.name, email: user.email || '', phone: user.phone || '', lang: lang })
  const [pw, setPw] = useState({ current_password: '', new_password: '' })
  const [loading, setLoading] = useState('')

  const save = async (withPw) => {
    setLoading(withPw ? 'pw' : 'info')
    try {
      await updateProfile({ ...f, ...(withPw ? pw : {}) })
      toast(t('saved'))
      if (withPw) setPw({ current_password: '', new_password: '' })
    } catch (x) { toast(err(x.code), 'err') } finally { setLoading('') }
  }

  return (
    <div>
      <PageHeader title={t('profile')} />
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Avatar name={user.name} id={user.id} size="lg" />
            <div><div className="text-xl font-extrabold">{user.name}</div><div className="text-sm text-ink/50">{t(user.role)}</div></div>
          </div>
          <div className="space-y-4">
            <Field label={t('name')}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={t('email')}><Input dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label={t('phone')}><Input dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label={t('language')}><Segmented value={f.lang} onChange={(v) => setF({ ...f, lang: v })} options={[{ value: 'en', label: 'English' }, { value: 'ur', label: 'اردو' }]} /></Field>
            <Button icon={UserCircle} loading={loading === 'info'} onClick={() => save(false)} className="w-full">{t('save')}</Button>
          </div>
        </Card>
        <Card className="h-fit p-6">
          <h2 className="mb-4 text-lg font-extrabold">{t('changePassword')}</h2>
          <div className="space-y-4">
            <Field label={t('currentPassword')}><Input type="password" dir="ltr" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
            <Field label={t('newPassword')}><Input type="password" dir="ltr" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></Field>
            <Button icon={KeyRound} variant="dark" loading={loading === 'pw'} onClick={() => save(true)} className="w-full">{t('changePassword')}</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
