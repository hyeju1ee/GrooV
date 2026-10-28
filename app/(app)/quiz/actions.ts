'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireMember } from '@/lib/auth'
import { dbMessage, go, num, str } from '@/lib/flash'

export async function answerQuiz(fd: FormData) {
  const { supabase, me } = await requireMember()
  const { error } = await supabase.from('quiz_answers').insert({ quiz_id: num(fd, 'quiz_id'), choice: num(fd, 'choice'), user_id: me.id })
  if (error) go('/quiz', error.code === '23505' ? '이미 답했어요' : dbMessage(error))
  revalidatePath('/quiz')
}

export async function createQuiz(fd: FormData) {
  const { supabase } = await requireAdmin()
  const options = str(fd, 'options')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
  const answer = num(fd, 'answer') - 1
  const url = str(fd, 'reveal_url')
  if (!str(fd, 'question') || options.length < 2) go('/quiz/new', '문제와 보기 두 개 이상을 적어주세요')
  if (!(answer >= 0 && answer < options.length)) go('/quiz/new', `정답 번호는 1부터 ${options.length} 사이로 적어주세요`)
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      question: str(fd, 'question'),
      hint: str(fd, 'hint') || null,
      options,
      reveal_title: str(fd, 'reveal_title') || null,
      reveal_url: /^https?:\/\//.test(url) ? url : null,
    })
    .select('id')
    .single()
  if (error) go('/quiz/new', dbMessage(error))
  const { error: keyErr } = await supabase.from('quiz_keys').insert({ quiz_id: data.id, answer })
  if (keyErr) go('/quiz/new', dbMessage(keyErr))
  revalidatePath('/quiz')
  go('/quiz', '문제를 냈어요')
}

export async function deleteQuiz(fd: FormData) {
  const { supabase } = await requireAdmin()
  await supabase.from('quizzes').delete().eq('id', num(fd, 'id'))
  revalidatePath('/quiz')
  go('/quiz', '문제를 지웠어요')
}
