"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Flag,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import {
  recordTabSwitch,
  saveAnswer,
  submitAttempt,
} from "@/lib/actions/attempt";
import { Button } from "@/components/ui";
import { OptionList, PassageView } from "@/components/question-view";
import { CountdownClock } from "@/components/countdown-clock";
import { cn } from "@/lib/utils";
import { TAB_SWITCH_WARN_AT } from "@/lib/exam-config";
import type { Attempt, AttemptQuestion, OptionKey } from "@/lib/types";

export function ExamRoom({
  attempt,
  questions: initial,
  examTitle,
}: {
  attempt: Attempt;
  questions: AttemptQuestion[];
  examTitle: string;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initial);
  const [index, setIndex] = useState(0);
  const [gridOpen, setGridOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(attempt.tab_switches);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const current = questions[index];
  const answered = questions.filter((q) => q.selected_key).length;
  const flagged = questions.filter((q) => q.marked_for_review).length;
  // Xem ghi chú ở runner.tsx: initializer của useRef phải thuần khiết.
  const questionStartRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [index]);

  /* ---------------------------- Nộp bài ---------------------------------- */
  const doSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    startSubmit(async () => {
      const res = await submitAttempt(attempt.id);
      if ("error" in res) {
        setError(res.error);
        submittedRef.current = false;
        return;
      }
      router.push(`/ket-qua/${attempt.id}`);
    });
  }, [attempt.id, router]);

  /* -------------------------- Lưu một đáp án ----------------------------- */
  const handleSelect = useCallback(
    async (key: OptionKey) => {
      // Cập nhật giao diện trước rồi mới gọi server: học sinh không phải chờ
      // mạng giữa hai câu, nhưng điểm số vẫn do server chấm lại khi nộp.
      setQuestions((prev) =>
        prev.map((q, i) => (i === index ? { ...q, selected_key: key } : q))
      );

      const elapsed = Date.now() - questionStartRef.current;
      questionStartRef.current = Date.now();

      const res = await saveAnswer(
        attempt.id,
        current.question_no,
        key,
        elapsed
      );
      if (res.error) setError(res.error);
    },
    [attempt.id, current, index]
  );

  const toggleFlag = useCallback(async () => {
    const next = !current.marked_for_review;
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, marked_for_review: next } : q))
    );
    await saveAnswer(
      attempt.id,
      current.question_no,
      current.selected_key,
      0,
      next
    );
  }, [attempt.id, current, index]);

  /* ----------------------- Chống gian lận cơ bản ------------------------- */
  useEffect(() => {
    // Rời tab / thu nhỏ cửa sổ
    const onVisibility = async () => {
      if (document.hidden && !submittedRef.current) {
        const n = await recordTabSwitch(attempt.id);
        setTabSwitches(n);
      }
    };
    // Chặn sao chép đề bài
    const block = (e: Event) => e.preventDefault();

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [attempt.id]);

  // Cảnh báo khi học sinh định đóng tab giữa chừng
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /* ------------------------------ Phím tắt ------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || confirmOpen) return;
      const k = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(k)) {
        e.preventDefault();
        handleSelect(k as OptionKey);
      } else if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(questions.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSelect, questions.length, confirmOpen]);

  const unanswered = useMemo(
    () => questions.filter((q) => !q.selected_key).map((q) => q.question_no),
    [questions]
  );

  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* ================================ Thanh trên ====================== */}
      <header className="sticky top-0 z-20 border-b-2 border-border-strong bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-muted-foreground">
              {examTitle}
            </p>
            <p className="text-sm font-bold">
              Đã làm {answered}/{questions.length}
              {flagged > 0 && (
                <span className="ml-2 font-normal text-warning">
                  · {flagged} câu đánh dấu
                </span>
              )}
            </p>
          </div>

          {attempt.deadline_at && (
            <CountdownClock
              deadline={attempt.deadline_at}
              onTimeUp={doSubmit}
              size="lg"
            />
          )}

          <Button
            variant="outline"
            onClick={() => setGridOpen((v) => !v)}
            aria-expanded={gridOpen}
            className="shrink-0"
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Danh sách câu</span>
          </Button>
        </div>

        {/* Lưới điều hướng 40 câu */}
        {gridOpen && (
          <div className="border-t border-border bg-muted px-4 py-4">
            <div className="mx-auto max-w-5xl">
              <ul className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => (
                  <li key={q.question_no}>
                    <button
                      type="button"
                      onClick={() => {
                        setIndex(i);
                        setGridOpen(false);
                      }}
                      aria-label={`Câu ${i + 1}${
                        q.selected_key ? ", đã làm" : ", chưa làm"
                      }${q.marked_for_review ? ", đã đánh dấu" : ""}`}
                      className={cn(
                        "relative size-10 cursor-pointer rounded-md border-2 font-mono text-sm font-bold transition-colors duration-200",
                        i === index
                          ? "border-primary bg-primary text-on-primary"
                          : q.selected_key
                            ? "border-success bg-success-soft text-success-strong"
                            : "border-border-strong bg-card text-muted-foreground"
                      )}
                    >
                      {i + 1}
                      {q.marked_for_review && (
                        <span
                          className="absolute -top-1 -right-1 size-3 rounded-full bg-warning-fill"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <Legend className="border-success bg-success-soft" label="Đã làm" />
                <Legend className="border-border-strong bg-card" label="Chưa làm" />
                <Legend className="border-primary bg-primary" label="Câu hiện tại" />
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-warning-fill" aria-hidden="true" />
                  Đánh dấu xem lại
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Cảnh báo rời tab */}
      {tabSwitches > 0 && (
        <div
          role="alert"
          className={cn(
            "px-4 py-2.5 text-center text-sm font-semibold",
            tabSwitches >= TAB_SWITCH_WARN_AT
              ? "bg-destructive text-on-destructive"
              : "bg-warning-soft text-warning"
          )}
        >
          <AlertTriangle className="mr-1.5 inline size-4" aria-hidden="true" />
          Bạn đã rời khỏi màn hình làm bài {tabSwitches} lần. Hành vi này được
          ghi lại.
        </div>
      )}

      {error && (
        <div role="alert" className="bg-destructive-soft px-4 py-2.5 text-center text-sm font-semibold text-destructive-strong">
          {error}
        </div>
      )}

      {/* ================================ Câu hỏi ========================= */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <article
          className="rounded-lg border border-border bg-card p-5 shadow-sm"
          // Chặn bôi đen để hạn chế chụp/sao chép đề
          style={{ userSelect: "none" }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-lg font-extrabold">
              Câu {index + 1}
              <span className="font-normal text-muted-foreground">
                {" "}
                / {questions.length}
              </span>
            </p>

            <button
              type="button"
              onClick={toggleFlag}
              aria-pressed={current.marked_for_review}
              className={cn(
                "flex h-10 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition-colors duration-200",
                current.marked_for_review
                  ? "border-warning bg-warning-soft text-warning"
                  : "border-border-strong bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <Flag
                className={cn("size-4", current.marked_for_review && "fill-current")}
                aria-hidden="true"
              />
              {current.marked_for_review ? "Đã đánh dấu" : "Đánh dấu"}
            </button>
          </div>

          <PassageView q={current} />

          <h1 className="mb-4 text-[1.0625rem] leading-relaxed font-semibold text-balance">
            {current.stem}
          </h1>

          {/* revealed={false} tuyệt đối: trong phòng thi không bao giờ lộ đáp án */}
          <OptionList
            q={current}
            name={`cau-${current.question_no}`}
            selected={current.selected_key}
            revealed={false}
            onSelect={handleSelect}
          />
        </article>
      </main>

      {/* =============================== Thanh dưới ======================= */}
      <footer
        className="sticky bottom-0 border-t-2 border-border-strong bg-card"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Câu trước</span>
          </Button>

          <Button
            variant="danger"
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Đang nộp…
              </>
            ) : (
              "Nộp bài"
            )}
          </Button>

          <Button
            onClick={() =>
              setIndex((i) => Math.min(questions.length - 1, i + 1))
            }
            disabled={index === questions.length - 1}
          >
            <span className="hidden sm:inline">Câu sau</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </footer>

      {/* ============================ Hộp xác nhận ======================== */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="xac-nhan-nop"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 id="xac-nhan-nop" className="text-xl font-bold">
              Nộp bài?
            </h2>

            {unanswered.length > 0 ? (
              <div className="mt-3 rounded-md border-l-4 border-warning bg-warning-soft p-3">
                <p className="text-sm font-semibold text-warning">
                  Còn {unanswered.length} câu chưa làm
                </p>
                <p className="mt-1 font-mono text-xs text-warning">
                  Câu {unanswered.slice(0, 15).join(", ")}
                  {unanswered.length > 15 && "…"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-success-strong">
                Bạn đã trả lời hết {questions.length} câu.
              </p>
            )}

            <p className="mt-3 text-sm text-muted-foreground">
              Sau khi nộp, bài sẽ được chấm ngay và bạn không thể sửa đáp án nữa.
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmOpen(false)}
              >
                Quay lại làm tiếp
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={doSubmit}
                disabled={submitting}
              >
                {submitting ? "Đang nộp…" : "Nộp bài"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-4 rounded border-2", className)} aria-hidden="true" />
      {label}
    </span>
  );
}
