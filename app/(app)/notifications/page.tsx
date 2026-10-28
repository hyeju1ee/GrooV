import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Icon } from '@/components/Icon'
import { Empty, TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { ago } from '@/lib/date'

export const metadata = { title: '알림' }

async function readAll() {
  'use server'
  const { supabase, me } = await requireMember()
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', me.id).is('read_at', null)
  revalidatePath('/', 'layout')
}

export default async function NotificationsPage() {
  const { supabase, me } = await requireMember()
  const { data } = await supabase.from('notifications').select('*').eq('user_id', me.id).order('created_at', { ascending: false }).limit(50)
  const list = (data ?? []) as { id: number; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }[]
  const unread = list.some((n) => !n.read_at)

  return (
    <main className="main sub">
      <TopBar back="/" title="알림">
        {unread ? (
          <form action={readAll}>
            <button className="chip" type="submit">
              모두 읽음
            </button>
          </form>
        ) : null}
      </TopBar>
      {!list.length ? <Empty>요청 진행 상태가 바뀌거나 내 글에 댓글이 달리면 여기에 알려드려요.</Empty> : null}
      <div className="rows">
        {list.map((n) => (
          <Link key={n.id} className="lrow" href={n.link ?? '/'} style={{ opacity: n.read_at ? 0.6 : 1 }}>
            <span className={`ic${n.read_at ? '' : ' p'}`}>
              <Icon name="bell" />
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="t" style={{ whiteSpace: 'normal' }}>
                {n.title}
              </span>
              <span className="s">
                {n.body ? `${n.body} · ` : ''}
                {ago(n.created_at)}
              </span>
            </span>
            <span className="r">
              <Icon name="chev" size={18} />
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
