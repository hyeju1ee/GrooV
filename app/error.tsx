'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="auth">
      <h1 className="q">화면을 불러오지 못했어요</h1>
      <p className="sub2" style={{ margin: 0 }}>
        잠시 뒤 다시 시도해 주세요. 계속 안 되면 운영진에게 알려주세요.
      </p>
      <button className="cta" type="button" onClick={reset}>
        다시 시도
      </button>
    </main>
  )
}
