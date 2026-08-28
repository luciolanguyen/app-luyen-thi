"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatScore } from "@/lib/utils";
import type { ProgressPoint } from "@/lib/types";

/* ============================================================================
   GHI CHÚ VỀ MÀU
   Cả hai biểu đồ ở đây đều chỉ có MỘT chuỗi dữ liệu, nên dùng một sắc màu duy
   nhất (indigo #4F46E5 — đã chạy qua validator, đạt cả 5 kiểm tra trên nền
   trắng). Cố ý KHÔNG tô cột theo mức tốt/yếu: bộ ba xanh–cam–đỏ có ΔE chỉ 2.8
   với người mù màu deutan, tức học sinh mù màu đỏ-lục sẽ không phân biệt được
   "cần củng cố" và "điểm yếu". Phán xét tốt/yếu do CHỮ đảm nhiệm.
   ========================================================================== */

const INK = "var(--color-muted-foreground)";
const SERIES = "var(--color-primary)";

/**
 * Biểu đồ tiến bộ: điểm thi thử theo thời gian.
 * Một chuỗi duy nhất nên không cần chú giải — tiêu đề đã nói rõ đây là gì.
 */
export function ProgressChart({ data }: { data: ProgressPoint[] }) {
  const chartData = data.map((d) => ({
    date: formatDate(d.submitted_at),
    score: Number(d.score),
    correct: d.correct_count,
    total: d.total_questions,
  }));

  const avg =
    chartData.reduce((s, d) => s + d.score, 0) / Math.max(1, chartData.length);

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: INK }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 11, fill: INK }}
              tickLine={false}
              axisLine={false}
            />

            {/* Đường tham chiếu điểm trung bình — cho biết mốc của chính mình */}
            {chartData.length > 1 && (
              <ReferenceLine
                y={avg}
                stroke={INK}
                strokeDasharray="4 4"
                label={{
                  value: `TB ${formatScore(avg)}`,
                  position: "right",
                  fontSize: 11,
                  fill: INK,
                }}
              />
            )}

            <Tooltip
              cursor={{ stroke: INK, strokeDasharray: "3 3" }}
              contentStyle={{
                borderRadius: "0.625rem",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
                fontSize: "0.8125rem",
              }}
              labelStyle={{ fontWeight: 700, marginBottom: 4 }}
              formatter={(value, _name, item) => {
                const p = item?.payload as
                  | { correct: number; total: number }
                  | undefined;
                return [
                  `${formatScore(Number(value))} điểm${
                    p ? ` — ${p.correct}/${p.total} câu đúng` : ""
                  }`,
                  "",
                ];
              }}
            />

            <Line
              type="monotone"
              dataKey="score"
              stroke={SERIES}
              strokeWidth={2}
              dot={{ r: 4, fill: SERIES, strokeWidth: 2, stroke: "var(--color-card)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bảng dữ liệu thay thế — người dùng trình đọc màn hình vẫn nắm được số */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Xem dạng bảng
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 font-semibold">Ngày</th>
                <th className="py-2 font-semibold">Điểm</th>
                <th className="py-2 font-semibold">Câu đúng</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2">{d.date}</td>
                  <td className="py-2 font-mono font-bold">
                    {formatScore(d.score)}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {d.correct}/{d.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
