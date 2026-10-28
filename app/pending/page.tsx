import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { logout } from '../login/actions'

export const metadata = { title: '승인 대기' }
export const dynamic = 'force-dynamic'

export default async function PendingPage() {
  const { user, profile } = await getSession()
  if (!user) redirect('/login')
  if (!profile) redirect('/join')
  if (profile.status === 'active') redirect('/')
  return (
    <main className="auth">
      <span className="logo">
        Groo<span className="v">V</span>
      </span>
      <h1 className="q">
        {profile.status === 'blocked' ? '이용이 멈춘 계정이에요' : `${profile.name}님, 운영진 승인을 기다리고 있어요`}
      </h1>
      <p className="sub2" style={{ margin: 0 }}>
        {profile.status === 'blocked'
          ? '궁금한 점은 운영진에게 물어봐 주세요.'
          : '승인되면 바로 들어올 수 있어요. 이 화면을 새로고침해 보세요.'}
      </p>
      <form action={logout}>
        <button className="cta grey" type="submit">
          로그아웃
        </button>
      </form>
    </main>
  )
}
