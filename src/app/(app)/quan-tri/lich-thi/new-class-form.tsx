"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { createClass, type ScheduleState } from "@/lib/actions/schedule";
import { Button, Input, Label } from "@/components/ui";

export function NewClassForm() {
  const [state, action] = useActionState<ScheduleState, FormData>(
    createClass,
    {}
  );

  return (
    <form action={action} className="space-y-3">
      {state.error && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive-strong">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="flex items-start gap-1.5 text-sm text-success-strong">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.ok}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
        <div>
          <Label htmlFor="class-name">Tên lớp</Label>
          <Input id="class-name" name="name" placeholder="12A1" required />
        </div>
        <div>
          <Label htmlFor="class-school">
            Trường{" "}
            <span className="font-normal text-muted-foreground">
              (không bắt buộc)
            </span>
          </Label>
          <Input id="class-school" name="school" placeholder="THPT Chu Văn An" />
        </div>
        <Submit />
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      <Plus className="size-4" aria-hidden="true" />
      {pending ? "Đang tạo…" : "Tạo lớp"}
    </Button>
  );
}
