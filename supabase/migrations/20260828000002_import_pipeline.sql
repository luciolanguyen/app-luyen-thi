-- ============================================================================
-- ĐƯỜNG ỐNG NHẬP CÂU HỎI
--
-- Dùng chung cho cả hai nguồn:
--   - Excel/CSV theo mẫu  -> parser đọc chính xác từng ô
--   - Word/Google Docs    -> AI đọc và tách thành câu hỏi
--
-- Cả hai đều đi qua BƯỚC RÀ SOÁT: dữ liệu vào bảng tạm import_items, admin xem
-- và bỏ chọn dòng sai, rồi mới commit vào ngân hàng thật. Với đường AI thì
-- bước này là bắt buộc về mặt nghiệp vụ — AI có thể đọc sai đáp án.
-- ============================================================================

create type import_source as enum ('upload', 'google_drive');
create type import_format as enum ('excel', 'csv', 'docx', 'gdoc', 'text');
create type import_status as enum ('parsing', 'review', 'committed', 'failed', 'cancelled');

create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references profiles (id) on delete cascade,
  source import_source not null,
  format import_format not null,
  file_name text not null,
  -- Chỉ lưu ID file để đối chiếu; KHÔNG lưu token truy cập Google
  drive_file_id text,
  status import_status not null default 'parsing',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  -- Ghi lại model đã dùng khi trích xuất bằng AI, để truy vết chất lượng
  extraction_model text,
  error_message text,
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create index import_jobs_user_idx on import_jobs (created_by, created_at desc);

-- Câu hỏi ở dạng tạm, chưa vào ngân hàng
create table import_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references import_jobs (id) on delete cascade,
  row_no integer not null,

  type_code text,
  topic_code text,
  difficulty text,
  cefr_level text,
  stem text,
  options jsonb,
  correct_key text,
  explanation text,
  tip text,

  -- Ngữ liệu dùng chung (đọc hiểu, cloze, thông báo). Các dòng cùng một
  -- passage_ref trong cùng job sẽ được gộp thành MỘT passage khi commit.
  passage_ref text,
  passage_kind text,
  passage_title text,
  passage_content text,
  position_in_passage smallint,

  errors text[] not null default '{}',
  is_valid boolean not null default false,
  -- Admin bỏ tick để loại dòng khỏi lần nhập này
  include boolean not null default true,
  created_at timestamptz not null default now(),

  unique (job_id, row_no)
);

create index import_items_job_idx on import_items (job_id, row_no);

alter table import_jobs enable row level security;
alter table import_items enable row level security;

create policy import_jobs_staff on import_jobs
  for all using (is_staff()) with check (is_staff());
