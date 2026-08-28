import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import mammoth from "mammoth";
import type { ParsedRow, ParseResult } from "./schema";

export const EXTRACTION_MODEL = "claude-opus-5";

/** Giới hạn độ dài để một lần gọi không vượt quá cửa sổ hợp lý và không treo request. */
const MAX_CHARS = 60_000;

const QuestionSchema = z.object({
  type_code: z
    .enum(["notice", "ordering", "cloze", "reading", "grammar", "vocab"])
    .describe("Dạng bài. reading = đọc hiểu, cloze = điền từ vào đoạn văn."),
  difficulty: z
    .enum(["nhan_biet", "thong_hieu", "van_dung", "van_dung_cao"])
    .describe("Mức độ tư duy theo thang của Bộ GD&ĐT."),
  cefr_level: z.enum(["A2", "B1", "B2", "C1"]).nullable(),
  stem: z.string().describe("Nội dung câu hỏi, giữ nguyên chỗ trống ______ nếu có."),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  correct_key: z.enum(["A", "B", "C", "D"]),
  explanation: z
    .string()
    .describe(
      "Giải thích bằng TIẾNG VIỆT vì sao đáp án đúng và vì sao các phương án kia sai. Nếu tài liệu gốc không có, tự viết dựa trên kiến thức ngữ pháp/từ vựng."
    ),
  tip: z.string().nullable().describe("Mẹo làm bài ngắn gọn bằng tiếng Việt, có thể để null."),
  passage_ref: z
    .string()
    .nullable()
    .describe(
      "Mã đoạn ngữ liệu. Các câu thuộc CÙNG một bài đọc/đoạn cloze phải có cùng mã, ví dụ 'bai_doc_1'. Câu độc lập thì null."
    ),
  passage_kind: z.enum(["notice", "ordering", "cloze", "reading"]).nullable(),
  passage_title: z.string().nullable(),
  passage_content: z
    .string()
    .nullable()
    .describe("Toàn văn đoạn ngữ liệu. Chỉ điền ở câu ĐẦU TIÊN của mỗi mã, các câu sau để null."),
  position_in_passage: z.number().int().nullable(),
});

const ExtractionSchema = z.object({
  questions: z.array(QuestionSchema),
  notes: z
    .string()
    .nullable()
    .describe("Ghi chú cho người rà soát: chỗ nào trong tài liệu mơ hồ, thiếu đáp án, hoặc bạn phải suy đoán."),
});

const SYSTEM_PROMPT = `Bạn đang trích xuất câu hỏi trắc nghiệm tiếng Anh từ tài liệu của giáo viên Việt Nam, để đưa vào ngân hàng đề luyện thi tốt nghiệp THPT.

Quy tắc:
- Mỗi câu phải có ĐÚNG 4 phương án A, B, C, D. Nếu tài liệu chỉ có 3 phương án hoặc thiếu, BỎ QUA câu đó và ghi vào notes.
- Chỉ trích xuất câu thực sự có trong tài liệu. Tuyệt đối không tự bịa thêm câu hỏi.
- Nếu tài liệu KHÔNG ghi rõ đáp án đúng, bỏ qua câu đó và ghi vào notes — đừng đoán.
- Phần giải thích viết bằng tiếng Việt. Nếu tài liệu đã có sẵn giải thích thì dùng lại, diễn đạt cho rõ ràng.
- Với bài đọc hiểu và cloze: các câu hỏi thuộc cùng một đoạn văn phải dùng chung passage_ref, và toàn văn đoạn đặt ở câu đầu tiên.
- Ghi vào notes mọi chỗ bạn phải suy đoán, để người rà soát kiểm tra lại.`;

/** Lấy văn bản thuần từ file .docx. */
export async function docxToText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export interface AiExtractionResult extends ParseResult {
  notes: string | null;
  model: string;
}

/**
 * Nhờ Claude đọc tài liệu và tách thành câu hỏi có cấu trúc.
 *
 * Kết quả LUÔN đi qua màn rà soát trước khi vào ngân hàng — AI có thể đọc sai
 * đáp án, và một câu sai đáp án gây hại hơn là không có câu đó.
 */
export async function extractQuestionsWithAI(
  text: string
): Promise<AiExtractionResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      rows: [],
      notes: null,
      model: EXTRACTION_MODEL,
      fileErrors: [
        "Chưa cấu hình ANTHROPIC_API_KEY nên không dùng được chức năng đọc file Word bằng AI. Bạn có thể dùng đường Excel/CSV, hoặc khai báo khoá trong .env.local.",
      ],
    };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {
      rows: [],
      notes: null,
      model: EXTRACTION_MODEL,
      fileErrors: ["File không có nội dung văn bản nào đọc được."],
    };
  }

  if (trimmed.length > MAX_CHARS) {
    return {
      rows: [],
      notes: null,
      model: EXTRACTION_MODEL,
      fileErrors: [
        `Tài liệu quá dài (${trimmed.length.toLocaleString("vi-VN")} ký tự, giới hạn ${MAX_CHARS.toLocaleString("vi-VN")}). Hãy tách thành nhiều file nhỏ rồi nhập lần lượt.`,
      ],
    };
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Trích xuất toàn bộ câu hỏi trắc nghiệm trong tài liệu sau:\n\n<tai_lieu>\n${trimmed}\n</tai_lieu>`,
        },
      ],
      output_config: { format: zodOutputFormat(ExtractionSchema) },
    });

    if (response.stop_reason === "refusal") {
      return {
        rows: [],
        notes: null,
        model: EXTRACTION_MODEL,
        fileErrors: ["Mô hình từ chối xử lý tài liệu này. Bạn kiểm tra lại nội dung file."],
      };
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      return {
        rows: [],
        notes: null,
        model: EXTRACTION_MODEL,
        fileErrors: ["Không đọc được kết quả trả về. Bạn thử lại, hoặc dùng đường Excel/CSV."],
      };
    }

    const rows: ParsedRow[] = parsed.questions.map((q, i) => ({
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
      notes: parsed.notes,
      model: EXTRACTION_MODEL,
      fileErrors:
        rows.length === 0
          ? ["Không tìm thấy câu hỏi trắc nghiệm nào có đủ 4 phương án và đáp án trong tài liệu."]
          : [],
    };
  } catch (error) {
    // Bắt theo lớp cụ thể trước, để thông báo cho admin đúng nguyên nhân
    let message = "Không gọi được dịch vụ trích xuất. Bạn thử lại sau ít phút.";
    if (error instanceof Anthropic.AuthenticationError) {
      message = "ANTHROPIC_API_KEY không hợp lệ. Kiểm tra lại khoá trong .env.local.";
    } else if (error instanceof Anthropic.RateLimitError) {
      message = "Đang bị giới hạn tần suất gọi. Đợi một lát rồi thử lại.";
    } else if (error instanceof Anthropic.BadRequestError) {
      message = `Yêu cầu không hợp lệ: ${error.message}`;
    } else if (error instanceof Anthropic.APIError) {
      message = `Lỗi dịch vụ (${error.status}). Bạn thử lại sau.`;
    }
    return { rows: [], notes: null, model: EXTRACTION_MODEL, fileErrors: [message] };
  }
}
