"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  BarChart3,
  ChevronDown,
  Coins,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Timer,
  Trophy,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth/actions";
import type { Profile } from "@/lib/types";

/** Tối đa 5 mục ở thanh dưới cùng trên mobile — quá 5 là khó bấm và khó nhớ. */
const PRIMARY_NAV = [
  { href: "/bang-dieu-khien", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/luyen-tap", label: "Luyện tập", icon: GraduationCap },
  { href: "/thi-thu", label: "Thi thử", icon: Timer },
  { href: "/bao-cao", label: "Báo cáo", icon: BarChart3 },
  { href: "/vinh-danh", label: "Vinh danh", icon: Trophy },
];

const SECONDARY_NAV = [
  { href: "/thanh-tich", label: "Thành tích", icon: Award },
  { href: "/diem-thuong", label: "Điểm thưởng", icon: Coins },
  { href: "/ho-so", label: "Hồ sơ cá nhân", icon: User },
];

export function AppNav({
  profile,
  streak,
  email,
}: {
  profile: Profile | null;
  streak: number;
  email: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isStaff = profile?.role === "teacher" || profile?.role === "admin";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* ------------------------------- Thanh trên ------------------------ */}
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link
            href="/bang-dieu-khien"
            className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-on-primary">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">Luyện thi THPT</span>
          </Link>

          {/* Điều hướng chính — chỉ hiện trên màn lớn, mobile dùng thanh dưới */}
          <nav
            aria-label="Điều hướng chính"
            className="ml-4 hidden flex-1 items-center gap-1 lg:flex"
          >
            {PRIMARY_NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200",
                  isActive(href)
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {/* Chuỗi ngày học — luôn thấy được để nhắc học sinh giữ streak */}
            <span
              className="flex items-center gap-1.5 rounded-md bg-warning-soft px-2.5 py-1.5 text-sm font-bold text-warning"
              title={`Chuỗi ${streak} ngày liên tiếp`}
            >
              <Flame className="size-4" aria-hidden="true" />
              {streak}
              <span className="sr-only">ngày học liên tiếp</span>
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold transition-colors duration-200 hover:bg-muted"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {initials(profile?.full_name || email)}
                </span>
                <ChevronDown className="size-4" aria-hidden="true" />
                <span className="sr-only">Mở menu tài khoản</span>
              </button>

              {menuOpen && (
                <>
                  {/* Lớp phủ để bấm ra ngoài là đóng menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
                  >
                    <div className="border-b border-border p-3">
                      <p className="truncate font-bold">
                        {profile?.full_name || "Học sinh"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {email}
                      </p>
                      {profile?.class_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {profile.class_name}
                          {profile.school ? ` · ${profile.school}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="p-1.5">
                      {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-200 hover:bg-muted"
                        >
                          <Icon
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          {label}
                        </Link>
                      ))}

                      {isStaff && (
                        <Link
                          href="/quan-tri"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-200 hover:bg-muted"
                        >
                          <Settings
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          Quản trị
                        </Link>
                      )}
                    </div>

                    <form action={logout} className="border-t border-border p-1.5">
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-destructive-strong transition-colors duration-200 hover:bg-destructive-soft"
                      >
                        <LogOut className="size-4" aria-hidden="true" />
                        Đăng xuất
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------ Thanh dưới ------------------------- */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon
                    className={cn("size-5", active && "stroke-[2.5]")}
                    aria-hidden="true"
                  />
                  <span className="text-[0.6875rem] leading-tight font-semibold">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  // Tên tiếng Việt: lấy chữ cái đầu của họ và của tên gọi (chữ cuối)
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
