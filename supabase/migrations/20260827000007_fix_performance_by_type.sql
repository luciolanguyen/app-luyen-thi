-- ============================================================================
-- SỬA LỖI: thống kê theo dạng bài đếm cả bài đang làm dở
--
-- Bản cũ viết:
--     left join attempts a on a.id = aa.attempt_id
--          and a.user_id = auth.uid() and a.status <> 'in_progress'
--     where a.id is not null or true
--
-- `or true` làm mệnh đề WHERE luôn đúng, nên LEFT JOIN giữ lại cả những dòng
-- attempt_answers KHÔNG khớp điều kiện (bài đang làm dở, và về nguyên tắc là
-- cả bài của người dùng khác). Hậu quả: trang tổng quan báo "2 câu đã làm, 0%"
-- trong khi bảng theo dạng bài báo "1/3 câu đúng, 33,3%" — hai số vênh nhau.
--
-- Bản mới dùng lateral subquery: điều kiện lọc nằm bên trong, không thể bị
-- LEFT JOIN nới lỏng, và vẫn giữ được các dạng bài chưa làm câu nào (trả 0).
-- ============================================================================

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
    coalesce(s.answered, 0),
    coalesce(s.correct, 0),
    case when coalesce(s.answered, 0) = 0 then 0
         else round(100.0 * s.correct / s.answered, 1) end,
    round(coalesce(s.avg_ms, 0) / 1000.0, 1)
  from question_types qt
  left join lateral (
    select
      count(*) filter (where aa.selected_key is not null) as answered,
      count(*) filter (where aa.is_correct) as correct,
      avg(aa.time_spent_ms) filter (where aa.selected_key is not null) as avg_ms
    from attempt_answers aa
    join attempts a on a.id = aa.attempt_id
    join questions q on q.id = aa.question_id
    where a.user_id = auth.uid()
      and a.status <> 'in_progress'
      and q.type_id = qt.id
  ) s on true
  order by qt.sort_order;
$$;

grant execute on function my_performance_by_type() to authenticated;
