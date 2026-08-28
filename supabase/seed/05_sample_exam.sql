-- ============================================================================
-- ĐỀ THI THỬ MẪU — 40 câu, đúng ma trận mặc định
--   Dạng 1 (thông báo):     4 câu
--   Dạng 2 (sắp xếp):       5 câu
--   Dạng 3 (cloze):        10 câu  (2 bài × 5, giữ nguyên thứ tự trong bài)
--   Dạng 4 (đọc hiểu):     21 câu  (3 bài × 7, giữ nguyên thứ tự trong bài)
-- ============================================================================

insert into exams (id, title, kind, matrix_id, year, description, is_published)
values (
  '22222222-2222-4222-8222-222222222222',
  'Đề thi thử số 1 — Cấu trúc THPT 2026',
  'official',
  '11111111-1111-4111-8111-111111111111',
  2026,
  'Đề mẫu dựng theo ma trận chuẩn: 40 câu, 50 phút, thang điểm 10. Dùng để kiểm tra toàn bộ luồng phòng thi ảo.',
  true
);

-- Xếp câu vào đề theo đúng thứ tự dạng bài của đề thật.
-- Cloze và Đọc hiểu giữ nguyên trật tự câu trong từng đoạn ngữ liệu, vì các câu
-- này phụ thuộc vào chỗ trống (1)...(5) và trình tự đoạn văn.
with ordered as (
  select
    q.id,
    row_number() over (
      order by
        qt.sort_order,
        p.id nulls first,
        q.position_in_passage nulls first,
        q.created_at
    ) as pos,
    qt.sort_order as type_order,
    row_number() over (
      partition by q.type_id
      order by p.id nulls first, q.position_in_passage nulls first, q.created_at
    ) as rn_in_type
  from questions q
  join question_types qt on qt.id = q.type_id
  left join passages p on p.id = q.passage_id
  where q.is_active and qt.in_real_exam
),
picked as (
  -- Lấy đúng số câu mỗi dạng theo ma trận
  select id, type_order, rn_in_type from ordered where type_order = 1 and rn_in_type <= 4
  union all
  select id, type_order, rn_in_type from ordered where type_order = 2 and rn_in_type <= 5
  union all
  select id, type_order, rn_in_type from ordered where type_order = 3 and rn_in_type <= 10
  union all
  select id, type_order, rn_in_type from ordered where type_order = 4 and rn_in_type <= 21
)
insert into exam_questions (exam_id, question_id, position)
select
  '22222222-2222-4222-8222-222222222222',
  id,
  row_number() over (order by type_order, rn_in_type)::smallint
from picked;

-- Kiểm tra: đề phải có đúng 40 câu, nếu không thì dừng seed để phát hiện sớm.
do $$
declare v_n integer;
begin
  select count(*) into v_n from exam_questions
   where exam_id = '22222222-2222-4222-8222-222222222222';
  if v_n <> 40 then
    raise exception 'Đề thi thử mẫu có % câu, cần đúng 40. Kiểm tra lại ngân hàng câu hỏi.', v_n;
  end if;
end $$;
