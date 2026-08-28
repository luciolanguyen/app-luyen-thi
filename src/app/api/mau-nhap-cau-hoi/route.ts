import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTemplate } from "@/lib/import/parse-table";

/** Tải file Excel mẫu để giáo viên điền câu hỏi. Chỉ giáo viên/quản trị. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile || !["teacher", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const buffer = await buildTemplate();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="mau-nhap-cau-hoi.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
