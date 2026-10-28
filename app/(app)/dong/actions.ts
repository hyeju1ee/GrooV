'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canWriteDong, requireAdmin, requireMember } from '@/lib/auth'
import { BUY_CATEGORIES, FREQUENCY, SYMPTOMS, URGENCY, USES } from '@/lib/constants'
import { isDateString } from '@/lib/date'
import { dbMessage, go, num, str } from '@/lib/flash'

type Result = { error: string } | undefined

const has = (list: readonly string[], v: string) => list.includes(v)
const cleanPhotos = (photos: string[], uid: string) =>
  photos.filter((p) => typeof p === 'string' && p.startsWith(`${uid}/`) && !p.includes('..')).slice(0, 5)

/* ---------- 수리 요청 ---------- */
export interface RepairInput {
  gearId: number | null
  gearOther: string
  symptoms: string[]
  detail: string
  urgency: string
  photos: string[]
}

export async function submitRepair(input: RepairInput): Promise<Result> {
  const { supabase, me } = await requireMember()
  if (!canWriteDong(me)) return { error: '수리 요청은 재학생이 써요' }
  const symptoms = input.symptoms.filter((s) => has(SYMPTOMS, s))
  const detail = input.detail.trim()
  if (!input.gearId && !input.gearOther.trim()) return { error: '악기를 골라주세요' }
  if (!symptoms.length) return { error: '증상을 하나 이상 골라주세요' }
  if (detail.length < 5) return { error: '자세한 설명을 5자 이상 적어주세요' }
  if (!URGENCY.some((u) => u.k === input.urgency)) return { error: '급한 정도를 골라주세요' }

  const { data, error } = await supabase
    .from('repair_requests')
    .insert({
      gear_id: input.gearId,
      gear_other: input.gearId ? null : input.gearOther.trim().slice(0, 40),
      symptoms,
      detail,
      urgency: input.urgency,
      photos: cleanPhotos(input.photos, me.id),
      user_id: me.id,
    })
    .select('id')
    .single()
  if (error) return { error: dbMessage(error) }
  revalidatePath('/', 'layout')
  redirect(`/dong/done?k=repair&id=${data.id}`)
}

/* ---------- 구매 제안 ---------- */
export interface BuyInput {
  name: string
  category: string
  price: number
  url: string
  photos: string[]
  pain: string
  gain: string
  uses: string[]
  frequency: string
}

export async function submitBuy(input: BuyInput): Promise<Result> {
  const { supabase, me } = await requireMember()
  if (!canWriteDong(me)) return { error: '구매 제안은 재학생이 써요' }
  const pain = input.pain.trim()
  const gain = input.gain.trim()
  const uses = input.uses.filter((u) => has(USES, u))
  if (!input.name.trim() || !has(BUY_CATEGORIES, input.category)) return { error: '이름과 분류를 적어주세요' }
  if (!(input.price > 0 && input.price < 100_000_000)) return { error: '예상 가격을 적어주세요' }
  // 기대효과는 모두 필수예요
  if (pain.length < 10) return { error: '지금 불편한 점을 10자 이상 적어주세요' }
  if (gain.length < 20) return { error: '사면 좋아지는 점을 20자 이상 적어주세요' }
  if (!uses.length) return { error: '어디에 쓰는지 하나 이상 골라주세요' }
  if (!has(FREQUENCY, input.frequency)) return { error: '얼마나 자주 쓰는지 골라주세요' }

  const { data, error } = await supabase
    .from('buy_proposals')
    .insert({
      name: input.name.trim().slice(0, 80),
      category: input.category,
      price: Math.round(input.price),
      url: /^https?:\/\//.test(input.url.trim()) ? input.url.trim() : null,
      photos: cleanPhotos(input.photos, me.id),
      pain,
      gain,
      uses,
      frequency: input.frequency,
      user_id: me.id,
    })
    .select('id')
    .single()
  if (error) return { error: dbMessage(error) }
  revalidatePath('/', 'layout')
  redirect(`/dong/done?k=buy&id=${data.id}`)
}

export async function toggleCheer(fd: FormData) {
  const { supabase, me } = await requireMember()
  const id = num(fd, 'id')
  if (str(fd, 'on') === '1') await supabase.from('proposal_cheers').delete().eq('proposal_id', id).eq('user_id', me.id)
  else await supabase.from('proposal_cheers').upsert({ proposal_id: id, user_id: me.id }, { ignoreDuplicates: true })
  revalidatePath(`/dong/buy/${id}`)
  revalidatePath('/dong')
}

