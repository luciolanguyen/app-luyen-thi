"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ScheduleState = { error?: string; ok?: string };

/**
 * Giờ nhập vào ô datetime-local là giờ Việt Nam (không có múi giờ).
 * Gắn +07:00 rồi chuyển sang ISO để database lưu đúng mốc tuyệt đối —
 * nếu để trình duyệt tự suy múi giờ, admin ngồi ở máy đặt sai timezone
 * sẽ vô tình mở đề lệch vài tiếng.
 */
function vnLocalToIso(value: string | null): string | null {
  if (!value) return null;
  const withZone = `${value.length === 16 ? `${value}:00` : value}+07:00`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const windowSchema = z
  .object({
    examId: z.guid(),
    openAt: z.string().nullable(),
    closeAt: z.string().nullable(),
    restricted: z.boolean(),
  })
  .refine(
    (v) =>
      !v.openAt || !v.closeAt || new Date(v.closeAt) > new Date(v.openAt),
    { message: "Giờ đóng phải sau giờ mở." }
  );

export async function updateExamWindow(
  _prev: ScheduleState,
  formData: FormData
): Promise<ScheduleState> {
  const parsed = windowSchema.safeParse({
    examId: formData.get("examId"),
    openAt: vnLocalToIso(String(formData.get("openAt") || "") || null),
    closeAt: vnLocalToIso(String(formData.get("closeAt") || "") || null),
    restricted: formData.get("restricted") === "on",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exams")
    .update({
      open_at: parsed.data.openAt,
      close_at: parsed.data.closeAt,
      restricted_to_classes: parsed.data.restricted,
    })
    .eq("id", parsed.data.examId);

  if (error) return { error: `Không lưu được lịch: ${error.message}` };

  revalidatePath("/quan-tri/lich-thi");
  revalidatePath("/thi-thu");
  return { ok: "Đã lưu lịch thi." };
}

const assignSchema = z.object({
  examId: z.guid(),
  classId: z.guid(),
  openAt: z.string().nullable(),
  closeAt: z.string().nullable(),
  maxAttempts: z.coerce.number().int().min(1).max(50).nullable(),
});

export async function assignExamToClass(
  _prev: ScheduleState,
  formData: FormData
): Promise<ScheduleState> {
  const rawMax = String(formData.get("maxAttempts") || "");
  const parsed = assignSchema.safeParse({
    examId: formData.get("examId"),
    classId: formData.get("classId"),
    openAt: vnLocalToIso(String(formData.get("openAt") || "") || null),
    closeAt: vnLocalToIso(String(formData.get("closeAt") || "") || null),
    maxAttempts: rawMax === "" ? null : rawMax,
  });

  if (!parsed.success) {
    return { error: "Thông tin giao bài chưa hợp lệ. Kiểm tra lại lớp và giờ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("exam_assignments").upsert(
    {
      exam_id: parsed.data.examId,
      class_id: parsed.data.classId,
      open_at: parsed.data.openAt,
      close_at: parsed.data.closeAt,
      max_attempts: parsed.data.maxAttempts,
      assigned_by: user?.id ?? null,
    },
    { onConflict: "exam_id,class_id" }
  );

  if (error) return { error: `Không giao được bài: ${error.message}` };

  revalidatePath("/quan-tri/lich-thi");
  revalidatePath("/thi-thu");
  return { ok: "Đã giao bài cho lớp." };
}

export async function removeAssignment(formData: FormData) {
  const id = String(formData.get("assignmentId"));
  const supabase = await createClient();
  await supabase.from("exam_assignments").delete().eq("id", id);
  revalidatePath("/quan-tri/lich-thi");
  revalidatePath("/thi-thu");
}

export async function toggleExamPublished(formData: FormData) {
  const id = String(formData.get("examId"));
  const next = formData.get("publish") === "1";
  const supabase = await createClient();
  await supabase.from("exams").update({ is_published: next }).eq("id", id);
  revalidatePath("/quan-tri/lich-thi");
  revalidatePath("/thi-thu");
}

const classSchema = z.object({
  name: z.string().trim().min(1, "Tên lớp không được để trống.").max(40),
  school: z.string().trim().max(120).optional(),
});

export async function createClass(
  _prev: ScheduleState,
  formData: FormData
): Promise<ScheduleState> {
  const parsed = classSchema.safeParse({
    name: formData.get("name"),
    school: formData.get("school"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("classes").insert({
    name: parsed.data.name,
    school: parsed.data.school || null,
    teacher_id: user?.id ?? null,
  });

  if (error) return { error: `Không tạo được lớp: ${error.message}` };

  revalidatePath("/quan-tri/lich-thi");
  return { ok: `Đã tạo lớp ${parsed.data.name}.` };
}
