'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireMember } from '@/lib/auth'
import { POST_TAGS } from '@/lib/constants'
import { dbMessage, go, num, str } from '@/lib/flash'

function readPost(fd: FormData) {
  const tag = str(fd, 'tag')
  return { tag: (POST_TAGS as readonly string[]).includes(tag) ? tag : '잡담', title: str(fd, 'title'), body: str(fd, 'body') }
}

export async function createPost(fd: FormData) {
  const { supabase, me } = await requireMember()
  const row = readPost(fd)
  if (!row.title || !row.body) go('/talk/new', '제목과 내용을 적어주세요')
  const { data, error } = await supabase.from('posts').insert({ ...row, user_id: me.id }).select('id').single()
  if (error) go('/talk/new', dbMessage(error))
  revalidatePath('/', 'layout')
  go(`/talk/${data.id}`, '글을 올렸어요')
}

export async function updatePost(fd: FormData) {
  const { supabase } = await requireMember()
  const id = num(fd, 'id')
  const row = readPost(fd)
  if (!row.title || !row.body) go(`/talk/${id}/edit`, '제목과 내용을 적어주세요')
  const { error } = await supabase.from('posts').update(row).eq('id', id)
  if (error) go(`/talk/${id}/edit`, dbMessage(error))
  revalidatePath('/', 'layout')
  go(`/talk/${id}`, '글을 고쳤어요')
}

export async function deletePost(fd: FormData) {
  const { supabase } = await requireMember()
  const { error } = await supabase.from('posts').delete().eq('id', num(fd, 'id'))
  if (error) go(`/talk/${num(fd, 'id')}`, dbMessage(error))
  revalidatePath('/', 'layout')
  go('/talk', '글을 지웠어요')
}

export async function setHidden(fd: FormData) {
  const { supabase } = await requireAdmin()
  const id = num(fd, 'id')
  const hidden = str(fd, 'hidden') === '1'
  await supabase.from('posts').update({ hidden }).eq('id', id)
  revalidatePath('/', 'layout')
  go(`/talk/${id}`, hidden ? '글을 숨겼어요. 글쓴이와 운영진만 볼 수 있어요' : '글을 다시 보이게 했어요')
}

export async function togglePostLike(fd: FormData) {
  const { supabase, me } = await requireMember()
  const id = num(fd, 'id')
  if (str(fd, 'on') === '1') await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', me.id)
  else await supabase.from('post_likes').upsert({ post_id: id, user_id: me.id }, { ignoreDuplicates: true })
  revalidatePath(`/talk/${id}`)
  revalidatePath('/talk')
}

export async function addComment(fd: FormData) {
  const { supabase, me } = await requireMember()
  const postId = num(fd, 'post_id')
  const body = str(fd, 'body')
  if (!body) go(`/talk/${postId}`, '댓글을 적어주세요')
  const { error } = await supabase.from('comments').insert({ post_id: postId, body, user_id: me.id })
  if (error) go(`/talk/${postId}`, dbMessage(error))
  revalidatePath(`/talk/${postId}`)
  go(`/talk/${postId}`, '댓글을 달았어요')
}

export async function deleteComment(fd: FormData) {
  const { supabase } = await requireMember()
  const postId = num(fd, 'post_id')
  await supabase.from('comments').delete().eq('id', num(fd, 'id'))
  revalidatePath(`/talk/${postId}`)
  go(`/talk/${postId}`, '댓글을 지웠어요')
}
