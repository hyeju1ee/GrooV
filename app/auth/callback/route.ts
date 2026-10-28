import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 가입 인증 메일의 링크가 여기로 돌아와요
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/', url.origin))
}
