import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import { WriteKudoCTA } from "@/components/kudos/WriteKudoCTA";
import type { PublicKudo } from "@/types/kudos";

async function fetchBoardData() {
  const supabase = await createClient();
  try {
    await getCurrentEmployee(supabase);
  } catch {
    return { kudos: [] as PublicKudo[] };
  }

  // Call our own Route Handler server-side to reuse serialisation + signed URLs.
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  const absolute = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

  try {
    const res = await fetch(`${absolute}/api/kudos?page=1&limit=20`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return { kudos: [] as PublicKudo[] };
    const json = (await res.json()) as { data: PublicKudo[] };
    return { kudos: json.data };
  } catch {
    return { kudos: [] as PublicKudo[] };
  }
}

export default async function KudosBoardPage() {
  const { kudos } = await fetchBoardData();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 text-white">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Kudos</h1>
        <WriteKudoCTA />
      </header>

      {kudos.length === 0 ? (
        <p className="text-white/60">Chưa có Kudo nào. Hãy là người đầu tiên!</p>
      ) : (
        <ul className="flex flex-col gap-4" role="list">
          {kudos.map((k) => (
            <li
              key={k.id}
              className="p-4 rounded-xl bg-[#101417] border border-[#2E3940]"
            >
              <div className="flex items-center gap-3 mb-2">
                {k.senderAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={k.senderAvatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full bg-[#FFEA9E]"
                    aria-hidden
                  />
                )}
                <div className="flex-1">
                  <p className="font-bold">{k.senderName}</p>
                  <p className="text-sm text-white/60">→ {k.recipientName}</p>
                </div>
              </div>
              <p className="text-[#FFEA9E] font-bold mb-1">{k.title.name}</p>
              <p className="whitespace-pre-wrap text-white/90">
                {k.bodyPlain}
              </p>
              {k.hashtags.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {k.hashtags.map((h) => (
                    <li
                      key={h.id}
                      className="px-2 py-1 rounded-full bg-[#FFEA9E]/10 text-[#FFEA9E] text-xs font-bold"
                    >
                      #{h.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
