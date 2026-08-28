import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { rpcList } from "@/lib/supabase/rpc";
import { ExamRoom } from "./exam-room";
import type { Attempt, AttemptQuestion } from "@/lib/types";

export const metadata: Metadata = {
  title: "Phòng thi",
  // Phòng thi không nên bị index hay hiện trong lịch sử chia sẻ
  robots: { index: false, follow: false },
};

export default async function ExamRoomPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const [{ data: attempt }, questions] = await Promise.all([
    supabase.from("attempts").select("*").eq("id", attemptId).single<Attempt>(),
    rpcList<AttemptQuestion>(supabase, "get_attempt_questions", {
      p_attempt_id: attemptId,
    }),
  ]);

  if (!attempt || questions.length === 0) notFound();
  if (attempt.status !== "in_progress") redirect(`/ket-qua/${attemptId}`);

  const { data: exam } = await supabase
    .from("exams")
    .select("title")
    .eq("id", attempt.exam_id!)
    .single<{ title: string }>();

  return (
    <ExamRoom
      attempt={attempt}
      questions={questions}
      examTitle={exam?.title ?? "Bài thi thử"}
    />
  );
}
