-- ============================================================================
-- BÁO CÁO NĂNG LỰC & BẢNG XẾP HẠNG
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tổng quan năng lực của học sinh đang đăng nhập (spec 4.3)
-- ---------------------------------------------------------------------------
create or replace function my_overview()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  select jsonb_build_object(
    'exam_count',        coalesce(e.cnt, 0),
    'avg_score',         round(coalesce(e.avg_score, 0), 2),
    'best_score',        round(coalesce(e.best, 0), 2),
    'last_score',        round(coalesce(e.last_score, 0), 2),
    'trend',             round(coalesce(e.last_score, 0) - coalesce(e.prev_score, e.last_score, 0), 2),
    'practice_sessions', coalesce(p.cnt, 0),
    'questions_done',    coalesce(a.answered, 0),
    'accuracy',          case when coalesce(a.answered, 0) = 0 then 0
                              else round(100.0 * a.correct / a.answered, 1) end,
    'total_minutes',     round(coalesce(t.secs, 0) / 60.0),
    'current_streak',    coalesce(s.current_streak, 0),
    'longest_streak',    coalesce(s.longest_streak, 0),
    'xp',                coalesce(pr.xp, 0),
    'points',            coalesce(pt.balance, 0),
    'badge_count',       coalesce(bg.cnt, 0)
  )
  into v_result
  from (select 1) dummy
  left join lateral (
    select count(*) as cnt,
           avg(score) as avg_score,
           max(score) as best,
           (array_agg(score order by submitted_at desc))[1] as last_score,
           (array_agg(score order by submitted_at desc))[2] as prev_score
      from attempts
     where user_id = v_uid and mode = 'exam' and status in ('submitted', 'expired')
  ) e on true
  left join lateral (
    select count(*) as cnt from attempts
     where user_id = v_uid and mode in ('practice_free', 'practice_timed')
       and status <> 'in_progress'
  ) p on true
  left join lateral (
    select count(*) filter (where aa.selected_key is not null) as answered,
           count(*) filter (where aa.is_correct) as correct
      from attempt_answers aa join attempts at2 on at2.id = aa.attempt_id
     where at2.user_id = v_uid and at2.status <> 'in_progress'
  ) a on true
  left join lateral (
    select sum(duration_seconds) as secs from attempts
     where user_id = v_uid and status <> 'in_progress'
  ) t on true
  left join streaks s on s.user_id = v_uid
  left join profiles pr on pr.id = v_uid
  left join lateral (select sum(delta) as balance from points_ledger where user_id = v_uid) pt on true
  left join lateral (select count(*) as cnt from user_badges where user_id = v_uid) bg on true;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- % đúng theo từng dạng bài — dữ liệu cho biểu đồ radar (spec 4.3)
-- ---------------------------------------------------------------------------
create or replace function my_performance_by_type()
returns table (
  type_id smallint,
  code text,
  name_vi text,
  answered bigint,
  correct bigint,
  accuracy numeric,
  avg_seconds numeric
)
language sql stable security definer set search_path = public as $$
  select
    qt.id,
    qt.code,
    qt.name_vi,
    count(aa.*) filter (where aa.selected_key is not null) as answered,
    count(aa.*) filter (where aa.is_correct) as correct,
    case when count(aa.*) filter (where aa.selected_key is not null) = 0 then 0
         else round(100.0 * count(aa.*) filter (where aa.is_correct)
                    / count(aa.*) filter (where aa.selected_key is not null), 1) end,
    round(coalesce(avg(aa.time_spent_ms) filter (where aa.selected_key is not null), 0) / 1000.0, 1)
  from question_types qt
  left join questions q on q.type_id = qt.id
  left join attempt_answers aa on aa.question_id = q.id
  left join attempts a on a.id = aa.attempt_id
       and a.user_id = auth.uid() and a.status <> 'in_progress'
  where a.id is not null or true
  group by qt.id, qt.code, qt.name_vi, qt.sort_order
  order by qt.sort_order;
$$;

