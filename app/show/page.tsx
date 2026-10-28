import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { dlong, hm, todayKST } from '@/lib/date'
import type { GroovEvent } from '@/lib/types'

export const metadata = { title: '정기공연', robots: { index: true, follow: true } }
export const dynamic = 'force-dynamic'

// 로그인 없이 누구나 보는 홍보용 페이지. 정기공연 일정만 공개돼요.
export default async function ShowPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('*').eq('type', 'show').gte('date', todayKST()).order('date')
  const shows = (data ?? []) as GroovEvent[]

  return (
    <main className="auth" style={{ gap: 20 }}>
      <span className="logo">
        Groo<span className="v">V</span>
      </span>
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="stepcap">성균관대학교 재즈동아리 그루브</span>
        <h1 className="q">정기공연에 초대합니다</h1>
      </div>
      {shows.length ? (
        shows.map((s) => (
          <section key={s.id} className="wrapped">
            <span className="cap">
              {dlong(s.date)} {hm(s.start_time)}
            </span>
            <h2>{s.title}</h2>
            {s.place ? <span>{s.place}</span> : null}
            {s.note ? <span className="cap" style={{ whiteSpace: 'pre-wrap' }}>{s.note}</span> : null}
          </section>
        ))
      ) : (
        <p className="sub2" style={{ margin: 0 }}>
          다음 정기공연 일정이 정해지면 여기에 올라와요.
        </p>
      )}
      <p className="cap" style={{ margin: 0 }}>
        부원이신가요? <Link href="/login">로그인</Link>
      </p>
    </main>
  )
}
