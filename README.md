# GrooV 라운지

성균관대학교 재즈동아리 그루브의 커뮤니티 웹앱이에요. [그루브 위키](https://groovwiki.com/index.php/%EB%8C%80%EB%AC%B8)가 정리된 기록이라면, 라운지는 부원들이 일정을 맞추고 음악을 나누고 동방을 함께 관리하는 곳이에요.

- **홈**: 다음 일정(잼데이면 악기별 인원과 빈 악기 경고), 동방 소식, 앨범 투표, 동아리 소식
- **일정**: 월간 캘린더, 잼데이 악기별 참가 신청, 참가자들이 같이 칠 수 있는 곡 추천, 신청곡과 +1
- **감상**: 감상모임 회차별 플레이리스트(유튜브, 스포티파이 링크로 곡 정보 불러오기), 앨범 투표, 블라인드 퀴즈
- **토크**: 추천, 질문, 후기, 잡담 게시판. 좋아요 10개가 넘은 글은 위키로 옮기기
- **동방**: 수리 요청과 구매 제안(사진 최대 5장, 구매 제안은 기대효과 필수), 진행 상태와 알림, 악기 현황, 동방 예약
- **내 정보**: 프로필, 연주할 수 있는 곡, 외부 공연 같이 가기, 연말결산, 운영진 도구(회원 승인, 초대 링크)
- **공개 페이지**: `/show` 정기공연 안내는 로그인 없이 누구나 볼 수 있어요

## 누가 무엇을 할 수 있나

가입은 운영진이 만든 **초대 링크**로만 할 수 있어요. 링크마다 역할(재학생, 졸업생, 운영진), 바로 입장 또는 승인 필요, 만료일, 최대 인원을 정해요.

| 할 수 있는 일 | 재학생 | 졸업생(OB) | 운영진 |
| --- | --- | --- | --- |
| 보기, 글, 댓글, 좋아요, 투표 | O | O | O |
| 잼데이 참가 | O | O (OB로 표시) | O |
| 수리 요청, 구매 제안 쓰기 | O | 보기와 공감만 | O |
| 동방 예약 (하루 2시간) | O | X | O |
| 일정, 감상모임, 투표, 퀴즈 만들기 | X | X | O |
| 요청 진행 상태 바꾸기, 글 숨기기 | X | X | O |
| 회원 승인, 역할 변경, 초대 링크 | X | X | O |

이 규칙은 화면뿐 아니라 데이터베이스의 행 수준 보안(RLS)으로 막혀 있어서, 주소를 직접 쳐도 우회할 수 없어요.

## 처음 배포하기

필요한 것: GitHub 계정, [Supabase](https://supabase.com) 계정, [Vercel](https://vercel.com) 계정. 모두 무료 플랜으로 충분해요.

### 1. Supabase 프로젝트 만들기

1. supabase.com에서 **New project**를 만들어요. Region은 `Northeast Asia (Seoul)`을 고르세요.
2. 왼쪽 메뉴 **SQL Editor**를 열고, 이 저장소의 [`supabase/schema.sql`](supabase/schema.sql) 내용을 전부 붙여넣고 **Run**을 눌러요. 테이블, 권한 규칙, 사진 저장소, 스탠다드 곡 목록이 한 번에 만들어져요.
3. **Authentication > Sign In / Providers > Email**에서 **Confirm email**을 끄는 것을 추천해요. Supabase 기본 메일 발송은 시간당 몇 통으로 제한돼서, 켜 두면 여러 명이 한꺼번에 가입할 때 인증 메일이 오지 않을 수 있어요. 초대 링크가 이미 가입을 막고 있으니 꺼도 괜찮아요.
4. **Project Settings > API**에서 `Project URL`과 `anon public` 키(또는 `Publishable key`)를 복사해 두세요.

### 2. Vercel에 배포하기

1. vercel.com에 GitHub 계정으로 로그인하고 **Add New > Project**에서 `GrooV` 저장소를 **Import**해요.
2. **Environment Variables**에 두 값을 넣어요.
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public 키
3. **Deploy**를 눌러요. 1~2분 뒤에 `https://<프로젝트이름>.vercel.app` 주소가 생겨요.
4. Supabase의 **Authentication > URL Configuration**에서 **Site URL**을 이 Vercel 주소로 바꿔 주세요.

이후에는 GitHub `main` 브랜치에 코드가 올라갈 때마다 Vercel이 자동으로 다시 배포해요. 환경변수를 바꿨다면 Vercel에서 **Redeploy**를 한 번 눌러야 반영돼요.

### 3. 첫 운영진 계정 만들기

초대 링크는 운영진이 만들기 때문에, 첫 운영진 링크만 SQL로 만들어요. Supabase **SQL Editor**에서 아래를 실행하세요. `admin-` 뒤는 남이 추측하기 어려운 영문, 숫자로 바꿔주세요.

```sql
insert into public.invites (code, role, auto_approve, max_uses, expires_at)
values ('admin-여기를바꾸세요', 'admin', true, 1, now() + interval '1 day');
```

> 코드는 영문, 숫자, 하이픈만 쓸 수 있어요. 예: `admin-k7Qp2xLm`

그다음 `https://<배포주소>/join/admin-k7Qp2xLm`으로 들어가 가입하면 운영진 계정이 돼요. 이후 다른 부원 링크는 앱의 **내 정보 > 초대 링크 관리**에서 만들면 돼요.

- 재학생 단톡방용: 역할 `재학생`, "승인 없이 바로 들어오게 하기" 체크
- 졸업생용: 역할 `졸업생(OB)`, 승인 필요 (가입 신청이 오면 **회원 관리**에서 승인)

### 4. 동방 악기 목록 채우기

운영진 계정으로 **동방 > 악기 현황**에 들어가 아래쪽 **악기 추가**로 동방에 있는 악기를 등록하세요. 부원이 악기를 누르면 그 악기로 수리 요청이 시작돼요.

## 그루브 색

색은 그루브 대표 이미지(SKKU JAZZ CLUB 레코드 로고)에서 뽑아 [`app/globals.css`](app/globals.css) 맨 위에 모아 두었어요.

| 이름 | 색 | 쓰는 곳 |
| --- | --- | --- |
| `--navy` | `#013C56` | 밝은 화면의 버튼, 강조, 결산 카드 |
| `--record` | `#1E1F1F` | 레코드 로고, 어두운 화면의 버튼 글씨 |
| `--gold` | `#D4B869` | 잼데이, 구매 제안, OB 배지, 어두운 화면의 버튼 |
| `--yellow` | `#FAE070` | 로그인 배너, 레코드 라벨, 탭 아이콘 |

휴대폰이 다크 모드면 버튼이 골드로 바뀌어 검정 레코드 위 골드 글씨처럼 보여요. 로고 글씨는 대표 이미지와 비슷한 세리프체 Playfair Display예요.

## 내 컴퓨터에서 실행하기

```bash
npm install
cp .env.example .env.local   # Supabase 주소와 키를 채워 넣기
npm run dev                  # http://localhost:3000
```

## 구조

```
app/
  (app)/          로그인한 회원만 보는 화면 (홈, 일정, 감상, 토크, 동방, 내 정보, 운영진)
  login/ join/    로그인, 초대 링크 가입
  show/           공개 정기공연 페이지
  api/oembed/     유튜브, 스포티파이 링크에서 곡 제목 읽기
components/       공통 UI (탭 바, 사진 첨부, 토스트 등)
lib/              Supabase 연결, 날짜(한국 시간), 상수, 권한 확인
supabase/schema.sql  데이터베이스 전체 (테이블, 권한, 트리거, 사진 저장소)
```

기술: Next.js 15 (App Router, 서버 액션), Supabase (Postgres, Auth, Storage), Vercel.

## 알아두면 좋은 점

- 첨부 사진은 올리기 전에 휴대폰에서 긴 변 1600px로 줄여서 Supabase Storage의 `photos` 버킷에 저장해요. 버킷은 공개라서 사진 주소를 아는 사람은 볼 수 있어요(주소는 추측할 수 없는 무작위 이름이에요). 악기 사진 외에 민감한 사진은 올리지 않도록 안내해 주세요.
- 비밀번호를 잊은 부원은 운영진이 Supabase 대시보드의 **Authentication > Users**에서 해당 사용자를 골라 비밀번호 재설정 메일을 보내거나 새 비밀번호를 정해줄 수 있어요.
- "위키로 옮기기"는 위키 문법으로 정리한 내용을 복사하고 위키 편집 화면을 열어주는 방식이에요. 위키에 자동으로 글을 쓰지는 않아요.