-- ---------------------------------------------------------------------------
-- % đúng theo chuyên đề ngữ pháp / chủ đề từ vựng — để chỉ ra điểm yếu
-- ---------------------------------------------------------------------------
create or replace function my_performance_by_topic()
returns table (
  topic_id integer,
  code text,
  name_vi text,
  kind text,
  answered bigint,
  correct bigint,
  accuracy numeric
)
language sql stable security definer set search_path = public as $$
  select
    t.id, t.code, t.name_vi, t.kind,
    count(aa.*) filter (where aa.selected_key is not null),
    count(aa.*) filter (where aa.is_correct),
    case when count(aa.*) filter (where aa.selected_key is not null) = 0 then 0
         else round(100.0 * count(aa.*) filter (where aa.is_correct)
                    / count(aa.*) filter (where aa.selected_key is not null), 1) end
  from topics t
  join questions q on q.topic_id = t.id
  join attempt_answers aa on aa.question_id = q.id
  join attempts a on a.id = aa.attempt_id
  where a.user_id = auth.uid() and a.status <> 'in_progress'
  group by t.id, t.code, t.name_vi, t.kind, t.sort_order
  having count(aa.*) filter (where aa.selected_key is not null) > 0
  order by 7 asc, t.sort_order;
$$;

-- ---------------------------------------------------------------------------
-- Tiến bộ theo thời gian — line chart điểm thi thử (spec 4.3)
-- ---------------------------------------------------------------------------
create or replace function my_progress_over_time(p_limit integer default 20)
returns table (
  attempt_id uuid,
  submitted_at timestamptz,
  score numeric,
  correct_count smallint,
  total_questions smallint,
  exam_title text,
  duration_seconds integer
)
language sql stable security definer set search_path = public as $$
  select a.id, a.submitted_at, a.score, a.correct_count, a.total_questions,
         coalesce(e.title, 'Đề thi thử'), a.duration_seconds
  from attempts a
  left join exams e on e.id = a.exam_id
  where a.user_id = auth.uid() and a.mode = 'exam' and a.status in ('submitted', 'expired')
  order by a.submitted_at asc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- Gợi ý lộ trình ôn tập cá nhân hoá (rule-based, spec 4.3 / mục 5)
-- Lấy 3 mảng yếu nhất mà học sinh đã làm đủ mẫu để kết luận.
-- ---------------------------------------------------------------------------
create or replace function my_study_plan()
returns table (
  kind text,
  ref_id integer,
  label text,
  accuracy numeric,
  answered bigint,
  reason text
)
language sql stable security definer set search_path = public as $$
  with by_type as (
    select 'type'::text as kind, t.type_id::integer as ref_id, t.name_vi as label,
           t.accuracy, t.answered
      from my_performance_by_type() t
     where t.answered >= 5
  ),
  by_topic as (
    select 'topic'::text, tp.topic_id, tp.name_vi, tp.accuracy, tp.answered
      from my_performance_by_topic() tp
     where tp.answered >= 5
  ),
  merged as (select * from by_type union all select * from by_topic)
  select kind, ref_id, label, accuracy, answered,
         case
           when accuracy < 50 then 'Tỉ lệ đúng dưới 50% — nên ưu tiên ôn lại phần này trước'
           when accuracy < 70 then 'Tỉ lệ đúng còn thấp — luyện thêm để chắc điểm'
           else 'Đã khá ổn, duy trì luyện tập để giữ phong độ'
         end
  from merged
  order by accuracy asc, answered desc
  limit 3;
$$;

