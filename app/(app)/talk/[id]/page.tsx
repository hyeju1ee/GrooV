import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LikeButton } from '@/components/LikeButton'
import { SubmitButton } from '@/components/SubmitButton'
import { Avatar, RoleBadge, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { WIKI_LIKES } from '@/lib/constants'
import { ago } from '@/lib/date'
import { PERSON, type Person } from '@/lib/types'
import { addComment, deleteComment, deletePost, setHidden, togglePostLike } from '../actions'

export const metadata = { title: '토크' }

type Post = {
  id: number
  tag: string
  title: string
  body: string
  hidden: boolean
  user_id: string
  created_at: string
  author: Person | null
  post_likes: { user_id: string }[]
  comments: { id: number; body: string; user_id: string; created_at: string; author: Person | null }[]
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, me } = await requireMember()
  const { data } = await supabase
    .from('posts')
    .select(`id, tag, title, body, hidden, user_id, created_at, author:profiles!posts_user_id_fkey(${PERSON}), post_likes(user_id), comments(id, body, user_id, created_at, author:profiles!comments_user_id_fkey(${PERSON}))`)
    .eq('id', Number(id))
    .order('created_at', { referencedTable: 'comments' })
    .maybeSingle()
  if (!data) notFound()
  const p = data as unknown as Post
  const on = p.post_likes.some((l) => l.user_id === me.id)
  const likes = p.post_likes.length
  const admin = me.role === 'admin'
  const mine = p.user_id === me.id

  return (
    <main className="main sub">
      <TopBar back="/talk">
        {mine ? (
          <Link className="chip" href={`/talk/${p.id}/edit`}>
            고치기
          </Link>
        ) : null}
        {mine || admin ? (
          <form action={deletePost}>
            <input type="hidden" name="id" value={p.id} />
            <button className="chip danger" type="submit">
              지우기
            </button>
          </form>
        ) : null}
      </TopBar>
      <article style={{ display: 'grid', gap: 10 }}>
        <span className="meta">
          <span className="pill">{p.tag}</span>
          {p.hidden ? <span className="pill d">숨긴 글</span> : null}
        </span>
        <h1 className="q" style={{ fontSize: 21 }}>
          {p.title}
        </h1>
        <span className="meta">
          <Avatar name={p.author?.name ?? '?'} ob={p.author?.role === 'ob'} size="sm" />
          {p.author?.name} · {p.author?.cohort} · {p.author?.instrument}
          {p.author ? <RoleBadge role={p.author.role} /> : null} · {ago(p.created_at)}
        </span>
        <p className="prose" style={{ marginTop: 6 }}>
          {p.body}
        </p>
        <div className="row between">
          <LikeButton action={togglePostLike} id={p.id} on={on} count={likes} label="좋아요" />
          <span className="row">
            {likes >= WIKI_LIKES ? (
              <Link className="chip" href={`/talk/${p.id}/wiki`}>
                위키로 옮기기
              </Link>
            ) : null}
            {admin ? (
              <form action={setHidden}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="hidden" value={p.hidden ? '0' : '1'} />
                <button className="chip" type="submit">
                  {p.hidden ? '숨김 풀기' : '숨기기'}
                </button>
              </form>
            ) : null}
          </span>
        </div>
        {likes >= WIKI_LIKES ? <div className="note">좋아요 {WIKI_LIKES}개가 넘은 글이에요. 위키에 남겨두면 좋을 내용이라면 옮겨주세요.</div> : null}
      </article>
      <div className="divider" />
      <b>댓글 {p.comments.length}</b>
      <div>
        {p.comments.map((c) => (
          <div key={c.id} className="comment">
            <Avatar name={c.author?.name ?? '?'} ob={c.author?.role === 'ob'} size="sm" />
            <div>
              <span className="meta">
                <b style={{ color: 'var(--ink)' }}>{c.author?.name}</b> {c.author?.cohort} · {c.author?.instrument}
                {c.author ? <RoleBadge role={c.author.role} /> : null} · {ago(c.created_at)}
                {c.user_id === me.id || admin ? (
                  <form action={deleteComment} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="post_id" value={p.id} />
                    <button type="submit" className="like" style={{ fontSize: 12 }}>
                      지우기
                    </button>
                  </form>
                ) : null}
              </span>
              <p>{c.body}</p>
            </div>
          </div>
        ))}
      </div>
      <form action={addComment} className="inline">
        <input type="hidden" name="post_id" value={p.id} />
        <input className="tf" name="body" placeholder={`${me.name}(으)로 댓글 달기`} aria-label="댓글" maxLength={1000} required />
        <SubmitButton className="cta weak">등록</SubmitButton>
      </form>
    </main>
  )
}
