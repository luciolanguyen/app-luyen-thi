"use client";

import { useEffect, useRef, useState } from "react";
import { AlarmClock } from "lucide-react";
import { cn, formatClock } from "@/lib/utils";
import { EXAM_WARNING_SECONDS } from "@/lib/exam-config";

/**
 * Đồng hồ đếm ngược tới `deadline` do SERVER đặt.
 *
 * Đồng hồ này chỉ để hiển thị. Việc chặn nộp muộn nằm ở phía server
 * (save_answer và submit_attempt đều so với deadline_at trong database),
 * nên học sinh có sửa giờ máy hay chỉnh JS cũng không kéo dài được thời gian.
 */
export function CountdownClock({
  deadline,
  onTimeUp,
  size = "sm",
}: {
  deadline: string;
  onTimeUp?: () => void;
  size?: "sm" | "lg";
}) {
  const deadlineMs = new Date(deadline).getTime();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((deadlineMs - Date.now()) / 1000))
  );
  const firedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const secs = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeUp?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs, onTimeUp]);

  const warning = remaining <= EXAM_WARNING_SECONDS && remaining > 0;
  const critical = remaining <= 60 && remaining > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md font-mono font-bold tabular-nums",
        size === "lg" ? "px-4 py-2.5 text-2xl" : "px-2.5 py-1.5 text-base",
        critical
          ? "bg-destructive text-on-destructive"
          : warning
            ? "bg-warning-soft text-warning"
            : "bg-muted text-foreground"
      )}
      // Chỉ thông báo lại khi đổi trạng thái cảnh báo, không đọc từng giây
      role="timer"
      aria-live={warning && !critical ? "polite" : "off"}
    >
      <AlarmClock
        className={cn(size === "lg" ? "size-6" : "size-4")}
        aria-hidden="true"
      />
      <span>{formatClock(remaining)}</span>
      <span className="sr-only">
        {warning
          ? `Còn ${Math.ceil(remaining / 60)} phút, hãy khẩn trương`
          : "thời gian còn lại"}
      </span>
    </div>
  );
}
