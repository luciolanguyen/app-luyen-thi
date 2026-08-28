"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";
import { saveAnswer, submitAttempt } from "@/lib/actions/attempt";
import { Alert, Button, Progress } from "@/components/ui";
import {
  DifficultyBadge,
  ExplanationBlock,
  OptionList,
  PassageView,
} from "@/components/question-view";
import { CountdownClock } from "@/components/countdown-clock";
import type { Attempt, AttemptQuestion, OptionKey } from "@/lib/types";

export function PracticeRunner({
  attempt,
  questions: initialQuestions,
  typeName,
}: {
  attempt: Attempt;
  questions: AttemptQuestion[];
  typeName: string;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(() => {
    // Quay lại phiên làm dở: nhảy tới câu chưa trả lời đầu tiên
    const firstUnanswered = initialQuestions.findIndex((q) => !q.selected_key);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const isFree = attempt.mode === "practice_free";
  const current = questions[index];
  const answeredCount = questions.filter((q) => q.selected_key).length;
  const isLast = index === questions.length - 1;

  // Đo thời gian làm từng câu để thống kê "trung bình bao nhiêu giây mỗi câu".
  // Khởi tạo 0 chứ không phải Date.now(): initializer của useRef chạy trong
  // lúc render nên phải thuần khiết. Effect ngay dưới gán mốc thật khi mount.
  const questionStartRef = useRef<number>(0);
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [index]);

  const handleSelect = useCallback(
    async (key: OptionKey) => {
      if (saving) return;
      // Ở chế độ tự do, câu đã chấm rồi thì khoá lại, không cho đổi đáp án
      if (isFree && current.correct_key) return;

      setSaving(true);
      setError(null);

      const elapsed = Date.now() - questionStartRef.current;
      const res = await saveAnswer(
        attempt.id,
        current.question_no,
        key,
        elapsed
      );

      if (res.error) {
        setError(res.error);
        setSaving(false);
        return;
      }

      setQuestions((prev) =>
        prev.map((q, i) =>
          i === index
            ? {
                ...q,
                selected_key: key,
                // Luyện tự do: server trả kèm đáp án VÀ giải thích ngay trong
                // phản hồi, vì hai trường này cố ý bị giấu lúc mở phiên.
                ...(res.revealed
                  ? {
                      is_correct: res.is_correct ?? null,
                      correct_key: res.correct_key ?? null,
                      explanation: res.explanation ?? null,
                      tip: res.tip ?? null,
                    }
                  : {}),
              }
            : q
        )
      );
      setSaving(false);
    },
    [attempt.id, current, index, isFree, saving]
  );

  const handleSubmit = useCallback(() => {
    startSubmit(async () => {
      const res = await submitAttempt(attempt.id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(`/ket-qua/${attempt.id}`);
    });
  }, [attempt.id, router]);

  // Hết giờ ở chế độ tính giờ -> nộp tự động
  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // Phím tắt A/B/C/D và mũi tên — học sinh luyện nhanh trên laptop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(key)) {
        e.preventDefault();
        handleSelect(key as OptionKey);
      } else if (e.key === "ArrowRight" && !isLast) {
        setIndex((i) => i + 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        setIndex((i) => i - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSelect, index, isLast]);

  const revealed = isFree && !!current.correct_key;

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      {/* ------------------------------- Thanh đầu ------------------------- */}
      <header className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-muted-foreground">
              {typeName}
            </p>
            <p className="text-lg font-bold">
              Câu {index + 1}
              <span className="font-normal text-muted-foreground">
                {" "}
                / {questions.length}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {attempt.deadline_at && (
              <CountdownClock
                deadline={attempt.deadline_at}
                onTimeUp={handleTimeUp}
              />
            )}
            <button
              type="button"
              onClick={() => router.push("/luyen-tap")}
              className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted"
              aria-label="Thoát phiên luyện tập"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <Progress
          value={answeredCount}
          max={questions.length}
          label={`Đã trả lời ${answeredCount} trên ${questions.length} câu`}
        />
      </header>

      {error && (
        <Alert tone="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {/* ------------------------------- Câu hỏi --------------------------- */}
      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <DifficultyBadge q={current} />
        </div>

        <PassageView q={current} />

        <h1 className="mb-4 text-[1.0625rem] leading-relaxed font-semibold text-balance">
          {current.stem}
        </h1>

        <OptionList
          q={current}
          name={`cau-${current.question_no}`}
          selected={current.selected_key}
          revealed={revealed}
          disabled={saving || revealed}
          onSelect={handleSelect}
        />

        {saving && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Đang lưu…
          </p>
        )}

        {revealed && <ExplanationBlock q={current} />}
      </article>

      {/* ------------------------------ Điều hướng -------------------------- */}
      <nav
        className="mt-5 flex items-center justify-between gap-3"
        aria-label="Điều hướng câu hỏi"
      >
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Câu trước
        </Button>

        {isLast ? (
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? "Đang nộp…" : "Nộp bài & xem kết quả"}
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)}>
            Câu tiếp theo
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )}
      </nav>

      {/* Lưới số câu — nhảy nhanh tới bất kỳ câu nào */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          Chuyển nhanh tới câu
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const done = !!q.selected_key;
            const isCurrent = i === index;
            return (
              <li key={q.question_no}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`Câu ${i + 1}${done ? ", đã trả lời" : ", chưa trả lời"}`}
                  className={[
                    "size-9 cursor-pointer rounded-md border font-mono text-sm font-bold transition-colors duration-200",
                    isCurrent
                      ? "border-primary bg-primary text-on-primary"
                      : done
                        ? "border-success bg-success-soft text-success-strong"
                        : "border-border-strong bg-card text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Mẹo: bấm phím <kbd className="font-mono font-bold">A</kbd>{" "}
        <kbd className="font-mono font-bold">B</kbd>{" "}
        <kbd className="font-mono font-bold">C</kbd>{" "}
        <kbd className="font-mono font-bold">D</kbd> để chọn, mũi tên trái/phải
        để chuyển câu.
      </p>
    </div>
  );
}
