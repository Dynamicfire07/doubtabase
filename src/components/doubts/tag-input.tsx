"use client";

import { useId, useState, type KeyboardEvent } from "react";

import { normalizeTag } from "@/lib/doubts/normalize";

type TagInputProps = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder?: string;
};

export function TagInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function addTag(raw: string) {
    const tag = normalizeTag(raw);

    if (!tag) {
      return;
    }

    if (value.includes(tag)) {
      setDraft("");
      return;
    }

    onChange([...value, tag]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    addTag(draft);
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
          value={draft}
          list={listId}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? "Type and press Enter"}
        />
        <button
          type="button"
          onClick={() => addTag(draft)}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
        >
          Add
        </button>
      </div>
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => removeTag(tag)}
              className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-700 hover:bg-teal-100"
            >
              {tag} x
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No tags added yet.</p>
      )}
    </div>
  );
}
