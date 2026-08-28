import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ProfileForm } from "./profile-form";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Hồ sơ cá nhân" };

const ROLE_LABELS: Record<Profile["role"], string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  admin: "Quản trị viên",
  parent: "Phụ huynh",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Hồ sơ cá nhân
        </h1>
        <p className="mt-1 text-muted-foreground">
          {user?.email} · {ROLE_LABELS[profile?.role ?? "student"]}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin của bạn</CardTitle>
          <CardDescription>
            Trường và lớp dùng để xếp hạng theo phạm vi trường/lớp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
