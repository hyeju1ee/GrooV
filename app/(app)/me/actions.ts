'use server'

import { revalidatePath } from 'next/cache'
import { requireMember } from '@/lib/auth'
import { INSTRUMENTS } from '@/lib/constants'
import { dbMessage, go, num, str } from '@/lib/flash'

export async function updateProfile(fd: FormData) {
  const { supabase, me } = await requireMember()
  const instrument = str(fd, 'instrument')
  const row = {
    name: str(fd, 'name'),
    instrument: (INSTRUMENTS as readonly string[]).includes(instrument) ? instrument : me.instrument,
    fav_artist: str(fd, 'fav_artist') || null,
    now_listening: str(fd, 'now_listening') || null,
  }
  if (!row.name) go('/me/edit', '이름을 적어주세요')
  const { error } = await supabase.from('profiles').update(row).eq('id', me.id)
  if (error) go('/me/edit', dbMessage(error))
  revalidatePath('/', 'layout')
  go('/me', '프로필을 저장했어요')
}

export async function toggleTune(fd: FormData) {
  const { supabase, me } = await requireMember()
  const id = num(fd, 'tune_id')
  if (str(fd, 'on') === '1') await supabase.from('member_tunes').delete().eq('user_id', me.id).eq('tune_id', id)
  else await supabase.from('member_tunes').upsert({ user_id: me.id, tune_id: id }, { ignoreDuplicates: true })
  revalidatePath('/me/tunes')
}

export async function addTune(fd: FormData) {
  const { supabase, me } = await requireMember()
  const title = str(fd, 'title').slice(0, 60)
  if (!title) go('/me/tunes', '곡 이름을 적어주세요')
  const { data: existing } = await supabase.from('tunes').select('id').ilike('title', title).maybeSingle()
  let id = existing?.id as number | undefined
  if (!id) {
    const { data, error } = await supabase.from('tunes').insert({ title, key: str(fd, 'key') || null }).select('id').single()
    if (error) go('/me/tunes', dbMessage(error))
    id = data.id
  }
  await supabase.from('member_tunes').upsert({ user_id: me.id, tune_id: id }, { ignoreDuplicates: true })
  revalidatePath('/me/tunes')
  go('/me/tunes', `${title}을(를) 추가했어요`)
}
