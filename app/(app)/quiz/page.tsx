import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Empty, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { youtubeSearch } from '@/lib/constants'
import { answerQuiz, deleteQuiz } from './actions'

export const metadata = { title: '블라인드 퀴즈' }

type Quiz = { id: number; question: string; hint: string | null; options: string[]; reveal_title: string | null; reveal_url: string | null }

export default async function QuizPage() {
  const { supabase, me } = await requireMember()
  const admin = me.role === 'admin'
  const { data } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false }).limit(10)
  const quizzes = (data ?? []) as Quiz[]
  const ids = quizzes.map((q) => q.id)
  const [{ data: answers }, { data: keys }] = await Promise.all([
    supabase.from('quiz_answers').select('quiz_id, choice').eq('user_id', me.id).in('quiz_id', ids),
    supabase.from('quiz_keys').select('quiz_id, answer').in('quiz_id', ids),
  ])
  const stats = await Promise.all(
    quizzes.map((q) => supabase.rpc('quiz_stats', { p_quiz: q.id }).maybeSingle<{ total: number; correct: number }>()),
  )

  return (
    <main className="main sub">
      <TopBar back="/listen" title="블라인드 퀴즈">
        {admin ? (
          <Link className="chip" href="/quiz/new">
            <Icon name="plus" size={16} /> 문제 내기
          </Link>
        ) : null}
      </TopBar>
      {!quizzes.length ? <Empty>감상모임에서 운영진이 문제를 내면 여기에 올라와요.</Empty> : null}
      {quizzes.map((q, qi) => {
        const mine = answers?.find((a) => a.quiz_id === q.id)?.choice
        const key = keys?.find((k) => k.quiz_id === q.id)?.answer
        const answered = mine !== undefined
        const st = stats[qi].data
        return (
          <section key={q.id} className="stack" style={{ gap: 12, paddingBottom: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <span className="stepcap">{qi === 0 ? '새 문제' : '지난 문제'}</span>
              <h1 className="q" style={{ fontSize: 21 }}>
                {q.question}
              </h1>
              {q.hint ? <span className="sub2">힌트: {q.hint}</span> : null}
            </div>
            <div className="opts">
              {q.options.map((o, i) => {
                const cls = !answered || key === undefined ? '' : i === key ? ' right' : i === mine ? ' wrong' : ''
                return (
                  <form key={i} action={answerQuiz}>
                    <input type="hidden" name="quiz_id" value={q.id} />
                    <input type="hidden" name="choice" value={i} />
                    <button type="submit" className={`quizopt${cls}`} disabled={answered || admin}>
                      {o}
                    </button>
                  </form>
                )
              })}
            </div>
            {answered && key !== undefined ? (
              <div className="note">
                <b>{mine === key ? '정답이에요!' : `정답은 ${q.options[key]}이에요`}</b>
                {q.reveal_title ? <> · {q.reveal_title}</> : null}
                {st ? (
                  <>
                    <br />
                    {st.total}명 중 {st.correct}명이 맞혔어요.
                  </>
                ) : null}{' '}
                <a href={q.reveal_url ?? youtubeSearch(q.reveal_title ?? q.options[key])} target="_blank" rel="noopener noreferrer">
                  다시 듣기 ↗
                </a>
              </div>
            ) : null}
            {admin ? (
              <div className="row between">
                <span className="cap">
                  운영진은 답할 수 없어요 · 정답 {key !== undefined ? q.options[key] : '-'} · {st?.total ?? 0}명 참여
                </span>
                <form action={deleteQuiz}>
                  <input type="hidden" name="id" value={q.id} />
                  <button className="chip danger" type="submit">
                    지우기
                  </button>
                </form>
              </div>
            ) : null}
            <div className="divider" />
          </section>
        )
      })}
    </main>
  )
}
