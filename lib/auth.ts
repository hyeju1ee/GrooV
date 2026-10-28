import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { Profile } from './types'

export const getSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null as Profile | null }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>()
  return { supabase, user, profile }
})

/** 승인된 회원만 통과. 아니면 로그인, 가입 안내, 승인 대기 화면으로 보내요. */
export async function requireMember() {
  const s = await getSession()
  if (!s.user) redirect('/login')
  if (!s.profile) redirect('/join')
  if (s.profile.status !== 'active') redirect('/pending')
  return { supabase: s.supabase, user: s.user, me: s.profile }
}

export async function requireAdmin() {
  const s = await requireMember()
  if (s.me.role !== 'admin') redirect('/?msg=' + encodeURIComponent('운영진만 볼 수 있는 화면이에요'))
  return s
}

export const canWriteDong = (p: Profile) => p.role !== 'ob'
