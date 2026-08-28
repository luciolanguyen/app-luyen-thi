import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, ChevronLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card, CardContent, buttonClasses } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { ReviewList } from "./review-list";

export const metadata: Metadata = { title: "Rà soát trước khi lưu" };

export interface ImportItem {
  id: string;
  row_no: number;
  type_code: string | null;
  topic_code: string | null;
  difficulty: string | null;
  stem: string | null;
  options: { key: string; text: string }[] | null;
  correct_key: string | null;
  explanation: string | null;
  tip: string | null;
  passage_ref: string | null;
  passage_title: string | null;
  errors: string[];
  is_valid: boolean;
  include: boolean;
}

interface Job {
  id: string;
  file_name: string;
  source: string;
  format: string;
  status: "parsing" | "review" | "committed" | "failed" | "cancelled";
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  extraction_model: string | null;
  error_message: string | null;
  created_at: string;
  committed_at: string | null;
}

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ loi?: string; xong?: string }>;
}) {
  const { jobId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: job }, { data: items }] = await Promise.all([
    supabase.from("import_jobs").select("*").eq("id", jobId).single<Job>(),
    supabase
      .from("import_items")
      .select(
        "id, row_no, type_code, topic_code, difficulty, stem, options, correct_key, explanation, tip, passage_ref, passage_title, errors, is_valid, include"
      )
      .eq("job_id", jobId)
      .order("row_no")
      .returns<ImportItem[]>(),
  ]);

  if (!job) notFound();

  const done = job.status === "committed";

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Link
        href="/quan-tri/nhap-cau-hoi"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Danh sách lần nhập
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {done ? "Đã lưu vào ngân hàng" : "Rà soát trước khi lưu"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {job.file_name} · {formatDateTime(job.created_at)}
        </p>
      </header>

      {sp.xong === "1" && (
        <Alert tone="success" title="Nhập thành công" className="mb-6">
          Các câu đã chọn đã vào ngân hàng câu hỏi và sẵn sàng cho học sinh luyện
          tập.{" "}
          <Link
            href="/quan-tri/ngan-hang-cau-hoi"
            className="font-semibold underline"
          >
            Xem ngân hàng
          </Link>
        </Alert>
      )}

      {sp.loi && (
        <Alert tone="destructive" title="Không lưu được" className="mb-6">
          {sp.loi}
        </Alert>
      )}

      {job.status === "failed" && (
        <Alert tone="destructive" title="Không đọc được file" className="mb-6">
          {job.error_message ?? "Lỗi không xác định."}
        </Alert>
      )}

      {/* Ghi chú của AI về những chỗ phải suy đoán */}
      {job.extraction_model && job.error_message && job.status !== "failed" && (
        <Alert tone="warning" className="mb-6">
          <p className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>AI ghi chú:</strong> {job.error_message}
            </span>
          </p>
        </Alert>
      )}

      {job.status !== "failed" && (
        <>
          {/* ------------------------- Tóm tắt ------------------------- */}
          <Card className="mb-6">
            <CardContent className="grid grid-cols-3 gap-4 p-5 text-center">
              <div>
                <p className="font-mono text-2xl font-extrabold">
                  {job.total_rows}
                </p>
                <p className="text-xs text-muted-foreground">Dòng đọc được</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-extrabold text-success">
                  {job.valid_rows}
                </p>
                <p className="text-xs text-muted-foreground">Hợp lệ</p>
              </div>
              <div>
                <p
                  className={
                    job.error_rows > 0
                      ? "font-mono text-2xl font-extrabold text-destructive"
                      : "font-mono text-2xl font-extrabold text-muted-foreground"
                  }
                >
                  {job.error_rows}
                </p>
                <p className="text-xs text-muted-foreground">Có lỗi</p>
              </div>
            </CardContent>
          </Card>

          {job.extraction_model && !done && (
            <Alert tone="primary" className="mb-6">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  File này do AI đọc ({job.extraction_model}). Hãy đọc kỹ phần
                  đáp án và giải thích của từng câu — <strong>một câu sai đáp
                  án gây hại hơn là không có câu đó</strong>.
                </span>
              </p>
            </Alert>
          )}

          {done ? (
            <Alert tone="success" className="mb-6">
              <p className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Lần nhập này đã hoàn tất lúc{" "}
                  {job.committed_at ? formatDateTime(job.committed_at) : "—"}.
                  Danh sách dưới đây chỉ để xem lại.
                </span>
              </p>
            </Alert>
          ) : null}

          <ReviewList jobId={job.id} items={items ?? []} readOnly={done} />
        </>
      )}

      {job.status === "failed" && (
        <Link href="/quan-tri/nhap-cau-hoi" className={buttonClasses("primary", "md")}>
          Thử file khác
        </Link>
      )}
    </div>
  );
}

export function ItemBadges({ item }: { item: ImportItem }) {
  return (
    <>
      {item.type_code && <Badge tone="primary">{item.type_code}</Badge>}
      {item.difficulty && <Badge>{item.difficulty}</Badge>}
      {item.passage_ref && <Badge>ngữ liệu: {item.passage_ref}</Badge>}
    </>
  );
}
