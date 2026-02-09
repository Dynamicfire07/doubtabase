import { DoubtDetailClient } from "@/components/doubts/doubt-detail-client";
import { requirePageUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";

export default async function DoubtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageUser();
  const { id } = await params;

  return (
    <main className="min-h-screen bg-base-200 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <DoubtDetailClient doubtId={id} />
      </div>
    </main>
  );
}
