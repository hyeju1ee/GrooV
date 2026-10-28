'use client'

import { useState } from 'react'
import { wikiEdit } from '@/lib/constants'

export function WikiExport({ title: initial, wikitext }: { title: string; wikitext: string }) {
  const [title, setTitle] = useState(initial)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(wikitext)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="stack">
      <div className="field">
        <label className="flabel" htmlFor="wtitle">
          위키 문서 제목
        </label>
        <input className="tf" id="wtitle" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <span className="flabel">
          옮길 내용 <span className="counter">{copied ? '복사했어요' : '위키 문법'}</span>
        </span>
        <pre className="wikitext">{wikitext}</pre>
      </div>
      <div className="ctarow">
        <button type="button" className="cta grey" onClick={copy}>
          내용 복사
        </button>
        <a className="cta" href={wikiEdit(title.trim() || initial)} target="_blank" rel="noopener noreferrer">
          위키에서 열기 ↗
        </a>
      </div>
    </div>
  )
}
