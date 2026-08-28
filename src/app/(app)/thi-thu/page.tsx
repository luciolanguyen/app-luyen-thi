import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  CalendarClock,
  FileText,
  History,
  Lock,
  Timer,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rpcList } from "@/lib/supabase/rpc";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
} from "@/components/ui";
import { startExam } from "@/lib/actions/attempt";
import { formatDateTime, formatScore } from "@/lib/utils";
import type { Attempt } from "@/lib/types";

export const metadata: Metadata = { title: "Thi thử" };

interface AvailableExam {
  id: string;
  title: string;
  kind: "official" | "province" | "teacher" | "generated";
  year: number | null;
  province: string | null;
  description: string | null;
  total_questions: number | null;
  duration_seconds: number | null;
  max_score: number | null;
  open_at: string | null;
  close_at: string | null;
  window_status: "chua_mo" | "dang_mo" | "da_dong";
  assigned_class: string | null;
  max_attempts: number | null;
  attempts_used: number;
  in_progress_attempt: string | null;
}

const KIND_LABELS: Record<AvailableExam["kind"], string> = {
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

  const [exams, { data: history }] = await Promise.all([
    rpcList<AvailableExam>(supabase, "available_exams"),
    supabase
      .from("attempts")
      .select("*")
      .eq("mode", "exam")
      .order("started_at", { ascending: false })
      .limit(10)
      .returns<Attempt[]>(),
  ]);

  const finished = (history ?? []).filter((a) => a.status !== "in_progress");
  const inProgress = exams.find((e) => e.in_progress_attempt);

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
        <Alert tone="destructive" title="Không vào được phòng thi" className="mb-6">
          {decodeURIComponent(sp.loi)}
        </Alert>
      )}

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
                  {inProgress.title} — đồng hồ vẫn đang chạy.
                </p>
              </div>
            </div>
            <Link
              href={`/phong-thi/${inProgress.in_progress_attempt}`}
              className="shrink-0 rounded-md bg-warning px-4 py-2.5 font-semibold text-white transition-colors duration-200 hover:opacity-90"
            >
              Quay lại làm bài
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold">Đề thi có sẵn</h2>

        {exams.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-8" aria-hidden="true" />}
            title="Chưa có đề thi nào dành cho bạn"
            description="Giáo viên chưa công bố đề, hoặc các đề hiện có chỉ giao cho lớp khác."
          />
        ) : (
          <ul className="space-y-4">
            {exams.map((exam) => (
              <li key={exam.id}>
                <ExamCard exam={exam} />
              </li>
            ))}
          </ul>
        )}
      </section>

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
                      {a.submitted_at ? formatDateTime(a.submitted_at) : "Chưa nộp"}
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

function ExamCard({ exam }: { exam: AvailableExam }) {
  const open = exam.window_status === "dang_mo";
  const notYet = exam.window_status === "chua_mo";
  const closed = exam.window_status === "da_dong";

  const outOfAttempts =
    exam.max_attempts !== null && exam.attempts_used >= exam.max_attempts;

  return (
    <Card className={closed ? "opacity-70" : undefined}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="primary">{KIND_LABELS[exam.kind]}</Badge>
              {exam.year && <Badge>{exam.year}</Badge>}
              {exam.province && <Badge>{exam.province}</Badge>}
              {exam.assigned_class && (
                <Badge tone="primary">
                  <Users className="size-3.5" aria-hidden="true" />
                  Giao cho {exam.assigned_class}
                </Badge>
              )}
              {notYet && <Badge tone="warning">Chưa mở</Badge>}
              {closed && <Badge tone="destructive">Đã đóng</Badge>}
            </div>

            <h3 className="font-bold text-balance">{exam.title}</h3>

            {exam.description && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {exam.description}
              </p>
            )}

            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {exam.total_questions && (
                <span className="flex items-center gap-1.5">
                  <FileText className="size-4" aria-hidden="true" />
                  {exam.total_questions} câu
                </span>
              )}
              {exam.duration_seconds && (
                <span className="flex items-center gap-1.5">
                  <Timer className="size-4" aria-hidden="true" />
                  {Math.round(exam.duration_seconds / 60)} phút
                </span>
              )}
              {exam.max_attempts !== null && (
                <span>
                  Đã dùng {exam.attempts_used}/{exam.max_attempts} lượt
                </span>
              )}
            </p>

            {/* Khung giờ nói rõ bằng chữ, không chỉ đổi màu nút */}
            {(exam.open_at || exam.close_at) && (
              <p
                className={
                  notYet
                    ? "mt-2.5 flex items-start gap-1.5 text-sm font-semibold text-warning"
                    : closed
                      ? "mt-2.5 flex items-start gap-1.5 text-sm font-semibold text-destructive-strong"
                      : "mt-2.5 flex items-start gap-1.5 text-sm text-muted-foreground"
                }
              >
                <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {notYet && exam.open_at && `Mở lúc ${formatDateTime(exam.open_at)}`}
                  {open && exam.close_at && `Đóng lúc ${formatDateTime(exam.close_at)}`}
                  {open && !exam.close_at && exam.open_at && `Đã mở từ ${formatDateTime(exam.open_at)}`}
                  {closed && exam.close_at && `Đã đóng lúc ${formatDateTime(exam.close_at)}`}
                </span>
              </p>
            )}
          </div>

          <div className="shrink-0">
            {exam.in_progress_attempt ? (
              <Link
                href={`/phong-thi/${exam.in_progress_attempt}`}
                className="inline-flex h-12 items-center rounded-md bg-warning px-6 font-semibold text-white"
              >
                Làm tiếp
              </Link>
            ) : open && !outOfAttempts ? (
              <form action={startExam}>
                <input type="hidden" name="examId" value={exam.id} />
                <Button type="submit" size="lg">
                  Vào phòng thi
                </Button>
              </form>
            ) : (
              <span className="inline-flex h-12 items-center gap-2 rounded-md border border-border-strong px-5 text-sm font-semibold text-muted-foreground">
                <Lock className="size-4" aria-hidden="true" />
                {outOfAttempts ? "Hết lượt" : notYet ? "Chưa mở" : "Đã đóng"}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
