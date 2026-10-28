import { notFound } from 'next/navigation'
import { TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { TrackForm } from './TrackForm'

export const metadata = { title: '곡 올리기' }

export default async function AddTrackPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params
  const { supabase } = await requireMember()
  const { data: session } = await supabase.from('sessions').select('id, no, title').eq('id', Number(sid)).maybeSingle()
  if (!session) notFound()
  return (
    <main className="main sub">
      <TopBar back={`/listen?s=${session.id}`} title={`#${session.no} ${session.title}`} />
      <TrackForm sessionId={session.id} />
    </main>
  )
}
