'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/** 주소의 ?msg=... 를 토스트로 보여주고 주소에서 지워요 */
export function Toast() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const m = params.get('msg')
    if (!m) return
    setMsg(m)
    const rest = new URLSearchParams(params.toString())
    rest.delete('msg')
    const qs = rest.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    const t = setTimeout(() => setMsg(null), 2600)
    return () => clearTimeout(t)
  }, [params, pathname, router])

  if (!msg) return null
  return (
    <div className="toast" role="status" aria-live="polite">
      {msg}
    </div>
  )
}
