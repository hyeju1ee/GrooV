import { redirect } from 'next/navigation'
import { Logo } from '@/components/Brand'
import { isConfigured } from '@/lib/supabase/env'

export const metadata = { title: '설정 필요' }

export default function SetupPage() {
  if (isConfigured) redirect('/')
  return (
    <main className="auth">
      <Logo />
      <h1 className="q">Supabase 연결이 아직 안 됐어요</h1>
      <p className="sub2" style={{ margin: 0 }}>
        Vercel 프로젝트의 Settings &gt; Environment Variables에 아래 두 값을 넣고 다시 배포해 주세요. 값은 Supabase 대시보드의
        Project Settings &gt; API에 있어요.
      </p>
      <pre className="wikitext">{`NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY`}</pre>
      <p className="cap" style={{ margin: 0 }}>
        자세한 순서는 저장소의 README에 있어요.
      </p>
    </main>
  )
}
