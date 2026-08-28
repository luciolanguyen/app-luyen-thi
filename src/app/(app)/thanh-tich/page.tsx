import type { Metadata } from "next";
import {
  Award,
  BookOpen,
  Crown,
  FileText,
  Flame,
  Footprints,
  GraduationCap,
  Infinity as InfinityIcon,
  Lock,
  Target,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rpc } from "@/lib/supabase/rpc";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Overview } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Thành tích" };

/** Ánh xạ tên icon trong database sang component lucide. */
const BADGE_ICONS: Record<string, React.ElementType> = {
  footprints: Footprints,
  target: Target,
  infinity: InfinityIcon,
  "book-open": BookOpen,
  "file-text": FileText,
  flame: Flame,
  trophy: Trophy,
  crown: Crown,
  "graduation-cap": GraduationCap,
  award: Award,
};

/** Các mốc cấp độ. XP cộng 10 điểm mỗi câu đúng. */
const LEVELS = [
  { min: 0, name: "Học sinh mới" },
  { min: 500, name: "Chăm chỉ" },
  { min: 2000, name: "Vững vàng" },
  { min: 5000, name: "Xuất sắc" },
  { min: 10000, name: "Thủ khoa tiềm năng" },
];

interface BadgeRow {
  id: number;
  code: string;
  name_vi: string;
  description: string;
  icon: string;
  points_reward: number;
  sort_order: number;
}

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [overview, { data: allBadges }, { data: earned }, { data: streak }] =
    await Promise.all([
      rpc<Overview>(supabase, "my_overview"),
      supabase
        .from("badges")
        .select("*")
        .order("sort_order")
        .returns<BadgeRow[]>(),
      supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user!.id)
        .returns<{ badge_id: number; earned_at: string }[]>(),
      supabase
        .from("streaks")
        .select("current_streak, longest_streak, last_activity_date")
        .eq("user_id", user!.id)
        .maybeSingle<{
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
        }>(),
    ]);

  const earnedMap = new Map((earned ?? []).map((e) => [e.badge_id, e.earned_at]));
  const xp = overview?.xp ?? 0;

  const levelIndex = LEVELS.reduce(
    (acc, l, i) => (xp >= l.min ? i : acc),
    0
  );
  const level = LEVELS[levelIndex];
  const nextLevel = LEVELS[levelIndex + 1];
  const xpIntoLevel = xp - level.min;
  const xpNeeded = nextLevel ? nextLevel.min - level.min : 0;

  // Streak được tính theo ngày Việt Nam; so với hôm nay để nhắc giữ chuỗi
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const practisedToday = streak?.last_activity_date === today;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Thành tích
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bộ sưu tập huy hiệu, chuỗi ngày học và cấp độ của bạn.
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {/* ------------------------------ Cấp độ -------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Cấp độ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-primary">{level.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {xp.toLocaleString("vi-VN")} XP
            </p>

            {nextLevel ? (
              <div className="mt-4">
                <Progress
                  value={xpIntoLevel}
                  max={xpNeeded}
                  label={`Tiến độ lên cấp ${nextLevel.name}`}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Còn {(nextLevel.min - xp).toLocaleString("vi-VN")} XP nữa để
                  lên <strong className="text-foreground">{nextLevel.name}</strong>
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-success-strong">
                Bạn đã đạt cấp cao nhất.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------ Streak -------------------------- */}
        <Card className={cn(!practisedToday && (streak?.current_streak ?? 0) > 0 && "border-warning")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-5 text-warning" aria-hidden="true" />
              Chuỗi ngày học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold">
              {streak?.current_streak ?? 0}{" "}
              <span className="text-base font-semibold text-muted-foreground">
                ngày
              </span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Kỷ lục: {streak?.longest_streak ?? 0} ngày
            </p>

            {(streak?.current_streak ?? 0) > 0 && !practisedToday && (
              <div className="mt-4 rounded-md border-l-4 border-warning bg-warning-soft p-3">
                <p className="text-sm font-semibold text-warning">
                  Hôm nay bạn chưa luyện
                </p>
                <p className="mt-0.5 text-xs text-warning">
                  Làm một phiên bất kỳ trong hôm nay để giữ chuỗi{" "}
                  {streak?.current_streak} ngày.
                </p>
              </div>
            )}
            {practisedToday && (
              <p className="mt-4 text-sm font-semibold text-success-strong">
                Đã luyện hôm nay — chuỗi được giữ nguyên.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------- Huy hiệu --------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Huy hiệu</CardTitle>
          <CardDescription>
            Đã đạt {earnedMap.size} trên {allBadges?.length ?? 0} huy hiệu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(allBadges ?? []).map((b) => {
              const Icon = BADGE_ICONS[b.icon] ?? Award;
              const at = earnedMap.get(b.id);
              const has = !!at;

              return (
                <li
                  key={b.id}
                  className={cn(
                    "flex gap-3.5 rounded-lg border p-4",
                    has
                      ? "border-success bg-success-soft"
                      : "border-border bg-card"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full",
                      has
                        ? "bg-success text-on-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {has ? (
                      <Icon className="size-5" aria-hidden="true" />
                    ) : (
                      <Lock className="size-5" aria-hidden="true" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-bold text-balance",
                        !has && "text-muted-foreground"
                      )}
                    >
                      {b.name_vi}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {b.description}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      {has ? (
                        <>
                          <Badge tone="success">Đạt {formatDate(at)}</Badge>
                          {b.points_reward > 0 && (
                            <span className="text-muted-foreground">
                              +{b.points_reward} điểm
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Chưa đạt
                          {b.points_reward > 0 &&
                            ` · thưởng ${b.points_reward} điểm`}
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
