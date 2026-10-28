'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { photoUrl } from '@/lib/supabase/env'
import { Icon } from './Icon'

const MAX = 5
const MAX_SIDE = 1600

/** 올리기 전에 긴 변 1600px JPEG로 줄여서 용량을 아껴요 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('변환 실패'))), 'image/jpeg', 0.85))
}

export function PhotoPicker({
  userId,
  value,
  onChange,
  onBusy,
}: {
  userId: string
  value: string[]
  onChange: (paths: string[]) => void
  onBusy?: (busy: boolean) => void
}) {
  const [busy, setBusy] = useState(0)
  useEffect(() => onBusy?.(busy > 0), [busy, onBusy])
  const [error, setError] = useState<string | null>(null)

  async function add(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const room = MAX - value.length
    if (list.length > room) setError(`사진은 ${MAX}장까지 올릴 수 있어요`)
    const supabase = createClient()
    let next = [...value]
    for (const file of list.slice(0, room)) {
      setBusy((n) => n + 1)
      try {
        const blob = await shrink(file)
        const path = `${userId}/${crypto.randomUUID()}.jpg`
        const { error: upErr } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' })
        if (upErr) throw upErr
        next = [...next, path]
        onChange(next)
      } catch {
        setError('사진을 올리지 못했어요. 다른 사진으로 다시 시도해 주세요')
      } finally {
        setBusy((n) => n - 1)
      }
    }
  }

  async function remove(path: string) {
    onChange(value.filter((p) => p !== path))
    await createClient().storage.from('photos').remove([path])
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="photos">
        {value.map((p, i) => (
          <div key={p} className="photo">
            <img src={photoUrl(p)} alt={`첨부 사진 ${i + 1}`} />
            <button type="button" className="x" onClick={() => remove(p)} aria-label={`사진 ${i + 1} 지우기`}>
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div key={`busy${i}`} className="photo">
            <span className="busy">올리는 중</span>
          </div>
        ))}
        {value.length + busy < MAX ? (
          <label className="addphoto">
            <Icon name="cam" />
            <span>
              {value.length}/{MAX}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                add(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        ) : null}
      </div>
      {error ? <span className="cap" style={{ color: 'var(--danger)' }}>{error}</span> : null}
    </div>
  )
}
