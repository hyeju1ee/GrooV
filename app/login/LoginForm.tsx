'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { SubmitButton } from '@/components/SubmitButton'

export function LoginForm() {
  const [state, action] = useActionState(login, undefined)
  return (
    <form action={action} className="stack">
      <div className="field">
        <label className="flabel" htmlFor="email">
          이메일
        </label>
        <input className="tf" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label className="flabel" htmlFor="password">
          비밀번호
        </label>
        <input className="tf" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error ? <div className="note d">{state.error}</div> : null}
      <SubmitButton pending="로그인하는 중">로그인</SubmitButton>
    </form>
  )
}
