"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  fullName: z.string().trim().min(2, "Họ tên cần ít nhất 2 ký tự."),
  school: z.string().trim().max(120).optional(),
  className: z.string().trim().max(40).optional(),
  anonymous: z.boolean(),
});

export type ProfileState = { error?: string; ok?: boolean };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    school: formData.get("school"),
    className: formData.get("className"),
    anonymous: formData.get("anonymous") === "on",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  // RLS chỉ cho phép sửa hồ sơ của chính mình; `role` không nằm trong danh sách
  // cập nhật nên học sinh không thể tự nâng quyền lên admin.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      school: parsed.data.school || null,
      class_name: parsed.data.className || null,
      leaderboard_anonymous: parsed.data.anonymous,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "Không lưu được. Bạn thử lại sau ít giây." };

  revalidatePath("/ho-so");
  revalidatePath("/", "layout");
  return { ok: true };
}
