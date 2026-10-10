import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, Wallet } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/i18n'
import { Button, Empty, PageHeader, Segmented, Spinner } from '../../components/ui'
import KametiCard from '../../components/KametiCard'

export function KametiGrid({ list, extra }) {
  const { t } = useLang()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const shown = list.filter((k) => (filter === 'all' || k.status === filter) && k.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-400" />
          <input className="input ps-12" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Segmented className="sm:w-96" value={filter} onChange={setFilter} options={['all', 'active', 'completed'].map((v) => ({ value: v, label: t(v) }))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shown.map((k) => <KametiCard key={k.id} k={k} extra={extra?.(k)} />)}</div>
    </>
  )
}

export default function KametiList() {
  const { t } = useLang()
  const [list, setList] = useState(null)
  useEffect(() => { api('kametis').then((d) => setList(d.kametis)).catch(() => setList([])) }, [])
  return (
    <div>
      <PageHeader title={t('myKametis')} action={<Link to="/org/new"><Button icon={PlusCircle}>{t('newKameti')}</Button></Link>} />
      {!list ? <Spinner /> : list.length === 0 ? (
        <Empty icon={Wallet} title={t('emptyKametis')} sub={t('emptyKametisSub')} action={<Link to="/org/new"><Button icon={PlusCircle}>{t('newKameti')}</Button></Link>} />
      ) : <KametiGrid list={list} />}
    </div>
  )
}
