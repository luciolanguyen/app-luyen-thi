import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Gọi một hàm Postgres và ép kiểu kết quả.
 *
 * Dự án chưa sinh type từ database (`supabase gen types`), nên supabase-js
 * không biết chữ ký của các hàm tự viết. Helper này gom chỗ ép kiểu về một
 * nơi duy nhất thay vì rải `as unknown as T` khắp các trang.
 *
 * Khi đã có file type sinh tự động, chỉ cần đổi phần thân hàm này.
 */
export async function rpc<T>(
  supabase: SupabaseClient,
  fn: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  const { data, error } = await supabase.rpc(fn, args ?? {});
  if (error) {
    console.error(`RPC ${fn} lỗi:`, error.message);
    return null;
  }
  return data as T;
}

/** Như `rpc` nhưng luôn trả về mảng — tiện cho các hàm RETURNS TABLE. */
export async function rpcList<T>(
  supabase: SupabaseClient,
  fn: string,
  args?: Record<string, unknown>
): Promise<T[]> {
  return (await rpc<T[]>(supabase, fn, args)) ?? [];
}
