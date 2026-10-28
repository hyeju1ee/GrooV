import { TabBar } from '@/components/TabBar'
import { requireMember } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireMember()
  return (
    <div className="shell">
      {children}
      <TabBar />
    </div>
  )
}
