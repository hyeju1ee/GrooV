'use client'

import { useActionState } from 'react'
import { join } from '../actions'
import { SubmitButton } from '@/components/SubmitButton'
import { INSTRUMENTS } from '@/lib/constants'

export function JoinForm({ code }: { code: string }) {
  const [state, action] = useActionState(join, undefined)
  if (state?.info) return <div className="note p">{state.info}</div>
  return (
    <form action={action} className="stack">
      <input type="hidden" name="code" value={code} />
      <div className="field">
        <label className="flabel" htmlFor="name">
          이름
        </label>
        <input className="tf" id="name" name="name" maxLength={20} required autoComplete="name" />
      </div>
      <div className="field">
        <label className="flabel" htmlFor="cohort">
          학번 <span className="counter">두 자리, 예: 25</span>
        </label>
        <input className="tf" id="cohort" name="cohort" inputMode="numeric" pattern="[0-9]{2}" maxLength={2} required />
      </div>
      <div className="field">
        <label className="flabel" htmlFor="instrument">
          악기
        </label>
        <select className="tf" id="instrument" name="instrument" required defaultValue="">
          <option value="" disabled>
            골라주세요
          </option>
          {INSTRUMENTS.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="flabel" htmlFor="email">
          이메일 <span className="counter">로그인할 때 써요</span>
        </label>
        <input className="tf" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label className="flabel" htmlFor="password">
          비밀번호 <span className="counter">8자 이상</span>
        </label>
        <input className="tf" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      {state?.error ? <div className="note d">{state.error}</div> : null}
      <SubmitButton pending="가입하는 중">가입하기</SubmitButton>
    </form>
  )
}
