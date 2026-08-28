import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";
import { AuthDivider, GoogleButton } from "@/components/google-button";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Miễn phí. Bắt đầu phiên luyện đầu tiên ngay sau khi đăng ký.
          </p>

          <div className="mt-6">
            <GoogleButton label="Đăng ký bằng Google" />
          </div>
          <AuthDivider />

          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            href="/dang-nhap"
            className="font-semibold text-primary underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
