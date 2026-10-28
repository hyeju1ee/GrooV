'use client'

import Link from 'next/link'
import { Icon } from '@/components/Icon'

/** 토스식 한 화면 한 질문 틀: 진행 막대, 질문, 내용, 아래 고정 버튼 */
export function Flow({
  label,
  step,
  total,
  question,
  exit,
  onBack,
  onNext,
  nextLabel,
  canNext,
  error,
  children,
}: {
  label: string
  step: number
  total: number
  question: string
  exit: string
  onBack: () => void
  onNext: () => void
  nextLabel: string
  canNext: boolean
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <main className="main sub" style={{ minHeight: '100dvh', gridTemplateRows: 'auto 1fr auto' }}>
      <div className="topbar">
        {step === 0 ? (
          <Link className="iconbtn" href={exit} aria-label="닫기">
            <Icon name="back" />
          </Link>
        ) : (
          <button type="button" className="iconbtn" onClick={onBack} aria-label="이전 질문">
            <Icon name="back" />
          </button>
        )}
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label={`${total}단계 중 ${step + 1}단계`}>
          <i style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
      </div>
      <div className="stack" style={{ gap: 20, alignContent: 'start' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <span className="stepcap">
            {label} {step + 1}/{total}
          </span>
          <h1 className="q">{question}</h1>
        </div>
        {children}
      </div>
      <div className="ctabar">
        {error ? <div className="note d">{error}</div> : null}
        <button type="button" className="cta" onClick={onNext} disabled={!canNext}>
          {nextLabel}
        </button>
      </div>
    </main>
  )
}

export function Opt({ on, onClick, title, sub }: { on: boolean; onClick: () => void; title: string; sub?: string }) {
  return (
    <button type="button" className="opt" aria-pressed={on} onClick={onClick}>
      <span>
        {title}
        {sub ? <span className="s">{sub}</span> : null}
      </span>
      <span className="ck">
        <Icon name="check" />
      </span>
    </button>
  )
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  )
}

export function Counter({ n, min, unit = '자 이상' }: { n: number; min: number; unit?: string }) {
  return <span className={`counter${n >= min ? ' ok' : ''}`}>{min ? `${n}/${min}${unit}` : `${n}자`}</span>
}

export const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
