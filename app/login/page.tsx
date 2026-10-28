import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BrandHero, Logo } from '@/components/Brand'
import { getSession } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export const metadata = { title: '로그인' }

export default async function LoginPage() {
  const { user } = await getSession()
  if (user) redirect('/')
  return (
    <main className="auth">
      <Logo />
      <BrandHero />
      <h1 className="q">
        그루브 라운지에
        <br />
        로그인해 주세요
      </h1>
      <LoginForm />
      <p className="cap" style={{ margin: 0 }}>
        처음이라면 운영진에게 초대 링크를 받아 가입해 주세요. 정기공연 안내는 <Link href="/show">여기</Link>에서 누구나 볼 수
        있어요.
      </p>
    </main>
  )
}
