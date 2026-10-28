import { notFound } from 'next/navigation'
import { InstStrip } from '@/components/InstStrip'
import { SubmitButton } from '@/components/SubmitButton'
import { TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { INSTRUMENTS, wikiSearch } from '@/lib/constants'
import { dlabel, hm, todayKST } from '@/lib/date'
import { getSignups, missingRhythm, tuneMatch } from '@/lib/jam'
import type { GroovEvent } from '@/lib/types'
import { joinJam, leaveJam, requestTune, toggleTuneVote } from '../actions'

export const metadata = { title: '잼데이' }

export default async function JamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, me } = await requireMember()
  const { data: event } = await supabase.from('events').select('*').eq('id', Number(id)).eq('type', 'jam').maybeSingle<GroovEvent>()
  if (!event) notFound()

  const signups = await getSignups(supabase, event.id)
  const mine = signups.find((s) => s.user_id === me.id)
  const missing = missingRhythm(signups)
  const N = signups.length
  const ranked = (await tuneMatch(supabase, signups.map((s) => s.user_id))).slice(0, 8)
  const past = event.date < todayKST()

  const { data: reqData } = await supabase
    .from('jam_requests')
    .select('id, tune, user_id, author:profiles!jam_requests_user_id_fkey(name), jam_request_votes(user_id)')
    .eq('event_id', event.id)
  const reqs = ((reqData ?? []) as unknown as { id: number; tune: string; author: { name: string } | null; jam_request_votes: { user_id: string }[] }[])
    .map((r) => ({ ...r, n: r.jam_request_votes.length, on: r.jam_request_votes.some((v) => v.user_id === me.id) }))
    .sort((a, b) => b.n - a.n)
  const { data: tunes } = await supabase.from('tunes').select('title').order('title')

  return (
    <main className="main sub">
      <TopBar back={`/calendar?d=${event.date}`} />
      <div className="hero" style={{ paddingTop: 0 }}>
        <span className="cap">
          {hm(event.start_time)} · {event.place ?? '동방'} · 참가 {N}명
        </span>
        <h1>
          {event.title} {dlabel(event.date)}
        </h1>
        {event.note ? <span className="sub2">{event.note}</span> : null}
      </div>

      <InstStrip signups={signups} names />
      {missing.length && !past ? <div className="note d">{missing.join(', ')}가 아직 0명이에요.</div> : null}

      {!past ? (
        <form action={mine ? leaveJam : joinJam} className="stack" style={{ gap: 10 }}>
          <input type="hidden" name="event_id" value={event.id} />
          {mine ? (
            <div className="note p">{mine.instrument}로 참가 신청했어요.</div>
          ) : (
            <div className="field">
              <span className="flabel">내 악기</span>
              <div className="chips">
                {INSTRUMENTS.map((i) => (
                  <label key={i} className="chip">
                    <input type="radio" name="instrument" value={i} defaultChecked={i === me.instrument} />
                    {i}
                  </label>
                ))}
              </div>
              {me.role === 'ob' ? <span className="cap">졸업생은 참가자 목록에 OB로 표시돼요.</span> : null}
            </div>
          )}
          <SubmitButton className={mine ? 'cta grey' : 'cta'}>{mine ? '참가 취소하기' : '참가 신청하기'}</SubmitButton>
        </form>
      ) : (
        <div className="note">지난 잼데이예요.</div>
      )}

      <div className="divider" />
      <div className="box-title">
        <h2>같이 칠 수 있는 곡</h2>
        <span className="cap">참가자 {N}명 기준</span>
      </div>
      {ranked.length ? (
        <div>
          {ranked.map((t) => (
            <div key={t.title} className="tunerow">
              <span style={{ minWidth: 0, display: 'grid' }}>
                <b>{t.title}</b>
                <span className="cap">
                  {[t.key, t.form].filter(Boolean).join(' · ')}
                  {t.key || t.form ? ' · ' : ''}
                  <a href={wikiSearch(t.title)} target="_blank" rel="noopener noreferrer">
                    위키
                  </a>
                </span>
              </span>
              {t.n === N ? <span className="pill s">전원 가능</span> : <span className="cap">{t.n}/{N}명</span>}
              <div className={`meter${t.n === N ? ' all' : ''}`}>
                <i style={{ width: `${Math.round((t.n / N) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="sub2" style={{ margin: 0 }}>
          참가자들이 내 정보에서 연주할 수 있는 곡을 체크하면 여기에 추천 곡이 나와요.
        </p>
      )}

      <div className="divider" />
      <div className="box-title">
        <h2>하고 싶은 곡</h2>
        <span className="cap">+1 많은 순</span>
      </div>
      <div className="rows">
        {reqs.map((r) => (
          <div key={r.id} className="lrow noicon">
            <span>
              <b>{r.tune}</b> <span className="cap">{r.author?.name}</span>
            </span>
            <form action={toggleTuneVote}>
              <input type="hidden" name="event_id" value={event.id} />
              <input type="hidden" name="request_id" value={r.id} />
              <input type="hidden" name="on" value={r.on ? '1' : '0'} />
              <button className="plus" type="submit" aria-pressed={r.on} aria-label={`${r.tune} +1`}>
                +{r.n}
              </button>
            </form>
          </div>
        ))}
        {!reqs.length ? <span className="sub2">아직 신청한 곡이 없어요.</span> : null}
      </div>
      {!past ? (
        <form action={requestTune} className="inline">
          <input type="hidden" name="event_id" value={event.id} />
          <input className="tf" name="tune" placeholder="곡 이름" aria-label="신청할 곡 이름" list="tunelist" maxLength={60} required />
          <datalist id="tunelist">
            {(tunes ?? []).map((t) => (
              <option key={t.title} value={t.title} />
            ))}
          </datalist>
          <SubmitButton className="cta weak">신청</SubmitButton>
        </form>
      ) : null}
    </main>
  )
}
