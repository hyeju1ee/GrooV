import { notFound, redirect } from 'next/navigation'
import { TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { updatePost } from '../../actions'
import { PostForm } from '../../PostForm'

export const metadata = { title: '글 고치기' }

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, me } = await requireMember()
  const { data: post } = await supabase.from('posts').select('id, tag, title, body, user_id').eq('id', Number(id)).maybeSingle()
  if (!post) notFound()
  if (post.user_id !== me.id) redirect(`/talk/${post.id}`)
  return (
    <main className="main sub">
      <TopBar back={`/talk/${post.id}`} title="글 고치기" />
      <PostForm action={updatePost} post={post} />
    </main>
  )
}
