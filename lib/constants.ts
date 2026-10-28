export const INSTRUMENTS = ['드럼', '베이스', '피아노', '기타', '관악', '보컬'] as const
export const RHYTHM = ['드럼', '베이스', '피아노'] as const

export const EVENT_TYPES = {
  listen: '감상모임',
  jam: '잼데이',
  rehearsal: '합주',
  show: '정기공연',
  out: '외부 공연',
} as const
export type EventType = keyof typeof EVENT_TYPES

export const ROLE_LABEL = { student: '재학생', ob: 'OB', admin: '운영진' } as const

export const POST_TAGS = ['추천', '질문', '후기', '잡담'] as const

export const REPAIR_STEPS = ['접수', '확인', '수리 중', '완료'] as const
export const BUY_STEPS = ['제안', '검토 중', '구매 확정', '도착'] as const

export const SYMPTOMS = ['소리가 안 나요', '잡음이 나요', '부품이 부러졌어요', '나사, 클러치가 풀려요', '조율, 세팅이 필요해요', '케이블, 단자 문제'] as const
export const URGENCY = [
  { k: '긴급', t: '다음 활동 전에 꼭 필요해요', s: '대신 쓸 악기가 없어요' },
  { k: '이번 달', t: '이번 달 안에 고쳐주세요', s: '대신 쓸 수 있는 게 있어요' },
  { k: '여유', t: '여유 있어요', s: '방학 정비 때 같이 봐도 돼요' },
] as const

export const BUY_CATEGORIES = ['악기', '앰프 · 음향', '액세서리', '소모품'] as const
export const USES = ['잼데이', '정기공연 합주', '개인 연습', '감상모임', '버스킹'] as const
export const FREQUENCY = ['거의 매일', '주 1~2회', '한 달에 몇 번', '공연 때만'] as const

export const GEAR_STATUS = {
  ok: { label: '정상', tone: 's' },
  broken: { label: '고장', tone: 'd' },
  repairing: { label: '수리 중', tone: 'p' },
} as const

export const ROOM_HOURS = Array.from({ length: 12 }, (_, i) => 10 + i)

export const WIKI_HOME = 'https://groovwiki.com/index.php/%EB%8C%80%EB%AC%B8'
export const wikiSearch = (q: string) => `https://groovwiki.com/index.php?search=${encodeURIComponent(q)}`
export const wikiEdit = (title: string) => `https://groovwiki.com/index.php?title=${encodeURIComponent(title)}&action=edit`
export const youtubeSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
export const spotifySearch = (q: string) => `https://open.spotify.com/search/${encodeURIComponent(q)}`

/** 좋아요가 이만큼 모인 토크 글에 '위키로 옮기기'가 생겨요 */
export const WIKI_LIKES = 10
