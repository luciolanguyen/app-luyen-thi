"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { register, type AuthState } from "@/app/auth/actions";
import { Button, Input, Label } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(register, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && (
        <div
          role="alert"
          className={
            state.ok
              ? "flex items-start gap-2 rounded-md border-l-4 border-success bg-success-soft p-3 text-sm text-success-strong"
              : "flex items-start gap-2 rounded-md border-l-4 border-destructive bg-destructive-soft p-3 text-sm text-destructive-strong"
          }
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <Label htmlFor="fullName">Họ và tên</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          placeholder="Nguyễn Văn A"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ban@example.com"
        />
      </div>

      <div>
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="password-hint"
        />
        {/* Yêu cầu mật khẩu nói TRƯỚC khi nhập, không đợi báo lỗi sau khi gửi */}
        <p id="password-hint" className="mt-1.5 text-xs text-muted-foreground">
          Ít nhất 8 ký tự.
        </p>
      </div>

      {/* Thông tin phụ — để cuối và ghi rõ không bắt buộc, tránh làm form
          trông dài và nản ngay từ đầu (progressive disclosure) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="school">
            Trường{" "}
            <span className="font-normal text-muted-foreground">
              (không bắt buộc)
            </span>
          </Label>
          <Input id="school" name="school" placeholder="THPT Chu Văn An" />
        </div>
        <div>
          <Label htmlFor="className">
            Lớp{" "}
            <span className="font-normal text-muted-foreground">
              (không bắt buộc)
            </span>
          </Label>
          <Input id="className" name="className" placeholder="12A1" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Trường và lớp dùng để xếp hạng theo lớp/trường. Bạn có thể bỏ trống và
        bổ sung sau trong hồ sơ cá nhân.
      </p>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
    </Button>
  );
}
