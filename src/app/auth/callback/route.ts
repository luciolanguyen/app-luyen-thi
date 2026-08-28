import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Đích quay về sau khi người dùng đồng ý ở màn hình Google.
 * Đổi mã uỷ quyền lấy session rồi đưa về trang họ đang muốn tới.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("tiep-tuc");
  const oauthError = searchParams.get("error");

  // Người dùng bấm "Huỷ" ở màn hình Google
  if (oauthError) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=google-tu-choi`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=google`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/dang-nhap?loi=google`);
  }

  // Trigger handle_new_user() đã tạo hồ sơ. Nếu tên còn trống (đăng ký bằng
  // email trước đó rồi mới nối Google) thì bổ sung tên và ảnh từ Google.
  const meta = data.user.user_metadata ?? {};
  const fullName =
    (meta.full_name as string) || (meta.name as string) || null;
  const avatar =
    (meta.avatar_url as string) || (meta.picture as string) || null;

  if (fullName || avatar) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", data.user.id)
      .single<{ full_name: string; avatar_url: string | null }>();

    const patch: Record<string, string> = {};
    if (fullName && !profile?.full_name?.trim()) patch.full_name = fullName;
    if (avatar && !profile?.avatar_url) patch.avatar_url = avatar;

    if (Object.keys(patch).length > 0) {
      await supabase.from("profiles").update(patch).eq("id", data.user.id);
    }
  }

  const target = next && next.startsWith("/") ? next : "/bang-dieu-khien";
  return NextResponse.redirect(`${origin}${target}`);
}
