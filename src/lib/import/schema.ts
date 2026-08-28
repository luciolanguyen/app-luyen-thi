/**
 * Định dạng bảng nhập câu hỏi.
 *
 * Tên cột đặt bằng tiếng Việt không dấu vì người điền là giáo viên, và để
 * tránh lệ thuộc vào bộ gõ khi sửa file trên Excel/Google Sheets.
 */

export interface ImportColumn {
  key: string;
  header: string;
  required: boolean;
  width: number;
  note: string;
  example: string;
}

export const IMPORT_COLUMNS: ImportColumn[] = [
  {
    key: "dang_bai",
    header: "dang_bai",
    required: true,
    width: 14,
    note: "notice | ordering | cloze | reading | grammar | vocab",
    example: "grammar",
  },
  {
    key: "chuyen_de",
    header: "chuyen_de",
    required: false,
    width: 18,
    note: "Mã chuyên đề, để trống nếu không có. Xem trang Quản trị > Ngân hàng câu hỏi.",
    example: "conditional_1",
  },
  {
    key: "do_kho",
    header: "do_kho",
    required: false,
    width: 14,
    note: "nhan_biet | thong_hieu | van_dung | van_dung_cao. Bỏ trống = thong_hieu.",
    example: "thong_hieu",
  },
  {
    key: "cefr",
    header: "cefr",
    required: false,
    width: 8,
    note: "A2 | B1 | B2 | C1",
    example: "B1",
  },
  {
    key: "ngu_lieu_ma",
    header: "ngu_lieu_ma",
    required: false,
    width: 14,
    note: "Các dòng có CÙNG mã sẽ dùng chung một đoạn văn. Chỉ cần cho cloze và đọc hiểu.",
    example: "bai_doc_1",
  },
  {
    key: "ngu_lieu_loai",
    header: "ngu_lieu_loai",
    required: false,
    width: 14,
    note: "notice | ordering | cloze | reading",
    example: "reading",
  },
  {
    key: "ngu_lieu_tieu_de",
    header: "ngu_lieu_tieu_de",
    required: false,
    width: 24,
    note: "Tiêu đề đoạn văn",
    example: "The return of the night train",
  },
  {
    key: "ngu_lieu_noi_dung",
    header: "ngu_lieu_noi_dung",
    required: false,
    width: 50,
    note: "Toàn văn đoạn. Chỉ cần điền ở dòng ĐẦU TIÊN của mỗi mã ngữ liệu.",
    example: "For decades, the night train seemed...",
  },
  {
    key: "thu_tu_trong_bai",
    header: "thu_tu_trong_bai",
    required: false,
    width: 16,
    note: "Câu số mấy trong đoạn (1, 2, 3...)",
    example: "1",
  },
  {
    key: "cau_hoi",
    header: "cau_hoi",
    required: true,
    width: 44,
    note: "Nội dung câu hỏi",
    example: "If the weather ______ fine tomorrow, we will go out.",
  },
  { key: "phuong_an_a", header: "phuong_an_a", required: true, width: 22, note: "Phương án A", example: "is" },
  { key: "phuong_an_b", header: "phuong_an_b", required: true, width: 22, note: "Phương án B", example: "will be" },
  { key: "phuong_an_c", header: "phuong_an_c", required: true, width: 22, note: "Phương án C", example: "were" },
  { key: "phuong_an_d", header: "phuong_an_d", required: true, width: 22, note: "Phương án D", example: "would be" },
  {
    key: "dap_an",
    header: "dap_an",
    required: true,
    width: 8,
    note: "A, B, C hoặc D",
    example: "A",
  },
  {
    key: "giai_thich",
    header: "giai_thich",
    required: true,
    width: 50,
    note: "BẮT BUỘC. Học sinh đọc phần này để hiểu vì sao sai.",
    example: "Câu điều kiện loại 1: mệnh đề if dùng hiện tại đơn, không dùng will.",
  },
  {
    key: "meo",
    header: "meo",
    required: false,
    width: 40,
    note: "Mẹo làm bài, hiện sau khi học sinh trả lời",
    example: "Không bao giờ có 'will' ngay sau 'if' trong câu điều kiện loại 1.",
  },
];

/** Một dòng đã chuẩn hoá, khớp với bảng import_items trong database. */
export interface ParsedRow {
  row_no: number;
  type_code: string | null;
  topic_code: string | null;
  difficulty: string | null;
  cefr_level: string | null;
  stem: string | null;
  options: { key: "A" | "B" | "C" | "D"; text: string }[] | null;
  correct_key: string | null;
  explanation: string | null;
  tip: string | null;
  passage_ref: string | null;
  passage_kind: string | null;
  passage_title: string | null;
  passage_content: string | null;
  position_in_passage: number | null;
}

export interface ParseResult {
  rows: ParsedRow[];
  /** Lỗi ở mức cả file (thiếu cột, file rỗng...) chứ không phải từng dòng. */
  fileErrors: string[];
}
