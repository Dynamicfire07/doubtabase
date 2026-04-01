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
    <main className="detail-page min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <DoubtDetailClient doubtId={id} />
      </div>
    </main>
  );
}
