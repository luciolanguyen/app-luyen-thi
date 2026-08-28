import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { rpcList } from "@/lib/supabase/rpc";
import { PracticeRunner } from "./runner";
import type { Attempt, AttemptQuestion } from "@/lib/types";

export const metadata: Metadata = { title: "Đang luyện tập" };

export default async function PracticeRunPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const [{ data: attempt }, questions] = await Promise.all([
    supabase.from("attempts").select("*").eq("id", attemptId).single<Attempt>(),
    rpcList<AttemptQuestion>(supabase, "get_attempt_questions", {
      p_attempt_id: attemptId,
    }),
  ]);

  if (!attempt || questions.length === 0) notFound();

  // Bài đã nộp thì đưa thẳng tới trang kết quả, không cho làm lại
  if (attempt.status !== "in_progress") {
    redirect(`/ket-qua/${attemptId}`);
  }

  // Lượt thi thử có màn hình riêng (phòng thi ảo)
  if (attempt.mode === "exam") {
    redirect(`/phong-thi/${attemptId}`);
  }

  const { data: type } = await supabase
    .from("question_types")
    .select("name_vi")
    .eq("id", attempt.type_id!)
    .single<{ name_vi: string }>();

  return (
    <PracticeRunner
      attempt={attempt}
      questions={questions}
      typeName={type?.name_vi ?? "Luyện tập"}
    />
  );
}
