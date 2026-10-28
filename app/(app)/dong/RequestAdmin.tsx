import { SubmitButton } from '@/components/SubmitButton'
import { updateRequest } from './actions'

/** 운영진만 보이는 진행 상태 바꾸기 */
export function RequestAdmin({
  kind,
  id,
  status,
  steps,
  held,
  memo,
}: {
  kind: 'repair' | 'buy'
  id: number
  status: number
  steps: readonly string[]
  held?: boolean
  memo: string | null
}) {
  const hidden = (op: string) => (
    <>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="op" value={op} />
    </>
  )
  return (
    <section className="box flat">
      <div className="box-title">
        <h2>운영진</h2>
        <span className="cap">바꾸면 요청한 사람에게 알림이 가요</span>
      </div>
      <form action={updateRequest} className="inline">
        {hidden('memo')}
        <input className="tf" name="memo" defaultValue={memo ?? ''} placeholder="예: 낙원상가에 맡겼어요" aria-label="운영진 메모" maxLength={300} style={{ background: 'var(--surface)' }} />
        <SubmitButton className="cta weak">메모</SubmitButton>
      </form>
      <div className="ctarow">
        {held ? (
          <form action={updateRequest} style={{ gridColumn: '1 / -1' }}>
            {hidden('unhold')}
            <SubmitButton className="cta grey sm">보류 풀기</SubmitButton>
          </form>
        ) : (
          <>
            {kind === 'buy' && status < 3 ? (
              <form action={updateRequest}>
                {hidden('hold')}
                <SubmitButton className="cta grey sm">보류</SubmitButton>
              </form>
            ) : status > 0 ? (
              <form action={updateRequest}>
                {hidden('back')}
                <SubmitButton className="cta grey sm">{steps[status - 1]}(으)로 되돌리기</SubmitButton>
              </form>
            ) : (
              <span />
            )}
            {status < 3 ? (
              <form action={updateRequest}>
                {hidden('advance')}
                <SubmitButton className="cta sm">{steps[status + 1]}(으)로 바꾸기</SubmitButton>
              </form>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
