"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Trash2, Users } from "lucide-react";
import {
  assignExamToClass,
  removeAssignment,
  toggleExamPublished,
  updateExamWindow,
  type ScheduleState,
} from "@/lib/actions/schedule";
import { Badge, Button, Card, CardContent, Input, Label } from "@/components/ui";
import type { AssignmentRow, ClassRow, ExamRow } from "./page";

/**
 * Chuyển ISO (UTC) sang chuỗi cho ô datetime-local, hiển thị theo giờ Việt Nam.
 * Không dùng toISOString().slice() vì nó trả về giờ UTC — admin sẽ thấy lệch 7 tiếng.
 */
function isoToVnLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const vn = new Date(d.getTime() + 7 * 3600 * 1000);
  return vn.toISOString().slice(0, 16);
}

function statusOf(exam: ExamRow): { label: string; tone: "neutral" | "success" | "warning" | "destructive" } {
  if (!exam.is_published) return { label: "Chưa công bố", tone: "neutral" };
  const now = Date.now();
  if (exam.open_at && now < new Date(exam.open_at).getTime())
    return { label: "Chờ tới giờ mở", tone: "warning" };
  if (exam.close_at && now > new Date(exam.close_at).getTime())
    return { label: "Đã đóng", tone: "destructive" };
  return { label: "Đang mở", tone: "success" };
}

export function ExamScheduleCard({
  exam,
  classes,
  assignments,
}: {
  exam: ExamRow;
  classes: ClassRow[];
  assignments: AssignmentRow[];
}) {
  const [open, setOpen] = useState(false);
  const [winState, winAction] = useActionState<ScheduleState, FormData>(
    updateExamWindow,
    {}
  );
  const [assignState, assignAction] = useActionState<ScheduleState, FormData>(
    assignExamToClass,
    {}
  );

  const status = statusOf(exam);
  const classById = new Map(classes.map((c) => [c.id, c]));
  const unassigned = classes.filter(
    (c) => !assignments.some((a) => a.class_id === c.id)
  );

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              {exam.restricted_to_classes && (
                <Badge tone="primary">Chỉ lớp được giao</Badge>
              )}
              {assignments.length > 0 && (
                <Badge>
                  <Users className="size-3.5" aria-hidden="true" />
                  {assignments.length} lớp
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-balance">{exam.title}</h3>
          </div>

          <div className="flex shrink-0 gap-2">
            <form action={toggleExamPublished}>
              <input type="hidden" name="examId" value={exam.id} />
              <input
                type="hidden"
                name="publish"
                value={exam.is_published ? "0" : "1"}
              />
              <Button
                type="submit"
                size="sm"
                variant={exam.is_published ? "outline" : "primary"}
              >
                {exam.is_published ? "Gỡ công bố" : "Công bố"}
              </Button>
            </form>
            <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
              {open ? "Thu gọn" : "Đặt lịch"}
            </Button>
          </div>
        </div>

        {/* Danh sách lớp đã giao — luôn hiện, không cần mở panel */}
        {assignments.length > 0 && (
          <ul className="mt-4 space-y-2">
            {assignments.map((a) => {
              const c = classById.get(a.class_id);
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{c?.name ?? "Lớp đã xoá"}</strong>
                    {a.open_at && ` · mở ${new Date(a.open_at).toLocaleString("vi-VN")}`}
                    {a.close_at && ` · đóng ${new Date(a.close_at).toLocaleString("vi-VN")}`}
                    {a.max_attempts && ` · tối đa ${a.max_attempts} lượt`}
                  </span>
                  <form action={removeAssignment}>
                    <input type="hidden" name="assignmentId" value={a.id} />
                    <button
                      type="submit"
                      className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-destructive-strong hover:underline"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Gỡ
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        {open && (
          <div className="mt-5 space-y-6 border-t border-border pt-5">
            {/* ------------------- Khung giờ chung của đề ------------------- */}
            <form action={winAction} className="space-y-4">
              <input type="hidden" name="examId" value={exam.id} />
              <p className="text-sm font-bold">Khung giờ chung</p>

              {winState.error && (
                <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive-strong">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {winState.error}
                </p>
              )}
              {winState.ok && (
                <p role="status" className="flex items-start gap-1.5 text-sm text-success-strong">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {winState.ok}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`open-${exam.id}`}>Giờ mở</Label>
                  <Input
                    id={`open-${exam.id}`}
                    name="openAt"
                    type="datetime-local"
                    defaultValue={isoToVnLocal(exam.open_at)}
                  />
                </div>
                <div>
                  <Label htmlFor={`close-${exam.id}`}>Giờ đóng</Label>
                  <Input
                    id={`close-${exam.id}`}
                    name="closeAt"
                    type="datetime-local"
                    defaultValue={isoToVnLocal(exam.close_at)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Bỏ trống cả hai ô = mở tự do ngay khi công bố.
              </p>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  name="restricted"
                  defaultChecked={exam.restricted_to_classes}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-primary)]"
                />
                <span className="text-sm">
                  <strong>Chỉ lớp được giao mới thấy đề này</strong>
                  <span className="mt-0.5 block text-muted-foreground">
                    Bật cho đề kiểm tra riêng của lớp. Tắt thì mọi học sinh đều
                    thấy trong danh sách chung.
                  </span>
                </span>
              </label>

              <SaveButton label="Lưu khung giờ" />
            </form>

            {/* ---------------------- Giao cho lớp ------------------------- */}
            <form action={assignAction} className="space-y-4 border-t border-border pt-5">
              <input type="hidden" name="examId" value={exam.id} />
              <p className="text-sm font-bold">Giao cho lớp</p>

              {assignState.error && (
                <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive-strong">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {assignState.error}
                </p>
              )}
              {assignState.ok && (
                <p role="status" className="flex items-start gap-1.5 text-sm text-success-strong">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {assignState.ok}
                </p>
              )}

              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có lớp nào. Tạo lớp ở phần trên trước.
                </p>
              ) : unassigned.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Đề này đã giao cho tất cả các lớp hiện có.
                </p>
              ) : (
                <>
                  <div>
                    <Label htmlFor={`class-${exam.id}`}>Lớp</Label>
                    <select
                      id={`class-${exam.id}`}
                      name="classId"
                      required
                      className="h-11 w-full cursor-pointer rounded-md border border-border-strong bg-card px-3 text-[0.9375rem]"
                    >
                      {unassigned.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.school ? ` — ${c.school}` : ""} ({c.member_count} học sinh)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor={`aopen-${exam.id}`}>Mở riêng</Label>
                      <Input id={`aopen-${exam.id}`} name="openAt" type="datetime-local" />
                    </div>
                    <div>
                      <Label htmlFor={`aclose-${exam.id}`}>Đóng riêng</Label>
                      <Input id={`aclose-${exam.id}`} name="closeAt" type="datetime-local" />
                    </div>
                    <div>
                      <Label htmlFor={`amax-${exam.id}`}>Số lượt</Label>
                      <Input
                        id={`amax-${exam.id}`}
                        name="maxAttempts"
                        type="number"
                        min={1}
                        max={50}
                        placeholder="không giới hạn"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bỏ trống giờ riêng = dùng khung giờ chung ở trên.
                  </p>

                  <SaveButton label="Giao bài" />
                </>
              )}
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Đang lưu…" : label}
    </Button>
  );
}
