'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from './Icon'

const TABS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: '/', label: '홈', icon: 'home', match: ['/'] },
  { href: '/calendar', label: '일정', icon: 'cal', match: ['/calendar', '/jam'] },
  { href: '/listen', label: '감상', icon: 'disc', match: ['/listen', '/polls', '/quiz'] },
  { href: '/talk', label: '토크', icon: 'talk', match: ['/talk'] },
  { href: '/dong', label: '동방', icon: 'amp', match: ['/dong'] },
]

// 글쓰기, 요청하기처럼 집중해야 하는 화면에서는 탭 바를 숨겨요
const HIDE = [/\/new$/, /\/edit$/, /\/add$/, /\/wiki$/, /\/done$/]

export function TabBar() {
  const pathname = usePathname()
  if (HIDE.some((r) => r.test(pathname))) return null
  return (
    <nav className="tabbar" aria-label="메뉴">
      {TABS.map((t) => {
        const active = t.match.some((m) => (m === '/' ? pathname === '/' : pathname.startsWith(m)))
        return (
          <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined}>
            <Icon name={t.icon} />
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
