'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireMember } from '@/lib/auth'
import { isDateString } from '@/lib/date'
import { dbMessage, go, num, str } from '@/lib/flash'

export async function vote(fd: FormData) {
  const { supabase, me } = await requireMember()
  const pollId = num(fd, 'poll_id')
  const optionId = num(fd, 'option_id')
  const { data: current } = await supabase.from('poll_votes').select('option_id').eq('poll_id', pollId).eq('user_id', me.id).maybeSingle()
  const { error } =
    current?.option_id === optionId
      ? await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', me.id)
      : await supabase.from('poll_votes').upsert({ poll_id: pollId, option_id: optionId, user_id: me.id })
  if (error) go('/polls', error.code === '42501' ? '투표가 마감됐어요' : dbMessage(error))
  revalidatePath('/', 'layout')
  go('/polls', current?.option_id === optionId ? '투표를 취소했어요' : '투표했어요. 마감 전까지 바꿀 수 있어요')
}

/** 후보 한 줄: 앨범 / 연주자 / 연도 */
function parseOptions(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((line, i) => {
      const [title, artist, year] = line.split('/').map((s) => s.trim())
      const y = Number(year)
      return { title, artist: artist || null, year: y >= 1900 && y <= 2100 ? y : null, sort: i }
    })
}

export async function createPoll(fd: FormData) {
  const { supabase } = await requireAdmin()
  const closes = str(fd, 'closes')
  const options = parseOptions(str(fd, 'options'))
  if (!str(fd, 'title') || !isDateString(closes)) go('/polls/new', '제목과 마감일을 적어주세요')
  if (options.length < 2) go('/polls/new', '후보를 두 개 이상 적어주세요')
  const { data, error } = await supabase
    .from('polls')
    .insert({ title: str(fd, 'title'), note: str(fd, 'note') || null, closes_at: `${closes}T23:59:59+09:00` })
    .select('id')
    .single()
  if (error) go('/polls/new', dbMessage(error))
  const { error: optErr } = await supabase.from('poll_options').insert(options.map((o) => ({ ...o, poll_id: data.id })))
  if (optErr) go('/polls/new', dbMessage(optErr))
  revalidatePath('/', 'layout')
  go('/polls', '투표를 열었어요')
}

export async function deletePoll(fd: FormData) {
  const { supabase } = await requireAdmin()
  await supabase.from('polls').delete().eq('id', num(fd, 'id'))
  revalidatePath('/', 'layout')
  go('/polls', '투표를 지웠어요')
}
