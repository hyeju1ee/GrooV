'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { str } from '@/lib/flash'

export type FormState = { error?: string; info?: string } | undefined

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email')
  const password = str(fd, 'password')
  if (!email || !password) return { error: '이메일과 비밀번호를 적어주세요' }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (/confirm/i.test(error.message)) return { error: '메일함에서 인증 링크를 먼저 눌러주세요' }
    return { error: '이메일이나 비밀번호가 맞지 않아요' }
  }
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
