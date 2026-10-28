import Link from 'next/link'
import { AppBar } from '@/components/AppBar'
import { Icon } from '@/components/Icon'
import { InstStrip } from '@/components/InstStrip'
import { Avatar, StatusPill } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { BUY_STEPS, EVENT_TYPES, REPAIR_STEPS } from '@/lib/constants'
import { ago, daysBetween, dlabel, dlong, hm, todayKST } from '@/lib/date'
import { getSignups, missingRhythm } from '@/lib/jam'
import type { GroovEvent } from '@/lib/types'

type FeedItem = { at: string; name: string; ob: boolean; href: string; t: string; s: string }
type Who = { name: string; role: string } | null

function headline(e: GroovEvent | null, today: string) {
  if (!e) return '다가오는 일정이 아직 없어요'
  const label = EVENT_TYPES[e.type]
  const diff = daysBetween(today, e.date)
  if (diff === 0) return `오늘은 ${label}예요`
  if (diff === 1) return `내일은 ${label}예요`
  return `${diff}일 뒤에 ${label}가 있어요`
}

export default async function HomePage() {
  const { supabase, me } = await requireMember()
  const today = todayKST()

  const [{ data: nextEvents }, { data: repairs }, { data: buys }, { data: polls }, posts, tracks, reqs, outings] = await Promise.all([
    supabase.from('events').select('*').gte('date', today).order('date').order('start_time', { nullsFirst: true }).limit(1),
    supabase.from('repair_requests').select('id, status, gear_other, gear:gear(name), author:profiles!repair_requests_user_id_fkey(name)').lt('status', 3).order('created_at', { ascending: false }).limit(2),
    supabase.from('buy_proposals').select('id, name, proposal_cheers(user_id)').lt('status', 2).eq('held', false).order('created_at', { ascending: false }).limit(20),
    supabase.from('polls').select('id, title, closes_at, poll_options!poll_options_poll_id_fkey(id, title), poll_votes!poll_votes_poll_id_fkey(option_id, user_id)').gt('closes_at', new Date().toISOString()).order('closes_at').limit(1),
    supabase.from('posts').select('id, title, tag, created_at, author:profiles!posts_user_id_fkey(name, role)').eq('hidden', false).order('created_at', { ascending: false }).limit(4),
    supabase.from('tracks').select('id, title, artist, session_id, created_at, author:profiles!tracks_user_id_fkey(name, role)').order('created_at', { ascending: false }).limit(3),
    supabase.from('jam_requests').select('id, tune, event_id, created_at, author:profiles!jam_requests_user_id_fkey(name, role)').order('created_at', { ascending: false }).limit(3),
    supabase.from('outings').select('id, title, date, capacity, created_at, author:profiles!outings_user_id_fkey(name, role), outing_members(user_id)').gte('date', today).order('created_at', { ascending: false }).limit(2),
  ])

  const next = (nextEvents?.[0] ?? null) as GroovEvent | null
  const signups = next?.type === 'jam' ? await getSignups(supabase, next.id) : []
  const joined = signups.some((s) => s.user_id === me.id)
  const missing = missingRhythm(signups)

  const topBuy = ((buys ?? []) as { id: number; name: string; proposal_cheers: { user_id: string }[] }[]).sort(
    (a, b) => b.proposal_cheers.length - a.proposal_cheers.length,
  )[0]
  const poll = polls?.[0] as
    | { id: number; title: string; closes_at: string; poll_options: { id: number; title: string }[]; poll_votes: { option_id: number; user_id: string }[] }
    | undefined
  const leader = poll
    ? poll.poll_options
        .map((o) => ({ ...o, n: poll.poll_votes.filter((v) => v.option_id === o.id).length }))
        .sort((a, b) => b.n - a.n)[0]
    : null

  const who = (w: unknown) => (w as Who) ?? { name: '?', role: 'student' }
  const feed: FeedItem[] = [
    ...(posts.data ?? []).map((p) => ({ at: p.created_at, name: who(p.author).name, ob: who(p.author).role === 'ob', href: `/talk/${p.id}`, t: p.title, s: `토크 · ${p.tag} · ${who(p.author).name}` })),
    ...(tracks.data ?? []).map((t) => ({ at: t.created_at, name: who(t.author).name, ob: who(t.author).role === 'ob', href: `/listen?s=${t.session_id}`, t: `${t.artist} - ${t.title}`, s: `플레이리스트 · ${who(t.author).name}` })),
    ...(reqs.data ?? []).map((r) => ({ at: r.created_at, name: who(r.author).name, ob: who(r.author).role === 'ob', href: `/jam/${r.event_id}`, t: `잼데이 신청곡 ${r.tune}`, s: `잼데이 · ${who(r.author).name}` })),
    ...(outings.data ?? []).map((o) => ({ at: o.created_at, name: who(o.author).name, ob: who(o.author).role === 'ob', href: '/outings', t: `${dlabel(o.date)} ${o.title}`, s: `동행 모집 · ${o.outing_members.length}/${o.capacity}명 · ${who(o.author).name}` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6)

  return (
    <>
      <AppBar />
      <main className="main">
        <div className="hero">
          <span className="cap">{dlong(today)}</span>
          <h1>
            {me.name}님,
            <br />
            {headline(next, today)}
          </h1>
        </div>

        {next ? (
          <section className="box">
            <div className="box-title">
              <h2>
                {dlabel(next.date)} {hm(next.start_time)} · {next.place ?? EVENT_TYPES[next.type]}
              </h2>
              {joined ? <span className="pill s">참가 신청함</span> : null}
            </div>
            {next.type === 'jam' ? (
              <>
                <InstStrip signups={signups} />
                {missing.length ? (
                  <div className="note d">{missing.join(', ')}가 아직 0명이에요. 칠 수 있는 분을 찾고 있어요.</div>
                ) : (
                  <div className="note">리듬 섹션이 다 모였어요.</div>
                )}
                <Link className="cta" href={`/jam/${next.id}`}>
                  {joined ? '신청 내용 보기' : '악기 골라서 참가하기'}
                </Link>
              </>
            ) : (
              <>
                <span className="sub2">{next.title}</span>
                <Link className="cta weak" href={`/calendar?d=${next.date}`}>
                  일정 보기
                </Link>
              </>
            )}
          </section>
        ) : (
          <Link className="box" href="/calendar">
            <span className="sub2">캘린더에서 지난 활동을 볼 수 있어요.</span>
          </Link>
        )}

        <section className="box">
          <div className="box-title">
            <h2>동방 소식</h2>
            <Link className="more" href="/dong">
              전체 <Icon name="chev" size={18} />
            </Link>
          </div>
          <div className="rows">
            {(repairs ?? []).map((r) => {
              const g = r.gear as unknown as { name: string } | null
              return (
                <Link key={r.id} className="lrow" href={`/dong/repair/${r.id}`}>
                  <span className="ic">
                    <Icon name="wrench" />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="t">{g?.name ?? r.gear_other}</span>
                    <span className="s">수리 요청 · {who(r.author).name}</span>
                  </span>
                  <StatusPill steps={REPAIR_STEPS} status={r.status} />
                </Link>
              )
            })}
            {topBuy ? (
              <Link className="lrow" href={`/dong/buy/${topBuy.id}`}>
                <span className="ic a">
                  <Icon name="bag" />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t">{topBuy.name}</span>
                  <span className="s">구매 제안 · 나도 필요해요 {topBuy.proposal_cheers.length}명</span>
                </span>
                <span className="r">
                  <Icon name="chev" size={18} />
                </span>
              </Link>
            ) : null}
            {!repairs?.length && !topBuy ? <span className="sub2">고장 난 악기도, 진행 중인 제안도 없어요.</span> : null}
          </div>
        </section>

        {poll ? (
          <Link className="box" href="/polls">
            <div className="box-title">
              <h2>{poll.title}</h2>
              <span className="pill p">
                {new Date(poll.closes_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })} 마감
              </span>
            </div>
            <span className="sub2">
              {leader && leader.n > 0 ? (
                <>
                  지금 1위는 <b style={{ color: 'var(--ink)' }}>{leader.title}</b>
                </>
              ) : (
                '아직 아무도 투표하지 않았어요'
              )}
              {poll.poll_votes.some((v) => v.user_id === me.id) ? ' · 투표했어요' : ' · 아직 투표하지 않았어요'}
            </span>
          </Link>
        ) : null}

        <section className="box">
          <div className="box-title">
            <h2>그루브 소식</h2>
          </div>
          <div className="rows">
            {feed.length ? (
              feed.map((f) => (
                <Link key={f.href + f.at} className="lrow" href={f.href}>
                  <Avatar name={f.name} ob={f.ob} />
                  <span style={{ minWidth: 0 }}>
                    <span className="t">{f.t}</span>
                    <span className="s">
                      {f.s} · {ago(f.at)}
                    </span>
                  </span>
                  <span className="r">
                    <Icon name="chev" size={18} />
                  </span>
                </Link>
              ))
            ) : (
              <span className="sub2">아직 소식이 없어요. 토크에 첫 글을 남겨보세요.</span>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
