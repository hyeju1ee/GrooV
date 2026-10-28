import { SubmitButton } from '@/components/SubmitButton'
import { EVENT_TYPES } from '@/lib/constants'
import type { GroovEvent } from '@/lib/types'

export function EventForm({ action, event, date }: { action: (fd: FormData) => Promise<void>; event?: GroovEvent; date?: string }) {
  return (
    <form action={action} className="stack">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <div className="field">
        <span className="flabel">종류</span>
        <div className="chips">
          {Object.entries(EVENT_TYPES).map(([k, v]) => (
            <label key={k} className="chip">
              <input type="radio" name="type" value={k} defaultChecked={(event?.type ?? 'jam') === k} />
              {v}
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="flabel" htmlFor="title">
          제목
        </label>
        <input className="tf" id="title" name="title" maxLength={60} required defaultValue={event?.title ?? ''} placeholder="예: 잼데이, 감상모임 #43 · 하드밥" />
      </div>
      <div className="inline" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="field">
          <label className="flabel" htmlFor="date">
            날짜
          </label>
          <input className="tf" id="date" name="date" type="date" required defaultValue={event?.date ?? date} />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="start_time">
            시작 시간
          </label>
          <input className="tf" id="start_time" name="start_time" type="time" defaultValue={event?.start_time?.slice(0, 5) ?? '19:00'} />
        </div>
      </div>
      <div className="field">
        <label className="flabel" htmlFor="place">
          장소
        </label>
        <input className="tf" id="place" name="place" maxLength={40} defaultValue={event?.place ?? '동방'} />
      </div>
      <div className="field">
        <label className="flabel" htmlFor="note">
          메모 <span className="counter">선택</span>
        </label>
        <textarea className="tf" id="note" name="note" maxLength={300} defaultValue={event?.note ?? ''} style={{ minHeight: 80 }} />
      </div>
      <div className="ctabar">
        <SubmitButton>{event ? '고친 내용 저장' : '일정 등록'}</SubmitButton>
      </div>
    </form>
  )
}
