import Anthropic from "@anthropic-ai/sdk";

/**
 * Nhà cung cấp mô hình AI dùng cho việc đọc file Word/Google Docs.
 *
 * OpenAI, OpenRouter và DeepSeek đều nói chung một chuẩn API (OpenAI-compatible
 * `/chat/completions`), nên dùng chung một adapter — ô "Tuỳ chỉnh" cũng đi
 * đường này, miễn endpoint tương thích. Anthropic có API riêng nên tách nhánh.
 */

export type ProviderKind =
  | "openai"
  | "openrouter"
  | "deepseek"
  | "anthropic"
  | "custom";

export interface ProviderPreset {
  kind: ProviderKind;
  label: string;
  baseUrl: string;
  /** Trang lấy khoá, hiện kèm ô nhập để admin không phải tự đi tìm. */
  keyUrl: string;
  keyPrefix: string;
  note: string;
  /** Anthropic dùng header và thân request khác hẳn. */
  dialect: "openai" | "anthropic";
  editableBaseUrl: boolean;
}

/** Thứ tự ở đây là thứ tự hiển thị trong giao diện quản trị. */
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    kind: "openai",
    label: "ChatGPT (OpenAI)",
    baseUrl: "https://api.openai.com/v1",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
    note: "Khoá bắt đầu bằng sk-. Cần tài khoản có số dư ở platform.openai.com.",
    dialect: "openai",
    editableBaseUrl: false,
  },
  {
    kind: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    keyUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-",
    note: "Một khoá dùng được nhiều mô hình của nhiều hãng. Khoá bắt đầu bằng sk-or-.",
    dialect: "openai",
    editableBaseUrl: false,
  },
  {
    kind: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPrefix: "sk-",
    note: "Giá rẻ, phù hợp khi cần đọc nhiều file. Khoá bắt đầu bằng sk-.",
    dialect: "openai",
    editableBaseUrl: false,
  },
  {
    kind: "anthropic",
    label: "Claude (Anthropic)",
    baseUrl: "https://api.anthropic.com/v1",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPrefix: "sk-ant-",
    note: "Khoá bắt đầu bằng sk-ant-.",
    dialect: "anthropic",
    editableBaseUrl: false,
  },
  {
    kind: "custom",
    label: "Tuỳ chỉnh (endpoint tương thích OpenAI)",
    baseUrl: "",
    keyUrl: "",
    keyPrefix: "",
    note:
      "Dùng cho máy chủ tự dựng (Ollama, vLLM, LM Studio…) hoặc nhà cung cấp khác. " +
      "Endpoint phải hỗ trợ GET /models và POST /chat/completions theo chuẩn OpenAI.",
    dialect: "openai",
    editableBaseUrl: true,
  },
];

export function presetOf(kind: ProviderKind): ProviderPreset {
  return (
    PROVIDER_PRESETS.find((p) => p.kind === kind) ??
    PROVIDER_PRESETS[PROVIDER_PRESETS.length - 1]
  );
}

export interface ModelInfo {
  id: string;
  label: string;
  /** Ghi chú thêm (giá, ngữ cảnh) nếu nhà cung cấp trả về. */
  note?: string;
}

export interface ListModelsResult {
  models: ModelInfo[];
  error?: string;
}

/** Lọc bớt model không dùng được cho việc trích xuất văn bản. */
function isUsableModel(id: string): boolean {
  const lower = id.toLowerCase();
  const skip = [
    "whisper",
    "tts",
    "dall-e",
    "embedding",
    "moderation",
    "sora",
    "clip",
    "rerank",
    "-audio",
    "-realtime",
    "-image",
    "davinci",
    "babbage",
  ];
  return !skip.some((s) => lower.includes(s));
}

/** Dịch lỗi có kiểu của SDK Anthropic sang thông báo tiếng Việt cho admin. */
function anthropicError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) {
    return "API key của Anthropic không hợp lệ.";
  }
  if (e instanceof Anthropic.RateLimitError) {
    return "Bị giới hạn tần suất. Đợi một lát rồi thử lại.";
  }
  if (e instanceof Anthropic.NotFoundError) {
    return "Không tìm thấy model. Chọn lại model trong danh sách.";
  }
  if (e instanceof Anthropic.BadRequestError) {
    return `Yêu cầu không hợp lệ: ${e.message}`;
  }
  if (e instanceof Anthropic.APIError) {
    return `Anthropic báo lỗi ${e.status}: ${e.message}`;
  }
  return friendlyFetchError(e);
}

function friendlyFetchError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|EAI_AGAIN/i.test(msg)) {
    return "Không kết nối được tới máy chủ. Kiểm tra lại địa chỉ endpoint và mạng.";
  }
  return `Lỗi khi gọi nhà cung cấp: ${msg}`;
}

/** Đọc thông báo lỗi từ thân phản hồi, dù mỗi hãng gói một kiểu khác nhau. */
async function readError(res: Response): Promise<string> {
  let detail = "";
  try {
    const body = await res.json();
    detail =
      body?.error?.message ??
      body?.message ??
      body?.error ??
      JSON.stringify(body).slice(0, 200);
  } catch {
    detail = (await res.text().catch(() => "")).slice(0, 200);
  }

  if (res.status === 401 || res.status === 403) {
    return `API key không hợp lệ hoặc không đủ quyền. ${detail}`.trim();
  }
  if (res.status === 429) {
    return "Bị giới hạn tần suất. Đợi một lát rồi thử lại.";
  }
  if (res.status === 404) {
    return `Không tìm thấy endpoint. Kiểm tra lại địa chỉ. ${detail}`.trim();
  }
  return `Nhà cung cấp báo lỗi ${res.status}. ${detail}`.trim();
}

