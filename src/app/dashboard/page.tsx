import { DashboardClient } from "@/components/doubts/dashboard-client";
import { requirePageUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePageUser();

  return (
    <main className="min-h-screen bg-base-200">
      <DashboardClient />
    </main>
  );
}
