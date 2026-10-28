'use client'

import { useState, useTransition } from 'react'
import { PhotoPicker } from '@/components/PhotoPicker'
import { BUY_CATEGORIES, FREQUENCY, USES } from '@/lib/constants'
import { won } from '@/lib/date'
import { photoUrl } from '@/lib/supabase/env'
import { submitBuy } from '../../actions'
import { Chip, Counter, Flow, toggle } from '../../Flow'

const QUESTIONS = ['어떤 걸 사면 좋을까요?', '얼마 정도 하나요?', '사진을 올려주세요', '왜 사야 하나요?', '이대로 제안할까요?']
const PAIN_MIN = 10
const GAIN_MIN = 20

export function BuyFlow({ userId }: { userId: string }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [pain, setPain] = useState('')
  const [gain, setGain] = useState('')
  const [uses, setUses] = useState<string[]>([])
  const [frequency, setFrequency] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const priceNum = Number(price || 0)
  const effectOk = pain.trim().length >= PAIN_MIN && gain.trim().length >= GAIN_MIN && uses.length > 0 && frequency !== null
  const valid = [name.trim().length > 0 && category !== null, priceNum > 0, !uploading, effectOk, !pending][step]
  const last = step === QUESTIONS.length - 1

  function next() {
    if (!valid) return
    if (!last) return setStep(step + 1)
    setError(null)
    start(async () => {
      const res = await submitBuy({ name, category: category!, price: priceNum, url, photos, pain, gain, uses, frequency: frequency! })
      if (res?.error) setError(res.error)
    })
  }

  return (
    <Flow
      label="구매 제안"
      step={step}
      total={QUESTIONS.length}
      question={QUESTIONS[step]}
      exit="/dong"
      onBack={() => setStep(step - 1)}
      onNext={next}
      canNext={Boolean(valid)}
      error={error}
      nextLabel={last ? (pending ? '보내는 중' : '구매 제안 보내기') : step === 2 && !photos.length ? '사진 없이 다음' : '다음'}
    >
      {step === 0 ? (
        <>
          <div className="field">
            <label className="flabel" htmlFor="name">
              이름
            </label>
            <input className="tf" id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="예: 카혼, 베이스 앰프, 드럼 스틱" autoFocus />
          </div>
          <div className="field">
            <span className="flabel">분류</span>
            <div className="chips">
              {BUY_CATEGORIES.map((c) => (
                <Chip key={c} on={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <div className="field">
            <label className="flabel" htmlFor="price">
              예상 가격
            </label>
            <input
              className="tf"
              id="price"
              inputMode="numeric"
              value={price ? Number(price).toLocaleString('ko-KR') : ''}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
              placeholder="0"
              style={{ fontSize: 24, fontWeight: 800 }}
              autoFocus
            />
            <span className="cap">{priceNum ? won(priceNum) : '숫자만 적어주세요'}</span>
          </div>
          <div className="field">
            <label className="flabel" htmlFor="url">
              구매 링크 <span className="counter">선택</span>
            </label>
            <input className="tf" id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <PhotoPicker userId={userId} value={photos} onChange={setPhotos} onBusy={setUploading} />
          <span className="cap">제품 사진이나, 바꿔야 하는 지금 악기의 상태를 올려주세요. 사진 없이 넘어가도 돼요.</span>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <div className="note">기대효과를 모두 적어야 제안할 수 있어요. 운영진이 예산 회의에서 이 내용을 그대로 보고 판단해요.</div>
          <div className="field">
            <label className="flabel" htmlFor="pain">
              지금 어떤 점이 불편한가요? <Counter n={pain.trim().length} min={PAIN_MIN} />
            </label>
            <textarea className="tf" id="pain" value={pain} onChange={(e) => setPain(e.target.value)} maxLength={1000} style={{ minHeight: 88 }} placeholder="예: 버스킹 때 드럼을 못 가져가서 리듬 악기가 없어요" />
          </div>
          <div className="field">
            <label className="flabel" htmlFor="gain">
              사면 무엇이 좋아지나요? <Counter n={gain.trim().length} min={GAIN_MIN} />
            </label>
            <textarea className="tf" id="gain" value={gain} onChange={(e) => setGain(e.target.value)} maxLength={1000} style={{ minHeight: 88 }} placeholder="예: 야외 공연과 어쿠스틱 잼에서도 리듬을 넣을 수 있어요" />
          </div>
          <div className="field">
            <span className="flabel">어디에 쓰나요?</span>
            <div className="chips">
              {USES.map((u) => (
                <Chip key={u} on={uses.includes(u)} onClick={() => setUses(toggle(uses, u))}>
                  {u}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="flabel">얼마나 자주 쓰나요?</span>
            <div className="chips">
              {FREQUENCY.map((f) => (
                <Chip key={f} on={frequency === f} onClick={() => setFrequency(f)}>
                  {f}
                </Chip>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <dl className="kv">
            <dt>이름</dt>
            <dd>{name}</dd>
            <dt>분류</dt>
            <dd>{category}</dd>
            <dt>예상 가격</dt>
            <dd>{won(priceNum)}</dd>
            <dt>사진</dt>
            <dd>{photos.length}장</dd>
            <dt>쓰는 곳</dt>
            <dd>{uses.join(', ')}</dd>
            <dt>얼마나 자주</dt>
            <dd>{frequency}</dd>
          </dl>
          <section className="effect">
            <h2>기대효과</h2>
            <div>
              <span className="cap">지금 불편한 점</span>
              <p>{pain}</p>
            </div>
            <div>
              <span className="cap">사면 좋아지는 점</span>
              <p>{gain}</p>
            </div>
          </section>
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
