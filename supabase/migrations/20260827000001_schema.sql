-- ============================================================================
-- LUYỆN THI TIẾNG ANH THPT 2026 — SCHEMA
-- Bám theo Quyết định 4068/QĐ-BGDĐT: 40 câu / 50 phút / 0,25đ mỗi câu.
-- Các con số này KHÔNG hardcode: chúng nằm trong bảng exam_matrices để admin
-- chỉnh khi Bộ GD&ĐT điều chỉnh cấu trúc đề (yêu cầu ở mục 0 và mục 7 của spec).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
create type user_role as enum ('student', 'teacher', 'admin', 'parent');

-- 4 mức theo thang đánh giá tư duy của Bộ GD&ĐT
create type difficulty_level as enum ('nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao');

create type attempt_mode as enum ('practice_free', 'practice_timed', 'exam');
create type attempt_status as enum ('in_progress', 'submitted', 'expired');
create type exam_kind as enum ('official', 'province', 'teacher', 'generated');
create type passage_kind as enum ('notice', 'ordering', 'cloze', 'reading');

-- ---------------------------------------------------------------------------
-- HỒ SƠ NGƯỜI DÙNG
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role user_role not null default 'student',
  school text,
  class_name text,
  avatar_url text,
  -- Học sinh được quyền ẩn danh trên bảng xếp hạng công khai (spec 4.5)
  leaderboard_anonymous boolean not null default false,
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);
create index profiles_class_idx on profiles (school, class_name);

-- Tự tạo hồ sơ ngay khi có tài khoản mới
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- PHÂN LOẠI CÂU HỎI
-- ---------------------------------------------------------------------------
-- 6 danh mục = 4 dạng bài của đề thật + 2 danh mục bổ trợ (spec 4.1)
create table question_types (
  id smallint primary key,
  code text not null unique,
  name_vi text not null,
  description text,
  -- Dạng bài này có xuất hiện trong đề thi thật hay chỉ để luyện tập?
  in_real_exam boolean not null default true,
  sort_order smallint not null default 0
);

create table topics (
  id serial primary key,
  code text not null unique,
  name_vi text not null,
  -- 'grammar' = chuyên đề ngữ pháp, 'vocab' = chủ đề từ vựng
  kind text not null check (kind in ('grammar', 'vocab')),
  sort_order smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- NGÂN HÀNG CÂU HỎI
-- ---------------------------------------------------------------------------
-- Đoạn ngữ liệu dùng chung cho nhiều câu (bài đọc hiểu, cloze, thông báo...)
create table passages (
  id uuid primary key default gen_random_uuid(),
  kind passage_kind not null,
  title text,
  content text not null,
  -- Với dạng "sắp xếp câu": thứ tự đúng, vd ["c","a","d","b"]
  meta jsonb not null default '{}'::jsonb,
  source text,
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  type_id smallint not null references question_types (id),
  passage_id uuid references passages (id) on delete cascade,
  topic_id integer references topics (id),
  -- Vị trí trong đoạn ngữ liệu (câu 1,2,3... của cùng một bài đọc)
  position_in_passage smallint,
  stem text not null,
  -- [{"key":"A","text":"..."}, ...] — luôn đúng 4 phương án
  options jsonb not null,
  correct_key text not null check (correct_key in ('A', 'B', 'C', 'D')),
  explanation text not null default '',
  -- Mẹo làm bài hiển thị sau khi trả lời (spec 4.1)
  tip text,
  difficulty difficulty_level not null default 'thong_hieu',
  cefr_level text check (cefr_level in ('A2', 'B1', 'B2', 'C1')),
  source text,
  is_active boolean not null default true,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint options_must_be_four check (jsonb_array_length(options) = 4)
);

create index questions_type_idx on questions (type_id) where is_active;
create index questions_topic_idx on questions (topic_id) where is_active;
create index questions_difficulty_idx on questions (difficulty) where is_active;
create index questions_passage_idx on questions (passage_id, position_in_passage);

-- ---------------------------------------------------------------------------
-- MA TRẬN ĐỀ THI — admin chỉnh được, không cần sửa code
-- ---------------------------------------------------------------------------
create table exam_matrices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  total_questions smallint not null default 40,
  duration_seconds integer not null default 3000, -- 50 phút
  points_per_question numeric(4, 3) not null default 0.25,
  max_score numeric(4, 2) not null default 10.00,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Chỉ cho phép đúng một ma trận mặc định
create unique index exam_matrices_single_default
  on exam_matrices (is_default) where is_default;

create table exam_matrix_items (
  id uuid primary key default gen_random_uuid(),
  matrix_id uuid not null references exam_matrices (id) on delete cascade,
  type_id smallint not null references question_types (id),
  question_count smallint not null check (question_count > 0),
  -- Tỉ lệ độ khó, vd {"nhan_biet":2,"thong_hieu":3,"van_dung":2,"van_dung_cao":1}
  difficulty_mix jsonb not null default '{}'::jsonb,
  sort_order smallint not null default 0,
  unique (matrix_id, type_id)
);

-- Tổng số câu của các dòng phải khớp total_questions của ma trận
create or replace function check_matrix_total()
returns trigger language plpgsql as $$
declare
  v_matrix uuid := coalesce(new.matrix_id, old.matrix_id);
  v_sum integer;
  v_total integer;
begin
  select coalesce(sum(question_count), 0) into v_sum
    from exam_matrix_items where matrix_id = v_matrix;
  select total_questions into v_total from exam_matrices where id = v_matrix;
  if v_sum > v_total then
    raise exception 'Tổng số câu trong ma trận (%) vượt quá total_questions (%)', v_sum, v_total;
  end if;
  return null;
end;
$$;

create constraint trigger exam_matrix_items_total_check
  after insert or update or delete on exam_matrix_items
  deferrable initially deferred
  for each row execute function check_matrix_total();

-- ---------------------------------------------------------------------------
-- ĐỀ THI THỬ
-- ---------------------------------------------------------------------------
create table exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind exam_kind not null default 'official',
  matrix_id uuid references exam_matrices (id),
  year smallint,
  province text,
  description text,
  is_published boolean not null default false,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table exam_questions (
  exam_id uuid not null references exams (id) on delete cascade,
  question_id uuid not null references questions (id) on delete restrict,
  position smallint not null,
  primary key (exam_id, position),
  unique (exam_id, question_id)
);

-- ---------------------------------------------------------------------------
-- LƯỢT LÀM BÀI
-- ---------------------------------------------------------------------------
create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  mode attempt_mode not null,
  exam_id uuid references exams (id) on delete set null,
  -- Với phiên luyện theo danh mục: lưu lại bộ lọc đã chọn
  type_id smallint references question_types (id),
  topic_id integer references topics (id),
  difficulty difficulty_level,
  status attempt_status not null default 'in_progress',
  total_questions smallint not null,
  correct_count smallint not null default 0,
  score numeric(4, 2),
  -- Hạn nộp do server tính, client không sửa được -> chống gian lận đồng hồ
  deadline_at timestamptz,
  duration_seconds integer,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  -- Đếm số lần rời tab (spec 4.2: chống gian lận cơ bản)
  tab_switches smallint not null default 0,
  created_at timestamptz not null default now()
);

