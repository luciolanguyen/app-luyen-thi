"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateProfile, type ProfileState } from "./actions";
import { Button, Input, Label } from "@/components/ui";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfile,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border-l-4 border-destructive bg-destructive-soft p-3 text-sm text-destructive-strong"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border-l-4 border-success bg-success-soft p-3 text-sm text-success-strong"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Đã lưu thay đổi.</span>
        </div>
      )}

      <div>
        <Label htmlFor="fullName">Họ và tên</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={profile?.full_name ?? ""}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="school">Trường</Label>
          <Input
            id="school"
            name="school"
            defaultValue={profile?.school ?? ""}
            placeholder="THPT Chu Văn An"
          />
        </div>
        <div>
          <Label htmlFor="className">Lớp</Label>
          <Input
            id="className"
            name="className"
            defaultValue={profile?.class_name ?? ""}
            placeholder="12A1"
          />
        </div>
      </div>

      {/* Quyền riêng tư trên bảng xếp hạng — spec 4.5 */}
      <fieldset className="rounded-md border border-border p-4">
        <legend className="px-1.5 text-sm font-semibold">
          Quyền riêng tư
        </legend>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="anonymous"
            defaultChecked={profile?.leaderboard_anonymous}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-primary)]"
          />
          <span>
            <span className="block font-semibold">
              Ẩn tên trên bảng vinh danh
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Bạn vẫn được xếp hạng bình thường, nhưng người khác chỉ thấy
              &quot;Ẩn danh&quot; thay vì tên thật.
            </span>
          </span>
        </label>
      </fieldset>

      <SaveButton />
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Đang lưu…" : "Lưu thay đổi"}
    </Button>
  );
}
