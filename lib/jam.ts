import type { SupabaseClient } from '@supabase/supabase-js'
import { INSTRUMENTS, RHYTHM } from './constants'

export interface Signup {
  user_id: string
  instrument: string
  person: { name: string; role: string } | null
}

export async function getSignups(supabase: SupabaseClient, eventId: number) {
  const { data } = await supabase
    .from('jam_signups')
    .select('user_id, instrument, person:profiles!jam_signups_user_id_fkey(name, role)')
    .eq('event_id', eventId)
    .order('created_at')
  return (data ?? []) as unknown as Signup[]
}

export function byInstrument(signups: Signup[]) {
  const map = Object.fromEntries(INSTRUMENTS.map((i) => [i, [] as Signup[]])) as Record<string, Signup[]>
  signups.forEach((s) => map[s.instrument]?.push(s))
  return map
}

export function missingRhythm(signups: Signup[]) {
  const map = byInstrument(signups)
  return RHYTHM.filter((i) => map[i].length === 0)
}

/** 신청한 사람들이 연주할 수 있는 곡을 많이 아는 순으로 */
export async function tuneMatch(supabase: SupabaseClient, userIds: string[]) {
  if (!userIds.length) return []
  const { data } = await supabase.from('member_tunes').select('user_id, tune:tunes(id, title, key, form)').in('user_id', userIds)
  const counts = new Map<number, { title: string; key: string | null; form: string | null; n: number }>()
  for (const row of (data ?? []) as unknown as { tune: { id: number; title: string; key: string | null; form: string | null } }[]) {
    if (!row.tune) continue
    const c = counts.get(row.tune.id) ?? { title: row.tune.title, key: row.tune.key, form: row.tune.form, n: 0 }
    c.n++
    counts.set(row.tune.id, c)
  }
  return [...counts.values()].sort((a, b) => b.n - a.n || a.title.localeCompare(b.title))
}
