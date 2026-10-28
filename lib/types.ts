import type { EventType } from './constants'

export type Role = 'student' | 'ob' | 'admin'

export interface Profile {
  id: string
  name: string
  cohort: string
  instrument: string
  role: Role
  status: 'pending' | 'active' | 'blocked'
  title: string | null
  fav_artist: string | null
  now_listening: string | null
  created_at: string
}

export type Person = Pick<Profile, 'id' | 'name' | 'cohort' | 'instrument' | 'role'>

export interface GroovEvent {
  id: number
  date: string
  start_time: string | null
  type: EventType
  title: string
  place: string | null
  note: string | null
}

export interface RepairRequest {
  id: number
  gear_id: number | null
  gear_other: string | null
  symptoms: string[]
  detail: string
  urgency: string
  photos: string[]
  status: number
  memo: string | null
  user_id: string
  created_at: string
  gear?: { name: string } | null
  author?: Person | null
}

export interface BuyProposal {
  id: number
  name: string
  category: string
  price: number
  url: string | null
  photos: string[]
  pain: string
  gain: string
  uses: string[]
  frequency: string
  status: number
  held: boolean
  memo: string | null
  user_id: string
  created_at: string
  author?: Person | null
  proposal_cheers?: { user_id: string }[]
}

export const PERSON = 'id, name, cohort, instrument, role'
