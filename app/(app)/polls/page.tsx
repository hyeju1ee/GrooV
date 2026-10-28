import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Empty, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { deletePoll, vote } from './actions'

export const metadata = { title: '앨범 투표' }

type Poll = {
  id: number
  title: string
  note: string | null
  closes_at: string
  poll_options: { id: number; title: string; artist: string | null; year: number | null; sort: number }[]
  poll_votes: { option_id: number; user_id: string }[]
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short' })

export default async function PollsPage() {
  const { supabase, me } = await requireMember()
  const admin = me.role === 'admin'
  const { data } = await supabase
    .from('polls')
    .select('id, title, note, closes_at, poll_options!poll_options_poll_id_fkey(id, title, artist, year, sort), poll_votes!poll_votes_poll_id_fkey(option_id, user_id)')
    .order('closes_at', { ascending: false })
    .limit(6)
  const polls = (data ?? []) as Poll[]
  const now = new Date().toISOString()

  return (
    <main className="main sub">
      <TopBar back="/listen" title="앨범 투표">
        {admin ? (
          <Link className="chip" href="/polls/new">
            <Icon name="plus" size={16} /> 투표 열기
          </Link>
        ) : null}
      </TopBar>
      {!polls.length ? <Empty>아직 열린 투표가 없어요.</Empty> : null}
      {polls.map((p) => {
        const open = p.closes_at > now
        const total = p.poll_votes.length
        const mine = p.poll_votes.find((v) => v.user_id === me.id)?.option_id
        const opts = [...p.poll_options].sort((a, b) => a.sort - b.sort)
        return (
          <section key={p.id} className="stack" style={{ gap: 10, paddingBottom: 12 }}>
            <div style={{ display: 'grid', gap: 2 }}>
              <span className="cap">
                {fmt(p.closes_at)} {open ? '마감' : '마감됨'} · {total}명 참여
              </span>
              <h1 className="q" style={{ fontSize: 21 }}>
                {p.title}
              </h1>
              {p.note ? <span className="sub2">{p.note}</span> : null}
            </div>
            <div className="opts">
              {opts.map((o) => {
                const n = p.poll_votes.filter((v) => v.option_id === o.id).length
                return (
                  <form key={o.id} action={vote}>
                    <input type="hidden" name="poll_id" value={p.id} />
                    <input type="hidden" name="option_id" value={o.id} />
                    <button type="submit" className="voteopt" aria-pressed={mine === o.id} disabled={!open}>
                      <span className="fill" style={{ width: `${total ? Math.round((n / total) * 100) : 0}%` }} />
                      <span className="t">{o.title}</span>
                      <span className="cap">{[o.artist, o.year].filter(Boolean).join(' · ')}</span>
                      <span className="c">{n}</span>
                    </button>
                  </form>
                )
              })}
            </div>
            {admin ? (
              <form action={deletePoll}>
                <input type="hidden" name="id" value={p.id} />
                <button className="chip danger" type="submit">
                  이 투표 지우기
                </button>
              </form>
            ) : null}
            <div className="divider" />
          </section>
        )
      })}
    </main>
  )
}