create policy import_items_staff on import_items
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- KIỂM TRA TỪNG DÒNG
-- Chạy ở database để cả hai đường (Excel và AI) dùng chung một bộ luật —
-- không để hai nơi kiểm tra lệch nhau.
-- ---------------------------------------------------------------------------
create or replace function validate_import_job(p_job_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_valid integer;
  v_error integer;
begin
  if not is_staff() then
    raise exception 'Không có quyền';
  end if;

  update import_items i
     set errors = e.errs,
         is_valid = (cardinality(e.errs) = 0)
    from (
      select
        it.id,
        array_remove(array[
          case when coalesce(trim(it.stem), '') = ''
               then 'Thiếu nội dung câu hỏi' end,
          case when it.options is null or jsonb_typeof(it.options) <> 'array'
                 or jsonb_array_length(it.options) <> 4
               then 'Phải có đúng 4 phương án A, B, C, D' end,
          case when it.correct_key is null or it.correct_key not in ('A','B','C','D')
               then 'Đáp án đúng phải là A, B, C hoặc D' end,
          case when it.options is not null
                 and jsonb_typeof(it.options) = 'array'
                 and it.correct_key in ('A','B','C','D')
                 and not exists (
                   select 1 from jsonb_array_elements(it.options) o
                    where o ->> 'key' = it.correct_key
                      and coalesce(trim(o ->> 'text'), '') <> ''
                 )
               then 'Đáp án đúng không khớp phương án nào, hoặc phương án đó rỗng' end,
          case when it.type_code is null
                 or not exists (select 1 from question_types qt where qt.code = it.type_code)
               then 'Mã dạng bài không hợp lệ: ' || coalesce(it.type_code, '(trống)') end,
          case when it.topic_code is not null
                 and not exists (select 1 from topics t where t.code = it.topic_code)
               then 'Mã chuyên đề không tồn tại: ' || it.topic_code end,
          case when it.difficulty is not null
                 and it.difficulty not in ('nhan_biet','thong_hieu','van_dung','van_dung_cao')
               then 'Độ khó không hợp lệ: ' || it.difficulty end,
          case when it.cefr_level is not null
                 and it.cefr_level not in ('A2','B1','B2','C1')
               then 'Trình độ CEFR không hợp lệ: ' || it.cefr_level end,
          case when coalesce(trim(it.explanation), '') = ''
               then 'Thiếu giải thích — học sinh sẽ không hiểu vì sao sai' end
        ], null) as errs
      from import_items it
      where it.job_id = p_job_id
    ) e
   where i.id = e.id;

  select count(*) filter (where is_valid), count(*) filter (where not is_valid)
    into v_valid, v_error
    from import_items where job_id = p_job_id;

  update import_jobs
     set valid_rows = v_valid,
         error_rows = v_error,
         total_rows = v_valid + v_error,
         status = 'review'
   where id = p_job_id;

  return jsonb_build_object('valid', v_valid, 'errors', v_error);
end;
$$;

-- ---------------------------------------------------------------------------
-- ĐƯA VÀO NGÂN HÀNG THẬT
-- Toàn bộ trong một transaction: hoặc vào hết, hoặc không dòng nào.
-- ---------------------------------------------------------------------------
create or replace function commit_import_job(p_job_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_job import_jobs%rowtype;
  v_inserted integer := 0;
  v_passages integer := 0;
  r record;
  v_passage_id uuid;
  v_map jsonb := '{}'::jsonb;
begin
  if not is_staff() then
    raise exception 'Không có quyền';
  end if;

  select * into v_job from import_jobs where id = p_job_id for update;
  if not found then
    raise exception 'Không tìm thấy lần nhập';
  end if;
  if v_job.status = 'committed' then
    raise exception 'Lần nhập này đã được lưu vào ngân hàng rồi';
  end if;

  -- Tạo trước các đoạn ngữ liệu, mỗi passage_ref một bản ghi
  for r in
    select distinct on (passage_ref)
           passage_ref, passage_kind, passage_title, passage_content
      from import_items
     where job_id = p_job_id and include and is_valid
       and passage_ref is not null
       and coalesce(trim(passage_content), '') <> ''
     order by passage_ref, row_no
  loop
    insert into passages (kind, title, content, source)
    values (
      coalesce(r.passage_kind, 'reading')::passage_kind,
      r.passage_title,
      r.passage_content,
      'Nhập từ ' || v_job.file_name
    )
    returning id into v_passage_id;

    v_map := v_map || jsonb_build_object(r.passage_ref, v_passage_id);
    v_passages := v_passages + 1;
  end loop;

  insert into questions (
    type_id, passage_id, topic_id, position_in_passage,
    stem, options, correct_key, explanation, tip,
    difficulty, cefr_level, source, created_by
  )
  select
    qt.id,
    case when it.passage_ref is not null
         then (v_map ->> it.passage_ref)::uuid end,
    t.id,
    it.position_in_passage,
    trim(it.stem),
    it.options,
    it.correct_key,
    trim(it.explanation),
    nullif(trim(coalesce(it.tip, '')), ''),
    coalesce(it.difficulty, 'thong_hieu')::difficulty_level,
    it.cefr_level,
    'Nhập từ ' || v_job.file_name,
    v_job.created_by
  from import_items it
  join question_types qt on qt.code = it.type_code
  left join topics t on t.code = it.topic_code
  where it.job_id = p_job_id and it.include and it.is_valid;

  get diagnostics v_inserted = row_count;

  update import_jobs
     set status = 'committed', committed_at = now()
   where id = p_job_id;

  insert into audit_log (actor_id, action, entity, entity_id, detail)
  values (
    auth.uid(), 'import_questions', 'import_job', p_job_id::text,
    jsonb_build_object(
      'file', v_job.file_name,
      'questions', v_inserted,
      'passages', v_passages,
      'model', v_job.extraction_model
    )
  );

  return jsonb_build_object('questions', v_inserted, 'passages', v_passages);
end;
$$;

grant execute on function
  validate_import_job(uuid),
  commit_import_job(uuid)
to authenticated;
