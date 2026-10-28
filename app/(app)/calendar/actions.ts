'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { EVENT_TYPES } from '@/lib/constants'
import { isDateString } from '@/lib/date'
import { dbMessage, go, num, str } from '@/lib/flash'

function readEvent(fd: FormData) {
  const date = str(fd, 'date')
  const type = str(fd, 'type')
  const time = str(fd, 'start_time')
  return {
    date,
    type,
    title: str(fd, 'title'),
    start_time: /^\d{2}:\d{2}$/.test(time) ? time : null,
    place: str(fd, 'place') || null,
    note: str(fd, 'note') || null,
    valid: isDateString(date) && type in EVENT_TYPES && str(fd, 'title').length > 0,
  }
}

export async function createEvent(fd: FormData) {
  const { supabase } = await requireAdmin()
  const { valid, ...row } = readEvent(fd)
  if (!valid) go(`/calendar/new?d=${row.date}`, '날짜, 종류, 제목을 모두 적어주세요')
  const { error } = await supabase.from('events').insert(row)
  if (error) go(`/calendar/new?d=${row.date}`, dbMessage(error))
  revalidatePath('/', 'layout')
  go(`/calendar?d=${row.date}`, '일정을 등록했어요')
}

export async function updateEvent(fd: FormData) {
  const { supabase } = await requireAdmin()
  const id = num(fd, 'id')
  const { valid, ...row } = readEvent(fd)
  if (!valid) go(`/calendar/${id}/edit`, '날짜, 종류, 제목을 모두 적어주세요')
  const { error } = await supabase.from('events').update(row).eq('id', id)
  if (error) go(`/calendar/${id}/edit`, dbMessage(error))
  revalidatePath('/', 'layout')
  go(`/calendar?d=${row.date}`, '일정을 고쳤어요')
}

export async function deleteEvent(fd: FormData) {
  const { supabase } = await requireAdmin()
  const id = num(fd, 'id')
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) go(`/calendar/${id}/edit`, dbMessage(error))
  revalidatePath('/', 'layout')
  go('/calendar', '일정을 지웠어요')
}
