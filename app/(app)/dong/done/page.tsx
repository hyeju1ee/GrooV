import Link from 'next/link'
import { Icon } from '@/components/Icon'

export const metadata = { title: '보냈어요' }

export default async function DonePage({ searchParams }: { searchParams: Promise<{ k?: string; id?: string }> }) {
  const { k, id } = await searchParams
  const buy = k === 'buy'
  return (
    <main className="main sub" style={{ minHeight: '100dvh', gridTemplateRows: '1fr auto' }}>
      <div className="done">
        <span className="big">
          <Icon name="check" />
        </span>
        <h1>{buy ? '구매 제안을 보냈어요' : '수리 요청을 보냈어요'}</h1>
        <p className="sub2" style={{ margin: 0 }}>
          {buy ? '부원들이 "나도 필요해요"를 누르면 예산 회의에서 먼저 다뤄요.' : '운영진이 확인하면 알림으로 알려드릴게요.'}
        </p>
      </div>
      <div className="ctabar">
        <Link className="cta" href={`/dong/${buy ? 'buy' : 'repair'}/${Number(id)}`}>
          내 요청 보기
        </Link>
        <Link className="cta grey" href="/dong">
          동방으로
        </Link>
      </div>
    </main>
  )
}
