import { useEffect, useState } from 'react'
import { UserPlus, Search, Pencil, Trash2, Crown, Briefcase, User, Save } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useLang } from '../../lib/i18n'
import { fmtDate } from '../../lib/kameti'
import { Avatar, Badge, Button, Card, Confirm, Field, Input, Modal, PageHeader, Segmented, Spinner, Toggle, useToast } from '../../components/ui'

const ROLE_ICON = { superadmin: Crown, organizer: Briefcase, member: User }
const ROLE_TONE = { superadmin: 'amber', organizer: 'violet', member: 'cyan' }

export default function AdminUsers() {
  const { t, err, lang } = useLang()
  const { user: me } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState(null)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => api('admin/users').then((d) => setUsers(d.users)).catch(() => setUsers([]))
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try { await api('admin/users', edit); toast(t('saved')); setEdit(null); load() } catch (x) { toast(err(x.code), 'err') } finally { setSaving(false) }
  }

  const shown = (users || []).filter((u) => (role === 'all' || u.role === role) && `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHeader title={t('users')} action={<Button icon={UserPlus} onClick={() => setEdit({ name: '', email: '', phone: '', role: 'organizer', status: 'active', password: '' })}>{t('addUser')}</Button>} />
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-400" />
          <input className="input ps-12" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Segmented className="lg:w-[30rem]" value={role} onChange={setRole} options={['all', 'superadmin', 'organizer', 'member'].map((v) => ({ value: v, label: t(v) }))} />
      </div>
      {!users ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((u) => {
            const Icon = ROLE_ICON[u.role]
            return (
              <Card key={u.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} id={u.id} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{u.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={ROLE_TONE[u.role]}><Icon className="h-3 w-3" />{t(u.role)}</Badge>
                      {u.status !== 'active' && <Badge tone="red">{t('disabled')}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-0.5 text-sm text-ink/60" dir="ltr">
                  {u.email && <div className="truncate">{u.email}</div>}
                  {u.phone && <div>{u.phone}</div>}
                  <div className="text-xs text-ink/40" dir="auto">{fmtDate(u.created_at, lang)}</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="sm" variant="soft" icon={Pencil} onClick={() => setEdit({ ...u, password: '' })}>{t('edit')}</Button>
                  <Button size="sm" variant="outline" icon={Trash2} disabled={u.id === me.id} onClick={() => setDel(u)}>{t('delete')}</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t('edit') : t('addUser')}>
        {edit && (
          <div className="space-y-4">
            <Field label={t('name')}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={t('email')}><Input dir="ltr" type="email" value={edit.email || ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label={t('phone')}><Input dir="ltr" value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label={t('role')}><Segmented value={edit.role} onChange={(v) => setEdit({ ...edit, role: v })} options={['superadmin', 'organizer', 'member'].map((v) => ({ value: v, label: t(v), icon: ROLE_ICON[v] }))} /></Field>
            <Field label={t('password')} hint={edit.id ? t('leaveBlank') : ''}><Input dir="ltr" type="password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></Field>
            <Toggle checked={edit.status === 'active'} onChange={(v) => setEdit({ ...edit, status: v ? 'active' : 'disabled' })} label={t('active')} />
            <Button className="w-full" icon={Save} loading={saving} onClick={save}>{t('save')}</Button>
          </div>
        )}
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} text={del?.name} onConfirm={async () => {
        try { await api('admin/users/delete', { id: del.id }); toast(t('saved')); load() } catch (x) { toast(err(x.code), 'err') }
        setDel(null)
      }} />
    </div>
  )
}
