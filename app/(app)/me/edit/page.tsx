import { SubmitButton } from '@/components/SubmitButton'
import { TopBar } from '@/components/ui'
import { requireMember } from '@/lib/auth'
import { INSTRUMENTS } from '@/lib/constants'
import { updateProfile } from '../actions'

export const metadata = { title: '프로필 고치기' }

export default async function EditMePage() {
  const { me } = await requireMember()
  return (
    <main className="main sub">
      <TopBar back="/me" title="프로필 고치기" />
      <form action={updateProfile} className="stack">
        <div className="field">
          <label className="flabel" htmlFor="name">
            이름
          </label>
          <input className="tf" id="name" name="name" maxLength={20} defaultValue={me.name} required />
        </div>
        <div className="field">
          <span className="flabel">악기</span>
          <div className="chips">
            {INSTRUMENTS.map((i) => (
              <label key={i} className="chip">
                <input type="radio" name="instrument" value={i} defaultChecked={me.instrument === i} />
                {i}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="flabel" htmlFor="fav_artist">
            최애 연주자
          </label>
          <input className="tf" id="fav_artist" name="fav_artist" maxLength={60} defaultValue={me.fav_artist ?? ''} placeholder="예: Bill Evans" />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="now_listening">
            요즘 듣는 앨범
          </label>
          <input className="tf" id="now_listening" name="now_listening" maxLength={100} defaultValue={me.now_listening ?? ''} placeholder="예: Brad Mehldau, Art of the Trio Vol. 1" />
        </div>
        <span className="cap">학번과 역할은 운영진이 바꿀 수 있어요.</span>
        <div className="ctabar">
          <SubmitButton>저장</SubmitButton>
        </div>
      </form>
    </main>
  )
}
