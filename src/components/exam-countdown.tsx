"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { EXAM_DATE_ESTIMATE, EXAM_DATE_IS_ESTIMATE } from "@/lib/exam-config";

/**
 * Đếm ngược tới ngày thi. Tính ở client sau khi mount để tránh lệch
 * server/client khi hydrate (server render lúc khác client một vài giây).
 */
export function ExamCountdown() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const diff = EXAM_DATE_ESTIMATE.getTime() - Date.now();
      // Cho phép số âm: mốc đã qua là thông tin cần nói ra, không phải
      // thứ để kẹp về 0 rồi hiện "còn 0 ngày" một cách vô nghĩa.
      setDays(Math.ceil(diff / 86_400_000));
    };
    compute();
    // Cập nhật mỗi giờ là đủ cho đơn vị ngày
    const id = setInterval(compute, 3_600_000);
    return () => clearInterval(id);
  }, []);

  if (days === null) {
    return <div className="mt-8 h-[52px]" aria-hidden="true" />;
  }

  // Mốc đã trôi qua -> nói thẳng là cấu hình đã cũ, đừng đếm ngược số âm
  if (days <= 0) {
    return (
      <div className="mt-8 flex items-start gap-3 rounded-md border border-warning bg-warning-soft px-4 py-3">
        <CalendarClock
          className="mt-0.5 size-5 shrink-0 text-warning"
          aria-hidden="true"
        />
        <p className="text-sm text-warning">
          Ngày thi đang cấu hình đã trôi qua. Quản trị viên cần cập nhật{" "}
          <code className="font-mono font-bold">EXAM_DATE_ESTIMATE</code> trong{" "}
          <code className="font-mono">src/lib/exam-config.ts</code> theo lịch thi
          mới nhất.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3">
      <CalendarClock
        className="size-5 shrink-0 text-primary"
        aria-hidden="true"
      />
      <p className="text-sm">
        Còn <strong className="text-primary">{days.toLocaleString("vi-VN")} ngày</strong>{" "}
        nữa là tới kỳ thi
        {EXAM_DATE_IS_ESTIMATE && (
          <span className="text-muted-foreground">
            {" "}
            (ngày dự kiến — cập nhật khi Bộ công bố lịch chính thức)
          </span>
        )}
      </p>
    </div>
  );
}
