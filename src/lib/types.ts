export type UserRole = "student" | "teacher" | "admin" | "parent";

export type DifficultyLevel =
  | "nhan_biet"
  | "thong_hieu"
  | "van_dung"
  | "van_dung_cao";

export type AttemptMode = "practice_free" | "practice_timed" | "exam";
export type AttemptStatus = "in_progress" | "submitted" | "expired";
export type PassageKind = "notice" | "ordering" | "cloze" | "reading";
export type OptionKey = "A" | "B" | "C" | "D";

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  nhan_biet: "Nhận biết",
  thong_hieu: "Thông hiểu",
  van_dung: "Vận dụng",
  van_dung_cao: "Vận dụng cao",
};

/** Màu token tương ứng 4 mức độ khó — dùng chung cho chip, biểu đồ, bộ lọc. */
export const DIFFICULTY_TOKENS: Record<DifficultyLevel, string> = {
  nhan_biet: "var(--color-level-1)",
  thong_hieu: "var(--color-level-2)",
  van_dung: "var(--color-level-3)",
  van_dung_cao: "var(--color-level-4)",
};

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  school: string | null;
  class_name: string | null;
  avatar_url: string | null;
  leaderboard_anonymous: boolean;
  xp: number;
}

export interface QuestionType {
  id: number;
  code: string;
  name_vi: string;
  description: string | null;
  in_real_exam: boolean;
  sort_order: number;
}

export interface Topic {
  id: number;
  code: string;
  name_vi: string;
  kind: "grammar" | "vocab";
  sort_order: number;
}

export interface QuestionOption {
  key: OptionKey;
  text: string;
}

/** Câu trả về từ RPC get_attempt_questions. Các trường đáp án là null khi
 *  đang trong lúc thi — server chỉ tiết lộ sau khi nộp. */
export interface AttemptQuestion {
  /** Số thứ tự câu trong lượt làm bài. Tên là `question_no` chứ không phải
   *  `position` vì `position` là từ khoá SQL, không dùng được trong RETURNS TABLE. */
  question_no: number;
  question_id: string;
  type_id: number;
  stem: string;
  options: QuestionOption[];
  difficulty: DifficultyLevel;
  passage_id: string | null;
  passage_kind: PassageKind | null;
  passage_title: string | null;
  passage_content: string | null;
  passage_meta: { sentences?: { label: string; text: string }[] } | null;
  selected_key: OptionKey | null;
  marked_for_review: boolean;
  is_correct: boolean | null;
  correct_key: OptionKey | null;
  explanation: string | null;
  tip: string | null;
}

/** Một dòng đếm từ RPC question_bank_counts — chỉ có con số, không có đáp án. */
export interface BankCount {
  type_id: number;
  difficulty: DifficultyLevel;
  topic_id: number | null;
  n: number;
}

export interface Attempt {
  id: string;
  user_id: string;
  mode: AttemptMode;
  exam_id: string | null;
  type_id: number | null;
  topic_id: number | null;
  difficulty: DifficultyLevel | null;
  status: AttemptStatus;
  total_questions: number;
  correct_count: number;
  score: number | null;
  deadline_at: string | null;
  duration_seconds: number | null;
  started_at: string;
  submitted_at: string | null;
  tab_switches: number;
}

export interface SubmitResult {
  already_submitted: boolean;
  expired?: boolean;
  score: number;
  correct_count: number;
  total: number;
  duration_seconds?: number;
  points_earned?: number;
  new_badges?: { code: string; name: string; icon: string; points: number }[];
}

export interface Overview {
  exam_count: number;
  avg_score: number;
  best_score: number;
  last_score: number;
  trend: number;
  practice_sessions: number;
  questions_done: number;
  accuracy: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  xp: number;
  points: number;
  badge_count: number;
}

export interface TypePerformance {
  type_id: number;
  code: string;
  name_vi: string;
  answered: number;
  correct: number;
  accuracy: number;
  avg_seconds: number;
}

export interface TopicPerformance {
  topic_id: number;
  code: string;
  name_vi: string;
  kind: "grammar" | "vocab";
  answered: number;
  correct: number;
  accuracy: number;
}

export interface ProgressPoint {
  attempt_id: string;
  submitted_at: string;
  score: number;
  correct_count: number;
  total_questions: number;
  exam_title: string;
  duration_seconds: number;
}

export interface StudyPlanItem {
  kind: "type" | "topic";
  ref_id: number;
  label: string;
  accuracy: number;
  answered: number;
  reason: string;
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  display_name: string;
  school: string | null;
  class_name: string | null;
  value: number;
  is_me: boolean;
}

export type LeaderboardMetric =
  | "exam_score"
  | "points"
  | "practice_time"
  | "streak";
export type LeaderboardPeriod = "week" | "month" | "all";

export const LEADERBOARD_METRICS: {
  value: LeaderboardMetric;
  label: string;
  unit: string;
}[] = [
  { value: "exam_score", label: "Điểm thi thử cao nhất", unit: "điểm" },
  { value: "points", label: "Điểm tích luỹ", unit: "điểm thưởng" },
  { value: "practice_time", label: "Thời gian luyện tập", unit: "phút" },
  { value: "streak", label: "Chuỗi ngày dài nhất", unit: "ngày" },
];
