/**
 * Các hằng số hiển thị ở phía client.
 *
 * LƯU Ý: đây chỉ là giá trị để HIỂN THỊ khi chưa tải được ma trận từ database.
 * Nguồn sự thật cho số câu / thời gian / thang điểm là bảng `exam_matrices`,
 * do admin chỉnh trong trang Quản trị (yêu cầu ở mục 0 và mục 7 của spec).
 */
export const EXAM_DEFAULTS = {
  totalQuestions: 40,
  durationMinutes: 50,
  pointsPerQuestion: 0.25,
  maxScore: 10,
} as const;

/**
 * Ngày thi dự kiến, dùng cho đồng hồ đếm ngược ở trang chủ.
 * Bộ GD&ĐT công bố lịch chính thức hằng năm — sửa lại khi có lịch thật.
 */
export const EXAM_DATE_ESTIMATE = new Date("2026-06-26T07:30:00+07:00");
export const EXAM_DATE_IS_ESTIMATE = true;

/** Cảnh báo khi còn 5 phút (spec 4.2). */
export const EXAM_WARNING_SECONDS = 5 * 60;

/** Ngưỡng số lần rời tab trước khi hiện cảnh báo nghiêm túc. */
export const TAB_SWITCH_WARN_AT = 3;
