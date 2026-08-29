import { z } from "zod";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret, isEncryptionConfigured } from "@/lib/ai/crypto";
import { completeJson, presetOf, type ProviderKind } from "@/lib/ai/providers";
import type { ParsedRow, ParseResult } from "./schema";

/** Giới hạn độ dài để một lần gọi không vượt cửa sổ ngữ cảnh của model rẻ nhất. */
const MAX_CHARS = 60_000;

const QuestionSchema = z.object({
  type_code: z.enum(["notice", "ordering", "cloze", "reading", "grammar", "vocab"]),
  difficulty: z.enum(["nhan_biet", "thong_hieu", "van_dung", "van_dung_cao"]),
  cefr_level: z.enum(["A2", "B1", "B2", "C1"]).nullable().catch(null),
  stem: z.string(),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  correct_key: z.enum(["A", "B", "C", "D"]),
  explanation: z.string(),
  tip: z.string().nullable().catch(null),
  passage_ref: z.string().nullable().catch(null),
  passage_kind: z.enum(["notice", "ordering", "cloze", "reading"]).nullable().catch(null),
  passage_title: z.string().nullable().catch(null),
  passage_content: z.string().nullable().catch(null),
  position_in_passage: z.number().int().nullable().catch(null),
});

const ExtractionSchema = z.object({
  questions: z.array(QuestionSchema),
  notes: z.string().nullable().catch(null),
});

/**
 * Mô tả cấu trúc JSON ngay trong prompt thay vì dùng `response_format:
 * json_schema` của OpenAI: OpenRouter và DeepSeek hỗ trợ tính năng đó không
 * đồng đều tuỳ model. Kết quả luôn được kiểm tra lại bằng zod ở dưới.
 */
const SYSTEM_PROMPT = `Bạn trích xuất câu hỏi trắc nghiệm tiếng Anh từ tài liệu của giáo viên Việt Nam, để đưa vào ngân hàng đề luyện thi tốt nghiệp THPT.

Trả về DUY NHẤT một object JSON, không kèm giải thích hay dấu \`\`\` nào, theo đúng cấu trúc:

{
  "questions": [
    {
      "type_code": "notice|ordering|cloze|reading|grammar|vocab",
      "difficulty": "nhan_biet|thong_hieu|van_dung|van_dung_cao",
      "cefr_level": "A2|B1|B2|C1" hoặc null,
      "stem": "nội dung câu hỏi, giữ nguyên chỗ trống ______",
      "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
      "correct_key": "A|B|C|D",
      "explanation": "giải thích BẰNG TIẾNG VIỆT vì sao đáp án đúng và vì sao các phương án kia sai",
      "tip": "mẹo làm bài ngắn bằng tiếng Việt" hoặc null,
      "passage_ref": "mã đoạn ngữ liệu, các câu cùng một bài đọc dùng CHUNG mã" hoặc null,
      "passage_kind": "notice|ordering|cloze|reading" hoặc null,
      "passage_title": "..." hoặc null,
      "passage_content": "toàn văn đoạn, CHỈ điền ở câu đầu tiên của mỗi mã" hoặc null,
      "position_in_passage": số thứ tự câu trong đoạn hoặc null
    }
  ],
  "notes": "ghi chú cho người rà soát về chỗ mơ hồ hoặc phải suy đoán" hoặc null
}

Quy tắc bắt buộc:
- Mỗi câu phải có ĐÚNG 4 phương án. Thiếu thì BỎ QUA câu đó và ghi vào notes.
- Nếu tài liệu KHÔNG ghi rõ đáp án đúng, BỎ QUA câu đó và ghi vào notes. Tuyệt đối không đoán.
- Chỉ lấy câu thực sự có trong tài liệu. Không tự bịa thêm câu hỏi.
- Giải thích viết bằng tiếng Việt. Tài liệu có sẵn thì dùng lại, diễn đạt cho rõ.
- Ghi vào notes mọi chỗ bạn phải suy đoán.`;

export async function docxToText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export interface AiExtractionResult extends ParseResult {
  notes: string | null;
  model: string | null;
}

interface ActiveProvider {
  kind: ProviderKind;
  baseUrl: string;
  model: string;
  apiKey: string;
  label: string;
}

/**
 * Lấy nhà cung cấp đang bật.
 * Nếu chưa cấu hình gì trong giao diện nhưng có sẵn ANTHROPIC_API_KEY trong
 * biến môi trường thì dùng tạm khoá đó — giữ nguyên cách cài đặt cũ.
 */
async function resolveProvider(): Promise<
  { provider: ActiveProvider } | { error: string }
> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_ai_provider_secret", { p_id: null });
  const row = Array.isArray(data) ? data[0] : null;

  if (row) {
    if (!row.model) {
      return {
        error:
          "Nhà cung cấp AI đang bật chưa chọn model. Vào Quản trị > Cấu hình AI để chọn.",
      };
    }
    if (!isEncryptionConfigured()) {
      return {
        error:
          "Thiếu AI_ENCRYPTION_KEY trong biến môi trường nên không giải mã được API key đã lưu.",
      };
    }
    try {
      return {
        provider: {
          kind: row.kind as ProviderKind,
          baseUrl: row.base_url,
          model: row.model,
          apiKey: decryptSecret(row.api_key_cipher),
          label: presetOf(row.kind as ProviderKind).label,
        },
      };
    } catch {
      return {
        error:
          "Không giải mã được API key đã lưu. Nhiều khả năng AI_ENCRYPTION_KEY đã bị đổi — hãy nhập lại khoá trong Quản trị > Cấu hình AI.",
      };
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: {
        kind: "anthropic",
        baseUrl: presetOf("anthropic").baseUrl,
        model: "claude-opus-5",
        apiKey: process.env.ANTHROPIC_API_KEY,
        label: "Claude (từ biến môi trường)",
      },
    };
  }

  return {
    error:
      "Chưa cấu hình nhà cung cấp AI nào. Vào Quản trị > Cấu hình AI để thêm ChatGPT, OpenRouter, DeepSeek hoặc Claude. Đường Excel/CSV vẫn dùng được bình thường.",
  };
}

/** Model hay bọc JSON trong ```json … ``` dù đã dặn không — gỡ ra trước khi parse. */
function stripFence(text: string): string {
  const t = text.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) return fenced[1].trim();
  // Có model chèn thêm lời dẫn trước JSON; cắt từ dấu { đầu tiên tới } cuối cùng
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first > 0 && last > first) return t.slice(first, last + 1);
  return t;
}

export async function extractQuestionsWithAI(
  text: string
): Promise<AiExtractionResult> {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return {
      rows: [],
      notes: null,
      model: null,
      fileErrors: ["File không có nội dung văn bản nào đọc được."],
    };
  }

  if (trimmed.length > MAX_CHARS) {
    return {
      rows: [],
      notes: null,
      model: null,
      fileErrors: [
        `Tài liệu quá dài (${trimmed.length.toLocaleString("vi-VN")} ký tự, giới hạn ${MAX_CHARS.toLocaleString("vi-VN")}). Hãy tách thành nhiều file nhỏ rồi nhập lần lượt.`,
      ],
    };
  }

  const resolved = await resolveProvider();
  if ("error" in resolved) {
    return { rows: [], notes: null, model: null, fileErrors: [resolved.error] };
  }
  const p = resolved.provider;
  const modelLabel = `${p.label} · ${p.model}`;

  const result = await completeJson({
    kind: p.kind,
    baseUrl: p.baseUrl,
    apiKey: p.apiKey,
    model: p.model,
    system: SYSTEM_PROMPT,
    user: `Trích xuất toàn bộ câu hỏi trắc nghiệm trong tài liệu sau:\n\n<tai_lieu>\n${trimmed}\n</tai_lieu>`,
  });

  if (result.error || !result.text) {
    return {
      rows: [],
      notes: null,
      model: modelLabel,
      fileErrors: [result.error ?? "Mô hình không trả về nội dung."],
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripFence(result.text));
  } catch {
    return {
      rows: [],
      notes: null,
      model: modelLabel,
      fileErrors: [
        "Mô hình không trả về JSON hợp lệ. Model này có thể không phù hợp cho việc trích xuất — thử chọn model mạnh hơn trong Quản trị > Cấu hình AI.",
      ],
    };
  }

  const validated = ExtractionSchema.safeParse(parsedJson);
  if (!validated.success) {
    return {
      rows: [],
      notes: null,
      model: modelLabel,
      fileErrors: [
        `Kết quả trả về sai cấu trúc: ${validated.error.issues[0]?.message ?? "không rõ"}. Thử chọn model khác.`,
      ],
    };
  }

  const rows: ParsedRow[] = validated.data.questions.map((q, i) => ({
    row_no: i + 1,
    type_code: q.type_code,
    topic_code: null,
    difficulty: q.difficulty,
    cefr_level: q.cefr_level,
    stem: q.stem,
    options: [
      { key: "A" as const, text: q.option_a },
      { key: "B" as const, text: q.option_b },
      { key: "C" as const, text: q.option_c },
      { key: "D" as const, text: q.option_d },
    ],
    correct_key: q.correct_key,
    explanation: q.explanation,
    tip: q.tip,
    passage_ref: q.passage_ref,
    passage_kind: q.passage_kind,
    passage_title: q.passage_title,
    passage_content: q.passage_content,
    position_in_passage: q.position_in_passage,
  }));

  return {
    rows,
    notes: validated.data.notes,
    model: modelLabel,
    fileErrors:
      rows.length === 0
        ? ["Không tìm thấy câu hỏi trắc nghiệm nào có đủ 4 phương án và đáp án trong tài liệu."]
        : [],
  };
}
