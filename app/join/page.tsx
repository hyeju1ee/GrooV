import { Logo } from '@/components/Brand'
import { logout } from '../login/actions'

export const metadata = { title: '가입 안내' }

export default function JoinHelpPage() {
  return (
    <main className="auth">
      <Logo />
      <h1 className="q">초대 링크로 가입해 주세요</h1>
      <p className="sub2" style={{ margin: 0 }}>
        그루브 라운지는 부원만 들어올 수 있어요. 운영진이 보낸 초대 링크를 열어 가입해 주세요. 링크가 없다면 운영진에게
        요청해 주세요.
      </p>
      <form action={logout}>
        <button className="cta grey" type="submit">
          다른 계정으로 로그인
        </button>
      </form>
    </main>
  )
}
