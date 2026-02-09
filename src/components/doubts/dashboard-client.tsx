"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";

import { MAX_ATTACHMENT_BYTES, SUPABASE_ATTACHMENTS_BUCKET } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Difficulty, Doubt, DoubtListResponse } from "@/types/domain";

type DraftRow = {
  title: string;
  subject: string;
  subtopicsCsv: string;
  difficulty: Difficulty;
  errorTagsCsv: string;
  isCleared: boolean;
  notes: string;
};

type FilterDraft = {
  q: string;
  subject: string;
  is_cleared: "" | "true" | "false";
};

const initialDraftRow: DraftRow = {
  title: "",
  subject: "",
  subtopicsCsv: "",
  difficulty: "medium",
  errorTagsCsv: "",
  isCleared: false,
  notes: "",
};

const initialFilterDraft: FilterDraft = {
  q: "",
  subject: "",
  is_cleared: "",
};

function parseTagCsv(csv: string) {
  const normalized = csv
    .split(",")
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .map((value) => value.slice(0, 80));

  return Array.from(new Set(normalized)).slice(0, 20);
}

function plainPreview(text: string, maxLength = 110) {
  const compact = text.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) {
    return compact || "-";
  }

  return `${compact.slice(0, maxLength)}...`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function difficultyBadgeClass(difficulty: Difficulty) {
  if (difficulty === "easy") {
    return "badge badge-success badge-outline";
  }

  if (difficulty === "hard") {
    return "badge badge-error badge-outline";
  }

  return "badge badge-warning badge-outline";
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

export function DashboardClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [draftRow, setDraftRow] = useState<DraftRow>(initialDraftRow);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [filterDraft, setFilterDraft] = useState<FilterDraft>(initialFilterDraft);
  const [appliedFilters, setAppliedFilters] = useState<FilterDraft>(
    initialFilterDraft,
  );

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    DoubtListResponse["suggestions"]
  >({
    subjects: [],
    subtopics: [],
    error_tags: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoubts = useCallback(
    async (cursor?: string, append = false) => {
      if (!append) {
        setIsLoading(true);
      }

      setError(null);

      const params = new URLSearchParams();
      params.set("limit", "20");

      if (cursor) {
        params.set("cursor", cursor);
      }

      if (appliedFilters.q.trim()) {
        params.set("q", appliedFilters.q.trim());
      }

      if (appliedFilters.subject.trim()) {
        params.set("subject", appliedFilters.subject.trim());
      }

      if (appliedFilters.is_cleared) {
        params.set("is_cleared", appliedFilters.is_cleared);
      }

      const response = await fetch(`/api/doubts?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setError(await parseError(response));
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as DoubtListResponse;

      setDoubts((current) => (append ? [...current, ...data.items] : data.items));
      setNextCursor(data.next_cursor);

      if (!append) {
        setSuggestions(data.suggestions);
      }

      setIsLoading(false);
    },
    [appliedFilters],
  );

  useEffect(() => {
    void fetchDoubts();
  }, [fetchDoubts]);

  async function onSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 5) {
      setError("Only 5 images are allowed per doubt.");
      return;
    }

    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Only JPEG, PNG, and WEBP images are allowed.");
        return;
      }

      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError("Each image must be 5MB or smaller.");
        return;
      }
    }

    setError(null);
    setSelectedFiles(files);
  }

  async function uploadFiles(doubtId: string, files: File[]) {
    for (const file of files) {
      const presignResponse = await fetch(
        `/api/doubts/${doubtId}/attachments/presign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          }),
        },
      );

      if (!presignResponse.ok) {
        throw new Error(await parseError(presignResponse));
      }

      const presignData = (await presignResponse.json()) as {
        upload: { path: string; token: string };
        attachment: { id: string };
      };

      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_ATTACHMENTS_BUCKET)
        .uploadToSignedUrl(
          presignData.upload.path,
          presignData.upload.token,
          file,
        );

      if (uploadError) {
        await fetch(`/api/attachments/${presignData.attachment.id}`, {
          method: "DELETE",
        }).catch(() => undefined);

        throw new Error(uploadError.message);
      }
    }
  }

  async function onAddRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/doubts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: draftRow.title.trim(),
          body_markdown: draftRow.notes.trim(),
          subject: draftRow.subject.trim(),
          subtopics: parseTagCsv(draftRow.subtopicsCsv),
          difficulty: draftRow.difficulty,
          error_tags: parseTagCsv(draftRow.errorTagsCsv),
          is_cleared: draftRow.isCleared,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as { item: Doubt };

      if (selectedFiles.length > 0) {
        await uploadFiles(data.item.id, selectedFiles);
      }

      setDraftRow(initialDraftRow);
      setSelectedFiles([]);
      await fetchDoubts();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to add doubt",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function onAddRowShortcut(event: ReactKeyboardEvent<HTMLFormElement>) {
    if (!(event.metaKey && event.key === "Enter")) {
      return;
    }

    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    event.currentTarget.requestSubmit();
  }

  async function onToggleCleared(item: Doubt) {
    const response = await fetch(`/api/doubts/${item.id}/clear`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_cleared: !item.is_cleared }),
    });

    if (!response.ok) {
      setError(await parseError(response));
      return;
    }

    await fetchDoubts();
  }

  async function onDelete(item: Doubt) {
    const shouldDelete = window.confirm(
      "Delete this doubt and all its attachments?",
    );

    if (!shouldDelete) {
      return;
    }

    const response = await fetch(`/api/doubts/${item.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError(await parseError(response));
      return;
    }

    await fetchDoubts();
  }

  const openCount = doubts.filter((item) => !item.is_cleared).length;
  const clearedCount = doubts.length - openCount;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 p-4 lg:p-6">
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Doubt Sheet</h1>
              <p className="text-sm text-base-content/70">
                Add one row per doubt. Fast capture, no extra clicks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-outline">Total: {doubts.length}</span>
              <span className="badge badge-warning badge-outline">Open: {openCount}</span>
              <span className="badge badge-success badge-outline">
                Cleared: {clearedCount}
              </span>
              <button type="button" onClick={onSignOut} className="btn btn-sm btn-outline">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="label pb-1">
                <span className="label-text text-xs">Search</span>
              </label>
              <input
                value={filterDraft.q}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, q: event.target.value }))
                }
                className="input input-bordered input-sm w-full"
                placeholder="Title / notes / tag"
              />
            </div>

            <div className="min-w-[180px]">
              <label className="label pb-1">
                <span className="label-text text-xs">Subject</span>
              </label>
              <input
                value={filterDraft.subject}
                list="subject-filter-suggestions"
                onChange={(event) =>
                  setFilterDraft((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                className="input input-bordered input-sm w-full"
                placeholder="Any subject"
              />
              <datalist id="subject-filter-suggestions">
                {suggestions.subjects.map((subject) => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>
            </div>

            <div className="min-w-[160px]">
              <label className="label pb-1">
                <span className="label-text text-xs">Status</span>
              </label>
              <select
                value={filterDraft.is_cleared}
                onChange={(event) =>
                  setFilterDraft((current) => ({
                    ...current,
                    is_cleared: event.target.value as FilterDraft["is_cleared"],
                  }))
                }
                className="select select-bordered select-sm w-full"
              >
                <option value="">All</option>
                <option value="false">Open</option>
                <option value="true">Cleared</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setAppliedFilters(filterDraft)}
              className="btn btn-sm btn-primary"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterDraft(initialFilterDraft);
                setAppliedFilters(initialFilterDraft);
              }}
              className="btn btn-sm btn-ghost"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-sm">
        <form onSubmit={onAddRow} onKeyDown={onAddRowShortcut}>
          <table className="table table-zebra table-sm min-w-[1500px]">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Subtopics</th>
                <th>Difficulty</th>
                <th>Errors</th>
                <th>Cleared</th>
                <th>Notes</th>
                <th>Images</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr className="bg-base-200/70 align-top">
                <td>
                  <input
                    required
                    value={draftRow.title}
                    onChange={(event) =>
                      setDraftRow((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="input input-bordered input-sm w-full"
                    placeholder="Why is this wrong?"
                  />
                </td>

                <td>
                  <input
                    required
                    value={draftRow.subject}
                    list="subject-add-suggestions"
                    onChange={(event) =>
                      setDraftRow((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    className="input input-bordered input-sm w-full"
                    placeholder="Math"
                  />
                  <datalist id="subject-add-suggestions">
                    {suggestions.subjects.map((subject) => (
                      <option key={subject} value={subject} />
                    ))}
                  </datalist>
                </td>

                <td>
                  <input
                    value={draftRow.subtopicsCsv}
                    onChange={(event) =>
                      setDraftRow((current) => ({
                        ...current,
                        subtopicsCsv: event.target.value,
                      }))
                    }
                    className="input input-bordered input-sm w-full"
                    placeholder="limits, lhopital"
                  />
                </td>

                <td>
                  <select
                    value={draftRow.difficulty}
                    onChange={(event) =>
                      setDraftRow((current) => ({
                        ...current,
                        difficulty: event.target.value as Difficulty,
                      }))
                    }
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </td>

                <td>
                  <input
                    value={draftRow.errorTagsCsv}
                    onChange={(event) =>
                      setDraftRow((current) => ({
                        ...current,
                        errorTagsCsv: event.target.value,
                      }))
                    }
                    className="input input-bordered input-sm w-full"
                    placeholder="sign mistake, wrong identity"
                  />
                </td>

                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={draftRow.isCleared}
                    onChange={(event) =>
                      setDraftRow((current) => ({
                        ...current,
                        isCleared: event.target.checked,
                      }))
                    }
                    className="checkbox checkbox-sm"
                  />
                </td>

                <td>
                  <input
                    required
                    value={draftRow.notes}
                    onChange={(event) =>
                      setDraftRow((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    className="input input-bordered input-sm w-full"
                    placeholder="Quick plain-text note"
                  />
                </td>

                <td>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onFileChange}
                    className="file-input file-input-bordered file-input-sm w-full"
                  />
                  {selectedFiles.length > 0 ? (
                    <p className="mt-1 text-xs text-base-content/70">
                      {selectedFiles.length} file(s)
                    </p>
                  ) : null}
                </td>

                <td>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-sm w-full"
                  >
                    {isSubmitting ? "Adding..." : "Add Row"}
                  </button>
                  <p className="mt-1 text-center text-[10px] text-base-content/60">
                    Cmd+Enter
                  </p>
                </td>
              </tr>

              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center text-sm text-base-content/70">
                    Loading doubts...
                  </td>
                </tr>
              ) : doubts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-sm text-base-content/70">
                    No doubts found for current filters.
                  </td>
                </tr>
              ) : (
                doubts.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td>
                      <div className="flex min-w-[220px] items-start gap-2">
                        {item.thumbnail_url_signed ? (
                          <div className="avatar">
                            <div className="h-14 w-14 rounded-md border border-base-300">
                              {/* Dynamic signed URLs are not known at build time. */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.thumbnail_url_signed}
                                alt="Doubt thumbnail"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md border border-base-300 bg-base-200 text-[10px] text-base-content/60">
                            No img
                          </div>
                        )}

                        <Link
                          href={`/doubts/${item.id}`}
                          className="line-clamp-2 font-semibold hover:text-primary"
                        >
                          {item.title}
                        </Link>
                      </div>
                    </td>

                    <td className="text-xs">{item.subject}</td>

                    <td>
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {item.subtopics.length === 0 ? (
                          <span className="text-xs text-base-content/50">-</span>
                        ) : (
                          item.subtopics.slice(0, 4).map((tag) => (
                            <span key={`${item.id}-sub-${tag}`} className="badge badge-info badge-outline badge-sm">
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={difficultyBadgeClass(item.difficulty)}>
                        {item.difficulty}
                      </span>
                    </td>

                    <td>
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {item.error_tags.length === 0 ? (
                          <span className="text-xs text-base-content/50">-</span>
                        ) : (
                          item.error_tags.slice(0, 4).map((tag) => (
                            <span key={`${item.id}-err-${tag}`} className="badge badge-error badge-outline badge-sm">
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => void onToggleCleared(item)}
                        className={`btn btn-xs ${item.is_cleared ? "btn-success" : "btn-warning"}`}
                      >
                        {item.is_cleared ? "Cleared" : "Open"}
                      </button>
                    </td>

                    <td className="max-w-[260px] text-xs text-base-content/80">
                      {plainPreview(item.body_markdown, 160)}
                    </td>

                    <td className="text-xs text-base-content/70">
                      {formatDate(item.updated_at)}
                    </td>

                    <td>
                      <div className="flex flex-col gap-1">
                        <Link href={`/doubts/${item.id}`} className="btn btn-outline btn-xs">
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => void onDelete(item)}
                          className="btn btn-outline btn-error btn-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </form>
      </section>

      {nextCursor ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void fetchDoubts(nextCursor, true)}
            className="btn btn-outline btn-sm"
          >
            Load more rows
          </button>
        </div>
      ) : null}
    </div>
  );
}
