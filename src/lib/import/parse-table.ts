import ExcelJS from "exceljs";
import Papa from "papaparse";
import {
  IMPORT_COLUMNS,
  type ParsedRow,
  type ParseResult,
} from "./schema";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function clean(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  // Ô Excel có thể là số, ngày, hoặc object rich text
  if (typeof v === "object" && v !== null && "richText" in v) {
    const rt = (v as { richText: { text: string }[] }).richText;
    const s = rt.map((r) => r.text).join("").trim();
    return s === "" ? null : s;
  }
  const s = String(v).trim();
  return s === "" ? null : s;
}

function toRow(
  get: (key: string) => string | null,
  rowNo: number
): ParsedRow {
  const options = OPTION_KEYS.map((k) => ({
    key: k,
    text: get(`phuong_an_${k.toLowerCase()}`) ?? "",
  }));

  const pos = get("thu_tu_trong_bai");
  const parsedPos = pos !== null ? Number.parseInt(pos, 10) : NaN;

  return {
    row_no: rowNo,
    type_code: get("dang_bai")?.toLowerCase() ?? null,
    topic_code: get("chuyen_de")?.toLowerCase() ?? null,
    difficulty: get("do_kho")?.toLowerCase() ?? null,
    cefr_level: get("cefr")?.toUpperCase() ?? null,
    stem: get("cau_hoi"),
    // Luôn gửi đủ 4 phương án; hàm kiểm tra ở database sẽ bắt ô rỗng
    options,
    correct_key: get("dap_an")?.toUpperCase() ?? null,
    explanation: get("giai_thich"),
    tip: get("meo"),
    passage_ref: get("ngu_lieu_ma"),
    passage_kind: get("ngu_lieu_loai")?.toLowerCase() ?? null,
    passage_title: get("ngu_lieu_tieu_de"),
    passage_content: get("ngu_lieu_noi_dung"),
    position_in_passage: Number.isFinite(parsedPos) ? parsedPos : null,
  };
}

/**
 * Nội dung đoạn văn chỉ cần điền ở dòng đầu tiên của mỗi mã ngữ liệu.
 * Hàm này lan giá trị đó xuống các dòng cùng mã, để giáo viên không phải
 * dán lại cả bài đọc vào 7 dòng liên tiếp.
 */
function fillPassages(rows: ParsedRow[]): void {
  const seen = new Map<
    string,
    { kind: string | null; title: string | null; content: string | null }
  >();

  for (const r of rows) {
    if (!r.passage_ref) continue;
    const prev = seen.get(r.passage_ref);
    if (prev) {
      r.passage_kind ??= prev.kind;
      r.passage_title ??= prev.title;
      r.passage_content ??= prev.content;
    }
    seen.set(r.passage_ref, {
      kind: r.passage_kind ?? prev?.kind ?? null,
      title: r.passage_title ?? prev?.title ?? null,
      content: r.passage_content ?? prev?.content ?? null,
    });
  }

  // Lượt hai: dòng đứng TRƯỚC dòng có nội dung cũng phải nhận được nội dung
  for (const r of rows) {
    if (!r.passage_ref) continue;
    const p = seen.get(r.passage_ref);
    if (!p) continue;
    r.passage_kind ??= p.kind;
    r.passage_title ??= p.title;
    r.passage_content ??= p.content;
  }
}

function headerIndex(headers: string[]): {
  index: Map<string, number>;
  missing: string[];
} {
  const norm = headers.map((h) =>
    String(h ?? "").trim().toLowerCase().replace(/\s+/g, "_")
  );
  const index = new Map<string, number>();
  for (const col of IMPORT_COLUMNS) {
    const i = norm.indexOf(col.header);
    if (i !== -1) index.set(col.key, i);
  }
  const missing = IMPORT_COLUMNS.filter(
    (c) => c.required && !index.has(c.key)
  ).map((c) => c.header);
  return { index, missing };
}

