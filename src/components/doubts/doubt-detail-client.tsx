"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Attachment, Doubt, RoomRole } from "@/types/domain";

type DoubtDetailResponse = {
  item: Doubt;
  room: {
    id: string;
    name: string;
    is_personal: boolean;
    owner_user_id: string;
    role: RoomRole;
  };
  attachments: Attachment[];
};

type DoubtDetailClientProps = {
  doubtId: string;
};

export function DoubtDetailClient({ doubtId }: DoubtDetailClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [data, setData] = useState<DoubtDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
  }, [doubtId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`doubt-${doubtId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "doubts",
          filter: `id=eq.${doubtId}`,
        },
        () => {
          void load();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "doubt_attachments",
          filter: `doubt_id=eq.${doubtId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [doubtId, load, supabase]);

  async function onDelete() {
    if (!data || data.room.role !== "owner") {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this doubt and all its attachments?",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/doubts/${doubtId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Unable to delete this doubt.");
      setIsDeleting(false);
      return;
    }

    router.replace(`/dashboard?room=${data.room.id}`);
    router.refresh();
  }

  if (isLoading) {
    return <span className="loading loading-spinner loading-md text-primary" />;
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
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/dashboard?room=${data.room.id}`} className="btn btn-sm btn-outline">
          Back to dashboard
        </Link>
        {data.room.role === "owner" ? (
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={isDeleting}
            className="btn btn-sm btn-error"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>

      <article className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <header className="mb-6 space-y-3">
            <h1 className="text-2xl font-bold">{data.item.title}</h1>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge badge-outline">Room: {data.room.name}</span>
              <span className="badge badge-outline">
                Room role: {data.room.role}
              </span>
              <span className="badge badge-outline">Subject: {data.item.subject}</span>
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
                <span
                  key={tag}
                  className="badge badge-info badge-outline h-auto max-w-[220px] whitespace-normal break-words py-1 leading-tight"
                >
                  {tag}
                </span>
              ))}
              {data.item.error_tags.map((tag) => (
                <span
                  key={tag}
                  className="badge badge-error badge-outline h-auto max-w-[240px] whitespace-normal break-words py-1 leading-tight"
                >
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
