-- ============================================================================
-- RLS + LOGIC PHÍA SERVER
-- Nguyên tắc: mọi thứ ảnh hưởng tới điểm số (chấm bài, đồng hồ, cộng điểm)
-- đều chạy ở server. Client chỉ gửi lựa chọn A/B/C/D.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- HÀM TIỆN ÍCH
-- ---------------------------------------------------------------------------
create or replace function current_role_of()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) in ('teacher', 'admin'), false);
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false);
$$;

-- Trigger tạo hồ sơ khi đăng ký (hàm đã khai báo ở migration 1)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- BẬT RLS
-- ---------------------------------------------------------------------------
alter table profiles          enable row level security;
alter table question_types    enable row level security;
alter table topics            enable row level security;
alter table passages          enable row level security;
alter table questions         enable row level security;
alter table exam_matrices     enable row level security;
alter table exam_matrix_items enable row level security;
alter table exams             enable row level security;
alter table exam_questions    enable row level security;
alter table attempts          enable row level security;
alter table attempt_answers   enable row level security;
alter table points_ledger     enable row level security;
alter table streaks           enable row level security;
alter table badges            enable row level security;
alter table user_badges       enable row level security;
alter table point_rules       enable row level security;
alter table classes           enable row level security;
alter table class_members     enable row level security;
alter table audit_log         enable row level security;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
create policy profiles_read_self on profiles
  for select using (id = auth.uid() or is_staff());

create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_staff_all on profiles
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- DANH MỤC: ai đăng nhập cũng đọc được, chỉ admin sửa
-- ---------------------------------------------------------------------------
create policy qtypes_read on question_types for select using (auth.uid() is not null);
create policy qtypes_admin on question_types for all using (is_admin()) with check (is_admin());

create policy topics_read on topics for select using (auth.uid() is not null);
create policy topics_admin on topics for all using (is_admin()) with check (is_admin());

create policy matrices_read on exam_matrices for select using (auth.uid() is not null);
create policy matrices_admin on exam_matrices for all using (is_admin()) with check (is_admin());

create policy matrix_items_read on exam_matrix_items for select using (auth.uid() is not null);
create policy matrix_items_admin on exam_matrix_items for all using (is_admin()) with check (is_admin());

create policy point_rules_read on point_rules for select using (auth.uid() is not null);
create policy point_rules_admin on point_rules for all using (is_admin()) with check (is_admin());

create policy badges_read on badges for select using (auth.uid() is not null);
create policy badges_admin on badges for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- NGÂN HÀNG CÂU HỎI
-- Học sinh KHÔNG select trực tiếp -> không thể lộ correct_key khi đang thi.
-- Câu hỏi tới tay học sinh qua hàm get_attempt_questions() bên dưới.
-- ---------------------------------------------------------------------------
create policy questions_staff on questions for all using (is_staff()) with check (is_staff());
create policy passages_staff  on passages  for all using (is_staff()) with check (is_staff());

create policy exams_read on exams
  for select using (is_published or is_staff());
create policy exams_staff on exams for all using (is_staff()) with check (is_staff());

create policy exam_questions_staff on exam_questions for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- LƯỢT LÀM BÀI: học sinh chỉ thấy bài của chính mình
-- ---------------------------------------------------------------------------
create policy attempts_own on attempts
  for select using (user_id = auth.uid() or is_staff());

create policy attempts_insert_own on attempts
  for insert with check (user_id = auth.uid());

create policy answers_own on attempt_answers
  for select using (
    exists (select 1 from attempts a where a.id = attempt_id and (a.user_id = auth.uid() or is_staff()))
  );

-- ---------------------------------------------------------------------------
-- GAMIFICATION: chỉ đọc của mình; ghi điểm do server làm
-- ---------------------------------------------------------------------------
create policy points_own on points_ledger for select using (user_id = auth.uid() or is_staff());
create policy streaks_own on streaks for select using (user_id = auth.uid() or is_staff());
create policy user_badges_own on user_badges for select using (user_id = auth.uid() or is_staff());

