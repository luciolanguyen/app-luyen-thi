"use client";

import { useState, useTransition } from "react";
import { Check, Plus, X } from "lucide-react";
import { setClassMembership } from "@/lib/actions/schedule";
import { cn } from "@/lib/utils";

export interface ClassOption {
  id: string;
  name: string;
}

/**
 * Ô "Lớp" trong bảng học sinh: hiện các lớp đang thuộc, và cho phép thêm/bớt.
 *
 * Việc gán lớp phải nằm ở đây vì đây là nơi giáo viên nhìn thấy học sinh.
 * Giao đề cho lớp mà không có cách thêm học sinh vào lớp thì tính năng vô dụng.
 */
export function ClassCell({
  studentId,
  studentName,
  classes,
  memberOf,
}: {
  studentId: string;
  studentName: string;
  classes: ClassOption[];
  memberOf: string[];
}) {
  const [members, setMembers] = useState<string[]>(memberOf);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const available = classes.filter((c) => !members.includes(c.id));

  const change = (classId: string, join: boolean) => {
    setMembers((prev) =>
      join ? [...prev, classId] : prev.filter((id) => id !== classId)
    );
    setAdding(false);

    const fd = new FormData();
    fd.set("studentId", studentId);
    fd.set("classId", classId);
    fd.set("join", join ? "1" : "0");
    startTransition(() => {
      void setClassMembership(fd);
    });
  };

  if (classes.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Chưa có lớp nào
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {members.map((id) => {
        const c = classes.find((x) => x.id === id);
        if (!c) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary"
          >
            {c.name}
            <button
              type="button"
              onClick={() => change(id, false)}
              aria-label={`Bỏ ${studentName} khỏi lớp ${c.name}`}
              className="cursor-pointer rounded-full hover:bg-primary hover:text-on-primary"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        );
      })}

      {available.length > 0 &&
        (adding ? (
          <span className="inline-flex flex-wrap gap-1">
            {available.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => change(c.id, true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border-strong px-2 py-0.5 text-xs font-semibold hover:bg-success-soft"
              >
                <Check className="size-3" aria-hidden="true" />
                {c.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="cursor-pointer text-xs text-muted-foreground hover:underline"
            >
              Huỷ
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label={`Thêm ${studentName} vào lớp`}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-border-strong px-2 py-0.5",
              "text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            <Plus className="size-3" aria-hidden="true" />
            Thêm lớp
          </button>
        ))}
    </div>
  );
}
