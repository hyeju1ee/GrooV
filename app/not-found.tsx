import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="auth">
      <h1 className="q">찾는 화면이 없어요</h1>
      <p className="sub2" style={{ margin: 0 }}>
        지워졌거나 주소가 바뀌었을 수 있어요.
      </p>
      <Link className="cta grey" href="/">
        홈으로
      </Link>
    </main>
  )
}
