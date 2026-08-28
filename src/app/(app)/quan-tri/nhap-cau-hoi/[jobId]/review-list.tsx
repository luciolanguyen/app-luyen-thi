"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { commitImport, toggleImportItem } from "@/lib/actions/import";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ImportItem } from "./page";

export function ReviewList({
  jobId,
  items: initial,
  readOnly,
}: {
  jobId: string;
  items: ImportItem[];
  readOnly: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"all" | "valid" | "error">("all");
  const [committing, startCommit] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const selectedCount = items.filter((i) => i.is_valid && i.include).length;

  const shown = useMemo(
    () =>
      items.filter((i) =>
        filter === "all" ? true : filter === "valid" ? i.is_valid : !i.is_valid
      ),
    [items, filter]
  );

  const toggle = (item: ImportItem) => {
    if (readOnly || !item.is_valid) return;
    const next = !item.include;
    // Cập nhật giao diện ngay, gửi server nền — bảng dài mà chờ mạng từng ô thì rất khó dùng
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, include: next } : i))
    );
    void toggleImportItem(item.id, next);
  };

  const setAll = (include: boolean) => {
    if (readOnly) return;
    const targets = items.filter((i) => i.is_valid && i.include !== include);
    setItems((prev) =>
      prev.map((i) => (i.is_valid ? { ...i, include } : i))
    );
    targets.forEach((i) => void toggleImportItem(i.id, include));
  };

  return (
    <div>
      {/* ------------------------------ Bộ lọc ---------------------------- */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            ["all", `Tất cả (${items.length})`],
            ["valid", `Hợp lệ (${items.filter((i) => i.is_valid).length})`],
            ["error", `Có lỗi (${items.filter((i) => !i.is_valid).length})`],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            aria-pressed={filter === v}
            className={cn(
              "cursor-pointer rounded-md border px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
              filter === v
                ? "border-primary bg-primary text-on-primary"
                : "border-border-strong bg-card hover:bg-primary-soft"
            )}
          >
            {label}
          </button>
        ))}

        {!readOnly && (
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setAll(true)}
              className="cursor-pointer text-sm font-semibold text-primary hover:underline"
            >
              Chọn hết
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={() => setAll(false)}
              className="cursor-pointer text-sm font-semibold text-primary hover:underline"
            >
              Bỏ chọn hết
            </button>
          </span>
        )}
      </div>

      {/* ------------------------------ Danh sách -------------------------- */}
      <ul className="space-y-3">
        {shown.map((item) => (
          <li key={item.id}>
            <Card
              className={cn(
                item.is_valid
                  ? item.include
                    ? "border-l-4 border-l-success"
                    : "border-l-4 border-l-border opacity-60"
                  : "border-l-4 border-l-destructive"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {item.is_valid && !readOnly ? (
                    <input
                      type="checkbox"
                      checked={item.include}
                      onChange={() => toggle(item)}
                      aria-label={`Nhập dòng ${item.row_no}`}
                      className="mt-1 size-5 shrink-0 cursor-pointer accent-[var(--color-primary)]"
                    />
                  ) : (
                    <span className="mt-0.5 shrink-0" aria-hidden="true">
                      {item.is_valid ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <XCircle className="size-5 text-destructive" />
                      )}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        Dòng {item.row_no}
                      </span>
                      {item.type_code && <Badge tone="primary">{item.type_code}</Badge>}
                      {item.difficulty && <Badge>{item.difficulty}</Badge>}
                      {item.passage_ref && (
                        <Badge>ngữ liệu: {item.passage_ref}</Badge>
                      )}
                      {item.correct_key && (
                        <span className="ml-auto font-mono text-sm font-bold text-success">
                          Đáp án {item.correct_key}
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed font-medium">
                      {item.stem || (
                        <em className="text-muted-foreground">(trống)</em>
                      )}
                    </p>

                    {item.options && item.options.length > 0 && (
                      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                        {item.options.map((o) => (
                          <li
                            key={o.key}
                            className={cn(
                              "font-reading text-sm",
                              o.key === item.correct_key
                                ? "font-bold text-success-strong"
                                : "text-muted-foreground"
                            )}
                          >
                            <span className="font-mono">{o.key}.</span>{" "}
                            {o.text || (
                              <em className="text-destructive">(rỗng)</em>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.explanation && (
                      <p className="mt-2 border-l-2 border-border pl-3 text-sm text-muted-foreground">
                        {item.explanation}
                      </p>
                    )}

                    {/* Lỗi hiện NGAY TẠI dòng có vấn đề, không gom lên đầu trang */}
                    {item.errors.length > 0 && (
                      <ul
                        role="alert"
                        className="mt-2.5 space-y-1 rounded-md bg-destructive-soft p-3"
                      >
                        {item.errors.map((e, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-sm text-destructive-strong"
                          >
                            <AlertCircle
                              className="mt-0.5 size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {shown.length === 0 && (
        <p className="rounded-lg border border-dashed border-border-strong p-8 text-center text-sm text-muted-foreground">
          Không có dòng nào trong nhóm này.
        </p>
      )}

      {/* ------------------------------ Nút lưu ---------------------------- */}
      {!readOnly && (
        <div className="sticky bottom-0 mt-6 border-t border-border bg-card py-4">
          {confirm ? (
            <div className="rounded-md border border-warning bg-warning-soft p-4">
              <p className="font-bold text-warning">
                Lưu {selectedCount} câu vào ngân hàng?
              </p>
              <p className="mt-1 text-sm text-warning">
                Sau khi lưu, các câu này sẽ xuất hiện trong phần luyện tập của
                học sinh. Thao tác không hoàn tác được từ màn hình này.
              </p>
              <form action={commitImport} className="mt-4 flex gap-3">
                <input type="hidden" name="jobId" value={jobId} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirm(false)}
                >
                  Quay lại rà soát
                </Button>
                <Button type="submit" disabled={committing}>
                  {committing ? "Đang lưu…" : `Lưu ${selectedCount} câu`}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Đã chọn <strong className="text-foreground">{selectedCount}</strong>{" "}
                trong {items.filter((i) => i.is_valid).length} câu hợp lệ.
                {items.some((i) => !i.is_valid) &&
                  " Các dòng có lỗi sẽ bị bỏ qua."}
              </p>
              <Button
                size="lg"
                disabled={selectedCount === 0}
                onClick={() => startCommit(() => setConfirm(true))}
              >
                Lưu vào ngân hàng
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
