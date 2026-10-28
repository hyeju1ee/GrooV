import { SubmitButton } from '@/components/SubmitButton'
import { TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { addTune, toggleTune } from '../actions'

export const metadata = { title: '연주할 수 있는 곡' }

export default async function TunesPage() {
  const { supabase, me } = await requireMember()
  const [{ data: tunes }, { data: mine }] = await Promise.all([
    supabase.from('tunes').select('id, title, key, form').order('title'),
    supabase.from('member_tunes').select('tune_id').eq('user_id', me.id),
  ])
  const have = new Set((mine ?? []).map((m) => m.tune_id as number))

  return (
    <main className="main sub">
      <TopBar back="/me" title="연주할 수 있는 곡" />
      <p className="sub2" style={{ margin: 0 }}>
        잼데이에 신청하면 참가자들이 같이 칠 수 있는 곡을 이 목록으로 추천해요. 지금 바로 칠 수 있는 곡만 골라주세요.
      </p>
      <div className="chips">
        {(tunes ?? []).map((t) => {
          const on = have.has(t.id)
          return (
            <form key={t.id} action={toggleTune}>
              <input type="hidden" name="tune_id" value={t.id} />
              <input type="hidden" name="on" value={on ? '1' : '0'} />
              <button type="submit" className="chip" aria-pressed={on} title={[t.key, t.form].filter(Boolean).join(' · ')}>
                {t.title}
              </button>
            </form>
          )
        })}
      </div>
      <div className="divider" />
      <form action={addTune} className="stack" style={{ gap: 10 }}>
        <span className="flabel">목록에 없는 곡 추가</span>
        <div className="inline" style={{ gridTemplateColumns: '2fr 1fr auto' }}>
          <input className="tf" name="title" placeholder="곡 이름" aria-label="곡 이름" maxLength={60} required />
          <input className="tf" name="key" placeholder="키" aria-label="키" maxLength={10} />
          <SubmitButton className="cta weak">추가</SubmitButton>
        </div>
      </form>
    </main>
  )
}
