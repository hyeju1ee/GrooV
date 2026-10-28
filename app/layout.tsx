import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Bricolage_Grotesque, Noto_Sans_KR } from 'next/font/google'
import { Toast } from '@/components/Toast'
import './globals.css'

const body = Noto_Sans_KR({ weight: ['400', '500', '700', '800'], preload: false, variable: '--font-body', display: 'swap' })
const logo = Bricolage_Grotesque({ weight: '800', subsets: ['latin'], variable: '--font-logo', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'GrooV', template: '%s · GrooV' },
  description: '성균관대 재즈동아리 그루브 라운지',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f4f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1217' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${body.variable} ${logo.variable}`}>
      <body>
        {children}
        <Suspense>
          <Toast />
        </Suspense>
      </body>
    </html>
  )
}
