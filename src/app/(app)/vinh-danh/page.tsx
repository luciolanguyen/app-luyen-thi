import Link from "next/link";
import type { Metadata } from "next";
import { Crown, Medal, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rpc, rpcList } from "@/lib/supabase/rpc";
import { Alert, Badge, Card, CardContent, EmptyState } from "@/components/ui";
import { formatScore } from "@/lib/utils";
import {
  LEADERBOARD_METRICS,
  type LeaderboardMetric,
  type LeaderboardPeriod,
  type LeaderboardRow,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vinh danh" };

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "all", label: "Toàn thời gian" },
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bang?: string; ky?: string; pham_vi?: string }>;
}) {
  const sp = await searchParams;
  const metric = (sp.bang ?? "exam_score") as LeaderboardMetric;
  const period = (sp.ky ?? "week") as LeaderboardPeriod;
  const scope = sp.pham_vi ?? "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("school, class_name, leaderboard_anonymous")
    .eq("id", user!.id)
    .single<{
      school: string | null;
      class_name: string | null;
      leaderboard_anonymous: boolean;
    }>();

  const [rows, myRank] = await Promise.all([
    rpcList<LeaderboardRow>(supabase, "leaderboard", {
      p_metric: metric,
      p_period: period,
      p_school: scope === "school" ? me?.school : null,
      p_class: scope === "class" ? me?.class_name : null,
      p_limit: 20,
    }),
    rpc<{ ranked: boolean; rank?: number; value?: number }>(
      supabase,
      "my_rank",
      { p_metric: metric, p_period: period }
    ),
  ]);

  const metricInfo =
    LEADERBOARD_METRICS.find((m) => m.value === metric) ??
    LEADERBOARD_METRICS[0];

  const buildHref = (patch: Record<string, string>) => {
    const q = new URLSearchParams({
      bang: metric,
      ky: period,
      pham_vi: scope,
      ...patch,
    });
    return `/vinh-danh?${q}`;
  };

  const inTop = rows.some((r) => r.is_me);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Trophy className="size-7 text-primary" aria-hidden="true" />
          Bảng vinh danh
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ghi nhận công khai những bạn đang nỗ lực nhất.
        </p>
      </header>

      {/* ------------------------------ Bộ lọc ---------------------------- */}
      <div className="mb-6 space-y-3">
        <FilterRow label="Xếp theo">
          {LEADERBOARD_METRICS.map((m) => (
            <FilterLink
              key={m.value}
              href={buildHref({ bang: m.value })}
              active={metric === m.value}
            >
              {m.label}
            </FilterLink>
          ))}
        </FilterRow>

        <FilterRow label="Thời gian">
          {PERIODS.map((p) => (
            <FilterLink
              key={p.value}
              href={buildHref({ ky: p.value })}
              active={period === p.value}
            >
              {p.label}
            </FilterLink>
          ))}
        </FilterRow>

        <FilterRow label="Phạm vi">
          <FilterLink href={buildHref({ pham_vi: "all" })} active={scope === "all"}>
            Toàn quốc
          </FilterLink>
          {me?.school && (
            <FilterLink
              href={buildHref({ pham_vi: "school" })}
              active={scope === "school"}
            >
              Trường tôi
            </FilterLink>
          )}
          {me?.class_name && (
            <FilterLink
              href={buildHref({ pham_vi: "class" })}
              active={scope === "class"}
            >
              Lớp tôi
            </FilterLink>
          )}
        </FilterRow>
      </div>

      {me?.leaderboard_anonymous && (
        <Alert tone="primary" className="mb-5">
          Bạn đang bật chế độ ẩn danh nên người khác chỉ thấy &quot;Ẩn danh&quot;
          thay vì tên thật.{" "}
          <Link href="/ho-so" className="font-semibold underline">
            Đổi trong hồ sơ
          </Link>
        </Alert>
      )}

      {/* ------------------------------ Bảng ------------------------------ */}
      {rows.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-8" aria-hidden="true" />}
          title="Chưa có ai trên bảng xếp hạng"
          description={`Chưa có học sinh nào có dữ liệu ${metricInfo.label.toLowerCase()} trong khoảng thời gian này. Bạn có thể là người đầu tiên.`}
        />
      ) : (
        <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {rows.map((r) => (
            <li
              key={r.user_id}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5",
                r.is_me && "bg-primary-soft"
              )}
            >
              <RankMark rank={r.rank} />

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {r.display_name}
                  {r.is_me && (
                    <Badge tone="primary" className="ml-2">
                      Bạn
                    </Badge>
                  )}
                </p>
                {(r.class_name || r.school) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {[r.class_name, r.school].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              <span className="shrink-0 text-right">
                <span className="font-mono text-lg font-extrabold tabular-nums">
                  {metric === "exam_score"
                    ? formatScore(r.value)
                    : Math.round(r.value).toLocaleString("vi-VN")}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {metricInfo.unit}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* Thứ hạng của mình khi nằm ngoài top 20 */}
      {myRank?.ranked && !inTop && (
        <Card className="mt-4 border-primary">
          <CardContent className="flex items-center gap-4 p-4">
            <span className="font-mono text-lg font-extrabold text-primary">
              #{myRank.rank}
            </span>
            <p className="flex-1 text-sm">
              Bạn đang ở hạng <strong>{myRank.rank}</strong> với{" "}
              <strong>
                {metric === "exam_score"
                  ? formatScore(myRank.value ?? 0)
                  : Math.round(myRank.value ?? 0).toLocaleString("vi-VN")}{" "}
                {metricInfo.unit}
              </strong>
              . Luyện thêm để tiến vào top 20.
            </p>
          </CardContent>
        </Card>
      )}

      {!myRank?.ranked && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Bạn chưa có dữ liệu ở bảng này trong khoảng thời gian đã chọn.
        </p>
      )}
    </div>
  );
}

function RankMark({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
        <Crown className="size-5" aria-hidden="true" />
        <span className="sr-only">Hạng 1</span>
      </span>
    );
  }
  if (rank <= 3) {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Medal className="size-5" aria-hidden="true" />
        <span className="sr-only">Hạng {rank}</span>
      </span>
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center font-mono text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        // whitespace-nowrap: nhãn bộ lọc không được vỡ dòng giữa chừng
        "rounded-md border px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-border-strong bg-card hover:bg-primary-soft"
      )}
    >
      {children}
    </Link>
  );
}
