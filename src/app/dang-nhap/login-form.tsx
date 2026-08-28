"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { login, type AuthState } from "@/app/auth/actions";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(login, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {next && <input type="hidden" name="tiep-tuc" value={next} />}

      {/* Lỗi hiển thị NGAY TRÊN form và có role=alert để trình đọc màn hình
          thông báo — không giấu lỗi ở đâu đó xa khỏi ô nhập. */}
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border-l-4 border-destructive bg-destructive-soft p-3 text-sm text-destructive-strong"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

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
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Đang đăng nhập…" : "Đăng nhập"}
    </Button>
  );
}
