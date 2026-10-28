import Link from 'next/link'
import { Avatar, Empty, RoleBadge, TopBar } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { ROLE_LABEL } from '@/lib/constants'
import { ago } from '@/lib/date'
import type { Profile } from '@/lib/types'
import { setMember } from './actions'

export const metadata = { title: '회원 관리' }

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const { supabase, me } = await requireAdmin()
  const { data } = await supabase.from('profiles').select('*').order('cohort', { ascending: false }).order('name')
  const all = (data ?? []) as Profile[]
  const pending = all.filter((p) => p.status === 'pending')
  const members = all.filter((p) => p.status !== 'pending' && (!q || p.name.includes(q) || p.cohort === q))

  return (
    <main className="main sub">
      <TopBar back="/me" title="회원 관리">
        <Link className="chip" href="/admin/invites">
          초대 링크
        </Link>
      </TopBar>

      <div className="box-title">
        <h2>승인 대기 {pending.length}</h2>
      </div>
      {pending.length ? (
        <div className="rows">
          {pending.map((p) => (
            <div key={p.id} className="lrow">
              <Avatar name={p.name} ob={p.role === 'ob'} />
              <span style={{ minWidth: 0 }}>
                <span className="t">
                  {p.name} <RoleBadge role={p.role} />
                </span>
                <span className="s">
                  {p.cohort}학번 · {p.instrument} · {ago(p.created_at)} 신청
                </span>
              </span>
              <span className="row" style={{ gap: 4 }}>
                <form action={setMember}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="blocked" />
                  <button className="chip danger" type="submit">
                    거절
                  </button>
                </form>
                <form action={setMember}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="active" />
                  <input type="hidden" name="approve" value="1" />
                  <button className="chip" type="submit" aria-pressed="true">
                    승인
                  </button>
                </form>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="sub2">기다리는 사람이 없어요.</span>
      )}

      <div className="divider" />
      <div className="box-title">
        <h2>회원 {members.length}</h2>
        <form className="row" style={{ gap: 6 }}>
          <input className="tf" name="q" defaultValue={q} placeholder="이름, 학번" aria-label="회원 찾기" style={{ padding: '8px 12px', fontSize: 14, width: 130 }} />
        </form>
      </div>
      {!members.length ? <Empty>찾는 회원이 없어요.</Empty> : null}
      {members.map((p) => (
        <details key={p.id} className="box flat" style={{ padding: 14 }}>
          <summary className="row" style={{ cursor: 'pointer', listStyle: 'none' }}>
            <Avatar name={p.name} ob={p.role === 'ob'} size="sm" />
            <span style={{ flex: 1, minWidth: 0 }}>
              <b>{p.name}</b> <span className="cap">
                {p.cohort} · {p.instrument}
                {p.title ? ` · ${p.title}` : ''}
              </span>
            </span>
            <RoleBadge role={p.role} />
            {p.status === 'blocked' ? <span className="pill d">정지</span> : null}
          </summary>
          <form action={setMember} className="stack" style={{ gap: 10, marginTop: 12 }}>
            <input type="hidden" name="id" value={p.id} />
            <div className="chips">
              {(Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).map((r) => (
                <label key={r} className="chip">
                  <input type="radio" name="role" value={r} defaultChecked={p.role === r} />
                  {ROLE_LABEL[r]}
                </label>
              ))}
            </div>
            <div className="inline">
              <input className="tf" name="title" defaultValue={p.title ?? ''} placeholder="직책 (예: 회장)" aria-label="직책" maxLength={20} style={{ background: 'var(--surface)' }} />
              <button className="cta weak" type="submit">
                저장
              </button>
            </div>
          </form>
          {p.id !== me.id ? (
            <form action={setMember} style={{ marginTop: 8 }}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="status" value={p.status === 'blocked' ? 'active' : 'blocked'} />
              <button className="chip danger" type="submit">
                {p.status === 'blocked' ? '이용 정지 풀기' : '이용 정지'}
              </button>
            </form>
          ) : null}
        </details>
      ))}
    </main>
  )
}
