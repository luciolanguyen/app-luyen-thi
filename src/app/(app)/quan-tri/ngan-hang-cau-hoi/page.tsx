import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_LABELS,
  type DifficultyLevel,
  type QuestionType,
} from "@/lib/types";

export const metadata: Metadata = { title: "Ngân hàng câu hỏi" };

interface QuestionRow {
  id: string;
  type_id: number;
  stem: string;
  correct_key: string;
  explanation: string;
  difficulty: DifficultyLevel;
  cefr_level: string | null;
  source: string | null;
  topics: { name_vi: string } | null;
}

const PAGE_SIZE = 25;

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ dang?: string; muc?: string; trang?: string }>;
}) {
  const sp = await searchParams;
  const typeFilter = sp.dang ? Number(sp.dang) : null;
  const diffFilter = (sp.muc as DifficultyLevel) || null;
  const page = Math.max(1, Number(sp.trang ?? 1));

  const supabase = await createClient();

  let query = supabase
    .from("questions")
    .select(
      "id, type_id, stem, correct_key, explanation, difficulty, cefr_level, source, topics(name_vi)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("type_id")
    .order("created_at")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (typeFilter) query = query.eq("type_id", typeFilter);
  if (diffFilter) query = query.eq("difficulty", diffFilter);

  const [{ data: questions, count }, { data: types }] = await Promise.all([
    query.returns<QuestionRow[]>(),
    supabase
      .from("question_types")
      .select("*")
      .order("sort_order")
      .returns<QuestionType[]>(),
  ]);

  const typeName = new Map((types ?? []).map((t) => [t.id, t.name_vi]));
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const href = (patch: Record<string, string>) => {
    const q = new URLSearchParams();
    const merged = {
      dang: typeFilter ? String(typeFilter) : "",
      muc: diffFilter ?? "",
      trang: "1",
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    return `/quan-tri/ngan-hang-cau-hoi?${q}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Link
        href="/quan-tri"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Quản trị
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ngân hàng câu hỏi
        </h1>
        <p className="mt-1 text-muted-foreground">
          {count ?? 0} câu khớp bộ lọc hiện tại.
        </p>
      </header>

      {/* ------------------------------ Bộ lọc ---------------------------- */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-xs font-semibold text-muted-foreground">
            Dạng bài
          </span>
          <FilterLink href={href({ dang: "" })} active={!typeFilter}>
            Tất cả
          </FilterLink>
          {(types ?? []).map((t) => (
            <FilterLink
              key={t.id}
              href={href({ dang: String(t.id) })}
              active={typeFilter === t.id}
            >
              {t.name_vi}
            </FilterLink>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-xs font-semibold text-muted-foreground">
            Độ khó
          </span>
          <FilterLink href={href({ muc: "" })} active={!diffFilter}>
            Tất cả
          </FilterLink>
          {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((d) => (
            <FilterLink
              key={d}
              href={href({ muc: d })}
              active={diffFilter === d}
            >
              {DIFFICULTY_LABELS[d]}
            </FilterLink>
          ))}
        </div>
      </div>

      {/* ----------------------------- Danh sách -------------------------- */}
      {!questions || questions.length === 0 ? (
        <EmptyState
          title="Không có câu hỏi nào khớp bộ lọc"
          description="Thử bỏ bớt điều kiện lọc, hoặc bổ sung câu hỏi mới vào ngân hàng."
        />
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="primary">
                      {typeName.get(q.type_id) ?? `Dạng ${q.type_id}`}
                    </Badge>
                    <Badge>{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                    {q.cefr_level && <Badge>{q.cefr_level}</Badge>}
                    {q.topics && <Badge>{q.topics.name_vi}</Badge>}
                    <span className="ml-auto font-mono text-sm font-bold text-success">
                      Đáp án {q.correct_key}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed font-medium">{q.stem}</p>

                  {/* Cảnh báo chất lượng ngay trong danh sách để dễ rà soát */}
                  {!q.explanation && (
                    <p className="mt-2 text-xs font-semibold text-destructive">
                      Thiếu giải thích — học sinh sẽ không hiểu vì sao sai.
                    </p>
                  )}
                  {q.source && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Nguồn: {q.source}
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* ------------------------------ Phân trang ------------------------ */}
      {totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-center gap-2"
          aria-label="Phân trang"
        >
          {page > 1 && (
            <Link
              href={href({ trang: String(page - 1) })}
              className="rounded-md border border-border-strong bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Trang trước
            </Link>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={href({ trang: String(page + 1) })}
              className="rounded-md border border-border-strong bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Trang sau
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-border-strong bg-card hover:bg-primary-soft"
      )}
    >
      {children}
    </Link>
  );
}
