"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Attachment, Doubt } from "@/types/domain";

type DoubtDetailResponse = {
  item: Doubt;
  attachments: Attachment[];
};

type DoubtDetailClientProps = {
  doubtId: string;
};

export function DoubtDetailClient({ doubtId }: DoubtDetailClientProps) {
  const [data, setData] = useState<DoubtDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/doubts/${doubtId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Unable to load doubt details.");
        setIsLoading(false);
        return;
      }

      const payload = (await response.json()) as DoubtDetailResponse;
      setData(payload);
      setIsLoading(false);
    }

    void load();
  }, [doubtId]);

  if (isLoading) {
    return (
      <span className="loading loading-spinner loading-md text-primary" />
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="alert alert-error">
        <span>{error ?? "Doubt not found."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="btn btn-sm btn-outline">
        Back to dashboard
      </Link>

      <article className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
        <header className="mb-6 space-y-3">
          <h1 className="text-2xl font-bold">{data.item.title}</h1>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge badge-outline">
              Subject: {data.item.subject}
            </span>
            <span className="badge badge-outline">
              Difficulty: {data.item.difficulty}
            </span>
            <span
              className={`badge ${
                data.item.is_cleared
                  ? "badge-success badge-outline"
                  : "badge-warning badge-outline"
              }`}
            >
              {data.item.is_cleared ? "Cleared" : "Open"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {data.item.subtopics.map((tag) => (
              <span key={tag} className="badge badge-info badge-outline">
                {tag}
              </span>
            ))}
            {data.item.error_tags.map((tag) => (
              <span key={tag} className="badge badge-error badge-outline">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="rounded-box border border-base-300 bg-base-200 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {data.item.body_markdown}
          </p>
        </div>

        {data.attachments.length > 0 ? (
          <section className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
              Attachments
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {data.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-box border border-base-300 bg-base-100"
                >
                  {attachment.public_url_signed ? (
                    // Signed URLs are generated at runtime; Next/Image remote patterns are not static here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attachment.public_url_signed}
                      alt="Doubt attachment"
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-base-200 text-sm text-base-content/60">
                      Attachment unavailable
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}
        </div>
      </article>
    </div>
  );
}
