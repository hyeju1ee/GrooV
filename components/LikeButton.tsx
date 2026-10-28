import { Icon } from './Icon'

/** 좋아요 토글. 서버 액션 폼이라 자바스크립트가 늦게 떠도 동작해요. */
export function LikeButton({
  action,
  id,
  on,
  count,
  label,
  extra,
}: {
  action: (fd: FormData) => Promise<void>
  id: number
  on: boolean
  count: number
  label?: string
  extra?: Record<string, string | number>
}) {
  return (
    <form action={action} style={{ display: 'inline-flex' }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="on" value={on ? '1' : '0'} />
      {extra ? Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />) : null}
      <button type="submit" className="like" aria-pressed={on} aria-label={on ? '좋아요 취소' : '좋아요'}>
        <Icon name="heart" />
        {label ? `${label} ` : ''}
        {count}
      </button>
    </form>
  )
}
