'use client'

import { useEffect, useState } from 'react'

export function CopyLink({ path }: { path: string }) {
  const [done, setDone] = useState(false)
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])
  const url = `${origin}${path}`
  return (
    <span className="row" style={{ gap: 6, minWidth: 0 }}>
      <code style={{ overflowWrap: 'anywhere', fontSize: 12 }}>{url}</code>
      <button
        type="button"
        className="chip"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${window.location.origin}${path}`)
            setDone(true)
            setTimeout(() => setDone(false), 1800)
          } catch {
            setDone(false)
          }
        }}
      >
        {done ? '복사했어요' : '복사'}
      </button>
    </span>
  )
}