-- ---------------------------------------------------------------------------
-- BẢNG XẾP HẠNG (spec 4.5)
-- Cố ý dùng security definer để đọc xuyên RLS của attempts — đây là bảng công
-- khai. Học sinh bật leaderboard_anonymous sẽ hiện "Ẩn danh".
-- ---------------------------------------------------------------------------
create or replace function leaderboard(
  p_metric text default 'exam_score',   -- exam_score | points | practice_time | streak
  p_period text default 'week',         -- week | month | all
  p_school text default null,
  p_class text default null,
  p_limit integer default 20
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  school text,
  class_name text,
  value numeric,
  is_me boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_since timestamptz := case p_period
    when 'week'  then date_trunc('week', now())
    when 'month' then date_trunc('month', now())
    else '-infinity'::timestamptz
  end;
begin
  return query
  with base as (
    select
      p.id,
      case when p.leaderboard_anonymous then 'Ẩn danh'
           else nullif(p.full_name, '') end as display_name,
      p.school,
      p.class_name,
      case p_metric
        when 'exam_score' then (
          select coalesce(max(a.score), 0) from attempts a
           where a.user_id = p.id and a.mode = 'exam'
             and a.status in ('submitted', 'expired') and a.submitted_at >= v_since
        )
        when 'points' then (
          select coalesce(sum(pl.delta), 0) from points_ledger pl
           where pl.user_id = p.id and pl.created_at >= v_since
        )
        when 'practice_time' then (
          select round(coalesce(sum(a.duration_seconds), 0) / 60.0)
            from attempts a
           where a.user_id = p.id and a.status <> 'in_progress' and a.submitted_at >= v_since
        )
        when 'streak' then (select coalesce(s.current_streak, 0) from streaks s where s.user_id = p.id)
        else 0
      end::numeric as value
    from profiles p
    where p.role = 'student'
      and (p_school is null or p.school = p_school)
      and (p_class is null or p.class_name = p_class)
  )
  select
    rank() over (order by b.value desc) as rank,
    b.id,
    coalesce(b.display_name, 'Học sinh'),
    b.school,
    b.class_name,
    b.value,
    b.id = auth.uid()
  from base b
  where b.value > 0
  order by b.value desc, b.display_name
  limit p_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Thứ hạng của chính mình (để hiện "Bạn đang hạng N" kể cả khi ngoài top 20)
-- ---------------------------------------------------------------------------
create or replace function my_rank(
  p_metric text default 'exam_score',
  p_period text default 'week'
)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_row record;
begin
  select r.rank, r.value into v_row
    from leaderboard(p_metric, p_period, null, null, 100000) r
   where r.user_id = auth.uid();
  if not found then
    return jsonb_build_object('ranked', false);
  end if;
  return jsonb_build_object('ranked', true, 'rank', v_row.rank, 'value', v_row.value);
end;
$$;

-- ---------------------------------------------------------------------------
-- Báo cáo lớp cho giáo viên (spec 4.3)
-- ---------------------------------------------------------------------------
create or replace function class_report(p_class_id uuid)
returns table (
  student_id uuid,
  full_name text,
  exam_count bigint,
  avg_score numeric,
  best_score numeric,
  questions_done bigint,
  accuracy numeric,
  current_streak smallint,
  last_active timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff() then
    raise exception 'Chỉ giáo viên hoặc quản trị viên xem được báo cáo lớp';
  end if;

  return query
  select
    p.id, p.full_name,
    count(a.*) filter (where a.mode = 'exam' and a.status <> 'in_progress'),
    round(avg(a.score) filter (where a.mode = 'exam' and a.status <> 'in_progress'), 2),
    max(a.score) filter (where a.mode = 'exam' and a.status <> 'in_progress'),
    (select count(*) from attempt_answers aa join attempts a2 on a2.id = aa.attempt_id
      where a2.user_id = p.id and a2.status <> 'in_progress' and aa.selected_key is not null),
    (select case when count(*) filter (where aa.selected_key is not null) = 0 then 0
                 else round(100.0 * count(*) filter (where aa.is_correct)
                            / count(*) filter (where aa.selected_key is not null), 1) end
       from attempt_answers aa join attempts a2 on a2.id = aa.attempt_id
      where a2.user_id = p.id and a2.status <> 'in_progress'),
    s.current_streak,
    max(a.submitted_at)
  from class_members cm
  join profiles p on p.id = cm.student_id
  left join attempts a on a.user_id = p.id
  left join streaks s on s.user_id = p.id
  where cm.class_id = p_class_id
  group by p.id, p.full_name, s.current_streak
  order by 4 desc nulls last;
end;
$$;

-- ---------------------------------------------------------------------------
-- Quyền gọi hàm
-- ---------------------------------------------------------------------------
grant execute on function
  start_practice_session(smallint, integer, difficulty_level, smallint, boolean),
  start_exam_attempt(uuid),
  get_attempt_questions(uuid),
  save_answer(uuid, smallint, text, integer, boolean),
  submit_attempt(uuid),
  record_tab_switch(uuid),
  my_points_balance(),
  my_overview(),
  my_performance_by_type(),
  my_performance_by_topic(),
  my_progress_over_time(integer),
  my_study_plan(),
  leaderboard(text, text, text, text, integer),
  my_rank(text, text),
  class_report(uuid)
to authenticated;
