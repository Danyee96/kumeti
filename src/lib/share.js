import { n } from './kameti'

// Repeated contact rows are common when one person holds several numbers.
// Keep different known identities separate; name-only rows share by normalized name.
export function groupShareMembers(members, c) {
  const groups = new Map()
  for (const member of members) {
    const email = String(member.email || '').trim().toLowerCase()
    let phone = String(member.phone || '').replace(/\D/g, '')
    if (phone.startsWith('0092')) phone = phone.slice(2)
    if (phone.startsWith('0')) phone = '92' + phone.slice(1)
    const name = String(member.name || '').trim().replace(/\s+/g, ' ').toLowerCase()
    const key = member.user_id ? `user:${member.user_id}` : email ? `email:${email}` : phone ? `phone:${phone}` : `name:${name}`
    if (!groups.has(key)) groups.set(key, { key, member: { ...member, ids: [] }, numbers: [] })
    const group = groups.get(key)
    group.member.ids.push(n(member.id))
    for (const number of c.numbersOf(member.id)) {
      const existing = group.numbers.find((x) => x.slot_no === number.slot_no)
      if (existing) existing.portion += number.portion
      else group.numbers.push({ ...number })
    }
  }
  return [...groups.values()].map((group) => ({ ...group, numbers: group.numbers.sort((a, b) => a.slot_no - b.slot_no) }))
}
