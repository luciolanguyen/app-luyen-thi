import Link from "next/link";
import type { Metadata } from "next";
import { CalendarClock, ChevronLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/ui";
import { ExamScheduleCard } from "./schedule-card";
import { NewClassForm } from "./new-class-form";

export const metadata: Metadata = { title: "Lịch thi" };

export interface ClassRow {
  id: string;
  name: string;
  school: string | null;
  member_count: number;
}

export interface AssignmentRow {
  id: string;
  exam_id: string;
  class_id: string;
  open_at: string | null;
  close_at: string | null;
  max_attempts: number | null;
}

export interface ExamRow {
  id: string;
  title: string;
  is_published: boolean;
  open_at: string | null;
  close_at: string | null;
  restricted_to_classes: boolean;
  created_at: string;
}

export default async function SchedulePage() {
  const supabase = await createClient();

  const [{ data: exams }, { data: classes }, { data: assignments }, { data: members }] =
    await Promise.all([
      supabase
        .from("exams")
        .select("id, title, is_published, open_at, close_at, restricted_to_classes, created_at")
        .order("created_at", { ascending: false })
        .returns<ExamRow[]>(),
      supabase
        .from("classes")
        .select("id, name, school")
        .order("name")
        .returns<{ id: string; name: string; school: string | null }[]>(),
      supabase
        .from("exam_assignments")
        .select("id, exam_id, class_id, open_at, close_at, max_attempts")
        .returns<AssignmentRow[]>(),
      supabase.from("class_members").select("class_id"),
    ]);

  const memberCount = new Map<string, number>();
  for (const m of members ?? []) {
    memberCount.set(m.class_id, (memberCount.get(m.class_id) ?? 0) + 1);
  }

  const classList: ClassRow[] = (classes ?? []).map((c) => ({
    ...c,
    member_count: memberCount.get(c.id) ?? 0,
  }));

  const byExam = new Map<string, AssignmentRow[]>();
  for (const a of assignments ?? []) {
    byExam.set(a.exam_id, [...(byExam.get(a.exam_id) ?? []), a]);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Link
        href="/quan-tri"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Quản trị
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Lịch thi &amp; giao bài
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Đặt khung giờ mở–đóng cho từng đề và giao đề cho lớp cụ thể.
        </p>
      </header>

      <Alert tone="primary" className="mb-6">
        <p className="flex items-start gap-2">
          <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Giờ nhập theo <strong>múi giờ Việt Nam</strong>. Khung giờ được chặn
            ở máy chủ — ngoài giờ, học sinh không vào được kể cả khi gọi thẳng
            API. Nếu giờ đóng tới trước khi hết thời lượng làm bài, hệ thống tự
            cắt hạn nộp về mốc đóng.
          </span>
        </p>
      </Alert>

      {/* ------------------------------ Lớp học --------------------------- */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" aria-hidden="true" />
            Lớp học
          </CardTitle>
          <CardDescription>
            Cần có lớp trước khi giao đề. Học sinh được thêm vào lớp ở trang
            Danh sách học sinh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classList.length > 0 && (
            <ul className="mb-5 flex flex-wrap gap-2">
              {classList.map((c) => (
                <li
                  key={c.id}
                  className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm"
                >
                  <strong>{c.name}</strong>
                  {c.school && (
                    <span className="text-muted-foreground"> · {c.school}</span>
                  )}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {c.member_count} học sinh
                  </span>
                </li>
              ))}
            </ul>
          )}
          <NewClassForm />
        </CardContent>
      </Card>

      {/* ------------------------------ Đề thi ---------------------------- */}
      <h2 className="mb-4 text-lg font-bold">Đề thi</h2>

      {!exams || exams.length === 0 ? (
        <EmptyState
          title="Chưa có đề thi nào"
          description="Tạo đề trong phần quản lý đề trước khi lập lịch."
        />
      ) : (
        <ul className="space-y-4">
          {exams.map((e) => (
            <li key={e.id}>
              <ExamScheduleCard
                exam={e}
                classes={classList}
                assignments={byExam.get(e.id) ?? []}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
