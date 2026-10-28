import { canWriteDong, requireMember } from '@/lib/auth'
import { dlabel, todayKST } from '@/lib/date'
import { go } from '@/lib/flash'
import { RepairFlow } from './RepairFlow'

export const metadata = { title: '수리 요청' }

export default async function NewRepairPage({ searchParams }: { searchParams: Promise<{ gear?: string }> }) {
  const sp = await searchParams
  const { supabase, me } = await requireMember()
  if (!canWriteDong(me)) go('/dong', '수리 요청은 재학생이 써요. 졸업생은 요청을 보고 공감할 수 있어요')
  const [{ data: gear }, { data: next }] = await Promise.all([
    supabase.from('gear').select('id, name, category, status').order('sort').order('category').order('name'),
    supabase.from('events').select('date, type, title').in('type', ['jam', 'rehearsal', 'show']).gte('date', todayKST()).order('date').limit(1),
  ])
  const initial = Number(sp.gear)
  const nextUse = next?.[0] ? `${dlabel(next[0].date)} ${next[0].title}` : null
  return (
    <RepairFlow
      gear={gear ?? []}
      userId={me.id}
      initialGear={gear?.some((g) => g.id === initial) ? initial : null}
      nextUse={nextUse}
    />
  )
}
