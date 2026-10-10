import { useState } from 'react'
import { ArrowUp, ArrowDown, Scissors, Lock, Plus, Trash2, Check, AlertTriangle } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { PORTIONS, frac, money, n } from '../lib/kameti'
import { Avatar, Button, Modal, cx } from './ui'

/**
 * Generic numbers (slots) editor.
 * groups: [{ slot_no, holders: [{ id, portion }] }] — one entry per number 1..N
 * people: [{ id, name }]
 */
export default function SlotEditor({ groups, people, label, locked = () => false, onChange, amountFor, readOnly, highlight, mask = () => null }) {
  const { t } = useLang()
  const [split, setSplit] = useState(null)
  const name = (id) => people.find((p) => p.id === id)?.name || '?'

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= groups.length || locked(groups[i].slot_no) || locked(groups[j].slot_no)) return
    const next = groups.map((g) => ({ ...g }))
    ;[next[i].holders, next[j].holders] = [next[j].holders, next[i].holders]
    onChange(next)
  }

  const saveSplit = () => {
    const holders = split.holders.filter((h) => h.id !== '' && h.id !== undefined).map((h) => ({ id: h.id, portion: n(h.portion) }))
    onChange(groups.map((g) => (g.slot_no === split.slot_no ? { ...g, holders } : g)))
    setSplit(null)
  }
  const splitSum = split ? split.holders.reduce((a, h) => a + (h.id !== '' ? n(h.portion) : 0), 0) : 0

  return (
    <div className="space-y-3">
      {groups.map((g, i) => {
        const sum = g.holders.reduce((a, h) => a + n(h.portion), 0)
        const bad = Math.abs(sum - 1) > 0.01
        const isLocked = locked(g.slot_no)
        const mine = highlight && g.holders.some((h) => h.id === highlight)
        return (
          <div key={g.slot_no} className={cx('card overflow-hidden p-0', bad && 'ring-2 ring-amber-300', mine && 'ring-2 ring-violet-400')}>
            <div className="flex items-stretch">
              <div className={cx('num flex w-16 shrink-0 flex-col items-center justify-center text-white sm:w-20', isLocked ? 'bg-trust' : 'bg-baari')}>
                <span className="text-[10px] font-bold uppercase opacity-80">{t('number')}</span>
                <span className="text-3xl font-bold leading-none">{g.slot_no}</span>
                {isLocked && <Lock className="mt-1 h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-fg/60">{label(g.slot_no)}</span>
                  {amountFor && <span className="num shrink-0 text-sm font-bold">{money(amountFor(g.slot_no))}</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {mask(g.slot_no) ? <span className="chip bg-violet-100 text-violet-600">{mask(g.slot_no)}</span> : g.holders.length === 0 && <span className="chip bg-gray-100 text-gray-500">{t('empty')}</span>}
                  {!mask(g.slot_no) && g.holders.map((h, j) => (
                    <span key={j} className="inline-flex max-w-full items-center gap-1.5 rounded-xl bg-violet-50 py-1 pe-2.5 ps-1 text-[15px] font-extrabold">
                      <Avatar name={name(h.id)} id={h.id} size="sm" className="!h-7 !w-7 !rounded-lg !text-[10px]" />
                      <span className="truncate">{name(h.id)}</span>
                      {n(h.portion) < 0.99 && <span className="rounded-md bg-ink px-1.5 text-xs text-white">{frac(h.portion)}</span>}
                    </span>
                  ))}
                </div>
                {bad && !mask(g.slot_no) && <div className="mt-1.5 flex items-center gap-1 text-xs font-bold text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />{t('slotProblem', { r: g.slot_no })}</div>}
              </div>
              {!readOnly && !isLocked && (
                <div className="flex shrink-0 flex-col border-s border-violet-50">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="grid flex-1 place-items-center px-3 text-violet-600 disabled:opacity-25" aria-label={t('moveUp')}><ArrowUp className="h-5 w-5" /></button>
                  <button onClick={() => setSplit({ slot_no: g.slot_no, holders: g.holders.length ? g.holders.map((h) => ({ ...h })) : [{ id: '', portion: 1 }] })} className="grid flex-1 place-items-center border-y border-violet-50 px-3 text-violet-600" aria-label={t('split')}><Scissors className="h-5 w-5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === groups.length - 1} className="grid flex-1 place-items-center px-3 text-violet-600 disabled:opacity-25" aria-label={t('moveDown')}><ArrowDown className="h-5 w-5" /></button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <Modal open={!!split} onClose={() => setSplit(null)} title={split ? t('splitTitle', { r: split.slot_no }) : ''}>
        {split && (
          <div className="space-y-3">
            {split.holders.map((h, i) => (
              <div key={i} className="rounded-3xl border border-violet-100 bg-lilac/60 p-3">
                <div className="flex gap-2">
                  <select className="input h-12 flex-1 font-bold" value={h.id} onChange={(e) => setSplit({ ...split, holders: split.holders.map((x, j) => (j === i ? { ...x, id: isNaN(+e.target.value) || e.target.value === '' ? e.target.value : +e.target.value } : x)) })}>
                    <option value="">{t('choosePerson')}</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button onClick={() => setSplit({ ...split, holders: split.holders.filter((_, j) => j !== i) })} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-500" aria-label={t('delete')}><Trash2 className="h-5 w-5" /></button>
                </div>
                <div className="mt-2 grid grid-cols-6 gap-1.5">
                  {PORTIONS.map((p) => (
                    <button key={p} onClick={() => setSplit({ ...split, holders: split.holders.map((x, j) => (j === i ? { ...x, portion: p } : x)) })}
                      className={cx('h-11 rounded-xl text-lg font-bold', Math.abs(n(h.portion) - p) < 0.01 ? 'bg-baari text-white' : 'bg-surface text-fg/70')}>{frac(p)}</button>
                  ))}
                </div>
              </div>
            ))}
            <Button variant="soft" className="w-full" icon={Plus} onClick={() => {
              const left = Math.max(0, 1 - splitSum)
              const pick = PORTIONS.find((p) => Math.abs(p - left) < 0.01) || 0.5
              setSplit({ ...split, holders: [...split.holders, { id: '', portion: pick }] })
            }}>{t('addPerson')}</Button>
            <div className={cx('flex items-center gap-2 rounded-2xl px-4 py-3 font-bold', Math.abs(splitSum - 1) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
              {Math.abs(splitSum - 1) < 0.01 ? <Check className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              {t('partsTotal', { v: +splitSum.toFixed(2) })} · {t('mustEqualOne')}
            </div>
            <Button size="lg" className="w-full" icon={Check} disabled={Math.abs(splitSum - 1) > 0.01 && splitSum > 0} onClick={saveSplit}>{t('save')}</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
