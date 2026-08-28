"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { BookOpen, Timer } from "lucide-react";
import { startPractice } from "@/lib/actions/attempt";
import { Button, Card, CardContent, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS, type DifficultyLevel, type Topic } from "@/lib/types";

const COUNTS = [10, 20, 30] as const;

export function PracticeSetupForm({
  typeId,
  topics,
  countByDifficulty,
  total,
  preselectedTopic,
}: {
  typeId: number;
  topics: Topic[];
  countByDifficulty: Partial<Record<DifficultyLevel, number>>;
  total: number;
  preselectedTopic?: number;
}) {
  const [mode, setMode] = useState<"free" | "timed">("free");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");
  const [topicId, setTopicId] = useState<string>(
    preselectedTopic ? String(preselectedTopic) : ""
  );
  const [count, setCount] = useState<number>(10);

  return (
    <form action={startPractice} className="mt-6 space-y-6">
      <input type="hidden" name="typeId" value={typeId} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="difficulty" value={difficulty} />
      <input type="hidden" name="topicId" value={topicId} />
      <input type="hidden" name="count" value={count} />

      {/* ------------------------------ Chế độ ------------------------------ */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold">Chế độ luyện</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeOption
            selected={mode === "free"}
            onSelect={() => setMode("free")}
            icon={<BookOpen className="size-5" aria-hidden="true" />}
            title="Luyện tự do"
            description="Không giới hạn thời gian. Xem đáp án và giải thích ngay sau mỗi câu."
          />
          <ModeOption
            selected={mode === "timed"}
            onSelect={() => setMode("timed")}
            icon={<Timer className="size-5" aria-hidden="true" />}
            title="Luyện tính giờ"
            description="75 giây mỗi câu, xấp xỉ nhịp độ đề thật. Chỉ chấm sau khi nộp."
          />
        </div>
      </fieldset>

      {/* ------------------------------ Số câu ------------------------------ */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold">Số câu</legend>
        <div className="flex flex-wrap gap-2">
          {COUNTS.map((c) => {
            const disabled = c > total;
            return (
              <button
                key={c}
                type="button"
                disabled={disabled}
                onClick={() => setCount(c)}
                aria-pressed={count === c}
                className={cn(
                  "h-11 min-w-20 cursor-pointer rounded-md border px-4 font-semibold transition-colors duration-200",
                  count === c
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border-strong bg-card hover:bg-primary-soft",
                  disabled && "cursor-not-allowed opacity-40"
                )}
              >
                {c} câu
              </button>
            );
          })}
        </div>
        {count > total && (
          <p className="mt-2 text-xs text-warning">
            Ngân hàng chỉ có {total} câu — phiên luyện sẽ lấy tối đa số câu hiện có.
          </p>
        )}
      </fieldset>

      {/* ------------------------------ Độ khó ------------------------------ */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold">
          Độ khó{" "}
          <span className="font-normal text-muted-foreground">
            (bỏ trống để lấy mọi mức)
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            selected={difficulty === ""}
            onSelect={() => setDifficulty("")}
            label="Tất cả"
            count={total}
          />
          {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((d) => {
            const n = countByDifficulty[d] ?? 0;
            return (
              <FilterChip
                key={d}
                selected={difficulty === d}
                onSelect={() => setDifficulty(d)}
                label={DIFFICULTY_LABELS[d]}
                count={n}
                disabled={n === 0}
              />
            );
          })}
        </div>
      </fieldset>

      {/* ----------------------------- Chuyên đề ---------------------------- */}
      {topics.length > 0 && (
        <div>
          <Label htmlFor="topic-select">
            Chuyên đề{" "}
            <span className="font-normal text-muted-foreground">
              (không bắt buộc)
            </span>
          </Label>
          <select
            id="topic-select"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="h-11 w-full cursor-pointer rounded-md border border-border-strong bg-card px-3 text-[0.9375rem] transition-colors duration-200"
          >
            <option value="">Tất cả chuyên đề</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_vi}
              </option>
            ))}
          </select>
        </div>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-muted-foreground">
            {mode === "free"
              ? "Bạn có thể dừng giữa chừng và quay lại sau — tiến độ được lưu tự động."
              : `Đồng hồ sẽ chạy ${Math.round((Math.min(count, total) * 75) / 60)} phút cho ${Math.min(count, total)} câu.`}
          </p>
          <StartButton />
        </CardContent>
      </Card>
    </form>
  );
}

function ModeOption({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "cursor-pointer rounded-lg border p-4 text-left transition-colors duration-200",
        selected
          ? "border-primary bg-primary-soft"
          : "border-border-strong bg-card hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-md",
          selected ? "bg-primary text-on-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </span>
      <p className="mt-2.5 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function FilterChip({
  selected,
  onSelect,
  label,
  count,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  count: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        // whitespace-nowrap: nhãn độ khó không được xuống dòng giữa chừng
        "h-11 cursor-pointer rounded-md border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
        selected
          ? "border-primary bg-primary text-on-primary"
          : "border-border-strong bg-card hover:bg-primary-soft",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {label}
      <span className={cn("ml-1.5 font-mono text-xs", selected ? "opacity-80" : "text-muted-foreground")}>
        {count}
      </span>
    </button>
  );
}

function StartButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-40">
      {pending ? "Đang chuẩn bị…" : "Bắt đầu luyện"}
    </Button>
  );
}
