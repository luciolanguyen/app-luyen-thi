import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Languages,
  ListOrdered,
  Megaphone,
  SpellCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rpcList } from "@/lib/supabase/rpc";
import { Badge, Progress } from "@/components/ui";
import { accuracyBand } from "@/lib/utils";
import type { BankCount, QuestionType, TypePerformance } from "@/lib/types";

export const metadata: Metadata = { title: "Luyện theo danh mục" };

/** Biểu tượng cho từng danh mục — SVG (lucide), không dùng emoji làm icon. */
const TYPE_ICONS: Record<string, React.ElementType> = {
  notice: Megaphone,
  ordering: ListOrdered,
  cloze: BookOpenCheck,
  reading: BarChart3,
  grammar: SpellCheck,
  vocab: Languages,
};

export default async function PracticeHubPage() {
  const supabase = await createClient();

  const [{ data: types }, perf, counts] = await Promise.all([
    supabase
      .from("question_types")
      .select("*")
      .order("sort_order")
      .returns<QuestionType[]>(),
    rpcList<TypePerformance>(supabase, "my_performance_by_type"),
    // Không select thẳng bảng `questions`: RLS chặn học sinh đọc bảng đó để
    // đáp án không lộ. RPC này chỉ trả về con số đếm.
    rpcList<BankCount>(supabase, "question_bank_counts"),
  ]);

  const perfByType = new Map<number, TypePerformance>(
    perf.map((p) => [p.type_id, p])
  );
  const countByType = new Map<number, number>();
  for (const row of counts) {
    countByType.set(row.type_id, (countByType.get(row.type_id) ?? 0) + Number(row.n));
  }

  const examTypes = (types ?? []).filter((t) => t.in_real_exam);
  const supportTypes = (types ?? []).filter((t) => !t.in_real_exam);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Luyện theo danh mục
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Chọn một dạng bài để luyện sâu. Chế độ tự do sẽ hiện đáp án và giải
          thích ngay sau mỗi câu.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-1 text-lg font-bold">Bốn dạng bài của đề thi</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Đây là bốn dạng xuất hiện trực tiếp trong đề thi tốt nghiệp THPT.
        </p>
        <ul className="grid gap-4 md:grid-cols-2">
          {examTypes.map((t) => (
            <TypeCard
              key={t.id}
              type={t}
              perf={perfByType.get(t.id)}
              bankSize={countByType.get(t.id) ?? 0}
            />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-bold">Danh mục bổ trợ</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Không phải một phần riêng của đề, nhưng kiến thức ở đây nằm rải rác
          trong cả bốn dạng bài trên.
        </p>
        <ul className="grid gap-4 md:grid-cols-2">
          {supportTypes.map((t) => (
            <TypeCard
              key={t.id}
              type={t}
              perf={perfByType.get(t.id)}
              bankSize={countByType.get(t.id) ?? 0}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function TypeCard({
  type,
  perf,
  bankSize,
}: {
  type: QuestionType;
  perf?: TypePerformance;
  bankSize: number;
}) {
  const Icon = TYPE_ICONS[type.code] ?? BookOpenCheck;
  const answered = perf?.answered ?? 0;
  const band = answered > 0 ? accuracyBand(perf!.accuracy) : null;
  const empty = bankSize === 0;

  return (
    <li>
      <Link
        href={`/luyen-tap/${type.id}`}
        aria-disabled={empty}
        className="group block h-full rounded-lg border border-border bg-card p-5 shadow-sm transition-colors duration-200 hover:border-primary"
      >
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-balance">{type.name_vi}</h3>
              <ArrowRight
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </div>

            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {type.description}
            </p>

            <div className="mt-3.5">
              {answered > 0 ? (
                <>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {perf!.correct}/{answered} câu đúng
                    </span>
                    <span className="flex items-center gap-2">
                      {band && <Badge tone={band.tone}>{band.label}</Badge>}
                      <span className="font-mono text-sm font-bold">
                        {perf!.accuracy}%
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={perf!.accuracy}
                    tone={band!.tone}
                    label={`${type.name_vi}: ${perf!.accuracy}% đúng`}
                  />
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {empty
                    ? "Ngân hàng câu hỏi cho dạng này còn trống."
                    : `${bankSize} câu trong ngân hàng · chưa luyện lần nào`}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
