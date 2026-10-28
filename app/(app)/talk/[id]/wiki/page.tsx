import { notFound } from 'next/navigation'
import { TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { WikiExport } from './WikiExport'

export const metadata = { title: '위키로 옮기기' }

export default async function WikiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireMember()
  const { data: p } = await supabase
    .from('posts')
    .select('id, tag, title, body, created_at, author:profiles!posts_user_id_fkey(name, cohort), comments(body, created_at, author:profiles!comments_user_id_fkey(name, cohort))')
    .eq('id', Number(id))
    .order('created_at', { referencedTable: 'comments' })
    .maybeSingle()
  if (!p) notFound()
  const author = p.author as unknown as { name: string; cohort: string } | null
  const comments = p.comments as unknown as { body: string; author: { name: string; cohort: string } | null }[]
  const date = new Date(p.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })

  // 그루브 위키(MediaWiki) 문법으로 옮겨 적어요
  const wikitext = [
    `${p.body}`,
    '',
    comments.length ? '== 이어진 이야기 ==' : '',
    ...comments.map((c) => `* ${c.body.replace(/\n+/g, ' ')} — ${c.author?.name ?? ''}(${c.author?.cohort ?? ''})`),
    '',
    `''GrooV 라운지 토크(${p.tag})에서 옮김 · ${author?.name ?? ''}(${author?.cohort ?? ''}) · ${date}''`,
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n')

  return (
    <main className="main sub">
      <TopBar back={`/talk/${p.id}`} title="위키로 옮기기" />
      <p className="sub2" style={{ margin: 0 }}>
        위키 문서 제목을 정하고, 아래 내용을 복사해 위키 편집 화면에 붙여넣어 주세요. 그루브 위키에 로그인되어 있어야 해요.
      </p>
      <WikiExport title={p.title} wikitext={wikitext} />
    </main>
  )
}
