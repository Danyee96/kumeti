import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Layers } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/i18n'
import { PageHeader, Spinner, Empty, Button } from '../../components/ui'
import { KametiGrid } from '../org/KametiList'

export default function AdminKametis() {
  const { t } = useLang()
  const [list, setList] = useState(null)
  useEffect(() => { api('kametis').then((d) => setList(d.kametis)).catch(() => setList([])) }, [])
  return (
    <div>
      <PageHeader title={t('allKametis')} action={<Link to="/org/new"><Button icon={PlusCircle}>{t('newKameti')}</Button></Link>} />
      {!list ? <Spinner /> : list.length === 0 ? <Empty icon={Layers} title={t('emptyKametis')} /> : (
        <KametiGrid list={list} extra={(k) => <div className="text-xs font-semibold text-ink/50">{t('organizedBy')}: {k.organizer_name}</div>} />
      )}
    </div>
  )
}
