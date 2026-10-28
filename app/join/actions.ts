'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { INSTRUMENTS } from '@/lib/constants'
import { str } from '@/lib/flash'
import type { FormState } from '../login/actions'

export async function join(_: FormState, fd: FormData): Promise<FormState> {
  const code = str(fd, 'code')
  const name = str(fd, 'name')
  const cohort = str(fd, 'cohort')
  const instrument = str(fd, 'instrument')
  const email = str(fd, 'email')
  const password = str(fd, 'password')

  if (!name || name.length > 20) return { error: '이름을 20자 안으로 적어주세요' }
  if (!/^[0-9]{2}$/.test(cohort)) return { error: '학번은 숫자 두 자리로 적어주세요. 예: 25' }
  if (!(INSTRUMENTS as readonly string[]).includes(instrument)) return { error: '악기를 골라주세요' }
  if (password.length < 8) return { error: '비밀번호는 8자 이상이어야 해요' }

  const supabase = await createClient()
  const { data: info } = await supabase.rpc('invite_info', { p_code: code }).maybeSingle<{ valid: boolean }>()
  if (!info?.valid) return { error: '초대 링크가 만료됐거나 사용할 수 없어요. 운영진에게 새 링크를 받아주세요' }

  const h = await headers()
  const origin = h.get('origin') ?? `https://${h.get('host')}`
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { invite_code: code, name, cohort, instrument },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })
  if (error) {
    if (/already registered|already exists/i.test(error.message)) return { error: '이미 가입한 이메일이에요. 로그인해 주세요' }
    if (/database error/i.test(error.message)) return { error: '초대 링크가 만료됐거나 사용할 수 없어요' }
    if (/password/i.test(error.message)) return { error: '비밀번호를 더 길고 복잡하게 만들어 주세요' }
    return { error: '가입하지 못했어요. 잠시 뒤 다시 시도해 주세요' }
  }
  if (!data.session) {
    return { info: `${email}로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요.` }
  }
  redirect('/')
}
