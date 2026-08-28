import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState } from "@/components/ui";
import { formatScore } from "@/lib/utils";

export const metadata: Metadata = { title: "Danh sách học sinh" };

interface StudentRow {
  id: string;
  full_name: string;
  school: string | null;
  class_name: string | null;
  xp: number;
  created_at: string;
}

export default async function StudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, school, class_name, xp, created_at")
    .eq("role", "student")
    .order("xp", { ascending: false })
    .limit(200)
    .returns<StudentRow[]>();

  // Gom thống kê bài làm trong một truy vấn rồi tổng hợp phía ứng dụng —
  // rẻ hơn nhiều so với gọi class_report() cho từng học sinh.
  const { data: attempts } = await supabase
    .from("attempts")
    .select("user_id, mode, status, score, correct_count, total_questions")
    .neq("status", "in_progress")
    .returns<
      {
        user_id: string;
        mode: string;
        status: string;
        score: number | null;
        correct_count: number;
        total_questions: number;
      }[]
    >();

  const stats = new Map<
    string,
    { exams: number; bestScore: number; answered: number; correct: number }
  >();
  for (const a of attempts ?? []) {
    const s = stats.get(a.user_id) ?? {
      exams: 0,
      bestScore: 0,
      answered: 0,
      correct: 0,
    };
    if (a.mode === "exam") {
      s.exams += 1;
      s.bestScore = Math.max(s.bestScore, Number(a.score ?? 0));
    }
    s.answered += a.total_questions;
    s.correct += a.correct_count;
    stats.set(a.user_id, s);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Link
        href="/quan-tri"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Quản trị
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Danh sách học sinh
        </h1>
        <p className="mt-1 text-muted-foreground">
          {students?.length ?? 0} học sinh, sắp xếp theo XP.
        </p>
      </header>

      {!students || students.length === 0 ? (
        <EmptyState
          icon={<Users className="size-8" aria-hidden="true" />}
          title="Chưa có học sinh nào"
          description="Học sinh sẽ xuất hiện ở đây sau khi tạo tài khoản."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left">
                <th className="px-4 py-3 font-semibold">Học sinh</th>
                <th className="px-4 py-3 font-semibold">Lớp / Trường</th>
                <th className="px-4 py-3 text-right font-semibold">Thi thử</th>
                <th className="px-4 py-3 text-right font-semibold">Điểm cao nhất</th>
                <th className="px-4 py-3 text-right font-semibold">Tỉ lệ đúng</th>
                <th className="px-4 py-3 text-right font-semibold">XP</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const st = stats.get(s.id);
                const accuracy = st?.answered
                  ? Math.round((st.correct / st.answered) * 100)
                  : null;
                const needsHelp =
                  accuracy !== null && accuracy < 50 && (st?.answered ?? 0) >= 20;

                return (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold">
                        {s.full_name || "(chưa đặt tên)"}
                      </span>
                      {needsHelp && (
                        <Badge tone="destructive" className="ml-2">
                          Cần hỗ trợ
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[s.class_name, s.school].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {st?.exams ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {st?.exams ? formatScore(st.bestScore) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {accuracy !== null ? `${accuracy}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {s.xp.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