create policy classes_read on classes
  for select using (
    is_staff() or exists (
      select 1 from class_members m where m.class_id = id and m.student_id = auth.uid()
    )
  );
create policy classes_staff on classes for all using (is_staff()) with check (is_staff());
create policy class_members_read on class_members
  for select using (student_id = auth.uid() or is_staff());
create policy class_members_staff on class_members for all using (is_staff()) with check (is_staff());

create policy audit_admin on audit_log for select using (is_admin());

-- ============================================================================
-- BẮT ĐẦU MỘT PHIÊN LUYỆN THEO DANH MỤC
-- ============================================================================
create or replace function start_practice_session(
  p_type_id smallint,
  p_topic_id integer default null,
  p_difficulty difficulty_level default null,
  p_count smallint default 10,
  p_timed boolean default false
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_attempt uuid;
  v_uid uuid := auth.uid();
  v_actual smallint;
  v_seconds integer;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;
  if p_count not in (10, 20, 30, 40) then
    raise exception 'Số câu không hợp lệ: %', p_count;
  end if;

  create temporary table _picked on commit drop as
  select q.id, row_number() over (order by random()) as pos
  from questions q
  where q.is_active
    and q.type_id = p_type_id
    and (p_topic_id is null or q.topic_id = p_topic_id)
    and (p_difficulty is null or q.difficulty = p_difficulty)
  limit p_count;

  select count(*) into v_actual from _picked;
  if v_actual = 0 then
    raise exception 'Ngân hàng câu hỏi chưa có câu nào khớp bộ lọc này';
  end if;

  -- Luyện có tính giờ: 75 giây/câu, xấp xỉ nhịp độ đề thật (50 phút / 40 câu)
  v_seconds := case when p_timed then v_actual * 75 else null end;

  insert into attempts (
    user_id, mode, type_id, topic_id, difficulty,
    total_questions, deadline_at
  )
  values (
    v_uid,
    (case when p_timed then 'practice_timed' else 'practice_free' end)::attempt_mode,
    p_type_id, p_topic_id, p_difficulty,
    v_actual,
    case when p_timed then now() + make_interval(secs => v_seconds) else null end
  )
  returning id into v_attempt;

  insert into attempt_answers (attempt_id, question_id, position)
  select v_attempt, id, pos from _picked;

  return v_attempt;
end;
$$;

-- ============================================================================
-- BẮT ĐẦU MỘT LƯỢT THI THỬ
-- Hạn nộp do server tính từ duration_seconds của ma trận -> client không sửa được.
-- ============================================================================
create or replace function start_exam_attempt(p_exam_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_attempt uuid;
  v_uid uuid := auth.uid();
  v_total smallint;
  v_duration integer;
  v_open uuid;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  -- Nếu đang có lượt thi dở của chính đề này thì trả lại, không tạo lượt mới
  select id into v_open from attempts
   where user_id = v_uid and exam_id = p_exam_id and status = 'in_progress'
   order by started_at desc limit 1;
  if v_open is not null then
    return v_open;
  end if;

  select count(*) into v_total from exam_questions where exam_id = p_exam_id;
  if v_total = 0 then
    raise exception 'Đề thi chưa có câu hỏi';
  end if;

  select coalesce(m.duration_seconds, 3000) into v_duration
    from exams e left join exam_matrices m on m.id = e.matrix_id
   where e.id = p_exam_id;

  insert into attempts (user_id, mode, exam_id, total_questions, deadline_at)
  values (v_uid, 'exam', p_exam_id, v_total, now() + make_interval(secs => v_duration))
  returning id into v_attempt;

  insert into attempt_answers (attempt_id, question_id, position)
  select v_attempt, question_id, position from exam_questions where exam_id = p_exam_id;

  return v_attempt;
end;
$$;

-- ============================================================================
-- LẤY CÂU HỎI CỦA MỘT LƯỢT LÀM BÀI
-- Chỉ trả correct_key/explanation khi ĐƯỢC PHÉP:
--   - luyện tự do: trả ngay (học sinh cần xem giải thích sau mỗi câu)
--   - thi thử / luyện tính giờ: chỉ trả sau khi đã nộp
-- ============================================================================
create or replace function get_attempt_questions(p_attempt_id uuid)
returns table (
  question_no smallint,
  question_id uuid,
  type_id smallint,
  stem text,
  options jsonb,
  difficulty difficulty_level,
  passage_id uuid,
  passage_kind passage_kind,
  passage_title text,
  passage_content text,
  passage_meta jsonb,
  selected_key text,
  marked_for_review boolean,
  is_correct boolean,
  correct_key text,
  explanation text,
  tip text
)
language plpgsql security definer set search_path = public as $$
declare
  v_attempt attempts%rowtype;
  v_reveal boolean;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found then
    raise exception 'Không tìm thấy lượt làm bài';
  end if;
  if v_attempt.user_id <> auth.uid() and not is_staff() then
    raise exception 'Không có quyền xem lượt làm bài này';
  end if;

  v_reveal := v_attempt.status <> 'in_progress'
              or v_attempt.mode = 'practice_free';

  return query
  select
    aa.position,
    q.id,
    q.type_id,
    q.stem,
    q.options,
    q.difficulty,
    p.id,
    p.kind,
    p.title,
    p.content,
    p.meta,
    aa.selected_key,
    aa.marked_for_review,
    case when v_reveal then aa.is_correct else null end,
    case when v_reveal then q.correct_key else null end,
    case when v_reveal then q.explanation else null end,
    case when v_reveal then q.tip else null end
  from attempt_answers aa
  join questions q on q.id = aa.question_id
  left join passages p on p.id = q.passage_id
  where aa.attempt_id = p_attempt_id
  order by aa.position;
end;
$$;

-- ============================================================================
-- LƯU MỘT ĐÁP ÁN
-- Ở chế độ luyện tự do, chấm đúng/sai ngay để hiện giải thích.
-- ============================================================================
create or replace function save_answer(
  p_attempt_id uuid,
  p_position smallint,
  p_selected_key text,
  p_time_spent_ms integer default 0,
  p_marked boolean default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_attempt attempts%rowtype;
  v_correct text;
  v_is_correct boolean;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found or v_attempt.user_id <> auth.uid() then
    raise exception 'Không có quyền với lượt làm bài này';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'Lượt làm bài đã kết thúc';
  end if;
  -- Hết giờ thì không nhận thêm đáp án
  if v_attempt.deadline_at is not null and now() > v_attempt.deadline_at then
    raise exception 'Đã hết thời gian làm bài';
  end if;

  select q.correct_key into v_correct
    from attempt_answers aa join questions q on q.id = aa.question_id
   where aa.attempt_id = p_attempt_id and aa.position = p_position;

  v_is_correct := (p_selected_key = v_correct);

  update attempt_answers
     set selected_key = coalesce(p_selected_key, selected_key),
         marked_for_review = coalesce(p_marked, marked_for_review),
         time_spent_ms = time_spent_ms + greatest(p_time_spent_ms, 0),
         is_correct = v_is_correct,
         answered_at = now()
   where attempt_id = p_attempt_id and position = p_position;

  -- Chỉ tiết lộ kết quả ngay ở chế độ luyện tự do
  if v_attempt.mode = 'practice_free' then
    return jsonb_build_object('revealed', true, 'is_correct', v_is_correct, 'correct_key', v_correct);
  end if;
  return jsonb_build_object('revealed', false);
end;
$$;

-- ============================================================================
-- NỘP BÀI & CHẤM ĐIỂM (toàn bộ ở server)
-- ============================================================================
create or replace function submit_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_attempt attempts%rowtype;
  v_correct smallint;
  v_score numeric(4, 2);
  v_ppq numeric(4, 3) := 0.25;
  v_points integer := 0;
  v_duration integer;
  v_expired boolean;
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_streak streaks%rowtype;
  v_new_badges jsonb := '[]'::jsonb;
begin
  select * into v_attempt from attempts where id = p_attempt_id for update;
  if not found or v_attempt.user_id <> auth.uid() then
    raise exception 'Không có quyền với lượt làm bài này';
  end if;
  if v_attempt.status <> 'in_progress' then
    -- Nộp lại lần nữa thì trả về kết quả đã có, không chấm lại
    return jsonb_build_object(
      'already_submitted', true,
      'score', v_attempt.score,
      'correct_count', v_attempt.correct_count,
      'total', v_attempt.total_questions
    );
  end if;

  v_expired := v_attempt.deadline_at is not null and now() > v_attempt.deadline_at;

  -- Chấm lại toàn bộ từ đáp án gốc, không tin giá trị is_correct client đã ghi
  update attempt_answers aa
     set is_correct = (aa.selected_key = q.correct_key)
    from questions q
   where q.id = aa.question_id and aa.attempt_id = p_attempt_id;

  select count(*) filter (where is_correct) into v_correct
    from attempt_answers where attempt_id = p_attempt_id;

  if v_attempt.exam_id is not null then
    select coalesce(m.points_per_question, 0.25) into v_ppq
      from exams e left join exam_matrices m on m.id = e.matrix_id
     where e.id = v_attempt.exam_id;
  end if;

  v_score := round(v_correct * v_ppq, 2);
  v_duration := greatest(extract(epoch from (now() - v_attempt.started_at))::integer, 0);

  update attempts
     set status = (case when v_expired then 'expired' else 'submitted' end)::attempt_status,
         correct_count = v_correct,
         score = v_score,
         submitted_at = now(),
         duration_seconds = v_duration
   where id = p_attempt_id;

  -- ----- Cộng điểm thưởng theo cấu hình point_rules -----
  select points into v_points from point_rules
   where code = case when v_attempt.mode = 'exam' then 'complete_exam' else 'complete_practice' end
     and is_active;
  v_points := coalesce(v_points, 0);

  -- Thưởng thêm khi thi thử đạt điểm cao
  if v_attempt.mode = 'exam' and v_score >= 9 then
    v_points := v_points + coalesce((select points from point_rules where code = 'exam_score_9plus' and is_active), 0);
  elsif v_attempt.mode = 'exam' and v_score >= 8 then
    v_points := v_points + coalesce((select points from point_rules where code = 'exam_score_8plus' and is_active), 0);
  end if;

  if v_points > 0 then
    insert into points_ledger (user_id, delta, reason, ref_type, ref_id)
    values (v_attempt.user_id, v_points,
            case when v_attempt.mode = 'exam' then 'Hoàn thành bài thi thử' else 'Hoàn thành phiên luyện tập' end,
            'attempt', p_attempt_id);
  end if;

  -- XP: mỗi câu đúng 10 XP
  update profiles set xp = xp + v_correct * 10, updated_at = now()
   where id = v_attempt.user_id;

  -- ----- Cập nhật streak -----
  select * into v_streak from streaks where user_id = v_attempt.user_id for update;
  if v_streak.last_activity_date is null or v_streak.last_activity_date < v_today then
    if v_streak.last_activity_date = v_today - 1 then
      update streaks
         set current_streak = current_streak + 1,
             longest_streak = greatest(longest_streak, current_streak + 1),
             last_activity_date = v_today
       where user_id = v_attempt.user_id;
    else
      update streaks
         set current_streak = 1,
             longest_streak = greatest(longest_streak, 1),
             last_activity_date = v_today
       where user_id = v_attempt.user_id;
    end if;
  end if;

  -- ----- Xét huy hiệu -----
  v_new_badges := award_badges(v_attempt.user_id);

  return jsonb_build_object(
    'already_submitted', false,
    'expired', v_expired,
    'score', v_score,
    'correct_count', v_correct,
    'total', v_attempt.total_questions,
    'duration_seconds', v_duration,
    'points_earned', v_points,
    'new_badges', v_new_badges
  );
end;
$$;

-- ============================================================================
-- XÉT & TRAO HUY HIỆU
-- ============================================================================
create or replace function award_badges(p_user uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  b record;
  v_hit boolean;
  v_value numeric;
  v_awarded jsonb := '[]'::jsonb;
begin
  for b in
    select * from badges
     where id not in (select badge_id from user_badges where user_id = p_user)
  loop
    v_hit := false;

    case b.criteria ->> 'kind'
      when 'questions_answered' then
        select count(*) into v_value
          from attempt_answers aa join attempts a on a.id = aa.attempt_id
         where a.user_id = p_user and a.status <> 'in_progress' and aa.selected_key is not null;
        v_hit := v_value >= (b.criteria ->> 'threshold')::numeric;

      when 'questions_by_type' then
        select count(*) into v_value
          from attempt_answers aa
          join attempts a on a.id = aa.attempt_id
          join questions q on q.id = aa.question_id
         where a.user_id = p_user and a.status <> 'in_progress'
           and aa.selected_key is not null
           and q.type_id = (b.criteria ->> 'type_id')::smallint;
        v_hit := v_value >= (b.criteria ->> 'threshold')::numeric;

      when 'streak' then
        select current_streak into v_value from streaks where user_id = p_user;
        v_hit := coalesce(v_value, 0) >= (b.criteria ->> 'threshold')::numeric;

      when 'exam_score' then
        select coalesce(max(score), 0) into v_value
          from attempts where user_id = p_user and mode = 'exam' and status = 'submitted';
        v_hit := v_value >= (b.criteria ->> 'threshold')::numeric;

      when 'accuracy_by_type' then
        select case when count(*) filter (where aa.selected_key is not null) >= 20
                    then 100.0 * count(*) filter (where aa.is_correct)
                         / nullif(count(*) filter (where aa.selected_key is not null), 0)
                    else 0 end
          into v_value
          from attempt_answers aa
          join attempts a on a.id = aa.attempt_id
          join questions q on q.id = aa.question_id
         where a.user_id = p_user and a.status <> 'in_progress'
           and q.type_id = (b.criteria ->> 'type_id')::smallint;
        v_hit := coalesce(v_value, 0) >= (b.criteria ->> 'threshold')::numeric;

      else
        v_hit := false;
    end case;

    if v_hit then
      insert into user_badges (user_id, badge_id) values (p_user, b.id)
      on conflict do nothing;

      if b.points_reward > 0 then
        insert into points_ledger (user_id, delta, reason, ref_type, ref_id)
        values (p_user, b.points_reward, 'Đạt huy hiệu: ' || b.name_vi, 'badge', null);
      end if;

      v_awarded := v_awarded || jsonb_build_object(
        'code', b.code, 'name', b.name_vi, 'icon', b.icon, 'points', b.points_reward
      );
    end if;
  end loop;

  return v_awarded;
end;
$$;

-- ============================================================================
-- GHI NHẬN RỜI TAB (chống gian lận cơ bản)
-- ============================================================================
create or replace function record_tab_switch(p_attempt_id uuid)
returns smallint
language plpgsql security definer set search_path = public as $$
declare v_n smallint;
begin
  update attempts set tab_switches = tab_switches + 1
   where id = p_attempt_id and user_id = auth.uid() and status = 'in_progress'
  returning tab_switches into v_n;
  return coalesce(v_n, 0);
end;
$$;

-- ============================================================================
-- SỐ DƯ ĐIỂM THƯỞNG
-- ============================================================================
create or replace function my_points_balance()
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(delta), 0)::integer from points_ledger where user_id = auth.uid();
$$;
