'use server'

import { revalidatePath } from 'next/cache'
import { requireMember } from '@/lib/auth'
import { isDateString } from '@/lib/date'
import { dbMessage, go, num, str } from '@/lib/flash'

export async function createOuting(fd: FormData) {
  const { supabase, me } = await requireMember()
  const row = { date: str(fd, 'date'), title: str(fd, 'title'), place: str(fd, 'place'), capacity: num(fd, 'capacity'), note: str(fd, 'note') || null, user_id: me.id }
  if (!isDateString(row.date) || !row.title || !row.place) go('/outings/new', '날짜, 공연, 장소를 적어주세요')
  if (!(row.capacity >= 2 && row.capacity <= 50)) go('/outings/new', '인원은 2명에서 50명 사이로 적어주세요')
  const { error } = await supabase.from('outings').insert(row)
  if (error) go('/outings/new', dbMessage(error))
  revalidatePath('/', 'layout')
  go('/outings', '동행 모집 글을 올렸어요')
}

export async function toggleOuting(fd: FormData) {
  const { supabase, me } = await requireMember()
  const id = num(fd, 'id')
  const { error } =
    str(fd, 'on') === '1'
      ? await supabase.from('outing_members').delete().eq('outing_id', id).eq('user_id', me.id)
      : await supabase.from('outing_members').insert({ outing_id: id, user_id: me.id })
  if (error) go('/outings', dbMessage(error))
  revalidatePath('/outings')
  go('/outings', str(fd, 'on') === '1' ? '같이 가기를 취소했어요' : '같이 가요! 모집한 사람과 이야기해 보세요')
}

export async function deleteOuting(fd: FormData) {
  const { supabase } = await requireMember()
  await supabase.from('outings').delete().eq('id', num(fd, 'id'))
  revalidatePath('/', 'layout')
  go('/outings', '모집 글을 지웠어요')
}
