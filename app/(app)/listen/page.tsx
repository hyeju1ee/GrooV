import Link from 'next/link'
import { AppBar } from '@/components/AppBar'
import { Icon } from '@/components/Icon'
import { LikeButton } from '@/components/LikeButton'
import { Empty } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { spotifySearch, wikiSearch, youtubeSearch } from '@/lib/constants'
import { dlabel } from '@/lib/date'
import { deleteTrack, toggleTrackLike } from './actions'

export const metadata = { title: '감상' }

type Track = {
  id: number
  title: string
  artist: string
  album: string | null
  year: number | null
  url: string | null
  comment: string | null
  user_id: string
  author: { name: string } | null
  track_likes: { user_id: string }[]
}

export default async function ListenPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = await searchParams
  const { supabase, me } = await requireMember()
  const admin = me.role === 'admin'
  const { data: sessions } = await supabase.from('sessions').select('id, no, title, date, host').order('no', { ascending: false }).limit(30)
  const current = sessions?.find((s) => String(s.id) === sp.s) ?? sessions?.[0]

  const { data: trackData } = current
    ? await supabase
        .from('tracks')
        .select('id, title, artist, album, year, url, comment, user_id, author:profiles!tracks_user_id_fkey(name), track_likes(user_id)')
        .eq('session_id', current.id)
        .order('created_at')
    : { data: [] }
  const tracks = (trackData ?? []) as unknown as Track[]

  return (
    <>
      <AppBar />
      <main className="main">
        <div className="hero row between">
          <h1>감상</h1>
          {admin ? (
            <Link className="chip" href="/listen/new">
              <Icon name="plus" size={16} /> 감상모임 열기
            </Link>
          ) : null}
        </div>

        <div className="tiles">
          <Link className="tile" href="/polls">
            <span className="ic p">
              <Icon name="vote" />
            </span>
            <b>앨범 투표</b>
            <span className="cap">다음 감상모임 앨범 고르기</span>
          </Link>
          <Link className="tile" href="/quiz">
            <span className="ic a">
              <Icon name="disc" />
            </span>
            <b>블라인드 퀴즈</b>
            <span className="cap">누구의 연주일까요?</span>
          </Link>
        </div>

        {!current ? (
          <section className="box">
            <Empty>{admin ? '첫 감상모임을 열어 플레이리스트를 시작해 보세요.' : '아직 열린 감상모임이 없어요.'}</Empty>
          </section>
        ) : (
          <>
            <div className="scroller">
              {sessions!.map((s) => (
                <Link key={s.id} className="chip" href={`/listen?s=${s.id}`} aria-current={s.id === current.id ? 'page' : undefined} scroll={false}>
                  #{s.no} {s.title}
                </Link>
              ))}
            </div>
            <div className="wrapped">
              <span className="cap">
                감상모임 #{current.no} · {dlabel(current.date)}
                {current.host ? ` · 진행 ${current.host}` : ''}
              </span>
              <h2>{current.title}</h2>
              <span className="cap">{tracks.length}곡</span>
            </div>
            <section className="box" style={{ paddingBlock: 6 }}>
              {tracks.length ? (
                tracks.map((t, i) => {
                  const q = `${t.artist} ${t.title}`
                  const on = t.track_likes.some((l) => l.user_id === me.id)
                  return (
                    <div key={t.id} className="track">
                      <span className="n">{i + 1}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="tt">{t.title}</div>
                        <div className="cap">
                          {t.artist}
                          {t.album ? ` · ${t.album}` : ''}
                          {t.year ? ` (${t.year})` : ''}
                        </div>
                        {t.comment ? (
                          <div className="pick">
                            <b>{t.author?.name}</b>님이 고른 이유 · {t.comment}
                          </div>
                        ) : (
                          <div className="cap">{t.author?.name}님이 골랐어요</div>
                        )}
                        <div className="trackfoot">
                          <LikeButton action={toggleTrackLike} id={t.id} on={on} count={t.track_likes.length} />
                          {t.url ? (
                            <a href={t.url} target="_blank" rel="noopener noreferrer">
                              듣기 ↗
                            </a>
                          ) : null}
                          <a href={youtubeSearch(q)} target="_blank" rel="noopener noreferrer">
                            YouTube
                          </a>
                          <a href={spotifySearch(q)} target="_blank" rel="noopener noreferrer">
                            Spotify
                          </a>
                          <a href={wikiSearch(t.artist.split(' & ')[0])} target="_blank" rel="noopener noreferrer">
                            위키
                          </a>
                          {t.user_id === me.id || admin ? (
                            <form action={deleteTrack}>
                              <input type="hidden" name="id" value={t.id} />
                              <input type="hidden" name="session_id" value={current.id} />
                              <button type="submit" className="like">
                                지우기
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <Empty>이번 감상모임에서 들은 곡을 올려주세요.</Empty>
              )}
            </section>
            <Link className="cta weak" href={`/listen/${current.id}/add`}>
              곡 올리기
            </Link>
          </>
        )}
      </main>
    </>
  )
}
