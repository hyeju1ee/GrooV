import { SubmitButton } from '@/components/SubmitButton'
import { POST_TAGS } from '@/lib/constants'

export function PostForm({
  action,
  post,
}: {
  action: (fd: FormData) => Promise<void>
  post?: { id: number; tag: string; title: string; body: string }
}) {
  return (
    <form action={action} className="stack">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <div className="chips" role="radiogroup" aria-label="태그">
        {POST_TAGS.map((t) => (
          <label key={t} className="chip">
            <input type="radio" name="tag" value={t} defaultChecked={(post?.tag ?? '추천') === t} />
            {t}
          </label>
        ))}
      </div>
      <div className="field">
        <label className="flabel" htmlFor="title">
          제목
        </label>
        <input className="tf" id="title" name="title" maxLength={100} required defaultValue={post?.title} placeholder="예: 요즘 꽂힌 앨범" />
      </div>
      <div className="field">
        <label className="flabel" htmlFor="body">
          내용
        </label>
        <textarea className="tf" id="body" name="body" maxLength={5000} required defaultValue={post?.body} style={{ minHeight: 220 }} />
      </div>
      <div className="ctabar">
        <SubmitButton>{post ? '고친 내용 저장' : '올리기'}</SubmitButton>
      </div>
    </form>
  )
}
