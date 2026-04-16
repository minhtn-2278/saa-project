import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-bg-primary text-text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">SAA 2025</h1>
        <p className="text-white/60">Homepage coming soon</p>
      </div>
    </div>
  );
}
