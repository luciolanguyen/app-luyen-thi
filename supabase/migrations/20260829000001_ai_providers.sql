-- ============================================================================
-- NHÀ CUNG CẤP AI DÙNG CHO VIỆC ĐỌC FILE WORD/GOOGLE DOCS
--
-- Admin tự nhập API key của ChatGPT / OpenRouter / DeepSeek / Claude, hoặc một
-- endpoint tương thích OpenAI bất kỳ, rồi chọn model từ danh sách lấy về.
--
-- BẢO MẬT:
--   1. api_key_cipher chứa bản mã AES-256-GCM. Việc mã hoá/giải mã diễn ra ở
--      Node, khoá nằm trong biến môi trường AI_ENCRYPTION_KEY và KHÔNG bao giờ
--      vào database. Lộ bản sao database vẫn không đọc được API key.
--   2. Quyền SELECT trên riêng cột api_key_cipher bị THU HỒI ở tầng Postgres.
--      Kể cả admin, kể cả khi có RLS cho phép, cũng không select được cột này
--      qua PostgREST. Chỉ hàm security definer bên dưới đọc được.
-- ============================================================================

create type ai_provider_kind as enum (
  'openai', 'openrouter', 'deepseek', 'anthropic', 'custom'
);

create table ai_providers (
  id uuid primary key default gen_random_uuid(),
  kind ai_provider_kind not null,
  label text not null,
  base_url text not null,
  api_key_cipher text not null,
  -- 4 ký tự cuối, đủ để admin nhận ra khoá nào mà không dùng lại được
  api_key_hint text not null,
  model text,
  is_active boolean not null default false,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chỉ đúng một nhà cung cấp được bật tại một thời điểm
create unique index ai_providers_single_active
  on ai_providers (is_active) where is_active;

alter table ai_providers enable row level security;

create policy ai_providers_admin on ai_providers
  for all using (is_admin()) with check (is_admin());

-- Thu hồi quyền mặc định rồi cấp lại TỪNG CỘT, cố ý bỏ api_key_cipher.
revoke all on ai_providers from anon, authenticated;
grant select (id, kind, label, base_url, api_key_hint, model, is_active,
              created_by, created_at, updated_at)
  on ai_providers to authenticated;
grant insert, update, delete on ai_providers to authenticated;

comment on column ai_providers.api_key_cipher is
  'Bản mã AES-256-GCM. Không cấp quyền SELECT cột này cho vai trò nào — chỉ đọc qua get_ai_provider_secret().';

-- ---------------------------------------------------------------------------
-- Bật một nhà cung cấp (tự tắt các cái còn lại trong cùng transaction,
-- nếu không unique index sẽ chặn giữa chừng)
-- ---------------------------------------------------------------------------
create or replace function set_active_ai_provider(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'Chỉ quản trị viên mới đổi được nhà cung cấp AI';
  end if;

  update ai_providers set is_active = false, updated_at = now()
   where is_active and id <> p_id;

  update ai_providers set is_active = true, updated_at = now()
   where id = p_id;

  if not found then
    raise exception 'Không tìm thấy nhà cung cấp';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Đọc bản mã của nhà cung cấp đang bật.
-- Chỉ dùng từ server action; giá trị trả về là bản MÃ, Node mới giải mã.
-- ---------------------------------------------------------------------------
create or replace function get_ai_provider_secret(p_id uuid default null)
returns table (
  id uuid,
  kind ai_provider_kind,
  base_url text,
  model text,
  api_key_cipher text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff() then
    raise exception 'Không có quyền';
  end if;

  return query
  select p.id, p.kind, p.base_url, p.model, p.api_key_cipher
    from ai_providers p
   where (p_id is not null and p.id = p_id)
      or (p_id is null and p.is_active)
   limit 1;
end;
$$;

grant execute on function
  set_active_ai_provider(uuid),
  get_ai_provider_secret(uuid)
to authenticated;
