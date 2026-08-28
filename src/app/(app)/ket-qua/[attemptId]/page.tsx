import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Clock, Repeat, Target, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rpcList } from "@/lib/supabase/rpc";
import {
  Badge,
  Card,
  CardContent,
  Progress,
  buttonClasses,
} from "@/components/ui";
import {
  ExplanationBlock,
  OptionList,
  PassageView,
} from "@/components/question-view";
import { formatDuration, formatScore, scoreComment } from "@/lib/utils";
import { EXAM_DEFAULTS } from "@/lib/exam-config";
import type { Attempt, AttemptQuestion } from "@/lib/types";

export const metadata: Metadata = { title: "Kết quả" };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const [{ data: attempt }, questions] = await Promise.all([
    supabase.from("attempts").select("*").eq("id", attemptId).single<Attempt>(),
    rpcList<AttemptQuestion>(supabase, "get_attempt_questions", {
      p_attempt_id: attemptId,
    }),
  ]);

  if (!attempt) notFound();
  if (attempt.status === "in_progress") {
    redirect(attempt.mode === "exam" ? `/phong-thi/${attemptId}` : `/lam-bai/${attemptId}`);
  }

  const isExam = attempt.mode === "exam";
  const accuracy = Math.round(
    (attempt.correct_count / Math.max(1, attempt.total_questions)) * 100
  );
  const wrong = questions.filter((q) => !q.is_correct);
  const avgSeconds =
    attempt.duration_seconds && attempt.total_questions
      ? Math.round(attempt.duration_seconds / attempt.total_questions)
      : 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      {/* ============================ Tóm tắt kết quả ===================== */}
      <Card className="mb-6 overflow-hidden">
        <div
          className={
            accuracy >= 80
              ? "bg-success-soft px-6 py-7 text-center"
              : accuracy >= 50
                ? "bg-warning-soft px-6 py-7 text-center"
                : "bg-destructive-soft px-6 py-7 text-center"
          }
        >
          {attempt.status === "expired" && (
            <Badge tone="warning" className="mb-3">
              Hết giờ — bài được nộp tự động
            </Badge>
          )}

          {isExam ? (
            <>
              <p className="text-sm font-semibold text-muted-foreground">
                Điểm bài thi thử
              </p>
              <p className="mt-1 font-mono text-6xl font-extrabold tracking-tight">
                {formatScore(attempt.score)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                trên thang {EXAM_DEFAULTS.maxScore} điểm
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-muted-foreground">
                Kết quả phiên luyện
              </p>
              <p className="mt-1 font-mono text-6xl font-extrabold tracking-tight">
                {accuracy}%
              </p>
            </>
          )}

          <p className="mt-3 font-semibold text-balance">
            {isExam
              ? scoreComment(Number(attempt.score ?? 0))
              : `${attempt.correct_count} trên ${attempt.total_questions} câu đúng`}
          </p>
        </div>

        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <Stat
              icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
              label="Câu đúng"
              value={`${attempt.correct_count}/${attempt.total_questions}`}
            />
            <Stat
              icon={<Clock className="size-4" aria-hidden="true" />}
              label="Thời gian"
              value={formatDuration(attempt.duration_seconds ?? 0)}
            />
            <Stat
              icon={<Target className="size-4" aria-hidden="true" />}
              label="TB mỗi câu"
              value={`${avgSeconds}s`}
            />
          </div>

          <div className="mt-5">
            <Progress
              value={accuracy}
              tone={accuracy >= 80 ? "success" : accuracy >= 50 ? "warning" : "destructive"}
              label={`Tỉ lệ đúng ${accuracy}%`}
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================== Hành động ========================= */}
      <div className="mb-8 flex flex-wrap gap-3">
        {wrong.length > 0 && attempt.type_id && (
          <Link
            href={`/luyen-tap/${attempt.type_id}`}
            className={buttonClasses("primary", "md")}
          >
            <Repeat className="size-4" aria-hidden="true" />
            Luyện lại dạng này
          </Link>
        )}
        <Link href="/bao-cao" className={buttonClasses("outline", "md")}>
          Xem báo cáo năng lực
        </Link>
        <Link
          href={isExam ? "/thi-thu" : "/luyen-tap"}
          className={buttonClasses("ghost", "md")}
        >
          {isExam ? "Danh sách đề thi" : "Danh mục luyện tập"}
        </Link>
      </div>

      {/* ============================ Chi tiết từng câu =================== */}
      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">Chi tiết từng câu</h2>
          {wrong.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {wrong.length} câu cần xem lại
            </span>
          )}
        </div>

        <ol className="space-y-5">
          {questions.map((q) => (
            <li key={q.question_no}>
              <Card
                className={
                  q.is_correct
                    ? "border-l-4 border-l-success"
                    : "border-l-4 border-l-destructive"
                }
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-muted-foreground">
                      Câu {q.question_no}
                    </span>
                    {q.is_correct ? (
                      <Badge tone="success">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Đúng
                      </Badge>
                    ) : (
                      <Badge tone="destructive">
                        <XCircle className="size-3.5" aria-hidden="true" />
                        {q.selected_key ? "Sai" : "Bỏ trống"}
                      </Badge>
                    )}
                  </div>

                  <PassageView q={q} />

                  <p className="mb-4 leading-relaxed font-semibold">{q.stem}</p>

                  <OptionList
                    q={q}
                    name={`kq-${q.question_no}`}
                    selected={q.selected_key}
                    revealed
                    disabled
                  />

                  <ExplanationBlock q={q} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="flex justify-center text-muted-foreground">{icon}</span>
      <p className="mt-1.5 font-mono text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
