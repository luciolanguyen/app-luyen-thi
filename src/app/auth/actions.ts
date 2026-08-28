"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; ok?: boolean };

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên."),
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự."),
  school: z.string().trim().optional(),
  className: z.string().trim().optional(),
});

/** Ánh xạ lỗi của Supabase sang thông báo tiếng Việt dễ hiểu cho học sinh. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email hoặc mật khẩu không đúng.";
  if (m.includes("email not confirmed"))
    return "Bạn cần xác nhận email trước khi đăng nhập. Kiểm tra hộp thư nhé.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Email này đã được đăng ký. Bạn thử đăng nhập xem sao.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Bạn thử lại quá nhiều lần. Đợi một lát rồi thử lại nhé.";
  if (m.includes("password"))
    return "Mật khẩu chưa đạt yêu cầu. Cần ít nhất 8 ký tự.";
  return "Có lỗi xảy ra. Bạn thử lại sau ít phút.";
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: translateAuthError(error.message) };

  const next = formData.get("tiep-tuc");
  revalidatePath("/", "layout");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/bang-dieu-khien");
}

export async function register(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    school: formData.get("school"),
    className: formData.get("className"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { fullName, email, password, school, className } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: translateAuthError(error.message) };

  // Trigger handle_new_user() đã tạo hồ sơ; bổ sung trường trường/lớp nếu có.
  if (data.user && (school || className)) {
    await supabase
      .from("profiles")
      .update({ school: school || null, class_name: className || null })
      .eq("id", data.user.id);
  }

  // Khi bật xác nhận email, session sẽ chưa có ngay sau signUp
  if (!data.session) {
    return {
      ok: true,
      error:
        "Tài khoản đã tạo. Vui lòng mở email để xác nhận rồi quay lại đăng nhập.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/bang-dieu-khien");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Đăng nhập bằng Google qua Supabase Auth.
 *
 * Chỉ xin thông tin hồ sơ cơ bản (email, tên, ảnh) — KHÔNG xin quyền Drive.
 * Quyền Drive là một luồng riêng, chỉ dành cho quản trị viên, xin đúng lúc cần
 * chọn file (xem DrivePicker). Gộp hai thứ vào một lần xin quyền sẽ khiến học
 * sinh phải chấp nhận quyền truy cập Drive mà các em không hề dùng tới.
 */
export async function loginWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const next = formData.get("tiep-tuc");
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const callback = new URL("/auth/callback", origin);
  if (typeof next === "string" && next.startsWith("/")) {
    callback.searchParams.set("tiep-tuc", next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    redirect("/dang-nhap?loi=google");
  }

  redirect(data.url);
}
