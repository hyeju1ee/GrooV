import { notFound } from 'next/navigation'
import { Gallery } from '@/components/Gallery'
import { Icon } from '@/components/Icon'
import { Avatar, StatusPill, Stepper, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { BUY_STEPS } from '@/lib/constants'
import { ago, won } from '@/lib/date'
import { PERSON, type BuyProposal } from '@/lib/types'
import { deleteRequest, toggleCheer } from '../../actions'
import { RequestAdmin } from '../../RequestAdmin'

export const metadata = { title: '구매 제안' }

export default async function BuyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, me } = await requireMember()
  const { data } = await supabase
    .from('buy_proposals')
    .select(`*, author:profiles!buy_proposals_user_id_fkey(${PERSON}), proposal_cheers(user_id)`)
    .eq('id', Number(id))
    .maybeSingle()
  if (!data) notFound()
  const b = data as BuyProposal
  const cheers = b.proposal_cheers ?? []
  const cheered = cheers.some((c) => c.user_id === me.id)
  const canDelete = (b.user_id === me.id && b.status === 0) || me.role === 'admin'

  return (
    <main className="main sub">
      <TopBar back="/dong" title="구매 제안">
        {canDelete ? (
          <form action={deleteRequest}>
            <input type="hidden" name="kind" value="buy" />
            <input type="hidden" name="id" value={b.id} />
            <button className="chip danger" type="submit">
              지우기
            </button>
          </form>
        ) : null}
      </TopBar>
      <Gallery photos={b.photos} />
      <div style={{ display: 'grid', gap: 6 }}>
        <div className="meta">
          <StatusPill steps={BUY_STEPS} status={b.status} held={b.held} />
          <span className="pill">{b.category}</span>
        </div>
        <h1 className="q" style={{ fontSize: 22 }}>
          {b.name}
        </h1>
        <span className="meta">
          <Avatar name={b.author?.name ?? '?'} ob={b.author?.role === 'ob'} size="sm" />
          {b.author?.name} · {b.author?.cohort} · {b.author?.instrument} · {ago(b.created_at)}
        </span>
      </div>
      <Stepper steps={BUY_STEPS} at={b.status} held={b.held} />
      {b.memo ? <div className="note p">운영진 메모 · {b.memo}</div> : null}
      <dl className="kv">
        <dt>예상 가격</dt>
        <dd>{won(b.price)}</dd>
        {b.url ? (
          <>
            <dt>구매 링크</dt>
            <dd>
              <a href={b.url} target="_blank" rel="noopener noreferrer">
                열기 ↗
              </a>
            </dd>
          </>
        ) : null}
        <dt>쓰는 곳</dt>
        <dd>{b.uses.join(', ')}</dd>
        <dt>얼마나 자주</dt>
        <dd>{b.frequency}</dd>
      </dl>
      <section className="effect">
        <h2>기대효과</h2>
        <div>
          <span className="cap">지금 불편한 점</span>
          <p>{b.pain}</p>
        </div>
        <div>
          <span className="cap">사면 좋아지는 점</span>
          <p>{b.gain}</p>
        </div>
      </section>
      <form action={toggleCheer}>
        <input type="hidden" name="id" value={b.id} />
        <input type="hidden" name="on" value={cheered ? '1' : '0'} />
        <button type="submit" className={`cta${cheered ? ' weak' : ''}`} aria-pressed={cheered}>
          <Icon name="heart" />
          {cheered ? '나도 필요해요 취소' : '나도 필요해요'} · {cheers.length}명
        </button>
      </form>
      {me.role === 'admin' ? <RequestAdmin kind="buy" id={b.id} status={b.status} steps={BUY_STEPS} held={b.held} memo={b.memo} /> : null}
    </main>
  )
}
