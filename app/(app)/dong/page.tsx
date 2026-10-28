import Link from 'next/link'
import { AppBar } from '@/components/AppBar'
import { Icon } from '@/components/Icon'
import { SubmitButton } from '@/components/SubmitButton'
import { Empty, StatusPill } from '@/components/ui'
import { canWriteDong, requireMember } from '@/lib/auth'
import { BUY_STEPS, GEAR_STATUS, REPAIR_STEPS, ROOM_HOURS } from '@/lib/constants'
import { addDays, dlabel, isDateString, todayKST, won } from '@/lib/date'
import { photoUrl } from '@/lib/supabase/env'
import { addGear, book, cancelBooking, deleteGear, setGearStatus } from './actions'

export const metadata = { title: '동방' }

type Tab = 'req' | 'gear' | 'room'
type Gear = { id: number; name: string; category: string; status: keyof typeof GEAR_STATUS }

export default async function DongPage({ searchParams }: { searchParams: Promise<{ tab?: string; f?: string; date?: string }> }) {
  const sp = await searchParams
  const tab: Tab = sp.tab === 'gear' || sp.tab === 'room' ? sp.tab : 'req'
  const { me } = await requireMember()

  return (
    <>
      <AppBar />
      <main className="main">
        <div className="hero">
          <h1>동방</h1>
        </div>
        <nav className="tabs" aria-label="동방 메뉴">
          {(
            [
              ['req', '요청'],
              ['gear', '악기 현황'],
              ['room', '예약'],
            ] as const
          ).map(([k, v]) => (
            <Link key={k} href={`/dong?tab=${k}`} aria-current={tab === k ? 'page' : undefined} scroll={false}>
              {v}
            </Link>
          ))}
        </nav>
        {tab === 'req' ? <Requests filter={sp.f} canWrite={canWriteDong(me)} /> : null}
        {tab === 'gear' ? <GearList admin={me.role === 'admin'} canWrite={canWriteDong(me)} /> : null}
        {tab === 'room' ? <Room date={isDateString(sp.date) ? sp.date : todayKST()} /> : null}
      </main>
    </>
  )
}

