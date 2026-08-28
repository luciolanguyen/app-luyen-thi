-- ============================================================================
-- CẬP NHẬT MA TRẬN ĐỀ TRONG MỘT TRANSACTION
--
-- Vấn đề: supabase-js gửi mỗi lệnh ghi thành MỘT HTTP request riêng, tức mỗi
-- dòng là một transaction độc lập. Khi admin đổi phân bổ (vd dạng 1: 4 -> 6 và
-- dạng 4: 21 -> 19, tổng vẫn 40), lệnh đầu đã commit với tổng tạm thời là 42
-- và trigger kiểm tra tổng chặn lại — dù cấu hình cuối cùng hoàn toàn hợp lệ.
--
-- Trigger không sai; cách ghi mới sai. Toàn bộ thay đổi phải nằm trong một
-- transaction để chỉ trạng thái CUỐI CÙNG bị kiểm tra (trigger đã khai báo
-- `deferrable initially deferred` nên nó chạy lúc commit).
--
-- Đây cũng là hành vi đúng về nghiệp vụ: sửa ma trận phải all-or-nothing,
-- không được để đề thi rơi vào trạng thái nửa vời.
-- ============================================================================

create or replace function update_exam_matrix(
  p_matrix_id uuid,
  p_duration_seconds integer,
  p_points_per_question numeric,
  -- [{"type_id":1,"question_count":6}, ...]
  p_items jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_total integer;
  v_kept smallint[];
begin
  if not is_admin() then
    raise exception 'Chỉ quản trị viên mới sửa được ma trận đề';
  end if;

  if p_duration_seconds < 300 or p_duration_seconds > 14400 then
    raise exception 'Thời gian làm bài phải từ 5 đến 240 phút';
  end if;

  if p_points_per_question <= 0 then
    raise exception 'Điểm mỗi câu phải lớn hơn 0';
  end if;

  select coalesce(sum((i ->> 'question_count')::integer), 0)
    into v_total
    from jsonb_array_elements(p_items) i;

  if v_total <= 0 then
    raise exception 'Tổng số câu phải lớn hơn 0';
  end if;

  -- Cập nhật đầu ma trận TRƯỚC để total_questions khớp tổng mới
  update exam_matrices
     set total_questions = v_total,
         duration_seconds = p_duration_seconds,
         points_per_question = p_points_per_question,
         max_score = round(v_total * p_points_per_question, 2)
   where id = p_matrix_id;

  if not found then
    raise exception 'Không tìm thấy ma trận';
  end if;

  -- Bỏ các dạng bài bị đặt về 0 (hoặc không còn trong danh sách)
  select coalesce(
           array_agg((i ->> 'type_id')::smallint)
             filter (where (i ->> 'question_count')::integer > 0),
           '{}'::smallint[]
         )
    into v_kept
    from jsonb_array_elements(p_items) i;

  delete from exam_matrix_items
   where matrix_id = p_matrix_id
     and not (type_id = any (v_kept));

  insert into exam_matrix_items (matrix_id, type_id, question_count)
  select p_matrix_id,
         (i ->> 'type_id')::smallint,
         (i ->> 'question_count')::smallint
    from jsonb_array_elements(p_items) i
   where (i ->> 'question_count')::integer > 0
  on conflict (matrix_id, type_id)
  do update set question_count = excluded.question_count;

  return jsonb_build_object(
    'total_questions', v_total,
    'max_score', round(v_total * p_points_per_question, 2)
  );
end;
$$;

grant execute on function update_exam_matrix(uuid, integer, numeric, jsonb)
  to authenticated;