create index attempts_user_idx on attempts (user_id, created_at desc);
create index attempts_exam_idx on attempts (exam_id) where status = 'submitted';
create index attempts_leaderboard_idx on attempts (submitted_at desc, score desc)
  where status = 'submitted' and mode = 'exam';

create table attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts (id) on delete cascade,
  question_id uuid not null references questions (id) on delete restrict,
  position smallint not null,
  selected_key text check (selected_key in ('A', 'B', 'C', 'D')),
  is_correct boolean,
  time_spent_ms integer not null default 0,
  marked_for_review boolean not null default false,
  answered_at timestamptz,
  unique (attempt_id, position)
);

create index attempt_answers_attempt_idx on attempt_answers (attempt_id, position);
create index attempt_answers_question_idx on attempt_answers (question_id);

-- ---------------------------------------------------------------------------
-- GAMIFICATION
-- ---------------------------------------------------------------------------
create table points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index points_ledger_user_idx on points_ledger (user_id, created_at desc);

create table streaks (
  user_id uuid primary key references profiles (id) on delete cascade,
  current_streak smallint not null default 0,
  longest_streak smallint not null default 0,
  last_activity_date date
);

create table badges (
  id serial primary key,
  code text not null unique,
  name_vi text not null,
  description text not null,
  icon text not null default 'award',
  -- {"kind":"questions_by_type","type_id":4,"threshold":100}
  criteria jsonb not null,
  points_reward integer not null default 0,
  sort_order smallint not null default 0
);

create table user_badges (
  user_id uuid not null references profiles (id) on delete cascade,
  badge_id integer not null references badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- Cấu hình quy tắc cộng điểm — admin chỉnh, không sửa code (spec 4.6)
create table point_rules (
  code text primary key,
  name_vi text not null,
  points integer not null,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- LỚP HỌC (Teacher/Admin)
-- ---------------------------------------------------------------------------
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school text,
  teacher_id uuid references profiles (id) on delete set null,
  join_code text unique,
  created_at timestamptz not null default now()
);

create table class_members (
  class_id uuid not null references classes (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- ---------------------------------------------------------------------------
-- NHẬT KÝ HOẠT ĐỘNG (audit log — spec 4.7)
-- ---------------------------------------------------------------------------
create table audit_log (
  id bigserial primary key,
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on audit_log (created_at desc);
