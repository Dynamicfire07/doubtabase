"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { mediaCdnUrl } from "@/lib/cdn";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Attachment, Doubt, DoubtComment, RoomRole } from "@/types/domain";

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
  comments: DoubtComment[];
};

type DoubtDetailClientProps = {
  doubtId: string;
};

type LoadOptions = {
  fresh?: boolean;
};

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: string;
      details?: {
        formErrors?: string[];
        fieldErrors?: Record<string, string[] | undefined>;
      };
    };

    const formError = body.details?.formErrors?.find(Boolean);
    if (formError) {
      return formError;
    }

    const fieldEntry = Object.entries(body.details?.fieldErrors ?? {}).find(
      ([, messages]) => Array.isArray(messages) && messages.length > 0,
    );

    if (fieldEntry && fieldEntry[1]) {
      return `${fieldEntry[0]}: ${fieldEntry[1][0]}`;
    }

    return body.error ?? `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

function formatCommentTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatCommentAuthor(comment: DoubtComment) {
  if (comment.is_current_user) {
    return "You";
  }

  return `${comment.created_by_user_id.slice(0, 8)}...${comment.created_by_user_id.slice(-4)}`;
}

function difficultyBadgeClass(difficulty: Doubt["difficulty"]) {
  if (difficulty === "easy") {
    return "badge badge-outline db-difficulty-pill db-difficulty-pill-easy";
  }

  if (difficulty === "hard") {
    return "badge badge-outline db-difficulty-pill db-difficulty-pill-hard";
  }

  return "badge badge-outline db-difficulty-pill db-difficulty-pill-medium";
}

export function DoubtDetailClient({ doubtId }: DoubtDetailClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const articleRef = useRef<HTMLElement | null>(null);

  const [data, setData] = useState<DoubtDetailResponse | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (options: LoadOptions = {}) => {
    const response = await fetch(`/api/doubts/${doubtId}`, {
      cache: options.fresh ? "no-store" : "default",
    });

    if (!response.ok) {
      setPageError("Unable to load doubt details.");
      setIsLoading(false);
      return;
    }

    const payload = (await response.json()) as DoubtDetailResponse;
    setData(payload);
    setPageError(null);
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
          table: "doubt_comments",
          filter: `doubt_id=eq.${doubtId}`,
        },
        () => {
          void load({ fresh: true });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "doubts",
          filter: `id=eq.${doubtId}`,
        },
        () => {
          void load({ fresh: true });
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
          void load({ fresh: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [doubtId, load, supabase]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  async function onDelete() {
    if (!data || data.room.role !== "owner") {
      return;
    }

    setActionError(null);

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
      setActionError("Unable to delete this doubt.");
      setIsDeleting(false);
      return;
    }

    router.replace(`/dashboard?room=${data.room.id}`);
    router.refresh();
  }

  async function onToggleFullscreen() {
    if (!articleRef.current) {
      return;
    }

    setActionError(null);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await articleRef.current.requestFullscreen();
    } catch {
      setActionError("Unable to toggle full screen mode.");
    }
  }

  async function onSubmitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = commentDraft.trim();
    if (!body) {
      return;
    }

    setIsCommentSubmitting(true);
    setActionError(null);

    const response = await fetch(`/api/doubts/${doubtId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      setActionError(await parseError(response));
      setIsCommentSubmitting(false);
      return;
    }

    const payload = (await response.json()) as { item: DoubtComment };
    setData((current) =>
      current
        ? {
            ...current,
            comments: [...current.comments, payload.item],
          }
        : current,
    );
    setCommentDraft("");
    setIsCommentSubmitting(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-9 w-64" />
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body space-y-4">
            <div className="space-y-2">
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
            </div>
            <div className="skeleton h-28 w-full rounded-box" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="skeleton h-48 w-full rounded-box" />
              <div className="skeleton h-48 w-full rounded-box" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageError || !data) {
    return (
      <div role="alert" aria-live="assertive" className="alert alert-error">
        <span>{pageError ?? "Doubt not found."}</span>
      </div>
    );
  }

  return (
    <div className="detail-shell space-y-6">
      {actionError ? (
        <div role="alert" aria-live="assertive" className="alert alert-error">
          <span>{actionError}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/dashboard?room=${data.room.id}`} className="btn btn-sm btn-outline">
          Back to dashboard
        </Link>
        <button
          type="button"
          onClick={() => void onToggleFullscreen()}
          aria-pressed={isFullscreen}
          className="btn btn-sm btn-outline"
        >
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </button>
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

      <article
        ref={articleRef}
        className="detail-card overflow-hidden rounded-[28px]"
      >
        <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.88))] px-5 py-6 sm:px-7">
          <p className="db-kicker">DOUBT DETAIL</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-pretty text-3xl font-semibold tracking-tight text-slate-950">
                {data.item.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Room {data.room.name} • Updated {formatCommentTime(data.item.updated_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="detail-chip">Subject: {data.item.subject}</span>
              <span className="detail-chip">Role: {data.room.role}</span>
              <span className={difficultyBadgeClass(data.item.difficulty)}>
                {data.item.difficulty}
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
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
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
        </div>

        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1.15fr)_320px]">
          <div className="space-y-6">
            <section className="detail-section-card rounded-[22px] p-5">
              <p className="db-kicker">NOTES</p>
              <div className="mt-3 rounded-[18px] border border-slate-200/80 bg-slate-50/90 p-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {data.item.body_markdown}
                </p>
              </div>
            </section>

            {data.attachments.length > 0 ? (
              <section className="detail-section-card rounded-[22px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="db-kicker">ATTACHMENTS</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">
                      Visual context
                    </h2>
                  </div>
                  <span className="detail-chip">
                    {data.attachments.length} image
                    {data.attachments.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {data.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-white"
                    >
                      {attachment.public_url_signed ? (
                        <div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mediaCdnUrl(attachment.public_url_signed) ?? ""}
                            alt="Doubt attachment"
                            className="h-64 w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="flex justify-end border-t border-slate-200/80 bg-white p-3">
                            <button
                              type="button"
                              className="btn btn-xs btn-primary"
                              onClick={() =>
                                setSelectedImageUrl(mediaCdnUrl(attachment.public_url_signed))
                              }
                            >
                              View full image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-slate-50 text-sm text-slate-500">
                          Attachment unavailable
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="detail-section-card rounded-[22px] p-5">
              <p className="db-kicker">DISCUSSION</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Comments</h2>

              <form onSubmit={onSubmitComment} className="mt-4 space-y-3">
                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  placeholder="Add your comment for this doubt..."
                  maxLength={2000}
                />
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isCommentSubmitting || !commentDraft.trim()}
                    className="btn btn-sm btn-primary"
                  >
                    {isCommentSubmitting ? "Posting..." : "Post comment"}
                  </button>
                </div>
              </form>

              <div className="mt-4 space-y-3">
                {data.comments.length === 0 ? (
                  <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/90 p-4 text-sm text-slate-500">
                    No comments yet. Start the discussion.
                  </div>
                ) : (
                  data.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-[18px] border border-slate-200/80 bg-slate-50/90 p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {formatCommentAuthor(comment)}
                        </span>
                        <span>{formatCommentTime(comment.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {comment.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </article>

      {selectedImageUrl ? (
        <dialog className="modal modal-open">
          <div className="modal-box h-auto max-h-[90vh] w-11/12 max-w-6xl p-3">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setSelectedImageUrl(null)}
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaCdnUrl(selectedImageUrl) ?? ""}
              alt="Full-size doubt attachment"
              className="max-h-[78vh] w-full rounded-box object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setSelectedImageUrl(null)}>
              close
            </button>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
