import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/i18n'
import { Button, Card, Field, Input, PageHeader, Spinner, Toggle, useToast } from '../../components/ui'

export default function AdminSettings() {
  const { t, err } = useLang()
  const toast = useToast()
  const [site, setSite] = useState(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { api('admin/settings').then((d) => setSite({ show_demo: true, ...d.site })).catch(() => setSite({ name: 'Kumeti', allow_signup: true, whatsapp: '', currency: 'Rs' })) }, [])
  if (!site) return <Spinner />
  const save = async () => {
    setSaving(true)
    try { await api('admin/settings', { site }); toast(t('saved')) } catch (x) { toast(err(x.code), 'err') } finally { setSaving(false) }
  }
  return (
    <div>
      <PageHeader title={t('settings')} />
      <Card className="max-w-xl space-y-4 p-6">
        <Field label={t('siteName')}><Input value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} /></Field>
        <Field label={t('whatsapp')} hint="923001234567"><Input dir="ltr" value={site.whatsapp} onChange={(e) => setSite({ ...site, whatsapp: e.target.value })} /></Field>
        <Toggle checked={!!site.allow_signup} onChange={(v) => setSite({ ...site, allow_signup: v })} label={t('allowSignup')} />
        <Toggle checked={!!site.show_demo} onChange={(v) => setSite({ ...site, show_demo: v })} label={t('showDemo')} />
        <Button className="w-full" icon={Save} loading={saving} onClick={save}>{t('save')}</Button>
      </Card>
    </div>
  )
}
