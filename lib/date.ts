// 서버(Vercel)는 UTC로 돌아가므로 날짜 계산은 모두 한국 시간 기준으로 해요.
const WD = ['일', '월', '화', '수', '목', '금', '토']

export function todayKST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

export function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}

export function isDateString(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

/** 10/29 (목) */
export function dlabel(s: string) {
  const { m, d, wd } = parseDate(s)
  return `${m}/${d} (${WD[wd]})`
}

/** 10월 28일 수요일 */
export function dlong(s: string) {
  const { m, d, wd } = parseDate(s)
  return `${m}월 ${d}일 ${WD[wd]}요일`
}

export function hm(t: string | null) {
  return t ? t.slice(0, 5) : ''
}

export function addDays(s: string, n: number) {
  const { y, m, d } = parseDate(s)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}

export function monthKey(s: string) {
  return s.slice(0, 7)
}

export function shiftMonth(ym: string, n: number) {
  const [y, m] = ym.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1 + n, 1))
  return dt.toISOString().slice(0, 7)
}

export function monthCells(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells: (string | null)[] = Array(first).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${String(d).padStart(2, '0')}`)
  return cells
}

export const WEEKDAYS = WD

/** 방금, 5분 전, 3시간 전, 어제, 10/23 */
export function ago(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 2) return '어제'
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`
  const kst = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(iso))
  return dlabel(kst)
}

export function won(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export function daysBetween(from: string, to: string) {
  const a = parseDate(from)
  const b = parseDate(to)
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)
}
