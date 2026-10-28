import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// 유튜브, 스포티파이 링크에서 곡 제목을 가져와요. 다른 사이트 주소는 받지 않아요.
const PROVIDERS: { hosts: string[]; endpoint: string }[] = [
  { hosts: ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'], endpoint: 'https://www.youtube.com/oembed?format=json&url=' },
  { hosts: ['open.spotify.com'], endpoint: 'https://open.spotify.com/oembed?url=' },
]

export async function GET(request: Request) {
  const { profile } = await getSession()
  if (profile?.status !== 'active') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const raw = new URL(request.url).searchParams.get('url') ?? ''
  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: '링크 형식이 아니에요' }, { status: 400 })
  }
  const provider = PROVIDERS.find((p) => p.hosts.includes(target.hostname))
  if (!provider || target.protocol !== 'https:') {
    return NextResponse.json({ error: '유튜브나 스포티파이 링크만 읽을 수 있어요' }, { status: 400 })
  }
  try {
    const res = await fetch(provider.endpoint + encodeURIComponent(target.toString()), { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return NextResponse.json({ error: '곡 정보를 찾지 못했어요' }, { status: 404 })
    const data = (await res.json()) as { title?: string; author_name?: string }
    return NextResponse.json({ title: data.title ?? '', author: data.author_name ?? '' })
  } catch {
    return NextResponse.json({ error: '곡 정보를 불러오지 못했어요' }, { status: 502 })
  }
}
