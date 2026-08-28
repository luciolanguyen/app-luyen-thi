import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { AuthDivider, GoogleButton } from "@/components/google-button";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Đăng nhập" };

const GOOGLE_ERRORS: Record<string, string> = {
  google: "Không đăng nhập được bằng Google. Bạn thử lại hoặc dùng email/mật khẩu.",
  "google-tu-choi": "Bạn đã huỷ ở màn hình Google.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ "tiep-tuc"?: string; loi?: string }>;
}) {
  const params = await searchParams;

  return (
    <main
      id="noi-dung-chinh"
      className="flex flex-1 items-center justify-center px-5 py-12"
    >
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-sm font-semibold text-primary"
        >
          ← Về trang chủ
        </Link>

        <div className="rounded-lg border border-border bg-card p-7 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Đăng nhập</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tiếp tục luyện tập và giữ chuỗi ngày học của bạn.
          </p>

          {params.loi && (
            <Alert tone="destructive" className="mt-5">
              {GOOGLE_ERRORS[params.loi] ?? "Có lỗi xảy ra. Bạn thử lại."}
            </Alert>
          )}

          {/* Nút Google đặt TRƯỚC form: đây là cách nhanh nhất, đừng bắt
              người dùng đọc hết form rồi mới thấy lối tắt. */}
          <div className="mt-6">
            <GoogleButton next={params["tiep-tuc"]} label="Đăng nhập bằng Google" />
          </div>
          <AuthDivider />

          <LoginForm next={params["tiep-tuc"]} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="font-semibold text-primary underline">
            Đăng ký miễn phí
          </Link>
        </p>
      </div>
    </main>
  );
}
