import { Empty, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { todayKST } from '@/lib/date'

export const metadata = { title: '연말결산' }

type Recap = {
  tracks: number
  sessions: number
  jams: number
  shows: number
  repairs: number
  top_artists: { name: string; n: number }[]
  top_tunes: { name: string; n: number }[]
  top_jammers: { name: string; instrument: string; n: number }[]
}

function Ranking({ title, rows }: { title: string; rows: { name: string; n: number }[] }) {
  if (!rows.length) return null
  const max = rows[0].n || 1
  return (
    <section className="box flat">
      <b>{title}</b>
      {rows.map((r) => (
        <div key={r.name} style={{ display: 'grid', gap: 6 }}>
          <div className="row between">
            <span>{r.name}</span>
            <b>{r.n}</b>
          </div>
          <div className="meter">
            <i style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </section>
  )
}

export default async function RecapPage({ searchParams }: { searchParams: Promise<{ y?: string }> }) {
  const sp = await searchParams
  const { supabase } = await requireMember()
  const thisYear = Number(todayKST().slice(0, 4))
  const year = Number(sp.y) >= 2020 && Number(sp.y) <= thisYear ? Number(sp.y) : thisYear
  const { data } = await supabase.rpc('recap', { p_year: year })
  const r = data as Recap | null

  return (
    <main className="main sub">
      <TopBar back="/me" title={`${year} 연말결산`} />
      {!r ? (
        <Empty>결산을 불러오지 못했어요.</Empty>
      ) : (
        <>
          <div className="wrapped">
            <span className="cap">{year} GROOV WRAPPED</span>
            <h2>
              올해 그루브는 재즈를
              <br />
              {r.tracks}곡 들었어요
            </h2>
            <span className="cap">
              감상모임 {r.sessions}회 · 잼데이 {r.jams}회 · 정기공연 {r.shows}회 · 악기 수리 {r.repairs}건
            </span>
          </div>
          <Ranking title="감상모임에서 가장 많이 튼 연주자" rows={r.top_artists} />
          <Ranking title="잼데이에서 가장 많이 신청한 곡" rows={r.top_tunes} />
          {r.top_jammers.length ? (
            <section className="box flat">
              <b>잼데이 개근상</b>
              {r.top_jammers.map((j, i) => (
                <div key={j.name} className="row between">
                  <span>
                    {i + 1}. {j.name} <span className="cap">{j.instrument}</span>
                  </span>
                  <b>{j.n}회</b>
                </div>
              ))}
            </section>
          ) : null}
          <div className="note">숫자는 앱에 기록된 활동으로 계산해요. 12월 마지막 감상모임에서 함께 보고 위키 회고 문서로 남겨보세요.</div>
        </>
      )}
    </main>
  )
}
