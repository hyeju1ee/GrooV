import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Avatar, RoleBadge, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { WIKI_HOME, wikiSearch } from '@/lib/constants'
import { logout } from '../../login/actions'

export const metadata = { title: '내 정보' }

export default async function MePage() {
  const { supabase, me } = await requireMember()
  const [{ data: tunes }, { count: pending }] = await Promise.all([
    supabase.from('member_tunes').select('tune:tunes(title)').eq('user_id', me.id),
    me.role === 'admin'
      ? supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
  ])
  const myTunes = ((tunes ?? []) as unknown as { tune: { title: string } | null }[]).map((t) => t.tune?.title).filter(Boolean) as string[]
  const year = new Date().getFullYear()

  return (
    <main className="main sub">
      <TopBar back="/" title="내 정보">
        <Link className="chip" href="/me/edit">
          프로필 고치기
        </Link>
      </TopBar>
      <div className="row" style={{ gap: 14, padding: '8px 0' }}>
        <Avatar name={me.name} ob={me.role === 'ob'} size="lg" />
        <div style={{ display: 'grid' }}>
          <b style={{ fontSize: 20 }}>
            {me.name} <RoleBadge role={me.role} />
          </b>
          <span className="cap">
            {me.cohort}학번 · {me.instrument}
            {me.title ? ` · ${me.title}` : ''}
          </span>
        </div>
      </div>
      <dl className="kv">
        <dt>최애 연주자</dt>
        <dd>{me.fav_artist ?? '-'}</dd>
        <dt>요즘 듣는 앨범</dt>
        <dd>{me.now_listening ?? '-'}</dd>
      </dl>
      <Link className="box flat" href="/me/tunes">
        <span className="flabel">
          연주할 수 있는 곡 <span className="counter">잼 곡 추천에 쓰여요 ›</span>
        </span>
        <div className="chips">
          {myTunes.length ? myTunes.map((t) => <span key={t} className="chip">{t}</span>) : <span className="sub2">아직 체크한 곡이 없어요. 눌러서 골라주세요.</span>}
        </div>
      </Link>
      <a href={wikiSearch(me.name)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600 }}>
        위키에서 내 그루버 문서 찾기 ↗
      </a>
      <div className="divider" />
      <div className="rows">
        <Link className="lrow" href="/outings">
          <span className="ic p">
            <Icon name="users" />
          </span>
          <span className="t">외부 공연 같이 가기</span>
          <span className="r">
            <Icon name="chev" size={18} />
          </span>
        </Link>
        <Link className="lrow" href="/recap">
          <span className="ic a">
            <Icon name="vote" />
          </span>
          <span className="t">{year} 그루브 연말결산</span>
          <span className="r">
            <Icon name="chev" size={18} />
          </span>
        </Link>
        <a className="lrow" href={WIKI_HOME} target="_blank" rel="noopener noreferrer">
          <span className="ic">W</span>
          <span className="t">그루브 위키</span>
          <span className="r">새 탭 ↗</span>
        </a>
      </div>
      {me.role === 'admin' ? (
        <>
          <div className="divider" />
          <b>운영진 도구</b>
          <div className="rows">
            <Link className="lrow" href="/admin">
              <span className="ic p">
                <Icon name="users" />
              </span>
              <span className="t">회원 관리</span>
              <span className="r">
                {pending ? <span className="pill d">승인 대기 {pending}</span> : null}
                <Icon name="chev" size={18} />
              </span>
            </Link>
            <Link className="lrow" href="/admin/invites">
              <span className="ic p">
                <Icon name="key" />
              </span>
              <span className="t">초대 링크 관리</span>
              <span className="r">
                <Icon name="chev" size={18} />
              </span>
            </Link>
          </div>
        </>
      ) : null}
      <form action={logout} style={{ marginTop: 12 }}>
        <button className="cta grey" type="submit">
          로그아웃
        </button>
      </form>
    </main>
  )
}
