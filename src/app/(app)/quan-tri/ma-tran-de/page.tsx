import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Alert, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { MatrixEditor } from "./matrix-editor";
import type { QuestionType } from "@/lib/types";

export const metadata: Metadata = { title: "Ma trận đề thi" };

export interface MatrixItem {
  id: string;
  type_id: number;
  question_count: number;
  difficulty_mix: Record<string, number>;
  sort_order: number;
}

export interface Matrix {
  id: string;
  name: string;
  description: string | null;
  total_questions: number;
  duration_seconds: number;
  points_per_question: number;
  max_score: number;
  is_default: boolean;
  exam_matrix_items: MatrixItem[];
}

export default async function MatrixPage() {
  const supabase = await createClient();

  const [{ data: matrices }, { data: types }] = await Promise.all([
    supabase
      .from("exam_matrices")
      .select(
        "id, name, description, total_questions, duration_seconds, points_per_question, max_score, is_default, exam_matrix_items(id, type_id, question_count, difficulty_mix, sort_order)"
      )
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .returns<Matrix[]>(),
    supabase
      .from("question_types")
      .select("*")
      .eq("in_real_exam", true)
      .order("sort_order")
      .returns<QuestionType[]>(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href="/quan-tri"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Quản trị
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ma trận đề thi
        </h1>
        <p className="mt-1 text-muted-foreground">
          Số câu mỗi dạng, thời gian và thang điểm của đề thi thử.
        </p>
      </header>

      <Alert tone="primary" className="mb-6">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Cấu trúc đề do Bộ GD&amp;ĐT quy định và có thể điều chỉnh theo từng
            năm. Sửa trực tiếp tại đây — <strong>không cần lập trình viên can
            thiệp vào mã nguồn</strong>. Số câu đang cấu hình sẵn là điểm khởi
            đầu, cần đối chiếu với đề minh hoạ mới nhất.
          </span>
        </p>
      </Alert>

      {(matrices ?? []).map((m) => (
        <Card key={m.id} className="mb-6">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {m.name}
              {m.is_default && (
                <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                  Mặc định
                </span>
              )}
            </CardTitle>
            {m.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {m.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <MatrixEditor matrix={m} types={types ?? []} />
          </CardContent>
        </Card>
      ))}

      {(!matrices || matrices.length === 0) && (
        <p className="text-sm text-muted-foreground">
          Chưa có ma trận nào. Chạy file seed để tạo ma trận chuẩn.
        </p>
      )}
    </div>
  );
}
