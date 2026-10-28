import Link from 'next/link'
import { AppBar } from '@/components/AppBar'
import { Empty, RoleBadge } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { POST_TAGS } from '@/lib/constants'
import { ago } from '@/lib/date'
import type { Person } from '@/lib/types'

export const metadata = { title: '토크' }

type Post = {
  id: number
  tag: string
  title: string
  body: string
  hidden: boolean
  created_at: string
  author: Person | null
  post_likes: { count: number }[]
  comments: { count: number }[]
}

export default async function TalkPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams
  const { supabase } = await requireMember()
  const active = tag && (POST_TAGS as readonly string[]).includes(tag) ? tag : null
  let query = supabase
    .from('posts')
    .select('id, tag, title, body, hidden, created_at, author:profiles!posts_user_id_fkey(id, name, cohort, instrument, role), post_likes(count), comments(count)')
    .order('created_at', { ascending: false })
    .limit(40)
  if (active) query = query.eq('tag', active)
  const { data } = await query
  const posts = (data ?? []) as unknown as Post[]

  return (
    <>
      <AppBar />
      <main className="main">
        <div className="hero">
          <h1>토크</h1>
        </div>
        <div className="scroller">
          <Link className="chip" href="/talk" aria-current={!active ? 'page' : undefined} scroll={false}>
            전체
          </Link>
          {POST_TAGS.map((t) => (
            <Link key={t} className="chip" href={`/talk?tag=${encodeURIComponent(t)}`} aria-current={active === t ? 'page' : undefined} scroll={false}>
              {t}
            </Link>
          ))}
        </div>
        <section className="box" style={{ paddingBlock: 4 }}>
          {posts.length ? (
            posts.map((p) => (
              <Link key={p.id} className="post" href={`/talk/${p.id}`}>
                <span className="meta">
                  <span className="pill">{p.tag}</span>
                  {p.hidden ? <span className="pill d">숨김</span> : null}
                  {p.author?.name} · {p.author?.cohort} · {p.author?.instrument}
                  {p.author ? <RoleBadge role={p.author.role} /> : null}
                </span>
                <h2>{p.title}</h2>
                <p className="ex">{p.body}</p>
                <span className="meta">
                  {ago(p.created_at)} · 좋아요 {p.post_likes[0]?.count ?? 0} · 댓글 {p.comments[0]?.count ?? 0}
                </span>
              </Link>
            ))
          ) : (
            <Empty>{active ? '이 태그로 올라온 글이 아직 없어요.' : '첫 글을 남겨보세요. 요즘 꽂힌 앨범도 좋아요.'}</Empty>
          )}
        </section>
        <Link className="cta" href="/talk/new">
          글쓰기
        </Link>
      </main>
    </>
  )
}