export async function parseExcel(buffer: Buffer): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return {
      rows: [],
      fileErrors: ["Không đọc được file Excel. File có thể hỏng hoặc sai định dạng .xlsx"],
    };
  }

  const ws = wb.worksheets[0];
  if (!ws || ws.rowCount < 2) {
    return { rows: [], fileErrors: ["File không có dữ liệu nào ngoài dòng tiêu đề."] };
  }

  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = clean(cell.value) ?? "";
  });

  const { index, missing } = headerIndex(headers);
  if (missing.length > 0) {
    return {
      rows: [],
      fileErrors: [
        `File thiếu cột bắt buộc: ${missing.join(", ")}. Hãy tải file mẫu và điền theo đúng tiêu đề cột.`,
      ],
    };
  }

  const rows: ParsedRow[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (key: string) => {
      const i = index.get(key);
      return i === undefined ? null : clean(row.getCell(i + 1).value);
    };
    // Bỏ qua dòng trống hoàn toàn
    if (IMPORT_COLUMNS.every((c) => get(c.key) === null)) continue;
    rows.push(toRow(get, r));
  }

  fillPassages(rows);
  return { rows, fileErrors: [] };
}

export function parseCsv(text: string): ParseResult {
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });

  if (parsed.data.length < 2) {
    return { rows: [], fileErrors: ["File CSV không có dữ liệu nào ngoài dòng tiêu đề."] };
  }

  const { index, missing } = headerIndex(parsed.data[0]);
  if (missing.length > 0) {
    return {
      rows: [],
      fileErrors: [
        `File thiếu cột bắt buộc: ${missing.join(", ")}. Hãy tải file mẫu và điền theo đúng tiêu đề cột.`,
      ],
    };
  }

  const rows: ParsedRow[] = [];
  for (let r = 1; r < parsed.data.length; r++) {
    const cells = parsed.data[r];
    const get = (key: string) => {
      const i = index.get(key);
      return i === undefined ? null : clean(cells[i]);
    };
    if (IMPORT_COLUMNS.every((c) => get(c.key) === null)) continue;
    rows.push(toRow(get, r + 1));
  }

  fillPassages(rows);
  return { rows, fileErrors: [] };
}

/** Sinh file mẫu để admin tải về và gửi cho giáo viên. */
export async function buildTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Luyện thi THPT 2026";

  const ws = wb.addWorksheet("Câu hỏi");
  ws.columns = IMPORT_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  // Dòng tiêu đề: in đậm, nền chàm nhạt, ghim lại khi cuộn
  const header = ws.getRow(1);
  header.font = { bold: true };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E7FF" },
  };
  header.alignment = { vertical: "middle" };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Một dòng ví dụ đã điền sẵn
  ws.addRow(
    Object.fromEntries(IMPORT_COLUMNS.map((c) => [c.key, c.example]))
  );
  ws.getRow(2).alignment = { wrapText: true, vertical: "top" };

  // Trang hướng dẫn riêng, để dòng ví dụ ở trên không bị lẫn chú thích
  const guide = wb.addWorksheet("Hướng dẫn");
  guide.columns = [
    { header: "Cột", key: "col", width: 22 },
    { header: "Bắt buộc", key: "req", width: 12 },
    { header: "Ghi chú", key: "note", width: 80 },
  ];
  guide.getRow(1).font = { bold: true };
  for (const c of IMPORT_COLUMNS) {
    guide.addRow({ col: c.header, req: c.required ? "Có" : "Không", note: c.note });
  }
  guide.addRow({});
  guide.addRow({
    col: "LƯU Ý",
    req: "",
    note: "Các dòng có cùng ngu_lieu_ma sẽ dùng chung một đoạn văn. Chỉ cần dán nội dung đoạn ở dòng đầu tiên.",
  });
  guide.addRow({
    col: "",
    req: "",
    note: "Sau khi nhập, hệ thống hiện màn rà soát. Dòng nào sai sẽ được chỉ rõ lý do và không được lưu.",
  });

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
