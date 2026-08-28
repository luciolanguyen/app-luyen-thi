"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MatrixState = { error?: string; ok?: boolean };

const schema = z.object({
  // z.guid() chứ không phải z.uuid(): uuid() của Zod 4 bắt buộc đúng bit
  // version/variant RFC 4122, loại oan các UUID hợp lệ với Postgres.
  matrixId: z.guid(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(5, "Thời gian tối thiểu 5 phút.")
    .max(240, "Thời gian tối đa 240 phút."),
  pointsPerQuestion: z.coerce
    .number()
    .min(0.01, "Điểm mỗi câu phải lớn hơn 0.")
    .max(10),
  counts: z.record(z.string(), z.coerce.number().int().min(0).max(200)),
});

export async function updateMatrix(
  _prev: MatrixState,
  formData: FormData
): Promise<MatrixState> {
  const counts: Record<string, number> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("count_")) counts[k.slice(6)] = Number(v);
  }

  const parsed = schema.safeParse({
    matrixId: formData.get("matrixId"),
    durationMinutes: formData.get("durationMinutes"),
    pointsPerQuestion: formData.get("pointsPerQuestion"),
    counts,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { matrixId, durationMinutes, pointsPerQuestion } = parsed.data;
  const total = Object.values(parsed.data.counts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return { error: "Tổng số câu phải lớn hơn 0." };
  }

  const supabase = await createClient();

  // Gọi MỘT hàm duy nhất thay vì ghi từng dòng.
  //
  // supabase-js gửi mỗi lệnh ghi thành một HTTP request, tức một transaction
  // riêng. Khi admin đổi phân bổ (dạng 1 tăng, dạng 4 giảm bù lại), lệnh đầu
  // commit với tổng tạm thời vượt total_questions và bị trigger chặn oan, dù
  // cấu hình cuối cùng hợp lệ. Gói trong một hàm thì chỉ trạng thái cuối bị
  // kiểm tra, và việc sửa ma trận trở thành all-or-nothing đúng như mong muốn.
  //
  // Hàm cũng tự kiểm tra quyền admin, nên không cần kiểm tra riêng ở đây.
  const { error } = await supabase.rpc("update_exam_matrix", {
    p_matrix_id: matrixId,
    p_duration_seconds: durationMinutes * 60,
    p_points_per_question: pointsPerQuestion,
    p_items: Object.entries(parsed.data.counts).map(([typeId, count]) => ({
      type_id: Number(typeId),
      question_count: count,
    })),
  });

  if (error) {
    // Trang này chỉ admin xem được, nên hiện nguyên văn lỗi từ database —
    // admin cần biết lý do thật để sửa, không phải một câu chung chung.
    return { error: error.message };
  }

  revalidatePath("/quan-tri/ma-tran-de");
  revalidatePath("/thi-thu");
  return { ok: true };
}
