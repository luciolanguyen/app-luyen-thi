import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Flame,
  ListOrdered,
  Megaphone,
  Timer,
  Trophy,
} from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { EXAM_DEFAULTS } from "@/lib/exam-config";
import { ExamCountdown } from "@/components/exam-countdown";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const FOUR_TYPES = [
  {
    icon: Megaphone,
    name: "Điền từ vào thông báo",
    detail: "Quảng cáo, biển hiệu, tờ rơi",
  },
  {
    icon: ListOrdered,
    name: "Sắp xếp câu",
    detail: "Hội thoại và đoạn văn",
  },
  {
    icon: BookOpenCheck,
    name: "Hoàn thành đoạn văn",
    detail: "Cloze test theo ngữ cảnh",
  },
  {
    icon: BarChart3,
    name: "Đọc hiểu",
    detail: "Ý chính, suy luận, paraphrase",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/bang-dieu-khien");

  return (
    <main id="noi-dung-chinh" className="flex-1">
      {/* ------------------------------------------------------------------
          HERO — mở đầu bằng chính thứ đặc trưng nhất của thế giới này:
          phiếu trả lời 40 câu và bộ ba con số 40 / 50 / 0,25.
         ------------------------------------------------------------------ */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
              Cấu trúc đề áp dụng từ 2025 · QĐ 4068/QĐ-BGDĐT
            </p>

            <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
              40 câu. 50 phút.
              <br />
              <span className="text-primary">Không câu nào là may rủi.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Luyện đúng 4 dạng bài có trong đề thi tốt nghiệp THPT môn Tiếng
              Anh, thi thử trong phòng thi ảo tính giờ, và biết chính xác mình
              đang yếu ở đâu sau mỗi lần làm bài.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dang-ky"
                className={buttonClasses("primary", "lg", "px-7")}
              >
                Bắt đầu luyện miễn phí
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/dang-nhap"
                className={buttonClasses("outline", "lg", "px-6")}
              >
                Tôi đã có tài khoản
              </Link>
            </div>

            <ExamCountdown />
          </div>

          {/* Phiếu trả lời 40 câu — hình ảnh nhận ra ngay của kỳ thi này */}
          <AnswerSheetVisual />
        </div>
      </section>

      {/* ------------------------------------------------------------------
          4 DẠNG BÀI
         ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-bold tracking-tight">
          Luyện đúng 4 dạng bài của đề thật
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Mỗi dạng có chế độ luyện tự do (xem giải thích ngay sau mỗi câu) và
          luyện tính giờ để làm quen áp lực thời gian.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FOUR_TYPES.map(({ icon: Icon, name, detail }, i) => (
            <li
              key={name}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                  Dạng {i + 1}
                </span>
              </div>
              <p className="mt-3 font-bold">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------------
          BA TRỤ CỘT
         ------------------------------------------------------------------ */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
          <Pillar
            icon={<Timer className="size-5" aria-hidden="true" />}
            title="Phòng thi ảo đúng nhịp thi thật"
            body="Đồng hồ đếm ngược 50 phút do máy chủ giữ, thanh điều hướng 40 câu, đánh dấu câu cần xem lại, cảnh báo khi còn 5 phút và tự nộp khi hết giờ."
          />
          <Pillar
            icon={<BarChart3 className="size-5" aria-hidden="true" />}
            title="Báo cáo chỉ thẳng điểm yếu"
            body="Tỉ lệ đúng theo từng dạng bài và từng chuyên đề ngữ pháp, đường tiến bộ qua các lần thi thử, kèm gợi ý nên ôn phần nào trước trong tuần tới."
          />
          <Pillar
            icon={<Flame className="size-5" aria-hidden="true" />}
            title="Động lực để không bỏ giữa chừng"
            body="Chuỗi ngày học liên tục, huy hiệu theo cột mốc, điểm thưởng tích luỹ và bảng vinh danh theo tuần, tháng, lớp và trường."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <Trophy
          className="mx-auto size-10 text-primary"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance">
          Mỗi ngày một phiên luyện. Đến kỳ thi là quen tay.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Tạo tài khoản trong một phút, không mất phí, và bắt đầu ngay với phiên
          luyện đầu tiên.
        </p>
        <div className="mt-7">
          <Link href="/dang-ky" className={buttonClasses("primary", "lg", "px-8")}>
            Tạo tài khoản
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-sm text-muted-foreground">
        <p>
          Nền tảng luyện thi Tiếng Anh THPT · Nội dung câu hỏi do giáo viên biên
          soạn, không phải đề thi chính thức của Bộ GD&amp;ĐT.
        </p>
      </footer>
    </main>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

/**
 * Phiếu trả lời 40 câu. Thuần trang trí nên ẩn khỏi trình đọc màn hình —
 * mọi thông tin ở đây đã có trong phần chữ bên cạnh.
 */
function AnswerSheetVisual() {
  const filled = new Set([1, 2, 5, 8, 13, 21, 34]);

  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-border bg-background p-5 shadow-lg"
    >
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Phiếu trả lời trắc nghiệm
        </span>
        <span className="font-mono text-sm font-bold text-primary">
          {EXAM_DEFAULTS.durationMinutes}:00
        </span>
      </div>

      <div className="grid grid-cols-4 gap-x-4 gap-y-2 sm:grid-cols-5">
        {Array.from({ length: EXAM_DEFAULTS.totalQuestions }, (_, i) => {
          const n = i + 1;
          const answered = filled.has(n);
          return (
            <div key={n} className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-right font-mono text-[0.6875rem] text-muted-foreground">
                {n}
              </span>
              <div className="flex gap-0.5">
                {["A", "B", "C", "D"].map((k, ki) => (
                  <span
                    key={k}
                    className={
                      answered && ki === n % 4
                        ? "size-2.5 rounded-full bg-primary"
                        : "size-2.5 rounded-full border border-border-strong"
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">
          Mỗi câu đúng{" "}
          <strong className="text-foreground">
            {String(EXAM_DEFAULTS.pointsPerQuestion).replace(".", ",")} điểm
          </strong>
        </span>
        <span className="font-bold text-success">
          Tối đa {EXAM_DEFAULTS.maxScore},0
        </span>
      </div>
    </div>
  );
}
