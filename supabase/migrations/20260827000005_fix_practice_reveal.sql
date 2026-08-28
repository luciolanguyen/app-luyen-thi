-- ============================================================================
-- SỬA LỖI: luyện tự do lộ đáp án ngay khi mở phiên
--
-- Bản trước đặt cờ lộ đáp án ở mức CẢ LƯỢT LÀM BÀI:
--     v_reveal := status <> 'in_progress' or mode = 'practice_free'
-- nên vừa vào phiên luyện tự do là toàn bộ 10 câu đã kèm sẵn correct_key và
-- giải thích — học sinh nhìn thấy đáp án trước khi trả lời.
--
-- Đúng ra phải xét theo TỪNG CÂU:
--   - đã nộp bài            -> lộ hết
--   - luyện tự do, câu ĐÃ trả lời -> lộ câu đó
--   - luyện tự do, câu CHƯA trả lời -> vẫn giấu
--   - thi thử / luyện tính giờ, đang làm -> giấu tất cả
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
  v_finished boolean;
  v_free boolean;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found then
    raise exception 'Không tìm thấy lượt làm bài';
  end if;
  if v_attempt.user_id <> auth.uid() and not is_staff() then
    raise exception 'Không có quyền xem lượt làm bài này';
  end if;

  v_finished := v_attempt.status <> 'in_progress';
  v_free := v_attempt.mode = 'practice_free';

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
    -- Lộ theo từng câu, không lộ theo cả lượt làm bài
    case when v_finished or (v_free and aa.selected_key is not null)
         then aa.is_correct end,
    case when v_finished or (v_free and aa.selected_key is not null)
         then q.correct_key end,
    case when v_finished or (v_free and aa.selected_key is not null)
         then q.explanation end,
    case when v_finished or (v_free and aa.selected_key is not null)
         then q.tip end
  from attempt_answers aa
  join questions q on q.id = aa.question_id
  left join passages p on p.id = q.passage_id
  where aa.attempt_id = p_attempt_id
  order by aa.position;
end;
$$;

grant execute on function get_attempt_questions(uuid) to authenticated;
