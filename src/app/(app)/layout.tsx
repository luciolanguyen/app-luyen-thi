import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import type { Profile } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, school, class_name, avatar_url, leaderboard_anonymous, xp")
    .eq("id", user.id)
    .single<Profile>();

  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-full flex-col">
      <AppNav
        profile={profile}
        streak={streak?.current_streak ?? 0}
        email={user.email ?? ""}
      />
      <main id="noi-dung-chinh" className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
