import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Grid3x3,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui";

export const metadata: Metadata = { title: "Quản trị" };

export default async function AdminHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single<{ role: string }>();

  // Middleware đã chặn ở biên; kiểm tra lại ở đây phòng khi middleware bị bỏ qua
  if (!profile || !["teacher", "admin"].includes(profile.role)) {
    redirect("/bang-dieu-khien");
  }

  const [{ count: questionCount }, { count: studentCount }, { count: examCount }] =
    await Promise.all([
      supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabase.from("exams").select("*", { count: "exact", head: true }),
    ]);

  const sections = [
    {
      href: "/quan-tri/ngan-hang-cau-hoi",
      icon: FileText,
      title: "Ngân hàng câu hỏi",
      description: "Xem, lọc và kiểm tra chất lượng câu hỏi theo dạng bài, chuyên đề và độ khó.",
      stat: `${questionCount ?? 0} câu đang dùng`,
    },
    {
      href: "/quan-tri/hoc-sinh",
      icon: Users,
      title: "Danh sách học sinh",
      description: "Theo dõi tiến độ, điểm số và mức độ hoạt động của từng học sinh.",
      stat: `${studentCount ?? 0} học sinh`,
    },
    {
      href: "/quan-tri/nhap-cau-hoi",
      icon: Upload,
      title: "Nhập câu hỏi từ file",
      description:
        "Đọc Excel/CSV theo mẫu, hoặc để AI tách câu hỏi từ file Word và Google Docs. Có bước rà soát trước khi lưu.",
      stat: "Excel · CSV · Word · Drive",
    },
    {
      href: "/quan-tri/cau-hinh-ai",
      icon: Sparkles,
      title: "Cấu hình AI",
      description:
        "Chọn ChatGPT, OpenRouter, DeepSeek, Claude hoặc endpoint tuỳ chỉnh để đọc file Word thành câu hỏi.",
      stat: "Nhập khoá, lấy model, chọn model",
    },
    {
      href: "/quan-tri/lich-thi",
      icon: CalendarClock,
      title: "Lịch thi & giao bài",
      description:
        "Đặt khung giờ mở–đóng cho từng đề, giao đề cho lớp và giới hạn số lượt làm.",
      stat: "Khung giờ do máy chủ chặn",
    },
    {
      href: "/quan-tri/ma-tran-de",
      icon: Grid3x3,
      title: "Ma trận đề thi",
      description:
        "Chỉnh số câu mỗi dạng, thời gian làm bài và thang điểm khi Bộ GD&ĐT điều chỉnh cấu trúc đề.",
      stat: `${examCount ?? 0} đề thi`,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Quản trị
        </h1>
        <p className="mt-1 text-muted-foreground">
          Vận hành nội dung và theo dõi học sinh.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, icon: Icon, title, description, stat }) => (
          <li key={href}>
            <Link href={href} className="group block h-full">
              <Card className="h-full transition-colors duration-200 group-hover:border-primary">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <ArrowRight
                      className="mt-1 size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="mt-3.5 font-bold">{title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                  <p className="mt-3 font-mono text-sm font-bold text-primary">
                    {stat}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
