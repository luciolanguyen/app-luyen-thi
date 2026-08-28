"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateMatrix, type MatrixState } from "./actions";
import { Button, Input, Label } from "@/components/ui";
import type { QuestionType } from "@/lib/types";
import type { Matrix } from "./page";

export function MatrixEditor({
  matrix,
  types,
}: {
  matrix: Matrix;
  types: QuestionType[];
}) {
  const [state, formAction] = useActionState<MatrixState, FormData>(
    updateMatrix,
    {}
  );

  const initial = Object.fromEntries(
    types.map((t) => [
      t.id,
      matrix.exam_matrix_items.find((i) => i.type_id === t.id)?.question_count ??
        0,
    ])
  );

  const [counts, setCounts] = useState<Record<number, number>>(initial);
  const [ppq, setPpq] = useState(Number(matrix.points_per_question));

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxScore = Math.round(total * ppq * 100) / 100;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="matrixId" value={matrix.id} />

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
          <span>Đã lưu ma trận. Các đề thi mới sẽ dùng cấu hình này.</span>
        </div>
      )}

      {/* ------------------------- Số câu mỗi dạng ------------------------ */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">
          Số câu theo dạng bài
        </legend>
        <ul className="divide-y divide-border rounded-md border border-border">
          {types.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <label
                htmlFor={`count_${t.id}`}
                className="min-w-0 flex-1 text-sm font-medium"
              >
                {t.name_vi}
              </label>
              <input
                id={`count_${t.id}`}
                name={`count_${t.id}`}
                type="number"
                min={0}
                max={200}
                value={counts[t.id]}
                onChange={(e) =>
                  setCounts((c) => ({
                    ...c,
                    [t.id]: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="h-11 w-20 shrink-0 rounded-md border border-border-strong bg-card px-3 text-center font-mono font-bold"
              />
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`dur_${matrix.id}`}>Thời gian làm bài (phút)</Label>
          <Input
            id={`dur_${matrix.id}`}
            name="durationMinutes"
            type="number"
            min={5}
            max={240}
            defaultValue={Math.round(matrix.duration_seconds / 60)}
            required
          />
        </div>
        <div>
          <Label htmlFor={`ppq_${matrix.id}`}>Điểm mỗi câu</Label>
          <Input
            id={`ppq_${matrix.id}`}
            name="pointsPerQuestion"
            type="number"
            step="0.01"
            min={0.01}
            value={ppq}
            onChange={(e) => setPpq(Number(e.target.value) || 0)}
            required
          />
        </div>
      </div>

      {/* Xem trước kết quả phép tính ngay khi gõ — không phải lưu rồi mới biết */}
      <div className="rounded-md border border-border bg-muted p-4">
        <p className="text-sm font-semibold">Kết quả sau khi lưu</p>
        <p className="mt-1.5 font-mono text-sm">
          {total} câu × {ppq} điểm ={" "}
          <strong
            className={
              Math.abs(maxScore - 10) < 0.001 ? "text-success" : "text-warning"
            }
          >
            {maxScore.toFixed(2).replace(".", ",")} điểm
          </strong>
        </p>
        {Math.abs(maxScore - 10) >= 0.001 && (
          <p className="mt-1.5 text-xs text-warning">
            Thang điểm hiện không tròn 10. Đề thi tốt nghiệp THPT dùng thang 10 —
            kiểm tra lại số câu hoặc điểm mỗi câu nếu đây không phải chủ ý.
          </p>
        )}
      </div>

      <SaveButton />
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Đang lưu…" : "Lưu ma trận"}
    </Button>
  );
}
