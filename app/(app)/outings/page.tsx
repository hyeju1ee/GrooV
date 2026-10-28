import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import { Empty, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { dlabel, todayKST } from '@/lib/date'
import { deleteOuting, toggleOuting } from './actions'

export const metadata = { title: '외부 공연 같이 가기' }

type Outing = {
  id: number
  date: string
  title: string
  place: string
  capacity: number
  note: string | null
  user_id: string
  author: { name: string; cohort: string; role: string } | null
  outing_members: { user_id: string; who: { name: string } | null }[]
}

export default async function OutingsPage() {
  const { supabase, me } = await requireMember()
  const { data } = await supabase
    .from('outings')
    .select('id, date, title, place, capacity, note, user_id, author:profiles!outings_user_id_fkey(name, cohort, role), outing_members(user_id, who:profiles!outing_members_user_id_fkey(name))')
    .gte('date', todayKST())
    .order('date')
  const outings = (data ?? []) as unknown as Outing[]

  return (
    <main className="main sub">
      <TopBar back="/me" title="외부 공연 같이 가기" />
      {!outings.length ? <Empty>다가오는 동행 모집이 없어요. 가고 싶은 공연이 있다면 같이 갈 사람을 찾아보세요.</Empty> : null}
      {outings.map((o) => {
        const going = o.outing_members.some((m) => m.user_id === me.id)
        const full = o.outing_members.length >= o.capacity
        const mine = o.user_id === me.id
        return (
          <section key={o.id} className="box flat">
            <div style={{ display: 'grid', gap: 2 }}>
              <span className="cap">
                {dlabel(o.date)} · {o.place}
              </span>
              <h2 style={{ margin: 0, fontSize: 17 }}>{o.title}</h2>
            </div>
            <span className="sub2">
              {o.author?.name}({o.author?.cohort}
              {o.author?.role === 'ob' ? ' OB' : ''}){o.note ? ` · "${o.note}"` : ''}
            </span>
            <div className="row between">
              <span className="sub2">
                <b style={{ color: 'var(--ink)' }}>
                  {o.outing_members.length}/{o.capacity}명
                </b>{' '}
                · {o.outing_members.map((m) => m.who?.name).join(', ')}
              </span>
              {mine ? (
                <form action={deleteOuting}>
                  <input type="hidden" name="id" value={o.id} />
                  <button type="submit" className="chip danger">
                    지우기
                  </button>
                </form>
              ) : (
                <form action={toggleOuting}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="on" value={going ? '1' : '0'} />
                  <SubmitButton className={`cta sm auto${going ? ' grey' : ''}`} disabled={!going && full}>
                    {going ? '취소' : full ? '마감' : '같이 가기'}
                  </SubmitButton>
                </form>
              )}
            </div>
          </section>
        )
      })}
      <Link className="cta weak" href="/outings/new">
        동행 모집하기
      </Link>
    </main>
  )
}
