import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, FileText, History, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { startExam } from "@/lib/actions/attempt";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
} from "@/components/ui";
import { formatDateTime, formatScore } from "@/lib/utils";
import type { Attempt } from "@/lib/types";

export const metadata: Metadata = { title: "Thi thử" };

interface ExamRow {
  id: string;
  title: string;
  kind: "official" | "province" | "teacher" | "generated";
  year: number | null;
  province: string | null;
  description: string | null;
  exam_matrices: {
    total_questions: number;
    duration_seconds: number;
    max_score: number;
  } | null;
}

const KIND_LABELS: Record<ExamRow["kind"], string> = {
  official: "Đề minh hoạ",
  province: "Đề Sở/Trường",
  teacher: "Giáo viên soạn",
  generated: "Sinh theo ma trận",
};

export default async function ExamListPage({
  searchParams,
}: {
  searchParams: Promise<{ loi?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: exams }, { data: history }] = await Promise.all([
    supabase
      .from("exams")
      .select(
        "id, title, kind, year, province, description, exam_matrices(total_questions, duration_seconds, max_score)"
      )
      .eq("is_published", true)
      .order("year", { ascending: false })
      .returns<ExamRow[]>(),
    supabase
      .from("attempts")
      .select("*")
      .eq("mode", "exam")
      .order("started_at", { ascending: false })
      .limit(10)
      .returns<Attempt[]>(),
  ]);

  const inProgress = (history ?? []).find((a) => a.status === "in_progress");
  const finished = (history ?? []).filter((a) => a.status !== "in_progress");

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Bài thi thử mô phỏng
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Làm bài trong phòng thi ảo với đồng hồ đếm ngược và chấm điểm tự động,
          giống nhịp độ thi thật.
        </p>
      </header>

      {sp.loi && (
        <Alert tone="destructive" title="Không bắt đầu được bài thi" className="mb-6">
          Đề có thể chưa được gán câu hỏi. Bạn thử đề khác hoặc báo cho giáo viên.
        </Alert>
      )}

      {/* Bài đang làm dở luôn hiện đầu tiên — đây là việc cần xử lý ngay */}
      {inProgress && (
        <Card className="mb-6 border-warning">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 size-5 shrink-0 text-warning"
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">Bạn có một bài thi đang làm dở</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Bắt đầu lúc {formatDateTime(inProgress.started_at)}. Đồng hồ
                  vẫn chạy kể từ thời điểm đó.
                </p>
              </div>
            </div>
            <Link
              href={`/phong-thi/${inProgress.id}`}
              className="shrink-0 rounded-md bg-warning px-4 py-2.5 font-semibold text-white transition-colors duration-200 hover:opacity-90"
            >
              Quay lại làm bài
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------ Danh sách đề ----------------------- */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold">Đề thi có sẵn</h2>

        {!exams || exams.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-8" aria-hidden="true" />}
            title="Chưa có đề thi nào được công bố"
            description="Giáo viên hoặc quản trị viên cần tạo và công bố đề trong trang Quản trị."
          />
        ) : (
          <ul className="space-y-4">
            {exams.map((exam) => {
              const m = exam.exam_matrices;
              return (
                <li key={exam.id}>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge tone="primary">{KIND_LABELS[exam.kind]}</Badge>
                            {exam.year && (
                              <Badge>{exam.year}</Badge>
                            )}
                            {exam.province && <Badge>{exam.province}</Badge>}
                          </div>

                          <h3 className="font-bold text-balance">{exam.title}</h3>

                          {exam.description && (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {exam.description}
                            </p>
                          )}

                          {m && (
                            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <FileText className="size-4" aria-hidden="true" />
                                {m.total_questions} câu
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Timer className="size-4" aria-hidden="true" />
                                {Math.round(m.duration_seconds / 60)} phút
                              </span>
                              <span>Thang điểm {m.max_score}</span>
                            </p>
                          )}
                        </div>

                        <form action={startExam} className="shrink-0">
                          <input type="hidden" name="examId" value={exam.id} />
                          <Button type="submit" size="lg">
                            Vào phòng thi
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ------------------------------ Lịch sử ---------------------------- */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <History className="size-5" aria-hidden="true" />
          Lịch sử thi thử
        </h2>

        {finished.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bạn chưa hoàn thành bài thi thử nào.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {finished.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/ket-qua/${a.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors duration-200 hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {a.submitted_at
                        ? formatDateTime(a.submitted_at)
                        : "Chưa nộp"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {a.correct_count}/{a.total_questions} câu đúng
                      {a.status === "expired" && " · hết giờ tự nộp"}
                    </p>
                  </div>
                  <span
                    className={
                      (a.score ?? 0) >= 8
                        ? "shrink-0 font-mono text-xl font-extrabold text-success"
                        : (a.score ?? 0) >= 5
                          ? "shrink-0 font-mono text-xl font-extrabold text-warning"
                          : "shrink-0 font-mono text-xl font-extrabold text-destructive"
                    }
                  >
                    {formatScore(a.score)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
