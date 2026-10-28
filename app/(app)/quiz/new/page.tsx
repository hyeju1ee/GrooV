import { SubmitButton } from '@/components/SubmitButton'
import { TopBar } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { createQuiz } from '../actions'

export const metadata = { title: '문제 내기' }

export default async function NewQuizPage() {
  await requireAdmin()
  return (
    <main className="main sub">
      <TopBar back="/quiz" title="문제 내기" />
      <form action={createQuiz} className="stack">
        <div className="field">
          <label className="flabel" htmlFor="question">
            문제
          </label>
          <input className="tf" id="question" name="question" maxLength={200} required defaultValue="진행자가 틀어준 곡, 누구의 연주일까요?" />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="hint">
            힌트 <span className="counter">선택</span>
          </label>
          <input className="tf" id="hint" name="hint" maxLength={200} placeholder="예: 1959년 녹음, 테너 색소폰" />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="options">
            보기 <span className="counter">한 줄에 하나, 2~6개</span>
          </label>
          <textarea className="tf" id="options" name="options" required placeholder={'Sonny Rollins\nJohn Coltrane\nDexter Gordon\nHank Mobley'} />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="answer">
            정답 번호 <span className="counter">위에서 몇 번째 보기인지</span>
          </label>
          <input className="tf" id="answer" name="answer" type="number" min={1} max={6} required />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="reveal_title">
            정답 곡 <span className="counter">선택</span>
          </label>
          <input className="tf" id="reveal_title" name="reveal_title" maxLength={100} placeholder="예: Giant Steps (1960)" />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="reveal_url">
            다시 듣기 링크 <span className="counter">선택</span>
          </label>
          <input className="tf" id="reveal_url" name="reveal_url" type="url" placeholder="https://" />
        </div>
        <div className="ctabar">
          <SubmitButton>문제 내기</SubmitButton>
        </div>
      </form>
    </main>
  )
}
