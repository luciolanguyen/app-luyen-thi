import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { importFromUpload } from "@/lib/actions/import";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { DrivePicker } from "./drive-picker";

export const metadata: Metadata = { title: "Nhập câu hỏi" };

interface JobRow {
  id: string;
  source: "upload" | "google_drive";
  format: string;
  file_name: string;
  status: "parsing" | "review" | "committed" | "failed" | "cancelled";
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  extraction_model: string | null;
  error_message: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<JobRow["status"], { text: string; tone: "neutral" | "primary" | "success" | "warning" | "destructive" }> = {
  parsing: { text: "Đang đọc", tone: "neutral" },
  review: { text: "Chờ rà soát", tone: "warning" },
  committed: { text: "Đã lưu", tone: "success" },
  failed: { text: "Đọc thất bại", tone: "destructive" },
  cancelled: { text: "Đã huỷ", tone: "neutral" },
};

const FILE_ERRORS: Record<string, string> = {
  "chua-chon-file": "Bạn chưa chọn file nào.",
  "file-qua-lon": "File vượt quá 10 MB. Hãy tách nhỏ rồi nhập lần lượt.",
  "dinh-dang-khong-ho-tro":
    "Chỉ hỗ trợ .xlsx, .csv, .docx và Google Docs/Sheets.",
  "khong-tao-duoc":
    "Không tạo được lần nhập. Bạn cần quyền giáo viên hoặc quản trị viên.",
  "drive-thieu-thong-tin": "Thiếu thông tin file từ Google Drive.",
  "drive-tai-that-bai":
    "Không tải được file từ Google Drive. Quyền truy cập có thể đã hết hạn — thử kết nối lại.",
};

export default async function ImportHubPage({
  searchParams,
}: {
  searchParams: Promise<{ loi?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("import_jobs")
    .select(
      "id, source, format, file_name, status, total_rows, valid_rows, error_rows, extraction_model, error_message, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<JobRow[]>();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";
  // Trạng thái AI lấy từ cấu hình trong database, không đọc biến môi trường:
  // admin đổi nhà cung cấp trong giao diện thì chỗ này phải phản ánh ngay.
  const { data: activeProvider } = await supabase
    .from("ai_providers")
    .select("label, model")
    .eq("is_active", true)
    .maybeSingle<{ label: string; model: string | null }>();

  const envFallback = Boolean(process.env.ANTHROPIC_API_KEY);
  const aiReady = Boolean(activeProvider?.model) || envFallback;
  const aiLabel = activeProvider?.model
    ? `${activeProvider.label} · ${activeProvider.model}`
    : envFallback
      ? "Claude (từ biến môi trường)"
      : null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Link
        href="/quan-tri"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Quản trị
      </Link>

      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Nhập câu hỏi từ file
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Mọi lần nhập đều đi qua bước rà soát — bạn xem và bỏ chọn dòng sai
          trước khi lưu vào ngân hàng.
        </p>
      </header>

      {sp.loi && (
        <Alert tone="destructive" title="Không nhập được" className="mb-6">
          {FILE_ERRORS[sp.loi] ?? sp.loi}
        </Alert>
      )}

      {/* ------------------------- Đường 1: Excel/CSV ---------------------- */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" aria-hidden="true" />
            Excel hoặc CSV theo mẫu
          </CardTitle>
          <CardDescription>
            Đọc chính xác từng ô, báo lỗi rõ từng dòng. Đây là cách nên dùng cho
            đề soạn mới.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="/api/mau-nhap-cau-hoi"
            className="mb-5 inline-flex items-center gap-2 rounded-md border border-border-strong bg-card px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-primary-soft"
          >
            <Download className="size-4" aria-hidden="true" />
            Tải file mẫu (.xlsx)
          </a>

          <form action={importFromUpload} className="space-y-4">
            <div>
              <label
                htmlFor="file"
                className="mb-1.5 block text-sm font-semibold"
              >
                Chọn file từ máy
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".xlsx,.xlsm,.csv,.docx"
                required
                className="block w-full cursor-pointer rounded-md border border-border-strong bg-card p-2.5 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Hỗ trợ .xlsx, .csv và .docx. Tối đa 10 MB.
              </p>
            </div>

            <Button type="submit">
              <Upload className="size-4" aria-hidden="true" />
              Đọc file
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ------------------------ Đường 2: Google Drive -------------------- */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="size-5" viewBox="0 0 87.3 78" aria-hidden="true">
              <path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" />
              <path fill="#00ac47" d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" />
              <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z" />
              <path fill="#00832d" d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" />
              <path fill="#2684fc" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" />
              <path fill="#ffba00" d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" />
            </svg>
            Google Drive
          </CardTitle>
          <CardDescription>
            Chọn file trực tiếp từ Drive của bạn. Hệ thống chỉ xin quyền đọc
            đúng file bạn chọn và không lưu lại quyền truy cập.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DrivePicker clientId={googleClientId} apiKey={googleApiKey} />
        </CardContent>
      </Card>

      {/* --------------------------- Trạng thái AI ------------------------- */}
      <Alert tone={aiReady ? "primary" : "warning"} className="mb-8">
        <p className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {aiReady ? (
              <>
                File <strong>.docx</strong> và <strong>Google Docs</strong> được
                đọc bằng <strong>{aiLabel}</strong>. Kết quả luôn cần bạn rà
                soát — AI có thể đọc sai đáp án.{" "}
                <Link href="/quan-tri/cau-hinh-ai" className="font-semibold underline">
                  Đổi nhà cung cấp
                </Link>
              </>
            ) : (
              <>
                Chưa cấu hình nhà cung cấp AI nên tạm thời chưa đọc được file
                Word/Google Docs. Đường Excel/CSV vẫn dùng bình thường.{" "}
                <Link href="/quan-tri/cau-hinh-ai" className="font-semibold underline">
                  Cấu hình ngay
                </Link>
              </>
            )}
          </span>
        </p>
      </Alert>

      {/* ---------------------------- Lịch sử ------------------------------ */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Lần nhập gần đây</h2>

        {!jobs || jobs.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-8" aria-hidden="true" />}
            title="Chưa có lần nhập nào"
            description="Tải file mẫu, điền câu hỏi rồi nhập lên để bắt đầu."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {jobs.map((j) => {
              const s = STATUS_LABEL[j.status];
              const clickable = j.status === "review" || j.status === "committed";
              const body = (
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold">{j.file_name}</span>
                      <Badge tone={s.tone}>{s.text}</Badge>
                      {j.extraction_model && (
                        <Badge tone="primary">AI đọc</Badge>
                      )}
                      {j.source === "google_drive" && <Badge>Drive</Badge>}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDateTime(j.created_at)}
                      {j.total_rows > 0 && (
                        <>
                          {" · "}
                          {j.valid_rows} hợp lệ
                          {j.error_rows > 0 && ` · ${j.error_rows} lỗi`}
                        </>
                      )}
                    </p>
                    {j.status === "failed" && j.error_message && (
                      <p className="mt-1 text-sm text-destructive-strong">
                        {j.error_message}
                      </p>
                    )}
                  </div>
                  {clickable && (
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {j.status === "review" ? "Rà soát →" : "Xem lại →"}
                    </span>
                  )}
                </div>
              );

              return (
                <li key={j.id}>
                  {clickable ? (
                    <Link
                      href={`/quan-tri/nhap-cau-hoi/${j.id}`}
                      className="block transition-colors duration-200 hover:bg-muted"
                    >
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
