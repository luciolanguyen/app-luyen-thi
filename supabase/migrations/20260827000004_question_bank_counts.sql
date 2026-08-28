-- ============================================================================
-- ĐẾM SỐ CÂU TRONG NGÂN HÀNG
--
-- Học sinh cần biết mỗi danh mục / độ khó / chuyên đề có bao nhiêu câu để chọn
-- bộ lọc, nhưng RLS cố tình KHÔNG cho họ select bảng `questions` (nếu cho thì
-- correct_key lộ ngay trong lúc thi).
--
-- Hàm security definer này chỉ trả về CON SỐ ĐẾM — không có đề bài, không có
-- phương án, không có đáp án — nên vẫn giữ nguyên nguyên tắc bảo mật.
-- ============================================================================

create or replace function question_bank_counts()
returns table (
  type_id smallint,
  difficulty difficulty_level,
  topic_id integer,
  n bigint
)
language sql stable security definer set search_path = public as $$
  select q.type_id, q.difficulty, q.topic_id, count(*)
    from questions q
   where q.is_active
   group by q.type_id, q.difficulty, q.topic_id;
$$;

grant execute on function question_bank_counts() to authenticated;
