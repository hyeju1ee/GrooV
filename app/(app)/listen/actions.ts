'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireMember } from '@/lib/auth'
import { isDateString } from '@/lib/date'
import { dbMessage, go, num, str } from '@/lib/flash'

export async function createSession(fd: FormData) {
  const { supabase } = await requireAdmin()
  const row = { no: num(fd, 'no'), title: str(fd, 'title'), date: str(fd, 'date'), host: str(fd, 'host') || null }
  if (!(row.no > 0) || !row.title || !isDateString(row.date)) go('/listen/new', '회차, 주제, 날짜를 모두 적어주세요')
  const { data, error } = await supabase.from('sessions').insert(row).select('id').single()
  if (error) go('/listen/new', error.code === '23505' ? `#${row.no} 감상모임이 이미 있어요` : dbMessage(error))
  revalidatePath('/listen')
  go(`/listen?s=${data.id}`, `감상모임 #${row.no}을 열었어요`)
}

export async function addTrack(fd: FormData) {
  const { supabase, me } = await requireMember()
  const sessionId = num(fd, 'session_id')
  const url = str(fd, 'url')
  const year = num(fd, 'year')
  const row = {
    session_id: sessionId,
    title: str(fd, 'title'),
    artist: str(fd, 'artist'),
    album: str(fd, 'album') || null,
    year: year >= 1900 && year <= 2100 ? year : null,
    url: /^https?:\/\//.test(url) ? url : null,
    comment: str(fd, 'comment') || null,
    user_id: me.id,
  }
  if (!row.title || !row.artist) go(`/listen/${sessionId}/add`, '곡 제목과 연주자를 적어주세요')
  const { error } = await supabase.from('tracks').insert(row)
  if (error) go(`/listen/${sessionId}/add`, dbMessage(error))
  revalidatePath('/', 'layout')
  go(`/listen?s=${sessionId}`, '곡을 올렸어요')
}

export async function deleteTrack(fd: FormData) {
  const { supabase } = await requireMember()
  const id = num(fd, 'id')
  const sessionId = num(fd, 'session_id')
  const { error } = await supabase.from('tracks').delete().eq('id', id)
  if (error) go(`/listen?s=${sessionId}`, dbMessage(error))
  revalidatePath('/listen')
  go(`/listen?s=${sessionId}`, '곡을 지웠어요')
}

export async function toggleTrackLike(fd: FormData) {
  const { supabase, me } = await requireMember()
  const id = num(fd, 'id')
  if (str(fd, 'on') === '1') await supabase.from('track_likes').delete().eq('track_id', id).eq('user_id', me.id)
  else await supabase.from('track_likes').upsert({ track_id: id, user_id: me.id }, { ignoreDuplicates: true })
  revalidatePath('/listen')
}
