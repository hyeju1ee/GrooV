import { photoUrl } from '@/lib/supabase/env'

export function Gallery({ photos }: { photos: string[] }) {
  if (!photos.length) return null
  return (
    <div className="gallery">
      {photos.map((p, i) => (
        <a key={p} href={photoUrl(p)} target="_blank" rel="noopener noreferrer" className="photo" aria-label={`사진 ${i + 1} 크게 보기`}>
          <img src={photoUrl(p)} alt={`첨부 사진 ${i + 1}`} />
        </a>
      ))}
    </div>
  )
}
