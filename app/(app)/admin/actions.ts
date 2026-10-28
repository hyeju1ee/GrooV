'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { dbMessage, go, num, str } from '@/lib/flash'

export async function setMember(fd: FormData) {
  const { supabase, me } = await requireAdmin()
  const id = str(fd, 'id')
  const patch: Record<string, string | null> = {}
  const status = str(fd, 'status')
  const role = str(fd, 'role')
  if (['pending', 'active', 'blocked'].includes(status)) patch.status = status
  if (['student', 'ob', 'admin'].includes(role)) patch.role = role
  if (fd.has('title')) patch.title = str(fd, 'title') || null
  if (id === me.id && (patch.role && patch.role !== 'admin' || patch.status && patch.status !== 'active')) {
    go('/admin', '내 권한은 다른 운영진이 바꿔야 해요')
  }
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) go('/admin', dbMessage(error))
  revalidatePath('/admin')
  go('/admin', patch.status === 'active' && str(fd, 'approve') ? '승인했어요' : '저장했어요')
}

export async function createInvite(fd: FormData) {
  const { supabase, me } = await requireAdmin()
  const role = ['student', 'ob', 'admin'].includes(str(fd, 'role')) ? str(fd, 'role') : 'ob'
  const days = Math.min(90, Math.max(1, num(fd, 'days') || 30))
  const maxUses = Math.min(200, Math.max(1, num(fd, 'max_uses') || 20))
  const prefix = { student: 'yb', ob: 'ob', admin: 'ad' }[role]
  const code = `${prefix}-${randomBytes(6).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 8)}`
  const { error } = await supabase.from('invites').insert({
    code,
    role,
    auto_approve: str(fd, 'auto_approve') === 'on',
    max_uses: maxUses,
    expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    created_by: me.id,
  })
  if (error) go('/admin/invites', dbMessage(error))
  revalidatePath('/admin/invites')
  go('/admin/invites', '새 초대 링크를 만들었어요. 복사해서 보내주세요')
}

export async function revokeInvite(fd: FormData) {
  const { supabase } = await requireAdmin()
  await supabase.from('invites').update({ revoked: true }).eq('code', str(fd, 'code'))
  revalidatePath('/admin/invites')
  go('/admin/invites', '링크를 닫았어요. 이 링크로는 더 가입할 수 없어요')
}