async function Requests({ filter, canWrite }: { filter?: string; canWrite: boolean }) {
  const { supabase } = await requireMember()
  const f = filter === 'repair' || filter === 'buy' ? filter : 'all'
  const [{ data: repairs }, { data: buys }] = await Promise.all([
    f === 'buy'
      ? { data: [] }
      : supabase.from('repair_requests').select('id, status, urgency, photos, gear_other, created_at, gear:gear(name), author:profiles!repair_requests_user_id_fkey(name)').order('created_at', { ascending: false }).limit(40),
    f === 'repair'
      ? { data: [] }
      : supabase.from('buy_proposals').select('id, name, price, status, held, photos, created_at, author:profiles!buy_proposals_user_id_fkey(name), proposal_cheers(count)').order('created_at', { ascending: false }).limit(40),
  ])
  type Row = { kind: 'repair' | 'buy'; id: number; title: string; sub: string; status: number; held: boolean; photo?: string; at: string }
  const rows: Row[] = [
    ...((repairs ?? []) as unknown as { id: number; status: number; urgency: string; photos: string[]; gear_other: string | null; created_at: string; gear: { name: string } | null; author: { name: string } | null }[]).map((r) => ({
      kind: 'repair' as const,
      id: r.id,
      title: r.gear?.name ?? r.gear_other ?? '',
      sub: `수리 · ${r.urgency} · ${r.author?.name ?? ''}`,
      status: r.status,
      held: false,
      photo: r.photos[0],
      at: r.created_at,
    })),
    ...((buys ?? []) as unknown as { id: number; name: string; price: number; status: number; held: boolean; photos: string[]; created_at: string; author: { name: string } | null; proposal_cheers: { count: number }[] }[]).map((b) => ({
      kind: 'buy' as const,
      id: b.id,
      title: b.name,
      sub: `구매 · ${won(b.price)} · 공감 ${b.proposal_cheers[0]?.count ?? 0} · ${b.author?.name ?? ''}`,
      status: b.status,
      held: b.held,
      photo: b.photos[0],
      at: b.created_at,
    })),
  ].sort((a, b) => Number(a.status === 3 || a.held) - Number(b.status === 3 || b.held) || b.at.localeCompare(a.at))

  return (
    <>
      <div className="tiles">
        <Link className="tile" href="/dong/repair/new">
          <span className="ic">
            <Icon name="wrench" />
          </span>
          <b>수리 요청</b>
          <span className="cap">고장 난 악기 알리기</span>
        </Link>
        <Link className="tile" href="/dong/buy/new">
          <span className="ic a">
            <Icon name="bag" />
          </span>
          <b>구매 제안</b>
          <span className="cap">샀으면 하는 악기</span>
        </Link>
      </div>
      {!canWrite ? <div className="note">졸업생은 요청을 보고 &quot;나도 필요해요&quot;로 공감할 수 있어요. 요청은 재학생이 써요.</div> : null}
      <section className="box">
        <div className="box-title">
          <h2>요청 목록</h2>
          <div className="chips">
            {(
              [
                ['all', '전체'],
                ['repair', '수리'],
                ['buy', '구매'],
              ] as const
            ).map(([k, v]) => (
              <Link key={k} className="chip" href={`/dong?tab=req&f=${k}`} aria-current={f === k ? 'page' : undefined} scroll={false}>
                {v}
              </Link>
            ))}
          </div>
        </div>
        <div className="rows">
          {rows.length ? (
            rows.map((r) => (
              <Link key={r.kind + r.id} className="lrow" href={`/dong/${r.kind}/${r.id}`}>
                <span className={`ic${r.kind === 'buy' ? ' a' : ''}`}>
                  {r.photo ? <img src={photoUrl(r.photo)} alt="" /> : <Icon name={r.kind === 'buy' ? 'bag' : 'wrench'} />}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t">{r.title}</span>
                  <span className="s">{r.sub}</span>
                </span>
                <StatusPill steps={r.kind === 'buy' ? BUY_STEPS : REPAIR_STEPS} status={r.status} held={r.held} />
              </Link>
            ))
          ) : (
            <Empty>아직 요청이 없어요.</Empty>
          )}
        </div>
      </section>
    </>
  )
}

