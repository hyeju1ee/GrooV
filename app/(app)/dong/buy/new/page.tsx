import { canWriteDong, requireMember } from '@/lib/auth'
import { go } from '@/lib/flash'
import { BuyFlow } from './BuyFlow'

export const metadata = { title: '구매 제안' }

export default async function NewBuyPage() {
  const { me } = await requireMember()
  if (!canWriteDong(me)) go('/dong', '구매 제안은 재학생이 써요. 졸업생은 제안을 보고 공감할 수 있어요')
  return <BuyFlow userId={me.id} />
}
