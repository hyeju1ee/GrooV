import { notFound } from 'next/navigation'
import { TopBar } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import type { GroovEvent } from '@/lib/types'
import { deleteEvent, updateEvent } from '../../actions'
import { EventForm } from '../../EventForm'

export const metadata = { title: '일정 고치기' }

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('events').select('*').eq('id', Number(id)).maybeSingle<GroovEvent>()
  if (!data) notFound()
  return (
    <main className="main sub">
      <TopBar back={`/calendar?d=${data.date}`} title="일정 고치기">
        <form action={deleteEvent}>
          <input type="hidden" name="id" value={data.id} />
          <button className="chip danger" type="submit">
            지우기
          </button>
        </form>
      </TopBar>
      <EventForm action={updateEvent} event={data} />
    </main>
  )
}
