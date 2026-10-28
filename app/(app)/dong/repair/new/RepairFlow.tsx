'use client'

import { useState, useTransition } from 'react'
import { PhotoPicker } from '@/components/PhotoPicker'
import { SYMPTOMS, URGENCY } from '@/lib/constants'
import { photoUrl } from '@/lib/supabase/env'
import { submitRepair } from '../../actions'
import { Chip, Counter, Flow, Opt, toggle } from '../../Flow'

type Gear = { id: number; name: string; category: string; status: string }

const QUESTIONS = ['어떤 악기가 고장 났나요?', '어떤 문제가 있나요?', '고장 난 부분을 찍어 올려주세요', '얼마나 급한가요?', '이대로 수리 요청할까요?']

export function RepairFlow({ gear, userId, initialGear, nextUse }: { gear: Gear[]; userId: string; initialGear: number | null; nextUse: string | null }) {
  const [step, setStep] = useState(initialGear ? 1 : 0)
  const [gearId, setGearId] = useState<number | 'other' | null>(initialGear)
  const [gearOther, setGearOther] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [detail, setDetail] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [urgency, setUrgency] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const gearName = gearId === 'other' ? gearOther : gear.find((g) => g.id === gearId)?.name
  const valid = [
    gearId !== null && (gearId !== 'other' || gearOther.trim().length > 0),
    symptoms.length > 0 && detail.trim().length >= 5,
    !uploading,
    urgency !== null,
    !pending,
  ][step]
  const last = step === QUESTIONS.length - 1

  function next() {
    if (!valid) return
    if (!last) return setStep(step + 1)
    setError(null)
    start(async () => {
      const res = await submitRepair({
        gearId: typeof gearId === 'number' ? gearId : null,
        gearOther,
        symptoms,
        detail,
        urgency: urgency!,
        photos,
      })
      if (res?.error) setError(res.error)
    })
  }

  return (
    <Flow
      label="수리 요청"
      step={step}
      total={QUESTIONS.length}
      question={QUESTIONS[step]}
      exit="/dong"
      onBack={() => setStep(step - 1)}
      onNext={next}
      canNext={Boolean(valid)}
      error={error}
      nextLabel={last ? (pending ? '보내는 중' : '수리 요청 보내기') : step === 2 && !photos.length ? '사진 없이 다음' : '다음'}
    >
      {step === 0 ? (
        <>
          <div className="opts">
            {gear.map((g) => (
              <Opt
                key={g.id}
                on={gearId === g.id}
                onClick={() => {
                  setGearId(g.id)
                  setStep(1)
                }}
                title={g.name}
                sub={`${g.category}${g.status !== 'ok' ? ' · 이미 요청이 있어요' : ''}`}
              />
            ))}
            <Opt on={gearId === 'other'} onClick={() => setGearId('other')} title="목록에 없어요" />
          </div>
          {gearId === 'other' ? (
            <input className="tf" value={gearOther} onChange={(e) => setGearOther(e.target.value)} placeholder="악기 이름" aria-label="악기 이름" maxLength={40} autoFocus />
          ) : null}
        </>
      ) : null}

      {step === 1 ? (
        <>
          <div className="field">
            <span className="flabel">
              증상 <span className="counter">여러 개 골라도 돼요</span>
            </span>
            <div className="chips">
              {SYMPTOMS.map((s) => (
                <Chip key={s} on={symptoms.includes(s)} onClick={() => setSymptoms(toggle(symptoms, s))}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="flabel" htmlFor="detail">
              자세히 알려주세요 <Counter n={detail.trim().length} min={5} />
            </label>
            <textarea className="tf" id="detail" value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={1000} placeholder="언제부터, 어떻게 하면 문제가 생기는지 적어주세요" />
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <PhotoPicker userId={userId} value={photos} onChange={setPhotos} onBusy={setUploading} />
          <span className="cap">어디가 고장 났는지 보이게 찍으면 수리점에 설명하기 쉬워요. 사진 없이 넘어가도 돼요.</span>
        </>
      ) : null}

      {step === 3 ? (
        <div className="opts">
          {URGENCY.map((u) => (
            <Opt key={u.k} on={urgency === u.k} onClick={() => setUrgency(u.k)} title={u.t} sub={u.k === '긴급' && nextUse ? `${nextUse}에 써야 해요` : u.s} />
          ))}
        </div>
      ) : null}

      {step === 4 ? (
        <>
          <dl className="kv">
            <dt>악기</dt>
            <dd>{gearName}</dd>
            <dt>증상</dt>
            <dd>{symptoms.join(', ')}</dd>
            <dt>사진</dt>
            <dd>{photos.length}장</dd>
            <dt>급한 정도</dt>
            <dd>{urgency}</dd>
          </dl>
          <div className="note" style={{ whiteSpace: 'pre-wrap' }}>
            {detail}
          </div>
          {photos.length ? (
            <div className="photos">
              {photos.map((p) => (
                <div key={p} className="photo">
                  <img src={photoUrl(p)} alt="첨부 사진" />
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </Flow>
  )
}
