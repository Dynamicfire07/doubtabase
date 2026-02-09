"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { MAX_ATTACHMENT_BYTES, SUPABASE_ATTACHMENTS_BUCKET } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  Difficulty,
  Doubt,
  DoubtListResponse,
  Room,
  RoomInvite,
  RoomMember,
  RoomsListResponse,
} from "@/types/domain";

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

type MembersResponse = {
  items: RoomMember[];
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

function formatUserLabel(member: RoomMember) {
  const shortId = `${member.user_id.slice(0, 8)}...${member.user_id.slice(-4)}`;
  if (member.is_current_user) {
    return `You (${member.role})`;
  }

  return `${shortId} (${member.role})`;
}

export function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draftRow, setDraftRow] = useState<DraftRow>(initialDraftRow);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [filterDraft, setFilterDraft] = useState<FilterDraft>(initialFilterDraft);
  const [appliedFilters, setAppliedFilters] = useState<FilterDraft>(
    initialFilterDraft,
  );

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [inviteData, setInviteData] = useState<RoomInvite | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    DoubtListResponse["suggestions"]
  >({
    subjects: [],
    subtopics: [],
    error_tags: [],
  });

  const [isRoomsLoading, setIsRoomsLoading] = useState(true);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRoomActionSubmitting, setIsRoomActionSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const canDelete = selectedRoom?.role === "owner";

  const updateRoomInUrl = useCallback(
    (roomId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (roomId) {
        params.set("room", roomId);
      } else {
        params.delete("room");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadRooms = useCallback(
    async (roomToSelect?: string | null) => {
      setIsRoomsLoading(true);

      const response = await fetch("/api/rooms", {
        cache: "no-store",
      });

      if (!response.ok) {
        setError(await parseError(response));
        setIsRoomsLoading(false);
        return;
      }

      const data = (await response.json()) as RoomsListResponse;
      setRooms(data.items);

      const urlRoom = searchParams.get("room");
      const validRoomIds = new Set(data.items.map((room) => room.id));

      const targetRoomId =
        (roomToSelect && validRoomIds.has(roomToSelect) ? roomToSelect : null) ??
        (selectedRoomId && validRoomIds.has(selectedRoomId) ? selectedRoomId : null) ??
        (urlRoom && validRoomIds.has(urlRoom) ? urlRoom : null) ??
        data.default_room_id;

      setSelectedRoomId(targetRoomId);
      if ((urlRoom ?? null) !== (targetRoomId ?? null)) {
        updateRoomInUrl(targetRoomId);
      }

      setIsRoomsLoading(false);
    },
    [searchParams, selectedRoomId, updateRoomInUrl],
  );

  const fetchDoubts = useCallback(
    async (cursor?: string, append = false) => {
      if (!selectedRoomId) {
        setDoubts([]);
        setNextCursor(null);
        setSuggestions({ subjects: [], subtopics: [], error_tags: [] });
        setIsLoading(false);
        return;
      }

      if (!append) {
        setIsLoading(true);
      }

      setError(null);

      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("room_id", selectedRoomId);

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
    [appliedFilters, selectedRoomId],
  );

  const fetchMembers = useCallback(async () => {
    if (!selectedRoomId) {
      setRoomMembers([]);
      return;
    }

    setIsMembersLoading(true);

    const response = await fetch(`/api/rooms/${selectedRoomId}/members`, {
      cache: "no-store",
    });

    if (!response.ok) {
      setIsMembersLoading(false);
      return;
    }

    const data = (await response.json()) as MembersResponse;
    setRoomMembers(data.items);
    setIsMembersLoading(false);
  }, [selectedRoomId]);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      void fetchDoubts();
      void fetchMembers();
    }, 250);
  }, [fetchDoubts, fetchMembers]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!selectedRoomId) {
      return;
    }

    updateRoomInUrl(selectedRoomId);
  }, [selectedRoomId, updateRoomInUrl]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    void fetchDoubts();
  }, [fetchDoubts]);

  useEffect(() => {
    if (!selectedRoomId) {
      return;
    }

    const channel = supabase
      .channel(`room-${selectedRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "doubts",
          filter: `room_id=eq.${selectedRoomId}`,
        },
        () => {
          scheduleRealtimeRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "doubt_attachments",
        },
        () => {
          scheduleRealtimeRefresh();
        },
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [scheduleRealtimeRefresh, selectedRoomId, supabase]);

  function resetDraftRow() {
    setDraftRow(initialDraftRow);
    setSelectedFiles([]);
    setEditingId(null);
  }

  useEffect(() => {
    resetDraftRow();
    setInviteData(null);
  }, [selectedRoomId]);

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

  function startEdit(item: Doubt) {
    setEditingId(item.id);
    setError(null);
    setSelectedFiles([]);
    setDraftRow({
      title: item.title,
      subject: item.subject,
      subtopicsCsv: item.subtopics.join(", "),
      difficulty: item.difficulty,
      errorTagsCsv: item.error_tags.join(", "),
      isCleared: item.is_cleared,
      notes: item.body_markdown,
    });
  }

  async function onAddRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRoomId) {
      setError("Select a room first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: draftRow.title.trim(),
        body_markdown: draftRow.notes.trim(),
        subject: draftRow.subject.trim(),
        subtopics: parseTagCsv(draftRow.subtopicsCsv),
        difficulty: draftRow.difficulty,
        error_tags: parseTagCsv(draftRow.errorTagsCsv),
        is_cleared: draftRow.isCleared,
      };

      const response = await fetch(
        editingId ? `/api/doubts/${editingId}` : "/api/doubts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            editingId
              ? payload
              : {
                  ...payload,
                  room_id: selectedRoomId,
                },
          ),
        },
      );

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as { item: Doubt };

      if (selectedFiles.length > 0) {
        await uploadFiles(data.item.id, selectedFiles);
      }

      resetDraftRow();
      await fetchDoubts();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to save doubt",
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
    if (!canDelete) {
      setError("Only room owners can delete doubts.");
      return;
    }

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

    if (editingId === item.id) {
      resetDraftRow();
    }

    await fetchDoubts();
  }

  async function onCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newRoomName.trim()) {
      return;
    }

    setIsRoomActionSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as { item: Room };
      setNewRoomName("");
      await loadRooms(data.item.id);
      await fetchMembers();
    } catch (roomError) {
      setError(roomError instanceof Error ? roomError.message : "Unable to create room");
    } finally {
      setIsRoomActionSubmitting(false);
    }
  }

  async function onJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!joinCode.trim()) {
      return;
    }

    setIsRoomActionSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: joinCode.trim() }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as { room_id: string };
      setJoinCode("");
      await loadRooms(data.room_id);
      await fetchMembers();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Unable to join room");
    } finally {
      setIsRoomActionSubmitting(false);
    }
  }

  async function onRotateInvite() {
    if (!selectedRoomId) {
      return;
    }

    setIsRoomActionSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${selectedRoomId}/invite/rotate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as { item: RoomInvite };
      setInviteData(data.item);
    } catch (inviteError) {
      setError(
        inviteError instanceof Error ? inviteError.message : "Unable to rotate invite",
      );
    } finally {
      setIsRoomActionSubmitting(false);
    }
  }

  async function onCopyInviteCode() {
    if (!inviteData?.code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteData.code);
    } catch {
      setError("Unable to copy invite code.");
    }
  }

  const openCount = doubts.filter((item) => !item.is_cleared).length;
  const clearedCount = doubts.length - openCount;

  return (
    <div className="w-full space-y-4 p-4 lg:p-6">
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-2 p-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-base-300 bg-base-200">
                <Image
                  src="/brand-icon.svg"
                  alt="Doubts App logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold">Doubt Sheet</h1>
            </div>
            <p className="text-sm text-base-content/70">
              Room: {selectedRoom?.name ?? "No room selected"}
            </p>
            {editingId ? (
              <p className="mt-1 text-xs font-medium text-warning">
                Editing row. Save to update this doubt.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <main className="space-y-4 xl:order-2">
          <section className="card border border-primary/30 bg-base-100 shadow-sm">
            <div className="card-body gap-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
                  Add Question
                </h2>
                <span className="text-xs text-base-content/60">
                  Cmd+Enter saves from anywhere in this form
                </span>
              </div>

              <form
                onSubmit={onAddRow}
                onKeyDown={onAddRowShortcut}
                className="grid gap-2 md:grid-cols-2 xl:grid-cols-12"
              >
                <div className="md:col-span-2 xl:col-span-2">
                  <label className="label py-1">
                    <span className="label-text text-xs">Title</span>
                  </label>
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
                </div>

                <div className="xl:col-span-1">
                  <label className="label py-1">
                    <span className="label-text text-xs">Subject</span>
                  </label>
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
                </div>

                <div className="xl:col-span-2">
                  <label className="label py-1">
                    <span className="label-text text-xs">Subtopics</span>
                  </label>
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
                </div>

                <div className="xl:col-span-1">
                  <label className="label py-1">
                    <span className="label-text text-xs">Difficulty</span>
                  </label>
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
                </div>

                <div className="xl:col-span-2">
                  <label className="label py-1">
                    <span className="label-text text-xs">Errors</span>
                  </label>
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
                </div>

                <div className="xl:col-span-1">
                  <label className="label py-1">
                    <span className="label-text text-xs">Cleared</span>
                  </label>
                  <div className="flex h-8 items-center">
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
                  </div>
                </div>

                <div className="md:col-span-2 xl:col-span-2">
                  <label className="label py-1">
                    <span className="label-text text-xs">Notes</span>
                  </label>
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
                </div>

                <div className="md:col-span-1 xl:col-span-1">
                  <label className="label py-1">
                    <span className="label-text text-xs">Images</span>
                  </label>
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
                </div>

                <div className="md:col-span-1 xl:col-span-12">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedRoomId}
                      className="btn btn-primary btn-sm"
                    >
                      {isSubmitting
                        ? editingId
                          ? "Saving..."
                          : "Adding..."
                        : editingId
                          ? "Save Row"
                          : "Add Row"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        onClick={resetDraftRow}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel edit
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>
            </div>
          </section>

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
            <table className="table table-zebra table-sm min-w-[1550px]">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Subtopics</th>
                  <th>Difficulty</th>
                  <th>Errors</th>
                  <th>Cleared</th>
                  <th>Notes</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
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
                            href={`/doubts/${item.id}?room=${item.room_id}`}
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
                              <span
                                key={`${item.id}-sub-${tag}`}
                                className="badge badge-info badge-outline h-auto max-w-[170px] whitespace-normal break-words py-1 leading-tight"
                              >
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
                              <span
                                key={`${item.id}-err-${tag}`}
                                className="badge badge-error badge-outline h-auto max-w-[170px] whitespace-normal break-words py-1 leading-tight"
                              >
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
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="btn btn-outline btn-primary btn-xs"
                          >
                            Edit
                          </button>
                          <Link
                            href={`/doubts/${item.id}?room=${item.room_id}`}
                            className="btn btn-outline btn-xs"
                          >
                            Open
                          </Link>
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => void onDelete(item)}
                              className="btn btn-outline btn-error btn-xs"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
        </main>

        <aside className="space-y-4 xl:order-1 xl:sticky xl:top-4 xl:self-start">
          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-2 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Summary
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-outline">Total: {doubts.length}</span>
                <span className="badge badge-warning badge-outline">Open: {openCount}</span>
                <span className="badge badge-success badge-outline">Cleared: {clearedCount}</span>
                <span className="badge badge-outline">Role: {selectedRoom?.role ?? "-"}</span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="btn btn-sm btn-outline mt-1 w-full"
              >
                Sign out
              </button>
            </div>
          </section>

          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-3 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Workspace
              </p>
              {isRoomsLoading ? (
                <p className="text-sm text-base-content/70">Loading rooms...</p>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`btn btn-sm w-full justify-between gap-2 ${
                        selectedRoomId === room.id ? "btn-primary" : "btn-ghost"
                      }`}
                    >
                      <span className="badge badge-xs badge-outline">
                        {room.is_personal ? "Personal" : "Shared"}
                      </span>
                      <span className="truncate">{room.name}</span>
                      <span className="badge badge-xs badge-outline">{room.member_count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-3 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Workspace settings
              </p>

              <form onSubmit={onCreateRoom} className="space-y-2">
                <p className="text-xs text-base-content/70">Create shared room</p>
                <div className="flex gap-2">
                  <input
                    value={newRoomName}
                    onChange={(event) => setNewRoomName(event.target.value)}
                    className="input input-bordered input-sm w-full"
                    placeholder="Team room name"
                  />
                  <button
                    type="submit"
                    disabled={isRoomActionSubmitting}
                    className="btn btn-primary btn-sm"
                  >
                    Create
                  </button>
                </div>
              </form>

              <form onSubmit={onJoinRoom} className="space-y-2">
                <p className="text-xs text-base-content/70">Join room</p>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value)}
                    className="input input-bordered input-sm w-full"
                    placeholder="Paste invite code"
                  />
                  <button
                    type="submit"
                    disabled={isRoomActionSubmitting}
                    className="btn btn-outline btn-sm"
                  >
                    Join
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <p className="text-xs text-base-content/70">Invite code</p>
                {selectedRoom && !selectedRoom.is_personal && selectedRoom.role === "owner" ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void onRotateInvite()}
                        disabled={isRoomActionSubmitting}
                        className="btn btn-sm btn-outline"
                      >
                        Rotate code
                      </button>
                      {inviteData?.code ? (
                        <button
                          type="button"
                          onClick={() => void onCopyInviteCode()}
                          className="btn btn-sm btn-primary"
                        >
                          Copy
                        </button>
                      ) : null}
                    </div>
                    {inviteData?.code ? (
                      <code className="block overflow-x-auto rounded-md bg-base-200 p-2 text-xs">
                        {inviteData.code}
                      </code>
                    ) : (
                      <p className="text-xs text-base-content/70">
                        Rotate once to generate a code.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-base-content/70">
                    Owner-only for shared rooms.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-base-content/70">Members</p>
                {isMembersLoading ? (
                  <p className="text-sm text-base-content/70">Loading members...</p>
                ) : roomMembers.length === 0 ? (
                  <p className="text-sm text-base-content/70">No members found.</p>
                ) : (
                  <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                    {roomMembers.map((member) => (
                      <span key={member.user_id} className="badge badge-outline">
                        {formatUserLabel(member)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
