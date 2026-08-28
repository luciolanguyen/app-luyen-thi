-- ============================================================================
-- LỊCH THI + GIAO BÀI THEO LỚP
--
-- Trước đây đề chỉ có is_published (mở hoặc không). Giờ thêm khung giờ mở–đóng
-- và cơ chế giao đề cho lớp cụ thể.
--
-- Nguyên tắc: khung giờ do SERVER chặn trong start_exam_attempt, không phải chỉ
-- ẩn nút ở giao diện. Học sinh gọi thẳng API cũng không vào được ngoài giờ.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- KHUNG GIỜ CỦA ĐỀ
-- ---------------------------------------------------------------------------
alter table exams
  add column open_at timestamptz,
  add column close_at timestamptz,
  -- Đề chỉ dành cho lớp được giao, không hiện trong danh sách chung
  add column restricted_to_classes boolean not null default false;

alter table exams
  add constraint exams_window_order
  check (open_at is null or close_at is null or close_at > open_at);

create index exams_window_idx on exams (open_at, close_at) where is_published;

comment on column exams.open_at is
  'Giờ mở. NULL = mở ngay khi công bố. Server chặn, không chỉ ẩn nút.';
comment on column exams.close_at is
  'Giờ đóng. NULL = không có hạn. Lượt thi đang làm dở vẫn được nộp sau giờ này.';

-- ---------------------------------------------------------------------------
-- GIAO ĐỀ CHO LỚP
-- ---------------------------------------------------------------------------
create table exam_assignments (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams (id) on delete cascade,
  class_id uuid not null references classes (id) on delete cascade,
  -- Khung giờ riêng cho lớp này; NULL thì dùng khung của đề
  open_at timestamptz,
  close_at timestamptz,
  -- Số lần được làm lại; NULL = không giới hạn
  max_attempts smallint check (max_attempts is null or max_attempts > 0),
  note text,
  assigned_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (exam_id, class_id)
);

create index exam_assignments_class_idx on exam_assignments (class_id);

alter table exam_assignments enable row level security;

create policy assignments_staff on exam_assignments
  for all using (is_staff()) with check (is_staff());

