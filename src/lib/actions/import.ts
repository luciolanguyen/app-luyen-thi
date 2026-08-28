"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseCsv, parseExcel } from "@/lib/import/parse-table";
import { docxToText, extractQuestionsWithAI } from "@/lib/import/extract-ai";
import type { ParsedRow } from "@/lib/import/schema";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

type Format = "excel" | "csv" | "docx" | "gdoc";

function detectFormat(name: string, mime?: string): Format | null {
  const lower = name.toLowerCase();
  if (mime === "application/vnd.google-apps.document") return "gdoc";
  if (mime === "application/vnd.google-apps.spreadsheet") return "excel";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) return "excel";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".docx")) return "docx";
  return null;
}

/**
 * Đọc file thành các dòng đã chuẩn hoá.
 * Excel/CSV đi qua parser chính xác; Word/Docs đi qua AI rồi bắt buộc rà soát.
 */
async function parseBuffer(
  buffer: Buffer,
  format: Format
): Promise<{
  rows: ParsedRow[];
  fileErrors: string[];
  model: string | null;
  notes: string | null;
}> {
  if (format === "excel") {
    const r = await parseExcel(buffer);
    return { ...r, model: null, notes: null };
  }
  if (format === "csv") {
    const r = parseCsv(buffer.toString("utf8"));
    return { ...r, model: null, notes: null };
  }

  const text =
    format === "docx" ? await docxToText(buffer) : buffer.toString("utf8");
  const r = await extractQuestionsWithAI(text);
  return {
    rows: r.rows,
    fileErrors: r.fileErrors,
    model: r.model,
    notes: r.notes,
  };
}

/** Tạo bản ghi lần nhập + các dòng tạm, rồi chạy kiểm tra. */
async function createJob(opts: {
  fileName: string;
  format: Format;
  source: "upload" | "google_drive";
  driveFileId?: string;
  buffer: Buffer;
}): Promise<{ jobId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  const { data: job, error: jobErr } = await supabase
    .from("import_jobs")
    .insert({
      created_by: user.id,
      source: opts.source,
      format: opts.format,
      file_name: opts.fileName,
      drive_file_id: opts.driveFileId ?? null,
      status: "parsing",
    })
    .select("id")
    .single<{ id: string }>();

  if (jobErr || !job) {
    return { error: "Không tạo được lần nhập. Bạn cần quyền quản trị hoặc giáo viên." };
  }

  const parsed = await parseBuffer(opts.buffer, opts.format);

  if (parsed.fileErrors.length > 0) {
    await supabase
      .from("import_jobs")
      .update({ status: "failed", error_message: parsed.fileErrors.join(" ") })
      .eq("id", job.id);
    return { jobId: job.id };
  }

  const { error: itemsErr } = await supabase.from("import_items").insert(
    parsed.rows.map((r) => ({
      job_id: job.id,
      row_no: r.row_no,
      type_code: r.type_code,
      topic_code: r.topic_code,
      difficulty: r.difficulty,
      cefr_level: r.cefr_level,
      stem: r.stem,
      options: r.options,
      correct_key: r.correct_key,
      explanation: r.explanation,
      tip: r.tip,
      passage_ref: r.passage_ref,
      passage_kind: r.passage_kind,
      passage_title: r.passage_title,
      passage_content: r.passage_content,
      position_in_passage: r.position_in_passage,
    }))
  );

  if (itemsErr) {
    await supabase
      .from("import_jobs")
      .update({ status: "failed", error_message: "Không lưu được dữ liệu đã đọc." })
      .eq("id", job.id);
    return { jobId: job.id };
  }

  await supabase
    .from("import_jobs")
    .update({
      extraction_model: parsed.model,
      error_message: parsed.notes,
    })
    .eq("id", job.id);

  // Bộ luật kiểm tra nằm ở database để cả hai đường dùng chung
  await supabase.rpc("validate_import_job", { p_job_id: job.id });

  return { jobId: job.id };
}

export async function importFromUpload(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/quan-tri/nhap-cau-hoi?loi=chua-chon-file");
  }
  if (file.size > MAX_FILE_BYTES) {
    redirect("/quan-tri/nhap-cau-hoi?loi=file-qua-lon");
  }

  const format = detectFormat(file.name);
  if (!format) {
    redirect("/quan-tri/nhap-cau-hoi?loi=dinh-dang-khong-ho-tro");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { jobId, error } = await createJob({
    fileName: file.name,
    format,
    source: "upload",
    buffer,
  });

  if (error || !jobId) {
    redirect("/quan-tri/nhap-cau-hoi?loi=khong-tao-duoc");
  }
  redirect(`/quan-tri/nhap-cau-hoi/${jobId}`);
}

/**
 * Nhập từ Google Drive.
 *
 * Access token do trình duyệt lấy trực tiếp từ Google rồi gửi kèm một lần cho
 * lần nhập này. Token KHÔNG được lưu vào database — hết phiên là hết hiệu lực.
 */
export async function importFromDrive(formData: FormData) {
  const fileId = String(formData.get("fileId") ?? "");
  const fileName = String(formData.get("fileName") ?? "file-tu-drive");
  const mimeType = String(formData.get("mimeType") ?? "");
  const accessToken = String(formData.get("accessToken") ?? "");

  if (!fileId || !accessToken) {
    redirect("/quan-tri/nhap-cau-hoi?loi=drive-thieu-thong-tin");
  }

  const format = detectFormat(fileName, mimeType);
  if (!format) {
    redirect("/quan-tri/nhap-cau-hoi?loi=dinh-dang-khong-ho-tro");
  }

  // Google Docs phải xuất ra text; file nhị phân thì tải thẳng
  const url =
    mimeType === "application/vnd.google-apps.document"
      ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text%2Fplain`
      : mimeType === "application/vnd.google-apps.spreadsheet"
        ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text%2Fcsv`
        : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    redirect("/quan-tri/nhap-cau-hoi?loi=drive-tai-that-bai");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_FILE_BYTES) {
    redirect("/quan-tri/nhap-cau-hoi?loi=file-qua-lon");
  }

  // Google Sheets xuất ra CSV nên đổi định dạng xử lý cho khớp
  const effective: Format =
    mimeType === "application/vnd.google-apps.spreadsheet" ? "csv" : format;

  const { jobId } = await createJob({
    fileName,
    format: effective,
    source: "google_drive",
    driveFileId: fileId,
    buffer,
  });

  if (!jobId) redirect("/quan-tri/nhap-cau-hoi?loi=khong-tao-duoc");
  redirect(`/quan-tri/nhap-cau-hoi/${jobId}`);
}

export async function toggleImportItem(itemId: string, include: boolean) {
  const supabase = await createClient();
  await supabase.from("import_items").update({ include }).eq("id", itemId);
}

export async function commitImport(formData: FormData) {
  const jobId = String(formData.get("jobId"));
  const supabase = await createClient();

  const { error } = await supabase.rpc("commit_import_job", {
    p_job_id: jobId,
  });

  if (error) {
    redirect(`/quan-tri/nhap-cau-hoi/${jobId}?loi=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/quan-tri/ngan-hang-cau-hoi");
  revalidatePath("/luyen-tap");
  redirect(`/quan-tri/nhap-cau-hoi/${jobId}?xong=1`);
}

export async function cancelImport(formData: FormData) {
  const jobId = String(formData.get("jobId"));
  const supabase = await createClient();
  await supabase
    .from("import_jobs")
    .update({ status: "cancelled" })
    .eq("id", jobId);
  redirect("/quan-tri/nhap-cau-hoi");
}
