import Link from 'next/link'
import { Icon } from './Icon'
import { ROLE_LABEL } from '@/lib/constants'
import type { Person } from '@/lib/types'

export function Avatar({ name, ob, size }: { name: string; ob?: boolean; size?: 'sm' | 'lg' }) {
  return (
    <span className={`avatar${ob ? ' ob' : ''}${size ? ' ' + size : ''}`} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  )
}

/** 지윤 · 25 · 피아노 [OB] */
export function personMeta(p: Person | null | undefined) {
  if (!p) return '알 수 없음'
  return `${p.name} · ${p.cohort} · ${p.instrument}`
}

export function RoleBadge({ role }: { role: Person['role'] }) {
  if (role === 'student') return null
  return <span className={`pill ${role === 'ob' ? 'a' : 'p'}`}>{ROLE_LABEL[role]}</span>
}

export function TopBar({ back, title, children }: { back: string; title?: string; children?: React.ReactNode }) {
  return (
    <div className="topbar">
      <Link className="iconbtn" href={back} aria-label="뒤로">
        <Icon name="back" />
      </Link>
      {title ? <b>{title}</b> : null}
      <span className="spacer" />
      {children}
    </div>
  )
}

export function Empty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <span>{children}</span>
      {action}
    </div>
  )
}

export function Stepper({ steps, at, held }: { steps: readonly string[]; at: number; held?: boolean }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div key={s} className={`st${i <= at && !held ? ' on' : ''}`}>
          <i />
          {s}
        </div>
      ))}
    </div>
  )
}

export function StatusPill({ steps, status, held }: { steps: readonly string[]; status: number; held?: boolean }) {
  if (held) return <span className="pill">보류</span>
  const tone = status === steps.length - 1 ? 's' : status === 0 ? '' : 'p'
  return <span className={`pill ${tone}`}>{steps[status]}</span>
}
