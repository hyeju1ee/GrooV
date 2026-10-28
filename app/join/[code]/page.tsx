import Link from 'next/link'
import { BrandHero, Logo } from '@/components/Brand'
import { createClient } from '@/lib/supabase/server'
import { ROLE_LABEL } from '@/lib/constants'
import { JoinForm } from './JoinForm'

export const metadata = { title: '가입' }

type Info = { role: keyof typeof ROLE_LABEL; expires_at: string; remaining: number; valid: boolean }

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: info } = await supabase.rpc('invite_info', { p_code: decodeURIComponent(code) }).maybeSingle<Info>()

  return (
    <main className="auth">
      <Logo />
      <BrandHero />
      {info?.valid ? (
        <>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="stepcap">
              {info.role === 'ob' ? '졸업생(OB) 초대' : `${ROLE_LABEL[info.role]} 초대`} ·{' '}
              {new Date(info.expires_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}까지
            </span>
            <h1 className="q">
              그루브 라운지에
              <br />
              초대받았어요
            </h1>
            {info.role === 'ob' ? (
              <p className="sub2" style={{ margin: 0 }}>
                가입 신청 후 운영진이 승인하면 OB 배지를 달고 들어와요.
              </p>
            ) : null}
          </div>
          <JoinForm code={decodeURIComponent(code)} />
        </>
      ) : (
        <>
          <h1 className="q">이 초대 링크는 쓸 수 없어요</h1>
          <p className="sub2" style={{ margin: 0 }}>
            기간이 지났거나, 정해진 인원이 다 가입했거나, 운영진이 링크를 닫았어요. 운영진에게 새 링크를 받아주세요.
          </p>
          <Link className="cta grey" href="/login">
            로그인 화면으로
          </Link>
        </>
      )}
    </main>
  )
}
