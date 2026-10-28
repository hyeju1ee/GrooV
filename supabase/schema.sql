-- GrooV 라운지 데이터베이스
-- Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여넣고 Run 하세요.
-- 권한(재학생 / 졸업생 OB / 운영진)은 모두 아래의 행 수준 보안(RLS) 정책으로 데이터베이스에서 막아요.

-------------------------------------------------------------------------------
-- 1. 회원과 권한
-------------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 20),
  cohort        text not null check (cohort ~ '^[0-9]{2}$'),
  instrument    text not null check (instrument in ('드럼', '베이스', '피아노', '기타', '관악', '보컬')),
  role          text not null default 'student' check (role in ('student', 'ob', 'admin')),
  status        text not null default 'pending' check (status in ('pending', 'active', 'blocked')),
  title         text check (char_length(title) <= 20),          -- 회장, 총무 같은 직책
  fav_artist    text check (char_length(fav_artist) <= 60),
  now_listening text check (char_length(now_listening) <= 100),
  invite_code   text,
  created_at    timestamptz not null default now()
);

-- 정책 안에서 쓰는 도우미 함수. security definer라서 profiles 정책을 다시 타지 않아요.
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active');
$$;

create or replace function public.is_student() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active' and role in ('student', 'admin'));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active' and role = 'admin');
$$;

alter table public.profiles enable row level security;
create policy "회원은 서로의 프로필을 봐요" on public.profiles for select using (public.is_member() or id = auth.uid());
create policy "내 프로필은 내가 고쳐요" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "운영진은 모든 프로필을 고쳐요" on public.profiles for update using (public.is_admin());

-- 본인이 역할이나 승인 상태를 바꾸지 못하게 막아요
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.invite_code := old.invite_code;
  end if;
  return new;
end $$;
create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile();

