'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  pending,
  className = 'cta',
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: string }) {
  const { pending: busy } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={busy || disabled} {...rest}>
      {busy ? (pending ?? '잠시만요') : children}
    </button>
  )
}
