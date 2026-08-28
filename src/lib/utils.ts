import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 3000 -> "50:00". Dùng cho đồng hồ đếm ngược phòng thi. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** 3725 -> "1 giờ 2 phút". Dùng cho thống kê thời lượng đã luyện. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} giờ${m > 0 ? ` ${m} phút` : ""}`;
  if (m > 0) return `${m} phút`;
  return `${s} giây`;
}

/** Điểm hiển thị theo quy ước Việt Nam: dấu phẩy thập phân, 8 -> "8,00". */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  return score.toFixed(2).replace(".", ",");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Xếp loại theo % đúng — dùng thống nhất ở báo cáo và màn kết quả. */
export function accuracyBand(accuracy: number): {
  label: string;
  tone: "success" | "warning" | "destructive";
} {
  if (accuracy >= 80) return { label: "Vững", tone: "success" };
  if (accuracy >= 60) return { label: "Cần củng cố", tone: "warning" };
  return { label: "Điểm yếu", tone: "destructive" };
}

/** Nhận xét ngắn kèm điểm thi thử, theo thang 10. */
export function scoreComment(score: number): string {
  if (score >= 9) return "Xuất sắc — giữ vững phong độ này.";
  if (score >= 8) return "Rất tốt, chỉ còn vài lỗi nhỏ cần dọn.";
  if (score >= 6.5) return "Khá — tập trung vào các dạng bài còn yếu.";
  if (score >= 5) return "Đạt, nhưng còn nhiều điểm cần cải thiện.";
  return "Cần ôn lại nền tảng trước khi luyện đề tiếp.";
}
