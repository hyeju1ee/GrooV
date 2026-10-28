'use server'

import { revalidatePath } from 'next/cache'
import { requireMember } from '@/lib/auth'
import { INSTRUMENTS } from '@/lib/constants'
import { dbMessage, go, num, str } from '@/lib/flash'

export async function joinJam(fd: FormData) {
  const { supabase, me } = await requireMember()
  const eventId = num(fd, 'event_id')
  const instrument = str(fd, 'instrument')
  if (!(INSTRUMENTS as readonly string[]).includes(instrument)) go(`/jam/${eventId}`, '악기를 골라주세요')
  const { error } = await supabase.from('jam_signups').upsert({ event_id: eventId, user_id: me.id, instrument })
  if (error) go(`/jam/${eventId}`, dbMessage(error))
  revalidatePath('/', 'layout')
  go(`/jam/${eventId}`, `${instrument}로 참가 신청했어요${me.role === 'ob' ? ' (OB 게스트)' : ''}`)
}

export async function leaveJam(fd: FormData) {
  const { supabase, me } = await requireMember()
  const eventId = num(fd, 'event_id')
  await supabase.from('jam_signups').delete().eq('event_id', eventId).eq('user_id', me.id)
  revalidatePath('/', 'layout')
  go(`/jam/${eventId}`, '참가 신청을 취소했어요')
}

export async function requestTune(fd: FormData) {
  const { supabase, me } = await requireMember()
  const eventId = num(fd, 'event_id')
  const tune = str(fd, 'tune').slice(0, 60)
  if (!tune) go(`/jam/${eventId}`, '곡 이름을 적어주세요')
  const { error } = await supabase.from('jam_requests').insert({ event_id: eventId, tune })
  if (error?.code === '23505') {
    // 이미 신청된 곡이면 +1로 바꿔요
    const { data } = await supabase.from('jam_requests').select('id').eq('event_id', eventId).eq('tune_key', tune.toLowerCase()).maybeSingle()
    if (data) await supabase.from('jam_request_votes').upsert({ request_id: data.id, user_id: me.id }, { ignoreDuplicates: true })
    revalidatePath(`/jam/${eventId}`)
    go(`/jam/${eventId}`, '이미 신청된 곡이라 +1 했어요')
  }
  if (error) go(`/jam/${eventId}`, dbMessage(error))
  revalidatePath('/', 'layout')
  go(`/jam/${eventId}`, `${tune} 신청했어요`)
}

export async function toggleTuneVote(fd: FormData) {
  const { supabase, me } = await requireMember()
  const eventId = num(fd, 'event_id')
  const requestId = num(fd, 'request_id')
  if (str(fd, 'on') === '1') {
    await supabase.from('jam_request_votes').delete().eq('request_id', requestId).eq('user_id', me.id)
  } else {
    await supabase.from('jam_request_votes').upsert({ request_id: requestId, user_id: me.id }, { ignoreDuplicates: true })
  }
  revalidatePath(`/jam/${eventId}`)
}
