'use client'

import { useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { addTrack } from '../../actions'

export function TrackForm({ sessionId }: { sessionId: number }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function lookup() {
    if (!url) return
    setLoading(true)
    setHint(null)
    try {
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`)
      const data = (await res.json()) as { title?: string; author?: string; error?: string }
      if (!res.ok || !data.title) {
        setHint(data.error ?? '곡 정보를 찾지 못했어요. 직접 적어주세요')
        return
      }
      setTitle(data.title)
      if (data.author && !artist) setArtist(data.author.replace(/ - Topic$/, ''))
      setHint('링크에서 제목을 가져왔어요. 맞게 고쳐주세요')
    } catch {
      setHint('곡 정보를 불러오지 못했어요. 직접 적어주세요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={addTrack} className="stack">
      <input type="hidden" name="session_id" value={sessionId} />
      <div className="field">
        <label className="flabel" htmlFor="url">
          유튜브, 스포티파이 링크 <span className="counter">선택</span>
        </label>
        <div className="inline">
          <input className="tf" id="url" name="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          <button type="button" className="cta weak" onClick={lookup} disabled={!url || loading}>
            {loading ? '읽는 중' : '불러오기'}
          </button>
        </div>
        {hint ? <span className="cap">{hint}</span> : null}
      </div>
      <div className="field">
        <label className="flabel" htmlFor="title">
          곡 제목
        </label>
        <input className="tf" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
      </div>
      <div className="field">
        <label className="flabel" htmlFor="artist">
          연주자
        </label>
        <input className="tf" id="artist" name="artist" value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={100} required placeholder="예: Sonny Rollins" />
      </div>
      <div className="inline" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="field">
          <label className="flabel" htmlFor="album">
            앨범 <span className="counter">선택</span>
          </label>
          <input className="tf" id="album" name="album" maxLength={100} />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="year">
            연도
          </label>
          <input className="tf" id="year" name="year" type="number" min={1900} max={2100} />
        </div>
      </div>
      <div className="field">
        <label className="flabel" htmlFor="comment">
          고른 이유 <span className="counter">한 줄이면 충분해요</span>
        </label>
        <textarea className="tf" id="comment" name="comment" maxLength={300} style={{ minHeight: 80 }} placeholder="예: 맥스 로치 드럼 솔로 구간은 꼭 들어주세요" />
      </div>
      <div className="ctabar">
        <SubmitButton>올리기</SubmitButton>
      </div>
    </form>
  )
}