async function GearList({ admin, canWrite }: { admin: boolean; canWrite: boolean }) {
  const { supabase } = await requireMember()
  const [{ data }, { data: open }] = await Promise.all([
    supabase.from('gear').select('id, name, category, status').order('sort').order('category').order('name'),
    supabase.from('repair_requests').select('id, gear_id').lt('status', 3).not('gear_id', 'is', null).order('created_at', { ascending: false }),
  ])
  const gear = (data ?? []) as Gear[]
  const openReq = new Map((open ?? []).map((r) => [r.gear_id as number, r.id as number]))
  const count = (s: Gear['status']) => gear.filter((g) => g.status === s).length

  return (
    <>
      <section className="box">
        <div className="statnums">
          <div>
            <b>{count('ok')}</b>
            <span className="cap">정상</span>
          </div>
          <div>
            <b style={{ color: 'var(--danger)' }}>{count('broken')}</b>
            <span className="cap">고장</span>
          </div>
          <div>
            <b style={{ color: 'var(--primary)' }}>{count('repairing')}</b>
            <span className="cap">수리 중</span>
          </div>
        </div>
      </section>
      <section className="box">
        <div className="box-title">
          <h2>동방 악기</h2>
          {canWrite ? <span className="cap">누르면 수리 요청</span> : null}
        </div>
        <div className="rows">
          {gear.map((g) => {
            const req = openReq.get(g.id)
            const href = req ? `/dong/repair/${req}` : canWrite ? `/dong/repair/new?gear=${g.id}` : null
            const body = (
              <>
                <span className="ic">
                  <Icon name="amp" />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t">{g.name}</span>
                  <span className="s">{g.category}</span>
                </span>
                <span className={`pill ${GEAR_STATUS[g.status].tone}`}>{GEAR_STATUS[g.status].label}</span>
              </>
            )
            return (
              <div key={g.id}>
                {href ? (
                  <Link className="lrow" href={href}>
                    {body}
                  </Link>
                ) : (
                  <div className="lrow">{body}</div>
                )}
                {admin ? (
                  <div className="row" style={{ paddingLeft: 54, paddingBottom: 8, gap: 6, flexWrap: 'wrap' }}>
                    {(Object.keys(GEAR_STATUS) as Gear['status'][]).map((s) => (
                      <form key={s} action={setGearStatus}>
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="status" value={s} />
                        <button className="chip" type="submit" aria-pressed={g.status === s} style={{ padding: '4px 10px', fontSize: 12 }}>
                          {GEAR_STATUS[s].label}
                        </button>
                      </form>
                    ))}
                    <form action={deleteGear}>
                      <input type="hidden" name="id" value={g.id} />
                      <button className="chip danger" type="submit" style={{ padding: '4px 10px', fontSize: 12 }}>
                        빼기
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            )
          })}
          {!gear.length ? <Empty>{admin ? '아래에서 동방 악기를 추가해 주세요.' : '운영진이 동방 악기 목록을 아직 만들지 않았어요.'}</Empty> : null}
        </div>
      </section>
      {admin ? (
        <form action={addGear} className="box">
          <div className="box-title">
            <h2>악기 추가</h2>
          </div>
          <div className="inline" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <input className="tf" name="name" placeholder="예: 베이스 앰프" aria-label="악기 이름" maxLength={40} required />
            <input className="tf" name="category" placeholder="분류" aria-label="분류" maxLength={20} required list="gearcats" />
            <datalist id="gearcats">
              {['드럼', '건반', '앰프', '음향', '관악', '기타'].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <SubmitButton className="cta weak">추가</SubmitButton>
        </form>
      ) : null}
    </>
  )
}

async function Room({ date }: { date: string }) {
  const { supabase, me } = await requireMember()
  const today = todayKST()
  const { data } = await supabase.from('room_bookings').select('id, hour, note, user_id, who:profiles!room_bookings_user_id_fkey(name)').eq('date', date)
  const bookings = (data ?? []) as unknown as { id: number; hour: number; note: string | null; user_id: string; who: { name: string } | null }[]
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const canBook = canWriteDong(me) && date >= today
  const myCount = bookings.filter((b) => b.user_id === me.id).length

  return (
    <>
      <div className="scroller">
        {days.map((d) => (
          <Link key={d} className="chip" href={`/dong?tab=room&date=${d}`} aria-current={d === date ? 'page' : undefined} scroll={false}>
            {d === today ? '오늘' : dlabel(d)}
          </Link>
        ))}
      </div>
      <section className="box">
        <div className="box-title">
          <h2>{dlabel(date)}</h2>
          <span className="cap">하루 최대 2시간 · 내 예약 {myCount}시간</span>
        </div>
        {!canWriteDong(me) ? <div className="note">동방 예약은 재학생만 할 수 있어요. 졸업생은 현황만 볼 수 있어요.</div> : null}
        <div className="slots">
          {ROOM_HOURS.map((h) => {
            const b = bookings.find((x) => x.hour === h)
            const mine = b?.user_id === me.id
            const label = `${String(h).padStart(2, '0')}:00`
            if (b) {
              return mine || me.role === 'admin' ? (
                <form key={h} action={cancelBooking}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="date" value={date} />
                  <button type="submit" className={`slot${mine ? ' mine' : ''}`} aria-label={`${label} 예약 취소`}>
                    <span className="h">{label}</span>
                    <span className="w">{mine ? '내 예약 · 누르면 취소' : `${b.who?.name} · 취소`}</span>
                  </button>
                </form>
              ) : (
                <div key={h} className="slot">
                  <span className="h">{label}</span>
                  <span className="w">
                    {b.who?.name} · {b.note}
                  </span>
                </div>
              )
            }
            return canBook ? (
              <form key={h} action={book}>
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="hour" value={h} />
                <button type="submit" className="slot free" aria-label={`${label} 예약하기`} disabled={myCount >= 2}>
                  <span className="h">{label}</span>
                  <span className="w">{myCount >= 2 ? '오늘은 다 썼어요' : '예약 가능'}</span>
                </button>
              </form>
            ) : (
              <div key={h} className="slot free">
                <span className="h">{label}</span>
                <span className="w">비어 있음</span>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
