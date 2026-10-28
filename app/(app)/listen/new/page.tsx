import { SubmitButton } from '@/components/SubmitButton'
import { TopBar } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { todayKST } from '@/lib/date'
import { createSession } from '../actions'

export const metadata = { title: '감상모임 열기' }

export default async function NewSessionPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('sessions').select('no').order('no', { ascending: false }).limit(1)
  const nextNo = (data?.[0]?.no ?? 0) + 1
  return (
    <main className="main sub">
      <TopBar back="/listen" title="감상모임 열기" />
      <form action={createSession} className="stack">
        <div className="inline" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div className="field">
            <label className="flabel" htmlFor="no">
              회차
            </label>
            <input className="tf" id="no" name="no" type="number" min={1} defaultValue={nextNo} required />
          </div>
          <div className="field">
            <label className="flabel" htmlFor="date">
              날짜
            </label>
            <input className="tf" id="date" name="date" type="date" defaultValue={todayKST()} required />
          </div>
        </div>
        <div className="field">
          <label className="flabel" htmlFor="title">
            주제
          </label>
          <input className="tf" id="title" name="title" maxLength={60} placeholder="예: 하드밥의 탄생" required />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="host">
            진행 <span className="counter">선택</span>
          </label>
          <input className="tf" id="host" name="host" maxLength={20} />
        </div>
        <div className="ctabar">
          <SubmitButton>감상모임 열기</SubmitButton>
        </div>
      </form>
    </main>
  )
}
