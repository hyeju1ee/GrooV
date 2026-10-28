import { SubmitButton } from '@/components/SubmitButton'
import { TopBar } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { addDays, todayKST } from '@/lib/date'
import { createPoll } from '../actions'

export const metadata = { title: '투표 열기' }

export default async function NewPollPage() {
  await requireAdmin()
  return (
    <main className="main sub">
      <TopBar back="/polls" title="투표 열기" />
      <form action={createPoll} className="stack">
        <div className="field">
          <label className="flabel" htmlFor="title">
            질문
          </label>
          <input className="tf" id="title" name="title" maxLength={80} defaultValue="다음 감상모임에서 들을 앨범" required />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="note">
            설명 <span className="counter">선택</span>
          </label>
          <input className="tf" id="note" name="note" maxLength={300} placeholder="예: 11/6 감상모임 #43" />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="closes">
            마감일
          </label>
          <input className="tf" id="closes" name="closes" type="date" defaultValue={addDays(todayKST(), 7)} required />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="options">
            후보 <span className="counter">한 줄에 하나, 앨범 / 연주자 / 연도</span>
          </label>
          <textarea
            className="tf"
            id="options"
            name="options"
            required
            style={{ minHeight: 150 }}
            placeholder={'Sunday at the Village Vanguard / Bill Evans Trio / 1961\nMaiden Voyage / Herbie Hancock / 1965'}
          />
        </div>
        <div className="ctabar">
          <SubmitButton>투표 열기</SubmitButton>
        </div>
      </form>
    </main>
  )
}
