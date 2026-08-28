import type { Metadata } from "next";
import { Coins, Gift, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rpc } from "@/lib/supabase/rpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Điểm thưởng" };

interface LedgerRow {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
}

interface PointRule {
  code: string;
  name_vi: string;
  points: number;
}

export default async function PointsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [balance, { data: ledger }, { data: rules }] = await Promise.all([
    rpc<number>(supabase, "my_points_balance"),
    supabase
      .from("points_ledger")
      .select("id, delta, reason, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<LedgerRow[]>(),
    supabase
      .from("point_rules")
      .select("code, name_vi, points")
      .eq("is_active", true)
      .order("points", { ascending: false })
      .returns<PointRule[]>(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ví điểm thưởng
        </h1>
        <p className="mt-1 text-muted-foreground">
          Điểm tích luỹ từ việc luyện tập đều đặn và làm bài tốt.
        </p>
      </header>

      {/* ------------------------------ Số dư ----------------------------- */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Coins className="size-7" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              Số dư hiện tại
            </p>
            <p className="font-mono text-4xl font-extrabold tracking-tight">
              {(balance ?? 0).toLocaleString("vi-VN")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --------------------------- Cách tích điểm ----------------------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cách tích điểm</CardTitle>
          <CardDescription>
            Mức điểm do quản trị viên cấu hình, có thể thay đổi theo từng thời kỳ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border rounded-md border border-border">
            {(rules ?? []).map((r) => (
              <li
                key={r.code}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-sm">{r.name_vi}</span>
                <span className="shrink-0 font-mono text-sm font-bold text-success">
                  +{r.points}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ------------------------ Cửa hàng đổi thưởng --------------------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="size-5 text-primary" aria-hidden="true" />
            Cửa hàng đổi thưởng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Nói thẳng trạng thái thay vì hiện cửa hàng rỗng không giải thích */}
          <div className="rounded-md border border-dashed border-border-strong bg-muted p-5 text-center">
            <p className="font-semibold">Cửa hàng chưa mở</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Phần đổi voucher, tài liệu PDF và quyền lợi nâng cao thuộc giai
              đoạn 2 theo kế hoạch triển khai. Điểm bạn tích được vẫn giữ nguyên
              và dùng được khi cửa hàng mở.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --------------------------- Lịch sử giao dịch -------------------- */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Lịch sử tích / tiêu điểm</h2>

        {!ledger || ledger.length === 0 ? (
          <EmptyState
            icon={<Coins className="size-8" aria-hidden="true" />}
            title="Chưa có giao dịch nào"
            description="Hoàn thành một phiên luyện tập hoặc bài thi thử để nhận điểm thưởng đầu tiên."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {ledger.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={
                    row.delta >= 0
                      ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-strong"
                      : "flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive-soft text-destructive-strong"
                  }
                  aria-hidden="true"
                >
                  {row.delta >= 0 ? (
                    <Plus className="size-4" />
                  ) : (
                    <Minus className="size-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </p>
                </div>

                <span
                  className={
                    row.delta >= 0
                      ? "shrink-0 font-mono font-bold text-success"
                      : "shrink-0 font-mono font-bold text-destructive"
                  }
                >
                  {row.delta >= 0 ? "+" : ""}
                  {row.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
