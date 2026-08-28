import Link from "next/link";
import type { Metadata } from "next";
import { BarChart3, TrendingUp } from "lucide-react";
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
  buttonClasses,
} from "@/components/ui";
import { ProgressChart } from "@/components/charts";
import { accuracyBand, formatDuration, formatScore } from "@/lib/utils";
import type {
  Overview,
  ProgressPoint,
  StudyPlanItem,
  TopicPerformance,
  TypePerformance,
} from "@/lib/types";

export const metadata: Metadata = { title: "Báo cáo kết quả" };

export default async function ReportPage() {
  const supabase = await createClient();

  const [overview, byType, byTopic, progress, plan] = await Promise.all([
    rpc<Overview>(supabase, "my_overview"),
    rpcList<TypePerformance>(supabase, "my_performance_by_type"),
    rpcList<TopicPerformance>(supabase, "my_performance_by_topic"),
    rpcList<ProgressPoint>(supabase, "my_progress_over_time", { p_limit: 20 }),
    rpcList<StudyPlanItem>(supabase, "my_study_plan"),
  ]);

  const active = byType.filter((t) => t.answered > 0);

  if (!overview || overview.questions_done === 0) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
          Báo cáo kết quả
        </h1>
        <EmptyState
          icon={<BarChart3 className="size-8" aria-hidden="true" />}
          title="Chưa có dữ liệu để phân tích"
          description="Báo cáo được dựng từ các câu bạn đã làm. Hãy hoàn thành một phiên luyện tập trước."
          action={
            <Link href="/luyen-tap" className={buttonClasses("primary", "lg")}>
              Bắt đầu luyện tập
            </Link>
          }
        />
      </div>
    );
  }

  const grammarTopics = byTopic.filter((t) => t.kind === "grammar");
  const vocabTopics = byTopic.filter((t) => t.kind === "vocab");

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Báo cáo kết quả
        </h1>
        <p className="mt-1 text-muted-foreground">
          {overview.questions_done.toLocaleString("vi-VN")} câu đã làm ·{" "}
          {formatDuration(overview.total_minutes * 60)} luyện tập ·{" "}
          {overview.exam_count} lần thi thử
        </p>
      </header>

      {/* ==================== Năng lực theo dạng bài ====================== */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tỉ lệ đúng theo dạng bài</CardTitle>
          <CardDescription>
            Độ dài cột là tỉ lệ đúng. Đường đứt là mốc 80% — ngưỡng coi như đã
            vững một dạng bài.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccuracyBars rows={active} />
        </CardContent>
      </Card>

      {/* ======================== Tiến bộ theo thời gian ================== */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" aria-hidden="true" />
            Tiến bộ qua các lần thi thử
          </CardTitle>
          <CardDescription>
            Điểm từng lần thi thử theo thang 10
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progress.length >= 2 ? (
            <ProgressChart data={progress} />
          ) : progress.length === 1 ? (
            <p className="text-sm text-muted-foreground">
              Bạn mới thi thử một lần và đạt{" "}
              <strong className="text-foreground">
                {formatScore(progress[0].score)}
              </strong>
              . Cần ít nhất hai lần để vẽ được đường tiến bộ.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa có lần thi thử nào.{" "}
              <Link href="/thi-thu" className="font-semibold text-primary underline">
                Thử một đề
              </Link>{" "}
              để bắt đầu theo dõi tiến bộ.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ============================ Chuyên đề ========================== */}
      {(grammarTopics.length > 0 || vocabTopics.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Chi tiết theo chuyên đề</CardTitle>
            <CardDescription>
              Sắp xếp từ yếu nhất lên — phần đầu danh sách là nơi cần ôn trước.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {grammarTopics.length > 0 && (
              <TopicGroup title="Ngữ pháp" rows={grammarTopics} />
            )}
            {vocabTopics.length > 0 && (
              <TopicGroup title="Từ vựng" rows={vocabTopics} />
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================== Lộ trình đề xuất ====================== */}
      {plan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lộ trình ôn tập tuần tới</CardTitle>
            <CardDescription>
              Đề xuất dựa trên các phần có tỉ lệ sai cao nhất trong dữ liệu của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {plan.map((item, i) => (
                <li
                  key={`${item.kind}-${item.ref_id}`}
                  className="flex items-start gap-3 rounded-md border border-border p-4"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{item.label}</p>
                      <Badge tone={accuracyBand(item.accuracy).tone}>
                        {item.accuracy}% đúng
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.reason} ({item.answered} câu đã làm)
                    </p>
                    <Link
                      href={
                        item.kind === "type"
                          ? `/luyen-tap/${item.ref_id}`
                          : `/luyen-tap?chuyen-de=${item.ref_id}`
                      }
                      className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
                    >
                      Luyện phần này →
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Biểu đồ cột ngang dựng bằng HTML thuần.
 * Một sắc màu duy nhất: độ dài cột đã mã hoá độ lớn, màu không cần lặp lại
 * thông tin đó. Mức tốt/yếu do nhãn chữ đảm nhiệm nên người mù màu vẫn đọc được.
 */
function AccuracyBars({ rows }: { rows: TypePerformance[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có dạng bài nào đủ dữ liệu.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((t) => {
        const band = accuracyBand(t.accuracy);
        return (
          <li key={t.type_id}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-semibold">{t.name_vi}</span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge tone={band.tone}>{band.label}</Badge>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {t.accuracy}%
                </span>
              </span>
            </div>

            {/* Rãnh cột + mốc tham chiếu 80% */}
            <div className="relative h-7 w-full overflow-hidden rounded-md bg-muted">
              <div
                className="h-full rounded-md bg-primary transition-[width] duration-500"
                style={{ width: `${t.accuracy}%` }}
                role="img"
                aria-label={`${t.name_vi}: ${t.accuracy} phần trăm đúng, ${band.label}`}
              />
              <div
                className="absolute inset-y-0 border-l-2 border-dashed border-muted-foreground"
                style={{ left: "80%" }}
                aria-hidden="true"
              />
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {t.correct}/{t.answered} câu đúng · trung bình {t.avg_seconds}s mỗi câu
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function TopicGroup({
  title,
  rows,
}: {
  title: string;
  rows: TopicPerformance[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="divide-y divide-border rounded-md border border-border">
        {rows.map((t) => {
          const band = accuracyBand(t.accuracy);
          return (
            <li
              key={t.topic_id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.name_vi}</p>
                <p className="text-xs text-muted-foreground">
                  {t.correct}/{t.answered} câu
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-2">
                <Badge tone={band.tone}>{band.label}</Badge>
                <span className="w-12 text-right font-mono text-sm font-bold tabular-nums">
                  {t.accuracy}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
