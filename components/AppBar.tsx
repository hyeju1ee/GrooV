import Link from 'next/link'
import { Icon } from './Icon'
import { Avatar } from './ui'
import { requireMember } from '@/lib/auth'

export async function AppBar() {
  const { supabase, me } = await requireMember()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', me.id)
    .is('read_at', null)
  return (
    <header className="appbar">
      <Link href="/" className="logo" aria-label="GrooV 홈">
        <span className="mark" aria-hidden="true" />
        <span>
          Groo<span className="v">V</span>
        </span>
      </Link>
      <span className="spacer" />
      <Link href="/notifications" className="iconbtn" aria-label={count ? `알림 ${count}개` : '알림'}>
        <Icon name="bell" />
        {count ? <span className="pip">{count > 9 ? '9+' : count}</span> : null}
      </Link>
      <Link href="/me" aria-label="내 정보" style={{ display: 'flex', paddingLeft: 6, textDecoration: 'none' }}>
        <Avatar name={me.name} ob={me.role === 'ob'} size="sm" />
      </Link>
    </header>
  )
}
