import { TopBar } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { isDateString, todayKST } from '@/lib/date'
import { createEvent } from '../actions'
import { EventForm } from '../EventForm'

export const metadata = { title: '일정 등록' }

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  await requireAdmin()
  const { d } = await searchParams
  return (
    <main className="main sub">
      <TopBar back="/calendar" title="일정 등록" />
      <EventForm action={createEvent} date={isDateString(d) ? d : todayKST()} />
    </main>
  )
}
