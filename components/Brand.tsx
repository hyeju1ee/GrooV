/** GrooV 글자 로고: 레코드 마크 + 세리프 글씨 */
export function Logo() {
  return (
    <span className="logo">
      <span className="mark" aria-hidden="true" />
      <span>
        Groo<span className="v">V</span>
      </span>
    </span>
  )
}

/** 그루브 대표 이미지(노랑 바탕, 검정 레코드, 골드 글씨)를 그대로 그린 배너 */
export function BrandHero({ navy }: { navy?: boolean }) {
  return (
    <div className={`brand${navy ? ' navy' : ''}`} role="img" aria-label="SKKU JAZZ CLUB">
      <div className="disc">
        <span>
          SKKU
          <br />
          JAZZ
          <br />
          CLUB
        </span>
      </div>
    </div>
  )
}