-- Học sinh xem được bài giao cho lớp mình
create policy assignments_own_class on exam_assignments
  for select using (
    exists (
      select 1 from class_members m
       where m.class_id = exam_assignments.class_id
         and m.student_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- TÍNH TRẠNG THÁI KHUNG GIỜ CHO MỘT HỌC SINH
-- Trả về khung giờ hiệu lực: ưu tiên khung của lớp, không có thì lấy của đề.
-- ---------------------------------------------------------------------------
create or replace function exam_window_for(p_exam_id uuid, p_user uuid)
returns table (
  open_at timestamptz,
  close_at timestamptz,
  max_attempts smallint,
  via_class uuid
)
language sql stable security definer set search_path = public as $$
  -- Từng trường lấy của lớp trước, không có thì rơi về khung chung của đề.
  -- Nhờ vậy lớp có thể chỉ ghi đè giờ đóng mà vẫn dùng giờ mở của đề.
  select
    coalesce(a.open_at, e.open_at),
    coalesce(a.close_at, e.close_at),
    a.max_attempts,
    a.class_id
  from exams e
  left join lateral (
    -- Học sinh ở nhiều lớp cùng được giao: lấy lớp mở sớm nhất
    select a2.open_at, a2.close_at, a2.max_attempts, a2.class_id
      from exam_assignments a2
      join class_members m on m.class_id = a2.class_id
     where a2.exam_id = e.id and m.student_id = p_user
     order by coalesce(a2.open_at, '-infinity'::timestamptz)
     limit 1
  ) a on true
  where e.id = p_exam_id;
$$;

-- ---------------------------------------------------------------------------
-- DANH SÁCH ĐỀ HỌC SINH THẤY, KÈM TRẠNG THÁI KHUNG GIỜ
-- ---------------------------------------------------------------------------
create or replace function available_exams()
returns table (
  id uuid,
  title text,
  kind exam_kind,
  year smallint,
  province text,
  description text,
  total_questions smallint,
  duration_seconds integer,
  max_score numeric,
  open_at timestamptz,
  close_at timestamptz,
  -- 'chua_mo' | 'dang_mo' | 'da_dong'
  window_status text,
  assigned_class text,
  max_attempts smallint,
  attempts_used bigint,
  in_progress_attempt uuid
)
language sql stable security definer set search_path = public as $$
  select
    e.id, e.title, e.kind, e.year, e.province, e.description,
    m.total_questions, m.duration_seconds, m.max_score,
    w.open_at, w.close_at,
    case
      when w.open_at is not null and now() < w.open_at then 'chua_mo'
      when w.close_at is not null and now() > w.close_at then 'da_dong'
      else 'dang_mo'
    end,
    c.name,
    w.max_attempts,
    (select count(*) from attempts a
      where a.exam_id = e.id and a.user_id = auth.uid()
        and a.status <> 'in_progress'),
    (select a.id from attempts a
      where a.exam_id = e.id and a.user_id = auth.uid() and a.status = 'in_progress'
      order by a.started_at desc limit 1)
  from exams e
  left join exam_matrices m on m.id = e.matrix_id
  cross join lateral exam_window_for(e.id, auth.uid()) w
  left join classes c on c.id = w.via_class
  where e.is_published
    -- Đề giới hạn theo lớp chỉ hiện với học sinh được giao
    and (not e.restricted_to_classes or w.via_class is not null)
  order by
    case
      when w.open_at is not null and now() < w.open_at then 1
      when w.close_at is not null and now() > w.close_at then 3
      else 0
    end,
    coalesce(w.close_at, 'infinity'::timestamptz),
    e.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- CHẶN NGOÀI KHUNG GIỜ NGAY TRONG HÀM BẮT ĐẦU THI
-- ---------------------------------------------------------------------------
create or replace function start_exam_attempt(p_exam_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_attempt uuid;
  v_uid uuid := auth.uid();
  v_total smallint;
  v_duration integer;
  v_open uuid;
  v_w record;
  v_used integer;
  v_published boolean;
  v_restricted boolean;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  select is_published, restricted_to_classes into v_published, v_restricted
    from exams where id = p_exam_id;
  if not found then
    raise exception 'Không tìm thấy đề thi';
  end if;
  if not v_published then
    raise exception 'Đề thi chưa được công bố';
  end if;

  select * into v_w from exam_window_for(p_exam_id, v_uid);

  if v_restricted and v_w.via_class is null then
    raise exception 'Đề này chỉ dành cho lớp được giao';
  end if;

  -- Khung giờ: chặn ở server, không phải chỉ ẩn nút ở giao diện
  if v_w.open_at is not null and now() < v_w.open_at then
    raise exception 'Đề thi chưa mở. Thời gian mở: %',
      to_char(v_w.open_at at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY');
  end if;
  if v_w.close_at is not null and now() > v_w.close_at then
    raise exception 'Đề thi đã đóng lúc %',
      to_char(v_w.close_at at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY');
  end if;

  -- Đang làm dở thì trả lại lượt cũ, không tạo lượt mới
  select id into v_open from attempts
   where user_id = v_uid and exam_id = p_exam_id and status = 'in_progress'
   order by started_at desc limit 1;
  if v_open is not null then
    return v_open;
  end if;

  -- Giới hạn số lần làm (nếu lớp có đặt)
  if v_w.max_attempts is not null then
    select count(*) into v_used from attempts
     where user_id = v_uid and exam_id = p_exam_id and status <> 'in_progress';
    if v_used >= v_w.max_attempts then
      raise exception 'Bạn đã dùng hết % lượt làm cho đề này', v_w.max_attempts;
    end if;
  end if;

  select count(*) into v_total from exam_questions where exam_id = p_exam_id;
  if v_total = 0 then
    raise exception 'Đề thi chưa có câu hỏi';
  end if;

  select coalesce(m.duration_seconds, 3000) into v_duration
    from exams e left join exam_matrices m on m.id = e.matrix_id
   where e.id = p_exam_id;

  -- Nếu giờ đóng tới sớm hơn thời lượng làm bài thì lấy mốc sớm hơn:
  -- không cho học sinh làm vượt quá giờ đóng của kỳ thi.
  insert into attempts (user_id, mode, exam_id, total_questions, deadline_at)
  values (
    v_uid, 'exam', p_exam_id, v_total,
    least(
      now() + make_interval(secs => v_duration),
      coalesce(v_w.close_at, 'infinity'::timestamptz)
    )
  )
  returning id into v_attempt;

  insert into attempt_answers (attempt_id, question_id, position)
  select v_attempt, question_id, position from exam_questions where exam_id = p_exam_id;

  return v_attempt;
end;
$$;

-- ---------------------------------------------------------------------------
-- TIẾN ĐỘ MỘT BÀI GIAO — giáo viên xem ai đã làm, ai chưa
-- ---------------------------------------------------------------------------
create or replace function assignment_progress(p_assignment_id uuid)
returns table (
  student_id uuid,
  full_name text,
  attempts_used bigint,
  best_score numeric,
  last_submitted timestamptz,
  status text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff() then
    raise exception 'Chỉ giáo viên hoặc quản trị viên xem được tiến độ';
  end if;

  return query
  select
    p.id,
    p.full_name,
    count(a.*) filter (where a.status <> 'in_progress'),
    max(a.score) filter (where a.status <> 'in_progress'),
    max(a.submitted_at),
    case
      when count(a.*) filter (where a.status <> 'in_progress') > 0 then 'da_lam'
      when count(a.*) filter (where a.status = 'in_progress') > 0 then 'dang_lam'
      else 'chua_lam'
    end
  from exam_assignments ea
  join class_members cm on cm.class_id = ea.class_id
  join profiles p on p.id = cm.student_id
  left join attempts a on a.exam_id = ea.exam_id and a.user_id = p.id
  where ea.id = p_assignment_id
  group by p.id, p.full_name
  order by p.full_name;
end;
$$;

grant execute on function
  exam_window_for(uuid, uuid),
  available_exams(),
  assignment_progress(uuid)
to authenticated;
