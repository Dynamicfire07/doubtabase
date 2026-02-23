import { DashboardClient } from "@/components/doubts/dashboard-client";
import { requirePageUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePageUser();

  return (
    <main className="dashboard-page min-h-screen">
      <DashboardClient />
    </main>
  );
}