/* ---------- 운영진: 진행 상태 ---------- */
export async function updateRequest(fd: FormData) {
  const { supabase } = await requireAdmin()
  const kind = str(fd, 'kind') === 'buy' ? 'buy' : 'repair'
  const id = num(fd, 'id')
  const table = kind === 'buy' ? 'buy_proposals' : 'repair_requests'
  const op = str(fd, 'op')
  const patch: Record<string, unknown> = {}
  if (op === 'advance') patch.status = Math.min(3, num(fd, 'status') + 1)
  if (op === 'back') patch.status = Math.max(0, num(fd, 'status') - 1)
  if (op === 'hold') patch.held = true
  if (op === 'unhold') patch.held = false
  if (op === 'memo') patch.memo = str(fd, 'memo').slice(0, 300) || null
  const { error } = await supabase.from(table).update(patch).eq('id', id)
  if (error) go(`/dong/${kind}/${id}`, dbMessage(error))
  revalidatePath('/', 'layout')
  go(`/dong/${kind}/${id}`, op === 'memo' ? '메모를 남겼어요. 요청한 사람에게 알림이 가요' : '진행 상태를 바꿨어요. 요청한 사람에게 알림이 가요')
}

export async function deleteRequest(fd: FormData) {
  const { supabase, me } = await requireMember()
  const kind = str(fd, 'kind') === 'buy' ? 'buy' : 'repair'
  const id = num(fd, 'id')
  const table = kind === 'buy' ? 'buy_proposals' : 'repair_requests'
  const { data: row } = await supabase.from(table).select('photos, user_id').eq('id', id).maybeSingle()
  const { error, count } = await supabase.from(table).delete({ count: 'exact' }).eq('id', id)
  if (error || !count) go(`/dong/${kind}/${id}`, error ? dbMessage(error) : '진행 중인 요청은 지울 수 없어요')
  if (row?.user_id === me.id && row.photos?.length) await supabase.storage.from('photos').remove(row.photos)
  revalidatePath('/', 'layout')
  go('/dong', '요청을 지웠어요')
}

/* ---------- 운영진: 악기 목록 ---------- */
export async function addGear(fd: FormData) {
  const { supabase } = await requireAdmin()
  const name = str(fd, 'name')
  const category = str(fd, 'category')
  if (!name || !category) go('/dong?tab=gear', '악기 이름과 분류를 적어주세요')
  const { error } = await supabase.from('gear').insert({ name, category })
  if (error) go('/dong?tab=gear', dbMessage(error))
  revalidatePath('/dong')
  go('/dong?tab=gear', `${name}을(를) 추가했어요`)
}

export async function setGearStatus(fd: FormData) {
  const { supabase } = await requireAdmin()
  const status = str(fd, 'status')
  if (!['ok', 'broken', 'repairing'].includes(status)) return
  await supabase.from('gear').update({ status }).eq('id', num(fd, 'id'))
  revalidatePath('/dong')
}

export async function deleteGear(fd: FormData) {
  const { supabase } = await requireAdmin()
  await supabase.from('gear').delete().eq('id', num(fd, 'id'))
  revalidatePath('/dong')
  go('/dong?tab=gear', '악기를 목록에서 뺐어요')
}

/* ---------- 동방 예약 ---------- */
export async function book(fd: FormData) {
  const { supabase, me } = await requireMember()
  const date = str(fd, 'date')
  const hour = num(fd, 'hour')
  const back = `/dong?tab=room&date=${date}`
  if (!canWriteDong(me)) go(back, '동방 예약은 재학생만 할 수 있어요')
  if (!isDateString(date) || !(hour >= 10 && hour <= 21)) go(back, '시간을 다시 골라주세요')
  const { error } = await supabase.from('room_bookings').insert({ date, hour, note: str(fd, 'note') || '개인 연습', user_id: me.id })
  if (error) go(back, error.code === '23505' ? '방금 다른 사람이 예약했어요' : dbMessage(error))
  revalidatePath('/dong')
  go(back, `${hour}:00 ~ ${hour + 1}:00 예약했어요`)
}

export async function cancelBooking(fd: FormData) {
  const { supabase } = await requireMember()
  const date = str(fd, 'date')
  await supabase.from('room_bookings').delete().eq('id', num(fd, 'id'))
  revalidatePath('/dong')
  go(`/dong?tab=room&date=${date}`, '예약을 취소했어요')
}
