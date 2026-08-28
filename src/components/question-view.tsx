import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { DIFFICULTY_LABELS, type AttemptQuestion, type OptionKey } from "@/lib/types";

/**
 * Hiển thị phần ngữ liệu của một câu hỏi (thông báo, đoạn hội thoại cần sắp
 * xếp, đoạn cloze, bài đọc hiểu). Mỗi loại có cách trình bày riêng vì chúng
 * là những thể loại văn bản khác nhau ngoài đời thật.
 */
export function PassageView({ q }: { q: AttemptQuestion }) {
  if (!q.passage_content) return null;

  // Thông báo/biển hiệu: giữ nguyên xuống dòng, trình bày như tấm biển thật
  if (q.passage_kind === "notice") {
    return (
      <div className="mb-5 rounded-lg border-2 border-border-strong bg-background p-5">
        <pre className="font-reading text-[0.9375rem] leading-relaxed whitespace-pre-wrap">
          {q.passage_content}
        </pre>
      </div>
    );
  }

  // Sắp xếp câu: liệt kê từng câu kèm nhãn a/b/c/d
  if (q.passage_kind === "ordering") {
    const sentences = q.passage_meta?.sentences ?? [];
    return (
      <div className="mb-5">
        <p className="mb-3 text-sm text-muted-foreground">
          {q.passage_content}
        </p>
        <ol className="space-y-2">
          {sentences.map((s) => (
            <li
              key={s.label}
              className="flex gap-3 rounded-md border border-border bg-background p-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-xs font-bold text-primary uppercase">
                {s.label}
              </span>
              <span className="font-reading text-[0.9375rem] leading-relaxed">
                {s.text}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // Cloze và Đọc hiểu: đoạn văn dài, đọc bằng font serif cho đỡ mỏi mắt
  return (
    <div className="mb-5 rounded-lg border border-border bg-background p-5">
      {q.passage_title && (
        <p className="mb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {q.passage_title}
        </p>
      )}
      {/* max-h + overflow: bài đọc dài không đẩy phần đáp án ra khỏi màn hình */}
      <div className="prose-exam max-h-[45vh] overflow-y-auto whitespace-pre-wrap">
        {q.passage_content}
      </div>
    </div>
  );
}

/**
 * Bốn phương án A/B/C/D.
 * `revealed` bật lên sau khi đã chấm (luyện tự do) hoặc sau khi nộp bài.
 *
 * Component này dùng ở CẢ hai phía:
 *   - màn làm bài (client)  -> truyền `onSelect`, render radio tương tác
 *   - trang kết quả (server) -> KHÔNG truyền `onSelect`, render thuần hiển thị
 *
 * Ở nhánh server tuyệt đối không được gắn onChange: hàm không truyền được qua
 * ranh giới server/client, React sẽ ném lỗi lúc render (next build không bắt
 * được vì đây là lỗi runtime).
 */
export function OptionList({
  q,
  selected,
  revealed,
  disabled,
  onSelect,
  name,
}: {
  q: AttemptQuestion;
  selected: OptionKey | null;
  revealed: boolean;
  disabled?: boolean;
  onSelect?: (key: OptionKey) => void;
  name: string;
}) {
  const interactive = typeof onSelect === "function";

  return (
    <ul
      className="space-y-2.5"
      role={interactive ? "radiogroup" : "list"}
      aria-label="Các phương án trả lời"
    >
      {q.options.map((opt) => {
        const isSelected = selected === opt.key;
        const isCorrect = revealed && q.correct_key === opt.key;
        const isWrongPick = revealed && isSelected && q.correct_key !== opt.key;

        const Row = interactive ? "label" : "div";

        return (
          <li key={opt.key}>
            <Row
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors duration-200",
                // Trạng thái sau khi chấm: dùng CẢ màu và biểu tượng chữ,
                // không chỉ dựa vào màu để truyền đạt đúng/sai.
                isCorrect && "border-success bg-success-soft",
                isWrongPick && "border-destructive bg-destructive-soft",
                !revealed &&
                  isSelected &&
                  "border-primary bg-primary-soft",
                !revealed &&
                  !isSelected &&
                  "border-border-strong bg-card hover:bg-muted",
                revealed &&
                  !isCorrect &&
                  !isWrongPick &&
                  "border-border bg-card opacity-70",
                !interactive && "cursor-default",
                disabled && "cursor-not-allowed"
              )}
            >
              {interactive && (
                <input
                  type="radio"
                  name={name}
                  value={opt.key}
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => onSelect(opt.key)}
                  className="sr-only"
                />
              )}

              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-bold",
                  isCorrect && "border-success bg-success text-on-success",
                  isWrongPick &&
                    "border-destructive bg-destructive text-on-destructive",
                  !revealed &&
                    isSelected &&
                    "border-primary bg-primary text-on-primary",
                  !revealed && !isSelected && "border-border-strong",
                  revealed && !isCorrect && !isWrongPick && "border-border"
                )}
                aria-hidden="true"
              >
                {opt.key}
              </span>

              <span className="font-reading pt-0.5 text-[0.9375rem] leading-relaxed">
                {opt.text}
              </span>

              {revealed && (isCorrect || isWrongPick) && (
                <span
                  className={cn(
                    "ml-auto shrink-0 self-center text-xs font-bold",
                    isCorrect ? "text-success-strong" : "text-destructive-strong"
                  )}
                >
                  {isCorrect ? "Đáp án đúng" : "Bạn chọn"}
                </span>
              )}
            </Row>
          </li>
        );
      })}
    </ul>
  );
}

/** Khối giải thích + mẹo làm bài, chỉ hiện sau khi đã chấm. */
export function ExplanationBlock({ q }: { q: AttemptQuestion }) {
  if (!q.explanation) return null;

  return (
    <div className="mt-5 space-y-3">
      <div
        className={cn(
          "rounded-md border-l-4 p-4",
          q.is_correct
            ? "border-success bg-success-soft"
            : "border-destructive bg-destructive-soft"
        )}
      >
        <p
          className={cn(
            "text-sm font-bold",
            q.is_correct ? "text-success-strong" : "text-destructive-strong"
          )}
        >
          {q.is_correct
            ? "Chính xác"
            : q.selected_key
              ? `Chưa đúng — đáp án là ${q.correct_key}`
              : `Bạn bỏ qua câu này — đáp án là ${q.correct_key}`}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          {q.explanation}
        </p>
      </div>

      {q.tip && (
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Mẹo làm bài
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">{q.tip}</p>
        </div>
      )}
    </div>
  );
}

export function DifficultyBadge({ q }: { q: AttemptQuestion }) {
  const tone =
    q.difficulty === "nhan_biet" || q.difficulty === "thong_hieu"
      ? "primary"
      : q.difficulty === "van_dung"
        ? "warning"
        : "destructive";
  return <Badge tone={tone}>{DIFFICULTY_LABELS[q.difficulty]}</Badge>;
}
