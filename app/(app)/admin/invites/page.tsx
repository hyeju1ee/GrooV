import { SubmitButton } from '@/components/SubmitButton'
import { TopBar } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { ROLE_LABEL } from '@/lib/constants'
import { createInvite, revokeInvite } from '../actions'
import { CopyLink } from './CopyLink'

export const metadata = { title: '초대 링크 관리' }

type Invite = { code: string; role: keyof typeof ROLE_LABEL; auto_approve: boolean; max_uses: number; used: number; expires_at: string; revoked: boolean }

export default async function InvitesPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false }).limit(30)
  const invites = (data ?? []) as Invite[]
  const now = new Date().toISOString()

  return (
    <main className="main sub">
      <TopBar back="/admin" title="초대 링크 관리" />
      <form action={createInvite} className="box flat">
        <div className="box-title">
          <h2>새 링크 만들기</h2>
        </div>
        <div className="chips">
          {(['ob', 'student', 'admin'] as const).map((r) => (
            <label key={r} className="chip">
              <input type="radio" name="role" value={r} defaultChecked={r === 'ob'} />
              {r === 'ob' ? '졸업생(OB)' : ROLE_LABEL[r]}
            </label>
          ))}
        </div>
        <div className="inline" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field">
            <label className="flabel" htmlFor="days">
              며칠 동안
            </label>
            <input className="tf" id="days" name="days" type="number" min={1} max={90} defaultValue={30} style={{ background: 'var(--surface)' }} />
          </div>
          <div className="field">
            <label className="flabel" htmlFor="max_uses">
              최대 인원
            </label>
            <input className="tf" id="max_uses" name="max_uses" type="number" min={1} max={200} defaultValue={20} style={{ background: 'var(--surface)' }} />
          </div>
        </div>
        <label className="check">
          <input type="checkbox" name="auto_approve" />
          승인 없이 바로 들어오게 하기 <span className="cap">(재학생 단톡방에 보낼 때)</span>
        </label>
        <SubmitButton>링크 만들기</SubmitButton>
      </form>

      <div className="box-title">
        <h2>만든 링크</h2>
      </div>
      <div className="rows">
        {invites.map((i) => {
          const dead = i.revoked || i.expires_at < now || i.used >= i.max_uses
          return (
            <div key={i.code} className="lrow noicon" style={{ opacity: dead ? 0.55 : 1 }}>
              <span style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                {dead ? <code style={{ fontSize: 12 }}>/join/{i.code}</code> : <CopyLink path={`/join/${i.code}`} />}
                <span className="cap">
                  {i.role === 'ob' ? '졸업생' : ROLE_LABEL[i.role]} · {i.auto_approve ? '바로 입장' : '승인 필요'} ·{' '}
                  {new Date(i.expires_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} 만료 · {i.used}/{i.max_uses}명
                </span>
              </span>
              {dead ? (
                <span className="pill">{i.revoked ? '닫힘' : '만료'}</span>
              ) : (
                <form action={revokeInvite}>
                  <input type="hidden" name="code" value={i.code} />
                  <button className="chip danger" type="submit">
                    닫기
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>
      <span className="cap">링크가 단톡방 밖으로 퍼졌다 싶으면 닫고 새로 만들어 주세요.</span>
    </main>
  )
}
