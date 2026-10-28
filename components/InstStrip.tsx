import { INSTRUMENTS } from '@/lib/constants'
import { byInstrument, type Signup } from '@/lib/jam'

export function InstStrip({ signups, names }: { signups: Signup[]; names?: boolean }) {
  const map = byInstrument(signups)
  return (
    <div className="inststrip">
      {INSTRUMENTS.map((i) => (
        <div key={i} className={`inst${map[i].length ? '' : ' zero'}`}>
          <b>{map[i].length}</b>
          <span>{i}</span>
          {names ? (
            <span className="who">
              {map[i].map((s) => (s.person?.name ?? '') + (s.person?.role === 'ob' ? '(OB)' : '')).join(' ')}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
