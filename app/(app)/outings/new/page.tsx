import { SubmitButton } from '@/components/SubmitButton'
import { TopBar } from '@/components/ui'
import { addDays, todayKST } from '@/lib/date'
import { createOuting } from '../actions'

export const metadata = { title: '동행 모집' }

export default function NewOutingPage() {
  return (
    <main className="main sub">
      <TopBar back="/outings" title="동행 모집" />
      <form action={createOuting} className="stack">
        <div className="field">
          <label className="flabel" htmlFor="title">
            어떤 공연인가요?
          </label>
          <input className="tf" id="title" name="title" maxLength={60} required placeholder="예: 재즈클럽 토요 잼세션" />
        </div>
        <div className="inline" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field">
            <label className="flabel" htmlFor="date">
              날짜
            </label>
            <input className="tf" id="date" name="date" type="date" min={todayKST()} defaultValue={addDays(todayKST(), 7)} required />
          </div>
          <div className="field">
            <label className="flabel" htmlFor="capacity">
              나 포함 인원
            </label>
            <input className="tf" id="capacity" name="capacity" type="number" min={2} max={50} defaultValue={4} required />
          </div>
        </div>
        <div className="field">
          <label className="flabel" htmlFor="place">
            장소
          </label>
          <input className="tf" id="place" name="place" maxLength={40} required placeholder="예: 홍대" />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="note">
            한마디 <span className="counter">선택</span>
          </label>
          <input className="tf" id="note" name="note" maxLength={300} placeholder="예: 끝나고 같이 밥 먹어요" />
        </div>
        <div className="ctabar">
          <SubmitButton>모집 글 올리기</SubmitButton>
        </div>
      </form>
    </main>
  )
}