/**
 * Lấy danh sách model khả dụng của một nhà cung cấp.
 * Gọi ngay lúc admin vừa nhập khoá — vừa liệt kê model, vừa là phép thử khoá.
 */
export async function listModels(
  kind: ProviderKind,
  baseUrl: string,
  apiKey: string
): Promise<ListModelsResult> {
  const preset = presetOf(kind);
  const root = (baseUrl || preset.baseUrl).replace(/\/+$/, "");

  if (!root) {
    return { models: [], error: "Chưa nhập địa chỉ endpoint." };
  }

  // Anthropic có SDK chính thức trong dự án — dùng nó để nhận lỗi có kiểu
  if (preset.dialect === "anthropic") {
    try {
      const client = new Anthropic({ apiKey, baseURL: root.replace(/\/v1$/, "") });
      const page = await client.models.list({ limit: 100 });
      const models: ModelInfo[] = page.data
        .map((m) => ({ id: m.id, label: m.display_name ?? m.id }))
        .sort((a, b) => a.id.localeCompare(b.id));
      return models.length > 0
        ? { models }
        : { models: [], error: "Không lấy được model nào từ Anthropic." };
    } catch (e) {
      return { models: [], error: anthropicError(e) };
    }
  }

  try {
    const res = await fetch(`${root}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) return { models: [], error: await readError(res) };

    const body = await res.json();
    const raw: unknown[] = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.models)
        ? body.models
        : [];

    const models: ModelInfo[] = raw
      .map((m) => {
        const o = m as Record<string, unknown>;
        const id = String(o.id ?? o.name ?? "");
        const label = String(o.display_name ?? o.name ?? id);
        // OpenRouter trả kèm giá và độ dài ngữ cảnh
        const ctx = o.context_length ?? (o.top_provider as Record<string, unknown>)?.context_length;
        const price = (o.pricing as Record<string, unknown>)?.prompt;
        const bits: string[] = [];
        if (ctx) bits.push(`${Number(ctx).toLocaleString("vi-VN")} token`);
        if (price && Number(price) > 0) {
          bits.push(`$${(Number(price) * 1_000_000).toFixed(2)}/1M token vào`);
        }
        return { id, label, note: bits.length ? bits.join(" · ") : undefined };
      })
      .filter((m) => m.id && isUsableModel(m.id))
      .sort((a, b) => a.id.localeCompare(b.id));

    if (models.length === 0) {
      return {
        models: [],
        error:
          "Kết nối được nhưng nhà cung cấp không trả về model nào dùng được cho việc đọc văn bản.",
      };
    }

    return { models };
  } catch (e) {
    return { models: [], error: friendlyFetchError(e) };
  }
}

export interface CompletionResult {
  text?: string;
  error?: string;
}

/**
 * Gọi mô hình và yêu cầu trả về JSON.
 *
 * Cố ý KHÔNG dùng `response_format: json_schema` của OpenAI: OpenRouter và
 * DeepSeek hỗ trợ không đồng đều tuỳ model, dùng vào là gãy với nửa số lựa
 * chọn. Thay vào đó yêu cầu JSON thuần rồi kiểm tra lại bằng zod ở nơi gọi —
 * cách này đúng với mọi nhà cung cấp và vẫn an toàn.
 */
export async function completeJson(opts: {
  kind: ProviderKind;
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<CompletionResult> {
  const preset = presetOf(opts.kind);
  const root = (opts.baseUrl || preset.baseUrl).replace(/\/+$/, "");
  const maxTokens = opts.maxTokens ?? 16000;

  if (preset.dialect === "anthropic") {
    try {
      const client = new Anthropic({
        apiKey: opts.apiKey,
        baseURL: root.replace(/\/v1$/, ""),
      });
      // Streaming vì max_tokens lớn: request không streaming dễ chạm timeout HTTP
      const stream = client.messages.stream({
        model: opts.model,
        max_tokens: maxTokens,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      });
      const message = await stream.finalMessage();

      if (message.stop_reason === "refusal") {
        return { error: "Mô hình từ chối xử lý tài liệu này." };
      }
      const text = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return text ? { text } : { error: "Mô hình không trả về nội dung." };
    } catch (e) {
      return { error: anthropicError(e) };
    }
  }

  try {
    const res = await fetch(`${root}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "content-type": "application/json",
        // OpenRouter khuyến nghị hai header này để nhận diện ứng dụng gọi
        "HTTP-Referer": "https://github.com/luciolanguyen/app-luyen-thi",
        "X-Title": "Luyen Thi THPT 2026",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
      signal: AbortSignal.timeout(300_000),
    });

    if (!res.ok) return { error: await readError(res) };

    const body = await res.json();
    const text = body?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim() === "") {
      return { error: "Mô hình không trả về nội dung." };
    }
    return { text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/timeout|aborted/i.test(msg)) {
      return {
        error:
          "Mô hình xử lý quá lâu và đã bị huỷ. Thử tách file nhỏ hơn hoặc chọn model nhanh hơn.",
      };
    }
    return { error: friendlyFetchError(e) };
  }
}
