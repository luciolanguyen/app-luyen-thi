import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Luyện thi Tiếng Anh THPT 2026",
    template: "%s · Luyện thi Tiếng Anh THPT 2026",
  },
  description:
    "Nền tảng luyện thi Tiếng Anh tốt nghiệp THPT bám sát cấu trúc đề 2025–2026: 40 câu, 50 phút, 4 dạng bài chính. Luyện theo dạng, thi thử tính giờ, báo cáo năng lực chi tiết.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Không đặt maximumScale/userScalable=no — chặn zoom là lỗi accessibility.
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#noi-dung-chinh"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-3 focus:left-3 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary focus:shadow-lg"
        >
          Bỏ qua, tới nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}
