import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, KeyRound, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isEncryptionConfigured } from "@/lib/ai/crypto";
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ProviderList } from "./provider-list";
import { AddProviderForm } from "./add-provider-form";

export const metadata: Metadata = { title: "Cấu hình AI" };

export interface ProviderRow {
  id: string;
  kind: "openai" | "openrouter" | "deepseek" | "anthropic" | "custom";
  label: string;
  base_url: string;
  api_key_hint: string;
  model: string | null;
  is_active: boolean;
  created_at: string;
}

export default async function AiConfigPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single<{ role: string }>();

  // Cấu hình AI chạm tới API key nên chỉ admin, giáo viên cũng không vào
  if (profile?.role !== "admin") redirect("/quan-tri");

  // Cố ý KHÔNG select api_key_cipher — quyền đọc cột đó đã bị thu hồi ở Postgres
  const { data: providers } = await supabase
    .from("ai_providers")
    .select("id, kind, label, base_url, api_key_hint, model, is_active, created_at")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ProviderRow[]>();

  const encryptionReady = isEncryptionConfigured();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href="/quan-tri"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Quản trị
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Cấu hình AI
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Chọn nhà cung cấp và model dùng để đọc file Word / Google Docs thành
          câu hỏi. Chỉ ảnh hưởng tới chức năng này — Excel/CSV không cần AI.
        </p>
      </header>

      {!encryptionReady ? (
        <Alert tone="destructive" title="Chưa bật được tính năng này" className="mb-6">
          <p>
            Cần khai <code className="font-mono font-bold">AI_ENCRYPTION_KEY</code>{" "}
            trong <code className="font-mono">.env.local</code> trước, vì API key
            phải được mã hoá trước khi lưu. Sinh một chuỗi ngẫu nhiên:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-card p-3 font-mono text-xs">
            node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;base64url&apos;))&quot;
          </pre>
          <p className="mt-2">Dán kết quả vào .env.local rồi khởi động lại server.</p>
        </Alert>
      ) : (
        <Alert tone="primary" className="mb-6">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              API key được mã hoá AES-256-GCM trước khi lưu, khoá giải mã nằm ở
              biến môi trường chứ không vào database. Giao diện chỉ hiện 4 ký tự
              cuối — <strong>không có cách nào xem lại khoá đầy đủ</strong>, kể
              cả bạn. Mất khoá thì nhập khoá mới.
            </span>
          </p>
        </Alert>
      )}

      {/* -------------------------- Đang dùng ---------------------------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" aria-hidden="true" />
            Nhà cung cấp đã lưu
          </CardTitle>
          <CardDescription>
            Chỉ một nhà cung cấp được bật tại một thời điểm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderList providers={providers ?? []} />
        </CardContent>
      </Card>

      {/* ---------------------------- Thêm mới ---------------------------- */}
      {encryptionReady && (
        <Card>
          <CardHeader>
            <CardTitle>Thêm nhà cung cấp</CardTitle>
            <CardDescription>
              Nhập khoá rồi bấm lấy danh sách model. Bước này cũng là phép thử
              khoá — sai là biết ngay.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddProviderForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
