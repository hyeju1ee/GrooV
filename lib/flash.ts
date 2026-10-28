import { redirect } from 'next/navigation'

/** 처리 결과를 토스트로 보여주며 이동해요 */
export function go(path: string, msg?: string): never {
  if (!msg) redirect(path)
  const sep = path.includes('?') ? '&' : '?'
  redirect(`${path}${sep}msg=${encodeURIComponent(msg)}`)
}

export function str(fd: FormData, key: string) {
  const v = fd.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

export function num(fd: FormData, key: string) {
  const n = Number(str(fd, key))
  return Number.isFinite(n) ? n : NaN
}

/** 데이터베이스 오류를 사람이 읽을 수 있는 문장으로 */
export function dbMessage(error: { message: string; code?: string } | null, fallback = '저장하지 못했어요. 다시 시도해 주세요') {
  if (!error) return fallback
  if (error.code === '23505') return '이미 있어요'
  if (error.code === '42501' || /row-level security/.test(error.message)) return '이 작업을 할 수 있는 권한이 없어요'
  if (error.code === '23514') return '입력한 내용을 다시 확인해 주세요'
  if (error.code === 'P0001') return error.message
  return fallback
}
