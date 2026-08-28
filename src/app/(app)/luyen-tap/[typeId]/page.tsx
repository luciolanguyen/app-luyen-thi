import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rpcList } from "@/lib/supabase/rpc";
import { Alert, Card, CardContent } from "@/components/ui";
import { PracticeSetupForm } from "./setup-form";
import type { BankCount, QuestionType, Topic, DifficultyLevel } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeId: string }>;
}): Promise<Metadata> {
  const { typeId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("question_types")
    .select("name_vi")
    .eq("id", Number(typeId))
    .single();
  return { title: data?.name_vi ?? "Luyện tập" };
}

export default async function PracticeSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ typeId: string }>;
  searchParams: Promise<{ loi?: string; "chuyen-de"?: string }>;
}) {
  const { typeId } = await params;
  const sp = await searchParams;
  const id = Number(typeId);
  if (!Number.isInteger(id)) notFound();

  const supabase = await createClient();

  const [{ data: type }, { data: allTopics }, allCounts] = await Promise.all([
    supabase
      .from("question_types")
      .select("*")
      .eq("id", id)
      .single<QuestionType>(),
    supabase.from("topics").select("*").order("sort_order").returns<Topic[]>(),
    // Xem ghi chú ở trang danh mục: RLS chặn học sinh select bảng `questions`.
    rpcList<BankCount>(supabase, "question_bank_counts"),
  ]);

  if (!type) notFound();

  const bank = allCounts.filter((c) => c.type_id === id);

  // Chỉ hiện chuyên đề thực sự có câu hỏi trong dạng bài này — tránh để học
  // sinh chọn một bộ lọc rồi nhận thông báo "không có câu nào".
  const topicIds = new Set(
    bank.map((q) => q.topic_id).filter((x): x is number => x !== null)
  );
  const topics = (allTopics ?? []).filter((t) => topicIds.has(t.id));

  const countByDifficulty = new Map<DifficultyLevel, number>();
  for (const row of bank) {
    countByDifficulty.set(
      row.difficulty,
      (countByDifficulty.get(row.difficulty) ?? 0) + Number(row.n)
    );
  }

  const total = bank.reduce((sum, row) => sum + Number(row.n), 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href="/luyen-tap"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Tất cả danh mục
      </Link>

      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-balance">
          {type.name_vi}
        </h1>
        <p className="mt-2 text-muted-foreground">{type.description}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Ngân hàng hiện có{" "}
          <strong className="text-foreground">{total} câu</strong> cho dạng bài
          này.
        </p>
      </header>

      {sp.loi === "khong-du-cau" && (
        <Alert tone="warning" title="Không tìm được câu hỏi khớp bộ lọc">
          Ngân hàng chưa có câu nào ứng với lựa chọn vừa rồi. Bạn thử nới bộ lọc
          — chẳng hạn bỏ chọn độ khó hoặc chuyên đề.
        </Alert>
      )}
      {sp.loi === "loi" && (
        <Alert tone="destructive" title="Không bắt đầu được phiên luyện">
          Đã có lỗi xảy ra. Bạn thử lại sau ít giây.
        </Alert>
      )}

      {total === 0 ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="font-semibold">Danh mục này chưa có câu hỏi.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Giáo viên cần bổ sung câu hỏi vào ngân hàng trước khi học sinh
              luyện được dạng bài này.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PracticeSetupForm
          typeId={id}
          topics={topics}
          countByDifficulty={Object.fromEntries(countByDifficulty)}
          total={total}
          preselectedTopic={
            sp["chuyen-de"] ? Number(sp["chuyen-de"]) : undefined
          }
        />
      )}
    </div>
  );
}
