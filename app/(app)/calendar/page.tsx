import Link from 'next/link'
import { AppBar } from '@/components/AppBar'
import { Icon } from '@/components/Icon'
import { requireMember } from '@/lib/auth'
import { EVENT_TYPES } from '@/lib/constants'
import { WEEKDAYS, dlabel, hm, isDateString, monthCells, shiftMonth, todayKST } from '@/lib/date'
import type { GroovEvent } from '@/lib/types'

export const metadata = { title: '일정' }

function eventHref(e: GroovEvent) {
  if (e.type === 'jam') return `/jam/${e.id}`
  if (e.type === 'out') return '/outings'
  return null
}

function EventRow({ e, admin }: { e: GroovEvent; admin: boolean }) {
  const href = eventHref(e) ?? (admin ? `/calendar/${e.id}/edit` : null)
  const inner = (
    <>
      <span className={`bar t-${e.type}`} />
      <span style={{ display: 'grid', minWidth: 0 }}>
        <b style={{ fontSize: 15 }}>{e.title}</b>
        <span className="cap">
          {EVENT_TYPES[e.type]} · {dlabel(e.date)} {hm(e.start_time)}
          {e.place ? ` · ${e.place}` : ''}
        </span>
        {e.note ? <span className="cap">{e.note}</span> : null}
      </span>
      <span className="r" style={{ color: 'var(--ink-3)', display: 'flex', gap: 2 }}>
        {admin && eventHref(e) ? (
          <Link className="chip" href={`/calendar/${e.id}/edit`}>
            고치기
          </Link>
        ) : null}
        {href ? <Icon name="chev" size={18} /> : null}
      </span>
    </>
  )
  return href ? (
    <Link className="evrow" href={href}>
      {inner}
    </Link>
  ) : (
    <div className="evrow">{inner}</div>
  )
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; d?: string }> }) {
  const sp = await searchParams
  const { supabase, me } = await requireMember()
  const today = todayKST()
  const sel = isDateString(sp.d) ? sp.d : today
  const ym = sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : sel.slice(0, 7)
  const admin = me.role === 'admin'

  const { data } = await supabase
    .from('events')
    .select('*')
    .gte('date', `${ym}-01`)
    .lt('date', `${shiftMonth(ym, 1)}-01`)
    .order('date')
    .order('start_time', { nullsFirst: true })
  const events = (data ?? []) as GroovEvent[]
  const onSel = events.filter((e) => e.date === sel)
  const upcoming = events.filter((e) => e.date >= today)
  const [y, m] = ym.split('-').map(Number)

  return (
    <>
      <AppBar />
      <main className="main">
        <div className="hero row between">
          <h1>일정</h1>
          {admin ? (
            <Link className="chip" href={`/calendar/new?d=${sel}`}>
              <Icon name="plus" size={16} /> 일정 등록
            </Link>
          ) : null}
        </div>
        <section className="box">
          <div className="calhead">
            <Link className="iconbtn" href={`/calendar?m=${shiftMonth(ym, -1)}`} aria-label="이전 달" scroll={false}>
              <Icon name="back" />
            </Link>
            <h2>
              {y}년 {m}월
            </h2>
            <Link className="iconbtn" href={`/calendar?m=${shiftMonth(ym, 1)}`} aria-label="다음 달" scroll={false}>
              <Icon name="next" />
            </Link>
          </div>
          <div className="calgrid">
            {WEEKDAYS.map((w) => (
              <span key={w} className="wd">
                {w}
              </span>
            ))}
            {monthCells(ym).map((d, i) => {
              if (!d) return <span key={`x${i}`} />
              const evs = events.filter((e) => e.date === d)
              return (
                <Link
                  key={d}
                  href={`/calendar?m=${ym}&d=${d}`}
                  scroll={false}
                  className={`day${d === today ? ' today' : ''}`}
                  aria-current={d === sel ? 'date' : undefined}
                  aria-label={`${Number(d.slice(8))}일${evs.length ? ', ' + evs.map((e) => EVENT_TYPES[e.type]).join(', ') : ''}`}
                >
                  {Number(d.slice(8))}
                  <span className="dots">
                    {evs.slice(0, 3).map((e) => (
                      <i key={e.id} className={`dot t-${e.type}`} />
                    ))}
                  </span>
                </Link>
              )
            })}
          </div>
          <div className="legend">
            {Object.entries(EVENT_TYPES).map(([k, v]) => (
              <span key={k}>
                <i className={`dot t-${k}`} />
                {v}
              </span>
            ))}
          </div>
        </section>

        <section className="box">
          <div className="box-title">
            <h2>{dlabel(sel)}</h2>
          </div>
          <div className="rows">
            {onSel.length ? onSel.map((e) => <EventRow key={e.id} e={e} admin={admin} />) : <span className="sub2">이 날은 일정이 없어요.</span>}
          </div>
        </section>

        <section className="box">
          <div className="box-title">
            <h2>{m}월 남은 일정</h2>
            <span className="cap">{upcoming.length}개</span>
          </div>
          <div className="rows">
            {upcoming.length ? upcoming.map((e) => <EventRow key={e.id} e={e} admin={admin} />) : <span className="sub2">남은 일정이 없어요.</span>}
          </div>
        </section>
      </main>
    </>
  )
}
