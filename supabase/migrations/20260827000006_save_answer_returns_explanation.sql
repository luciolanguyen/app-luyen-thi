-- ============================================================================
-- save_answer trả kèm giải thích khi ở chế độ luyện tự do
--
-- Sau khi vá lỗi lộ đáp án (migration 0005), explanation/tip không còn được
-- nạp sẵn lúc mở phiên nữa — đúng như mong muốn. Nhưng khi học sinh trả lời
-- xong, client cần ngay nội dung đó để hiển thị, mà save_answer chỉ trả về
-- is_correct và correct_key, nên khối giải thích trống trơn.
--
-- Trả thêm explanation + tip ngay trong phản hồi: một vòng gọi mạng, và vẫn
-- chỉ lộ đúng câu học sinh vừa trả lời.
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
  v_q questions%rowtype;
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

  select q.* into v_q
    from attempt_answers aa join questions q on q.id = aa.question_id
   where aa.attempt_id = p_attempt_id and aa.position = p_position;

  if not found then
    raise exception 'Không tìm thấy câu số % trong lượt làm bài', p_position;
  end if;

  v_is_correct := (p_selected_key = v_q.correct_key);

  update attempt_answers
     set selected_key = coalesce(p_selected_key, selected_key),
         marked_for_review = coalesce(p_marked, marked_for_review),
         time_spent_ms = time_spent_ms + greatest(p_time_spent_ms, 0),
         is_correct = v_is_correct,
         answered_at = now()
   where attempt_id = p_attempt_id and position = p_position;

  -- Chỉ tiết lộ ở chế độ luyện tự do, và chỉ cho đúng câu vừa trả lời
  if v_attempt.mode = 'practice_free' and p_selected_key is not null then
    return jsonb_build_object(
      'revealed', true,
      'is_correct', v_is_correct,
      'correct_key', v_q.correct_key,
      'explanation', v_q.explanation,
      'tip', v_q.tip
    );
  end if;

  return jsonb_build_object('revealed', false);
end;
$$;

grant execute on function save_answer(uuid, smallint, text, integer, boolean)
  to authenticated;