-------------------------------------------------------------------------------
-- 2. 초대 링크
-------------------------------------------------------------------------------
create table public.invites (
  code         text primary key check (code ~ '^[A-Za-z0-9-]{4,40}$'),
  role         text not null check (role in ('student', 'ob', 'admin')),
  auto_approve boolean not null default false,
  max_uses     int not null default 20 check (max_uses > 0),
  used         int not null default 0,
  expires_at   timestamptz not null,
  revoked      boolean not null default false,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
alter table public.invites enable row level security;
create policy "운영진만 초대 링크를 관리해요" on public.invites for all using (public.is_admin()) with check (public.is_admin());

-- 가입 화면에서 링크가 살아 있는지 확인할 때 써요 (로그인 전에도 호출 가능)
create or replace function public.invite_info(p_code text)
returns table (role text, expires_at timestamptz, remaining int, valid boolean)
language sql stable security definer set search_path = public as $$
  select i.role, i.expires_at, greatest(i.max_uses - i.used, 0),
         (not i.revoked and i.expires_at > now() and i.used < i.max_uses)
  from public.invites i
  where i.code = p_code;
$$;
grant execute on function public.invite_info(text) to anon, authenticated;

-- 회원가입하면 초대 링크를 확인하고 프로필을 만들어요.
-- 초대 코드 없이 만들어진 계정(대시보드에서 만든 계정 등)은 프로필이 없어서 앱에 들어올 수 없어요.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  inv  public.invites%rowtype;
begin
  if coalesce(meta ->> 'invite_code', '') = '' then
    return new;
  end if;
  select * into inv from public.invites where code = meta ->> 'invite_code' for update;
  if not found or inv.revoked or inv.expires_at <= now() or inv.used >= inv.max_uses then
    raise exception '초대 링크가 만료됐거나 사용할 수 없어요';
  end if;
  update public.invites set used = used + 1 where code = inv.code;
  insert into public.profiles (id, name, cohort, instrument, role, status, invite_code)
  values (new.id, trim(meta ->> 'name'), trim(meta ->> 'cohort'), meta ->> 'instrument', inv.role,
          case when inv.auto_approve then 'active' else 'pending' end, inv.code);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-------------------------------------------------------------------------------
-- 3. 알림
-------------------------------------------------------------------------------
create table public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "내 알림만 봐요" on public.notifications for select using (user_id = auth.uid());
create policy "내 알림을 읽음 처리해요" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notify(p_user uuid, p_title text, p_body text, p_link text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, title, body, link) values (p_user, p_title, p_body, p_link);
$$;
revoke execute on function public.notify(uuid, text, text, text) from public, anon, authenticated;

-------------------------------------------------------------------------------
-- 4. 일정과 잼데이
-------------------------------------------------------------------------------
create table public.events (
  id         bigint generated always as identity primary key,
  date       date not null,
  start_time time,
  type       text not null check (type in ('listen', 'jam', 'rehearsal', 'show', 'out')),
  title      text not null check (char_length(trim(title)) between 1 and 60),
  place      text check (char_length(place) <= 40),
  note       text check (char_length(note) <= 300),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.events (date);
alter table public.events enable row level security;
create policy "회원은 일정을 봐요, 정기공연은 누구나 봐요" on public.events for select using (public.is_member() or type = 'show');
create policy "운영진이 일정을 등록해요" on public.events for insert with check (public.is_admin());
create policy "운영진이 일정을 고쳐요" on public.events for update using (public.is_admin());
create policy "운영진이 일정을 지워요" on public.events for delete using (public.is_admin());

create table public.jam_signups (
  event_id   bigint not null references public.events (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  instrument text not null check (instrument in ('드럼', '베이스', '피아노', '기타', '관악', '보컬')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.jam_signups enable row level security;
create policy "회원은 잼 참가자를 봐요" on public.jam_signups for select using (public.is_member());
create policy "잼데이에 참가 신청해요" on public.jam_signups for insert with check (
  public.is_member() and user_id = auth.uid()
  and exists (select 1 from public.events e where e.id = event_id and e.type = 'jam'));
create policy "내 악기를 바꿔요" on public.jam_signups for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "참가를 취소해요" on public.jam_signups for delete using (user_id = auth.uid() or public.is_admin());

create table public.jam_requests (
  id         bigint generated always as identity primary key,
  event_id   bigint not null references public.events (id) on delete cascade,
  tune       text not null check (char_length(trim(tune)) between 1 and 60),
  tune_key   text generated always as (lower(trim(tune))) stored,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, tune_key)
);
alter table public.jam_requests enable row level security;
create policy "회원은 신청곡을 봐요" on public.jam_requests for select using (public.is_member());
create policy "곡을 신청해요" on public.jam_requests for insert with check (public.is_member() and user_id = auth.uid());
create policy "내 신청곡을 지워요" on public.jam_requests for delete using (user_id = auth.uid() or public.is_admin());

create table public.jam_request_votes (
  request_id bigint not null references public.jam_requests (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  primary key (request_id, user_id)
);
alter table public.jam_request_votes enable row level security;
create policy "회원은 +1을 봐요" on public.jam_request_votes for select using (public.is_member());
create policy "+1 해요" on public.jam_request_votes for insert with check (public.is_member() and user_id = auth.uid());
create policy "+1을 취소해요" on public.jam_request_votes for delete using (user_id = auth.uid());

-- 곡을 신청한 사람은 자동으로 +1
create or replace function public.vote_own_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.jam_request_votes (request_id, user_id) values (new.id, new.user_id) on conflict do nothing;
  return new;
end $$;
create trigger vote_own_request after insert on public.jam_requests
  for each row execute function public.vote_own_request();

-- 스탠다드 곡과 부원별 연주 가능한 곡 (잼 곡 추천에 쓰여요)
create table public.tunes (
  id         bigint generated always as identity primary key,
  title      text not null unique check (char_length(trim(title)) between 1 and 60),
  key        text check (char_length(key) <= 10),
  form       text check (char_length(form) <= 40),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null
);
alter table public.tunes enable row level security;
create policy "회원은 곡 목록을 봐요" on public.tunes for select using (public.is_member());
create policy "회원이 곡을 추가해요" on public.tunes for insert with check (public.is_member());
create policy "운영진이 곡 정보를 고쳐요" on public.tunes for update using (public.is_admin());
create policy "운영진이 곡을 지워요" on public.tunes for delete using (public.is_admin());

create table public.member_tunes (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  tune_id bigint not null references public.tunes (id) on delete cascade,
  primary key (user_id, tune_id)
);
alter table public.member_tunes enable row level security;
create policy "회원은 연주 가능한 곡을 봐요" on public.member_tunes for select using (public.is_member());
create policy "내 곡을 추가해요" on public.member_tunes for insert with check (public.is_member() and user_id = auth.uid());
create policy "내 곡을 빼요" on public.member_tunes for delete using (user_id = auth.uid());

-------------------------------------------------------------------------------
-- 5. 감상모임: 플레이리스트, 앨범 투표, 블라인드 퀴즈
-------------------------------------------------------------------------------
create table public.sessions (
  id         bigint generated always as identity primary key,
  no         int not null unique check (no > 0),
  title      text not null check (char_length(trim(title)) between 1 and 60),
  date       date not null,
  host       text check (char_length(host) <= 20),
  created_at timestamptz not null default now()
);
alter table public.sessions enable row level security;
create policy "회원은 감상모임을 봐요" on public.sessions for select using (public.is_member());
create policy "운영진이 감상모임을 열어요" on public.sessions for insert with check (public.is_admin());
create policy "운영진이 감상모임을 고쳐요" on public.sessions for update using (public.is_admin());
create policy "운영진이 감상모임을 지워요" on public.sessions for delete using (public.is_admin());

create table public.tracks (
  id         bigint generated always as identity primary key,
  session_id bigint not null references public.sessions (id) on delete cascade,
  title      text not null check (char_length(trim(title)) between 1 and 100),
  artist     text not null check (char_length(trim(artist)) between 1 and 100),
  album      text check (char_length(album) <= 100),
  year       int check (year between 1900 and 2100),
  url        text check (url ~ '^https?://'),
  comment    text check (char_length(comment) <= 300),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.tracks enable row level security;
create policy "회원은 곡을 봐요" on public.tracks for select using (public.is_member());
create policy "회원이 곡을 올려요" on public.tracks for insert with check (public.is_member() and user_id = auth.uid());
create policy "내가 올린 곡을 고쳐요" on public.tracks for update using (user_id = auth.uid() or public.is_admin());
create policy "내가 올린 곡을 지워요" on public.tracks for delete using (user_id = auth.uid() or public.is_admin());

create table public.track_likes (
  track_id bigint not null references public.tracks (id) on delete cascade,
  user_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  primary key (track_id, user_id)
);
alter table public.track_likes enable row level security;
create policy "회원은 좋아요를 봐요" on public.track_likes for select using (public.is_member());
create policy "좋아요 해요" on public.track_likes for insert with check (public.is_member() and user_id = auth.uid());
create policy "좋아요를 취소해요" on public.track_likes for delete using (user_id = auth.uid());

create table public.polls (
  id         bigint generated always as identity primary key,
  title      text not null check (char_length(trim(title)) between 1 and 80),
  note       text check (char_length(note) <= 300),
  closes_at  timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.polls enable row level security;
create policy "회원은 투표를 봐요" on public.polls for select using (public.is_member());
create policy "운영진이 투표를 열어요" on public.polls for insert with check (public.is_admin());
create policy "운영진이 투표를 고쳐요" on public.polls for update using (public.is_admin());
create policy "운영진이 투표를 지워요" on public.polls for delete using (public.is_admin());

create table public.poll_options (
  id      bigint generated always as identity primary key,
  poll_id bigint not null references public.polls (id) on delete cascade,
  title   text not null check (char_length(trim(title)) between 1 and 100),
  artist  text check (char_length(artist) <= 100),
  year    int check (year between 1900 and 2100),
  sort    int not null default 0,
  unique (poll_id, id)
);
alter table public.poll_options enable row level security;
create policy "회원은 후보를 봐요" on public.poll_options for select using (public.is_member());
create policy "운영진이 후보를 관리해요" on public.poll_options for all using (public.is_admin()) with check (public.is_admin());

create table public.poll_votes (
  poll_id    bigint not null references public.polls (id) on delete cascade,
  option_id  bigint not null,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id),
  foreign key (poll_id, option_id) references public.poll_options (poll_id, id) on delete cascade
);
alter table public.poll_votes enable row level security;
create policy "회원은 투표 결과를 봐요" on public.poll_votes for select using (public.is_member());
create policy "마감 전에 투표해요" on public.poll_votes for insert with check (
  public.is_member() and user_id = auth.uid()
  and exists (select 1 from public.polls p where p.id = poll_id and p.closes_at > now()));
create policy "마감 전에 표를 바꿔요" on public.poll_votes for update using (user_id = auth.uid()) with check (
  user_id = auth.uid() and exists (select 1 from public.polls p where p.id = poll_id and p.closes_at > now()));
create policy "마감 전에 표를 취소해요" on public.poll_votes for delete using (
  user_id = auth.uid() and exists (select 1 from public.polls p where p.id = poll_id and p.closes_at > now()));

create table public.quizzes (
  id           bigint generated always as identity primary key,
  question     text not null check (char_length(trim(question)) between 1 and 200),
  hint         text check (char_length(hint) <= 200),
  options      text[] not null check (cardinality(options) between 2 and 6),
  reveal_title text check (char_length(reveal_title) <= 100),
  reveal_url   text check (reveal_url ~ '^https?://'),
  created_at   timestamptz not null default now()
);
alter table public.quizzes enable row level security;
create policy "회원은 문제를 봐요" on public.quizzes for select using (public.is_member());
create policy "운영진이 문제를 관리해요" on public.quizzes for all using (public.is_admin()) with check (public.is_admin());

create table public.quiz_answers (
  quiz_id    bigint not null references public.quizzes (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  choice     int not null check (choice >= 0),
  created_at timestamptz not null default now(),
  primary key (quiz_id, user_id)
);
alter table public.quiz_answers enable row level security;
create policy "내 답만 봐요" on public.quiz_answers for select using (user_id = auth.uid());
create policy "한 번만 답해요" on public.quiz_answers for insert with check (public.is_member() and user_id = auth.uid());

create or replace function public.has_answered(p_quiz bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.quiz_answers where quiz_id = p_quiz and user_id = auth.uid());
$$;

-- 정답은 답을 낸 사람과 운영진에게만 보여요
create table public.quiz_keys (
  quiz_id bigint primary key references public.quizzes (id) on delete cascade,
  answer  int not null check (answer >= 0)
);
alter table public.quiz_keys enable row level security;
create policy "답한 뒤에 정답을 봐요" on public.quiz_keys for select using (public.is_admin() or public.has_answered(quiz_id));
create policy "운영진이 정답을 정해요" on public.quiz_keys for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.quiz_stats(p_quiz bigint)
returns table (total int, correct int)
language sql stable security definer set search_path = public as $$
  select count(*)::int, count(*) filter (where a.choice = k.answer)::int
  from public.quiz_answers a join public.quiz_keys k on k.quiz_id = a.quiz_id
  where a.quiz_id = p_quiz and (public.is_admin() or public.has_answered(p_quiz));
$$;

-------------------------------------------------------------------------------
-- 6. 토크
-------------------------------------------------------------------------------
create table public.posts (
  id         bigint generated always as identity primary key,
  tag        text not null check (tag in ('추천', '질문', '후기', '잡담')),
  title      text not null check (char_length(trim(title)) between 1 and 100),
  body       text not null check (char_length(trim(body)) between 1 and 5000),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.posts (created_at desc);
alter table public.posts enable row level security;
create policy "회원은 글을 봐요 (숨긴 글은 본인과 운영진만)" on public.posts for select using (
  public.is_member() and (not hidden or user_id = auth.uid() or public.is_admin()));
create policy "글을 써요" on public.posts for insert with check (public.is_member() and user_id = auth.uid() and not hidden);
create policy "내 글을 고쳐요" on public.posts for update using (user_id = auth.uid() or public.is_admin());
create policy "내 글을 지워요" on public.posts for delete using (user_id = auth.uid() or public.is_admin());

create or replace function public.protect_post() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.hidden := old.hidden;
  end if;
  new.user_id := old.user_id;
  return new;
end $$;
create trigger protect_post before update on public.posts for each row execute function public.protect_post();

create table public.comments (
  id         bigint generated always as identity primary key,
  post_id    bigint not null references public.posts (id) on delete cascade,
  body       text not null check (char_length(trim(body)) between 1 and 1000),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
create policy "회원은 댓글을 봐요" on public.comments for select using (public.is_member());
create policy "댓글을 달아요" on public.comments for insert with check (public.is_member() and user_id = auth.uid());
create policy "내 댓글을 지워요" on public.comments for delete using (user_id = auth.uid() or public.is_admin());

create or replace function public.notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p record;
  who text;
begin
  select id, title, user_id into p from public.posts where id = new.post_id;
  if p.user_id <> new.user_id then
    select name into who from public.profiles where id = new.user_id;
    perform public.notify(p.user_id, who || '님이 댓글을 달았어요', p.title, '/talk/' || p.id);
  end if;
  return new;
end $$;
create trigger notify_comment after insert on public.comments for each row execute function public.notify_comment();

create table public.post_likes (
  post_id bigint not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
create policy "회원은 좋아요를 봐요" on public.post_likes for select using (public.is_member());
create policy "좋아요 해요" on public.post_likes for insert with check (public.is_member() and user_id = auth.uid());
create policy "좋아요를 취소해요" on public.post_likes for delete using (user_id = auth.uid());

-------------------------------------------------------------------------------
-- 7. 외부 공연 같이 가기
-------------------------------------------------------------------------------
create table public.outings (
  id         bigint generated always as identity primary key,
  date       date not null,
  title      text not null check (char_length(trim(title)) between 1 and 60),
  place      text not null check (char_length(trim(place)) between 1 and 40),
  capacity   int not null check (capacity between 2 and 50),
  note       text check (char_length(note) <= 300),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.outings enable row level security;
create policy "회원은 동행 모집을 봐요" on public.outings for select using (public.is_member());
create policy "동행을 모집해요" on public.outings for insert with check (public.is_member() and user_id = auth.uid());
create policy "내 모집 글을 고쳐요" on public.outings for update using (user_id = auth.uid() or public.is_admin());
create policy "내 모집 글을 지워요" on public.outings for delete using (user_id = auth.uid() or public.is_admin());

create table public.outing_members (
  outing_id  bigint not null references public.outings (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (outing_id, user_id)
);
alter table public.outing_members enable row level security;
create policy "회원은 같이 가는 사람을 봐요" on public.outing_members for select using (public.is_member());
create policy "같이 가요" on public.outing_members for insert with check (public.is_member() and user_id = auth.uid());
create policy "같이 가기를 취소해요" on public.outing_members for delete using (user_id = auth.uid());

create or replace function public.check_outing_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap int;
begin
  select capacity into cap from public.outings where id = new.outing_id for update;
  if (select count(*) from public.outing_members where outing_id = new.outing_id) >= cap then
    raise exception '모집 인원이 다 찼어요';
  end if;
  return new;
end $$;
create trigger check_outing_capacity before insert on public.outing_members
  for each row execute function public.check_outing_capacity();

create or replace function public.join_own_outing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.outing_members (outing_id, user_id) values (new.id, new.user_id) on conflict do nothing;
  return new;
end $$;
create trigger join_own_outing after insert on public.outings for each row execute function public.join_own_outing();

-------------------------------------------------------------------------------
-- 8. 동방: 악기 현황, 수리 요청, 구매 제안, 예약
-------------------------------------------------------------------------------
create table public.gear (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(trim(name)) between 1 and 40),
  category   text not null check (char_length(trim(category)) between 1 and 20),
  status     text not null default 'ok' check (status in ('ok', 'broken', 'repairing')),
  sort       int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.gear enable row level security;
create policy "회원은 악기 현황을 봐요" on public.gear for select using (public.is_member());
create policy "운영진이 악기를 관리해요" on public.gear for all using (public.is_admin()) with check (public.is_admin());

create table public.repair_requests (
  id         bigint generated always as identity primary key,
  gear_id    bigint references public.gear (id) on delete set null,
  gear_other text check (char_length(gear_other) <= 40),
  symptoms   text[] not null check (cardinality(symptoms) between 1 and 6),
  detail     text not null check (char_length(trim(detail)) between 5 and 1000),
  urgency    text not null check (urgency in ('긴급', '이번 달', '여유')),
  photos     text[] not null default '{}' check (cardinality(photos) <= 5),
  status     smallint not null default 0 check (status between 0 and 3),  -- 접수, 확인, 수리 중, 완료
  memo       text check (char_length(memo) <= 300),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (gear_id is not null or char_length(trim(coalesce(gear_other, ''))) > 0)
);
alter table public.repair_requests enable row level security;
create policy "회원은 수리 요청을 봐요" on public.repair_requests for select using (public.is_member());
create policy "재학생이 수리 요청을 써요" on public.repair_requests for insert with check (
  public.is_student() and user_id = auth.uid() and status = 0 and memo is null);
create policy "운영진이 진행 상태를 바꿔요" on public.repair_requests for update using (public.is_admin());
create policy "접수 단계에서 내 요청을 지워요" on public.repair_requests for delete using (
  (user_id = auth.uid() and status = 0) or public.is_admin());

create table public.buy_proposals (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(trim(name)) between 1 and 80),
  category   text not null check (category in ('악기', '앰프 · 음향', '액세서리', '소모품')),
  price      int not null check (price > 0 and price < 100000000),
  url        text check (url ~ '^https?://'),
  photos     text[] not null default '{}' check (cardinality(photos) <= 5),
  -- 기대효과: 모두 필수
  pain       text not null check (char_length(trim(pain)) between 10 and 1000),
  gain       text not null check (char_length(trim(gain)) between 20 and 1000),
  uses       text[] not null check (cardinality(uses) >= 1),
  frequency  text not null check (frequency in ('거의 매일', '주 1~2회', '한 달에 몇 번', '공연 때만')),
  status     smallint not null default 0 check (status between 0 and 3),  -- 제안, 검토 중, 구매 확정, 도착
  held       boolean not null default false,
  memo       text check (char_length(memo) <= 300),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.buy_proposals enable row level security;
create policy "회원은 구매 제안을 봐요" on public.buy_proposals for select using (public.is_member());
create policy "재학생이 구매 제안을 써요" on public.buy_proposals for insert with check (
  public.is_student() and user_id = auth.uid() and status = 0 and not held and memo is null);
create policy "운영진이 진행 상태를 바꿔요" on public.buy_proposals for update using (public.is_admin());
create policy "제안 단계에서 내 제안을 지워요" on public.buy_proposals for delete using (
  (user_id = auth.uid() and status = 0) or public.is_admin());

create table public.proposal_cheers (
  proposal_id bigint not null references public.buy_proposals (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  primary key (proposal_id, user_id)
);
alter table public.proposal_cheers enable row level security;
create policy "회원은 공감 수를 봐요" on public.proposal_cheers for select using (public.is_member());
create policy "나도 필요해요" on public.proposal_cheers for insert with check (public.is_member() and user_id = auth.uid());
create policy "공감을 취소해요" on public.proposal_cheers for delete using (user_id = auth.uid());

-- 수리 요청에 따라 악기 상태를 맞추고, 요청한 사람에게 알려요
create or replace function public.sync_repair() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  steps text[] := array['접수', '확인', '수리 중', '완료'];
  gname text;
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  if new.gear_id is not null then
    update public.gear g set status = case
      when exists (select 1 from public.repair_requests r where r.gear_id = g.id and r.id <> new.id and r.status = 2) or new.status = 2 then 'repairing'
      when exists (select 1 from public.repair_requests r where r.gear_id = g.id and r.id <> new.id and r.status < 3) or new.status < 3 then 'broken'
      else 'ok' end
    where g.id = new.gear_id;
  end if;
  if tg_op = 'UPDATE' and (new.status <> old.status or coalesce(new.memo, '') <> coalesce(old.memo, '')) then
    select coalesce(g.name, new.gear_other) into gname from (select 1) x left join public.gear g on g.id = new.gear_id;
    perform public.notify(new.user_id,
      case when new.status <> old.status then gname || ' 수리 요청이 ''' || steps[new.status + 1] || '''(으)로 바뀌었어요'
           else gname || ' 수리 요청에 운영진 메모가 달렸어요' end,
      new.memo, '/dong/repair/' || new.id);
  end if;
  return new;
end $$;
create trigger sync_repair before insert or update on public.repair_requests
  for each row execute function public.sync_repair();

-- 악기를 목록에서 빼도 지난 수리 요청에는 악기 이름이 남아요
create or replace function public.keep_gear_name() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.repair_requests set gear_other = coalesce(gear_other, old.name), gear_id = null where gear_id = old.id;
  return old;
end $$;
create trigger keep_gear_name before delete on public.gear
  for each row execute function public.keep_gear_name();

create or replace function public.sync_proposal() returns trigger
language plpgsql security definer set search_path = public as $$
declare steps text[] := array['제안', '검토 중', '구매 확정', '도착'];
begin
  new.updated_at := now();
  if new.status <> old.status or new.held <> old.held or coalesce(new.memo, '') <> coalesce(old.memo, '') then
    perform public.notify(new.user_id,
      case when new.held and not old.held then new.name || ' 구매 제안이 보류됐어요'
           when new.status <> old.status then new.name || ' 구매 제안이 ''' || steps[new.status + 1] || '''(으)로 바뀌었어요'
           else new.name || ' 구매 제안에 운영진 메모가 달렸어요' end,
      new.memo, '/dong/buy/' || new.id);
  end if;
  return new;
end $$;
create trigger sync_proposal before update on public.buy_proposals
  for each row execute function public.sync_proposal();

create table public.room_bookings (
  id         bigint generated always as identity primary key,
  date       date not null,
  hour       int not null check (hour between 10 and 21),
  note       text check (char_length(note) <= 30),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (date, hour)
);
alter table public.room_bookings enable row level security;
create policy "회원은 예약 현황을 봐요" on public.room_bookings for select using (public.is_member());
create policy "재학생이 예약해요" on public.room_bookings for insert with check (public.is_student() and user_id = auth.uid());
create policy "내 예약을 취소해요" on public.room_bookings for delete using (user_id = auth.uid() or public.is_admin());

create or replace function public.check_booking() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.date < (now() at time zone 'Asia/Seoul')::date then
    raise exception '지난 날짜는 예약할 수 없어요';
  end if;
  if (select count(*) from public.room_bookings where user_id = new.user_id and date = new.date) >= 2 then
    raise exception '하루에 2시간까지 예약할 수 있어요';
  end if;
  return new;
end $$;
create trigger check_booking before insert on public.room_bookings
  for each row execute function public.check_booking();

-------------------------------------------------------------------------------
-- 9. 연말결산
-------------------------------------------------------------------------------
create or replace function public.recap(p_year int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  y0 date := make_date(p_year, 1, 1);
  y1 date := make_date(p_year + 1, 1, 1);
begin
  if not public.is_member() then
    return null;
  end if;
  return jsonb_build_object(
    'tracks',   (select count(*) from tracks t join sessions s on s.id = t.session_id where s.date >= y0 and s.date < y1),
    'sessions', (select count(*) from sessions where date >= y0 and date < y1),
    'jams',     (select count(*) from events where type = 'jam' and date >= y0 and date < y1),
    'shows',    (select count(*) from events where type = 'show' and date >= y0 and date < y1),
    'repairs',  (select count(*) from repair_requests where created_at >= y0 and created_at < y1),
    'top_artists', coalesce((select jsonb_agg(x) from (
        select t.artist as name, count(*) as n from tracks t join sessions s on s.id = t.session_id
        where s.date >= y0 and s.date < y1 group by t.artist order by n desc, name limit 5) x), '[]'),
    'top_tunes', coalesce((select jsonb_agg(x) from (
        select min(r.tune) as name, count(v.*) as n from jam_requests r
        join events e on e.id = r.event_id left join jam_request_votes v on v.request_id = r.id
        where e.date >= y0 and e.date < y1 group by r.tune_key order by n desc, name limit 5) x), '[]'),
    'top_jammers', coalesce((select jsonb_agg(x) from (
        select p.name, p.instrument, count(*) as n from jam_signups j
        join events e on e.id = j.event_id join profiles p on p.id = j.user_id
        where e.date >= y0 and e.date < y1 group by p.id, p.name, p.instrument order by n desc, p.name limit 3) x), '[]')
  );
end $$;

-------------------------------------------------------------------------------
-- 10. 사진 저장소 (수리 요청, 구매 제안 첨부)
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "회원이 내 폴더에 사진을 올려요" on storage.objects for insert to authenticated with check (
  bucket_id = 'photos' and public.is_member() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "내가 올린 사진을 지워요" on storage.objects for delete to authenticated using (
  bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-------------------------------------------------------------------------------
-- 11. 처음 데이터: 잼데이 단골 스탠다드
-------------------------------------------------------------------------------
insert into public.tunes (title, key, form) values
  ('Autumn Leaves', 'Gm', 'AABC 32'),
  ('Blue Bossa', 'Cm', '16마디'),
  ('Satin Doll', 'C', 'AABA 32'),
  ('Now''s the Time', 'F', '12마디 블루스'),
  ('Fly Me to the Moon', 'Am', 'ABAC 32'),
  ('Solar', 'Cm', '12마디'),
  ('Footprints', 'Cm', '24마디 마이너 블루스'),
  ('All the Things You Are', 'A♭', 'AABA 36'),
  ('Take the A Train', 'C', 'AABA 32'),
  ('Summertime', 'Dm', '16마디'),
  ('Billie''s Bounce', 'F', '12마디 블루스'),
  ('There Will Never Be Another You', 'E♭', 'AB 32'),
  ('So What', 'Dm', 'AABA 32'),
  ('Misty', 'E♭', 'AABA 32'),
  ('Cantaloupe Island', 'Fm', '16마디')
on conflict (title) do nothing;
