import { notFound } from 'next/navigation'
import { Gallery } from '@/components/Gallery'
import { Avatar, StatusPill, Stepper, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { REPAIR_STEPS } from '@/lib/constants'
import { ago } from '@/lib/date'
import { PERSON, type RepairRequest } from '@/lib/types'
import { deleteRequest } from '../../actions'
import { RequestAdmin } from '../../RequestAdmin'

export const metadata = { title: '수리 요청' }

export default async function RepairPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, me } = await requireMember()
  const { data } = await supabase
    .from('repair_requests')
    .select(`*, gear:gear(name), author:profiles!repair_requests_user_id_fkey(${PERSON})`)
    .eq('id', Number(id))
    .maybeSingle()
  if (!data) notFound()
  const r = data as RepairRequest
  const canDelete = (r.user_id === me.id && r.status === 0) || me.role === 'admin'

  return (
    <main className="main sub">
      <TopBar back="/dong" title="수리 요청">
        {canDelete ? (
          <form action={deleteRequest}>
            <input type="hidden" name="kind" value="repair" />
            <input type="hidden" name="id" value={r.id} />
            <button className="chip danger" type="submit">
              지우기
            </button>
          </form>
        ) : null}
      </TopBar>
      <Gallery photos={r.photos} />
      <div style={{ display: 'grid', gap: 6 }}>
        <div className="meta">
          <StatusPill steps={REPAIR_STEPS} status={r.status} />
          <span className={`pill${r.urgency === '긴급' ? ' d' : ''}`}>{r.urgency}</span>
        </div>
        <h1 className="q" style={{ fontSize: 22 }}>
          {r.gear?.name ?? r.gear_other}
        </h1>
        <span className="meta">
          <Avatar name={r.author?.name ?? '?'} ob={r.author?.role === 'ob'} size="sm" />
          {r.author?.name} · {r.author?.cohort} · {r.author?.instrument} · {ago(r.created_at)}
        </span>
      </div>
      <Stepper steps={REPAIR_STEPS} at={r.status} />
      {r.memo ? <div className="note p">운영진 메모 · {r.memo}</div> : null}
      <dl className="kv">
        <dt>증상</dt>
        <dd>{r.symptoms.join(', ')}</dd>
        <dt>급한 정도</dt>
        <dd>{r.urgency}</dd>
      </dl>
      <div className="field">
        <span className="flabel">자세한 설명</span>
        <p className="prose" style={{ fontSize: 15 }}>
          {r.detail}
        </p>
      </div>
      {me.role === 'admin' ? (
        <RequestAdmin kind="repair" id={r.id} status={r.status} steps={REPAIR_STEPS} memo={r.memo} />
      ) : (
        <span className="cap" style={{ textAlign: 'center' }}>
          운영진이 진행 상태를 바꾸면 알림으로 알려드려요
        </span>
      )}
    </main>
  )
}
