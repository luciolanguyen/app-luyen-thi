"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DifficultyLevel, OptionKey, SubmitResult } from "@/lib/types";

/** Bắt đầu một phiên luyện theo danh mục rồi chuyển thẳng vào màn làm bài. */
export async function startPractice(formData: FormData) {
  const supabase = await createClient();

  const typeId = Number(formData.get("typeId"));
  const topicRaw = formData.get("topicId");
  const diffRaw = formData.get("difficulty");
  const count = Number(formData.get("count") || 10);
  const timed = formData.get("mode") === "timed";

  const { data, error } = await supabase.rpc("start_practice_session", {
    p_type_id: typeId,
    p_topic_id: topicRaw ? Number(topicRaw) : null,
    p_difficulty: (diffRaw as DifficultyLevel) || null,
    p_count: count,
    p_timed: timed,
  });

  if (error) {
    // Thiếu câu hỏi khớp bộ lọc là tình huống bình thường khi ngân hàng còn mỏng
    const msg = error.message.includes("chưa có câu nào")
      ? "khong-du-cau"
      : "loi";
    redirect(`/luyen-tap/${typeId}?loi=${msg}`);
  }

  redirect(`/lam-bai/${data}`);
}

/** Bắt đầu (hoặc quay lại) một lượt thi thử. */
export async function startExam(formData: FormData) {
  const supabase = await createClient();
  const examId = String(formData.get("examId"));

  const { data, error } = await supabase.rpc("start_exam_attempt", {
    p_exam_id: examId,
  });

  if (error) redirect(`/thi-thu?loi=khong-bat-dau-duoc`);
  redirect(`/phong-thi/${data}`);
}

/** Lưu một đáp án. Trả về kết quả chấm ngay nếu đang ở chế độ luyện tự do. */
export async function saveAnswer(
  attemptId: string,
  questionNo: number,
  selectedKey: OptionKey | null,
  timeSpentMs: number,
  marked?: boolean
): Promise<{
  revealed: boolean;
  is_correct?: boolean;
  correct_key?: OptionKey;
  explanation?: string;
  tip?: string | null;
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("save_answer", {
    p_attempt_id: attemptId,
    p_position: questionNo,
    p_selected_key: selectedKey,
    p_time_spent_ms: timeSpentMs,
    p_marked: marked ?? null,
  });

  if (error) {
    return {
      revealed: false,
      error: error.message.includes("hết thời gian")
        ? "Đã hết thời gian làm bài."
        : "Không lưu được đáp án. Kiểm tra kết nối mạng.",
    };
  }

  return data as {
    revealed: boolean;
    is_correct?: boolean;
    correct_key?: OptionKey;
    explanation?: string;
    tip?: string | null;
  };
}

/** Nộp bài. Toàn bộ việc chấm điểm diễn ra ở server. */
export async function submitAttempt(
  attemptId: string
): Promise<SubmitResult | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_attempt", {
    p_attempt_id: attemptId,
  });

  if (error) return { error: "Không nộp được bài. Thử lại sau ít giây." };

  revalidatePath("/bang-dieu-khien");
  revalidatePath("/bao-cao");
  return data as SubmitResult;
}

/** Ghi nhận học sinh rời khỏi tab trong lúc thi (chống gian lận cơ bản). */
export async function recordTabSwitch(attemptId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("record_tab_switch", {
    p_attempt_id: attemptId,
  });
  return (data as number) ?? 0;
}
