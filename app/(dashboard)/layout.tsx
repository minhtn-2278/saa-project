import { Toaster } from "sonner";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { WriteKudoModalMount } from "@/components/kudos/WriteKudoModalMount";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#00101A] flex flex-col">
      <AppHeader />
      <main className="flex-1 flex flex-col pt-16 lg:pt-20">
        {children}
      </main>
      <AppFooter />
      <FloatingActionButton />
      <WriteKudoModalMount />
      <Toaster position="top-center" richColors />
    </div>
  );
}
