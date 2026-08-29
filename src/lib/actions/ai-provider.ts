"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret, isEncryptionConfigured, keyHint } from "@/lib/ai/crypto";
import {
  listModels,
  presetOf,
  type ModelInfo,
  type ProviderKind,
} from "@/lib/ai/providers";

export type AiState = { error?: string; ok?: string };

const KINDS = ["openai", "openrouter", "deepseek", "anthropic", "custom"] as const;

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  return data?.role === "admin" ? user.id : null;
}

/**
 * Lấy danh sách model của nhà cung cấp.
 *
 * Vừa liệt kê model để admin chọn, vừa là phép thử khoá — sai khoá thì biết
 * ngay ở bước này chứ không phải đợi tới lúc nhập file mới hỏng.
 *
 * Khoá chỉ đi qua bộ nhớ của tiến trình máy chủ, không ghi ra đâu cả.
 */
export async function fetchProviderModels(input: {
  kind: string;
  baseUrl: string;
  apiKey: string;
}): Promise<{ models: ModelInfo[]; error?: string }> {
  if (!(await requireAdmin())) {
    return { models: [], error: "Chỉ quản trị viên mới cấu hình được." };
  }

  const kind = KINDS.includes(input.kind as ProviderKind)
    ? (input.kind as ProviderKind)
    : "custom";

  if (!input.apiKey.trim()) {
    return { models: [], error: "Chưa nhập API key." };
  }

  return listModels(kind, input.baseUrl.trim(), input.apiKey.trim());
}

const saveSchema = z.object({
  kind: z.enum(KINDS),
  label: z.string().trim().min(1).max(60),
  baseUrl: z.string().trim().max(300),
  apiKey: z.string().trim().min(8, "API key quá ngắn."),
  model: z.string().trim().min(1, "Chưa chọn model."),
});

export async function saveAiProvider(
  _prev: AiState,
  formData: FormData
): Promise<AiState> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Chỉ quản trị viên mới cấu hình được." };

  if (!isEncryptionConfigured()) {
    return {
      error:
        "Thiếu AI_ENCRYPTION_KEY trong .env.local nên chưa lưu được API key. Xem hướng dẫn ở đầu trang.",
    };
  }

  const parsed = saveSchema.safeParse({
    kind: formData.get("kind"),
    label: formData.get("label"),
    baseUrl: formData.get("baseUrl") ?? "",
    apiKey: formData.get("apiKey"),
    model: formData.get("model"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { kind, label, apiKey, model } = parsed.data;
  const preset = presetOf(kind);
  const baseUrl = parsed.data.baseUrl || preset.baseUrl;

  if (!baseUrl) {
    return { error: "Chưa nhập địa chỉ endpoint cho nhà cung cấp tuỳ chỉnh." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ai_providers")
    .select("id")
    .limit(1);

  const { data: inserted, error } = await supabase
    .from("ai_providers")
    .insert({
      kind,
      label,
      base_url: baseUrl,
      api_key_cipher: encryptSecret(apiKey),
      api_key_hint: keyHint(apiKey),
      model,
      created_by: adminId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    return { error: `Không lưu được: ${error?.message ?? "lỗi không rõ"}` };
  }

  // Nhà cung cấp đầu tiên thì bật luôn, khỏi bắt admin bấm thêm một bước
  if (!existing || existing.length === 0) {
    await supabase.rpc("set_active_ai_provider", { p_id: inserted.id });
  }

  revalidatePath("/quan-tri/cau-hinh-ai");
  revalidatePath("/quan-tri/nhap-cau-hoi");
  return { ok: `Đã lưu ${label} với model ${model}.` };
}

export async function activateAiProvider(formData: FormData) {
  const id = String(formData.get("providerId"));
  const supabase = await createClient();
  await supabase.rpc("set_active_ai_provider", { p_id: id });
  revalidatePath("/quan-tri/cau-hinh-ai");
  revalidatePath("/quan-tri/nhap-cau-hoi");
}

export async function deleteAiProvider(formData: FormData) {
  const id = String(formData.get("providerId"));
  const supabase = await createClient();
  await supabase.from("ai_providers").delete().eq("id", id);
  revalidatePath("/quan-tri/cau-hinh-ai");
  revalidatePath("/quan-tri/nhap-cau-hoi");
}

/** Đổi model của một nhà cung cấp đã lưu, không phải nhập lại khoá. */
export async function updateProviderModel(formData: FormData) {
  const id = String(formData.get("providerId"));
  const model = String(formData.get("model") ?? "").trim();
  if (!model) return;

  const supabase = await createClient();
  await supabase
    .from("ai_providers")
    .update({ model, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/quan-tri/cau-hinh-ai");
}

/**
 * Lấy model của một nhà cung cấp ĐÃ LƯU, dùng khoá đã mã hoá trong database.
 * Nhờ vậy admin đổi model mà không phải nhập lại khoá.
 */
export async function refetchModelsForSaved(
  providerId: string
): Promise<{ models: ModelInfo[]; error?: string }> {
  if (!(await requireAdmin())) {
    return { models: [], error: "Chỉ quản trị viên mới cấu hình được." };
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_ai_provider_secret", {
    p_id: providerId,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return { models: [], error: "Không tìm thấy nhà cung cấp." };

  const { decryptSecret } = await import("@/lib/ai/crypto");
  let key: string;
  try {
    key = decryptSecret(row.api_key_cipher);
  } catch {
    return {
      models: [],
      error:
        "Không giải mã được khoá đã lưu. AI_ENCRYPTION_KEY có thể đã bị đổi — hãy xoá và nhập lại nhà cung cấp này.",
    };
  }

  return listModels(row.kind as ProviderKind, row.base_url, key);
}
