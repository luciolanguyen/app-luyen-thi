import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Coins,
  Flame,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rpc, rpcList } from "@/lib/supabase/rpc";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Progress,
  buttonClasses,
} from "@/components/ui";
import { accuracyBand, formatDuration, formatScore } from "@/lib/utils";
import type { Overview, StudyPlanItem, TypePerformance } from "@/lib/types";
import { EXAM_DEFAULTS } from "@/lib/exam-config";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [overview, byType, plan, { data: profile }] = await Promise.all([
    rpc<Overview>(supabase, "my_overview"),
    rpcList<TypePerformance>(supabase, "my_performance_by_type"),
    rpcList<StudyPlanItem>(supabase, "my_study_plan"),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .single<{ full_name: string }>(),
  ]);

  const firstName = (profile?.full_name || "").trim().split(/\s+/).pop() || "bạn";
  const isNew = !overview || overview.questions_done === 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Chào {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isNew
            ? "Bắt đầu bằng một phiên luyện ngắn để hệ thống biết bạn đang ở đâu."
            : "Đây là bức tranh năng lực hiện tại của bạn."}
        </p>
      </header>

      {isNew ? (
        <FirstRun />
      ) : (
        <>
          {/* --------------------------- Chỉ số chính --------------------- */}
          <section aria-labelledby="chi-so" className="mb-8">
            <h2 id="chi-so" className="sr-only">
              Chỉ số tổng quan
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Target className="size-5" aria-hidden="true" />}
                label="Điểm thi thử trung bình"
                value={formatScore(overview.avg_score)}
                suffix={`/ ${EXAM_DEFAULTS.maxScore}`}
                trend={overview.trend}
                hint={`${overview.exam_count} lần thi thử`}
              />
              <StatCard
                icon={<BookOpenCheck className="size-5" aria-hidden="true" />}
                label="Tỉ lệ đúng"
                value={`${overview.accuracy}%`}
                hint={`${overview.questions_done.toLocaleString("vi-VN")} câu đã làm`}
              />
              <StatCard
                icon={<Timer className="size-5" aria-hidden="true" />}
                label="Thời gian đã luyện"
                value={formatDuration(overview.total_minutes * 60)}
                hint={`${overview.practice_sessions} phiên luyện tập`}
              />
              <StatCard
                icon={<Flame className="size-5" aria-hidden="true" />}
                label="Chuỗi ngày học"
                value={`${overview.current_streak}`}
                suffix="ngày"
                hint={`Kỷ lục: ${overview.longest_streak} ngày`}
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* ---------------------- Năng lực theo dạng bài -------------- */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Năng lực theo dạng bài</CardTitle>
                  <CardDescription>
                    Tỉ lệ đúng ở từng dạng bài của đề thi
                  </CardDescription>
                </div>
                <Link
                  href="/bao-cao"
                  className="shrink-0 text-sm font-semibold text-primary hover:underline"
                >
                  Xem chi tiết
                </Link>
              </CardHeader>
              <CardContent>
                {byType.some((t) => t.answered > 0) ? (
                  <ul className="space-y-4">
                    {byType
                      .filter((t) => t.answered > 0)
                      .map((t) => {
                        const band = accuracyBand(t.accuracy);
                        return (
                          <li key={t.type_id}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-3">
                              <span className="text-sm font-semibold">
                                {t.name_vi}
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <Badge tone={band.tone}>{band.label}</Badge>
                                <span className="font-mono text-sm font-bold">
                                  {t.accuracy}%
                                </span>
                              </span>
                            </div>
                            <Progress
                              value={t.accuracy}
                              tone={band.tone}
                              label={`${t.name_vi}: ${t.accuracy}% đúng`}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t.correct}/{t.answered} câu đúng · trung bình{" "}
                              {t.avg_seconds}s mỗi câu
                            </p>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có dữ liệu. Hãy làm một phiên luyện tập để bắt đầu.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ----------------------- Gợi ý lộ trình -------------------- */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nên ôn gì tiếp theo</CardTitle>
                  <CardDescription>
                    Dựa trên các phần bạn đang sai nhiều nhất
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plan.length > 0 ? (
                    <ol className="space-y-3">
                      {plan.map((item, i) => (
                        <li
                          key={`${item.kind}-${item.ref_id}`}
                          className="rounded-md border border-border p-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-balance">
                                {item.label}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {item.reason}
                              </p>
                              <Link
                                href={
                                  item.kind === "type"
                                    ? `/luyen-tap/${item.ref_id}`
                                    : `/luyen-tap?chuyen-de=${item.ref_id}`
                                }
                                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                              >
                                Luyện ngay
                                <ArrowRight className="size-3.5" aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Cần thêm dữ liệu để đưa ra gợi ý. Hãy làm ít nhất 5 câu ở
                      một dạng bài bất kỳ.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Điểm thưởng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-md bg-warning-soft text-warning">
                      <Coins className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-2xl font-extrabold">
                        {overview.points.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {overview.badge_count} huy hiệu · {overview.xp.toLocaleString("vi-VN")} XP
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/diem-thuong"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    Xem ví điểm
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          <section className="mt-8 flex flex-wrap gap-3">
            <Link href="/luyen-tap" className={buttonClasses("primary", "lg")}>
              Luyện tập ngay
            </Link>
            <Link href="/thi-thu" className={buttonClasses("outline", "lg")}>
              Vào phòng thi thử
            </Link>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  hint,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary">
            {icon}
          </span>
          {trend !== undefined && trend !== 0 && (
            <span
              className={
                trend > 0
                  ? "flex items-center gap-0.5 text-xs font-bold text-success"
                  : "flex items-center gap-0.5 text-xs font-bold text-destructive"
              }
            >
              {trend > 0 ? (
                <TrendingUp className="size-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-3.5" aria-hidden="true" />
              )}
              {trend > 0 ? "+" : ""}
              {formatScore(trend)}
              <span className="sr-only">
                so với lần thi thử trước
              </span>
            </span>
          )}
        </div>
        <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold tracking-tight">
          {value}
          {suffix && (
            <span className="ml-1 text-base font-semibold text-muted-foreground">
              {suffix}
            </span>
          )}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function FirstRun() {
  return (
    <div className="space-y-6">
      <EmptyState
        icon={<BookOpenCheck className="size-8" aria-hidden="true" />}
        title="Chưa có dữ liệu luyện tập"
        description="Làm một phiên 10 câu ở bất kỳ dạng bài nào — hệ thống sẽ dựng ngay báo cáo năng lực và gợi ý lộ trình riêng cho bạn."
        action={
          <Link href="/luyen-tap" className={buttonClasses("primary", "lg")}>
            Chọn dạng bài để luyện
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Hoặc thử sức với đề thi thử</CardTitle>
          <CardDescription>
            {EXAM_DEFAULTS.totalQuestions} câu trong{" "}
            {EXAM_DEFAULTS.durationMinutes} phút, chấm điểm tự động theo thang{" "}
            {EXAM_DEFAULTS.maxScore}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/thi-thu"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Xem danh sách đề
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
