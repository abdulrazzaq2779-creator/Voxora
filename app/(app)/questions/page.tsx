"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Library,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { LIBRARY_QUESTIONS } from "@/lib/data";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge, type BadgeTone, } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuestionCategory } from "@/lib/types";

const categoryTone: Record<QuestionCategory, BadgeTone> = {
  technical: "accent",
  behavioral: "success",
  situational: "amber",
};

type LibQuestion = (typeof LIBRARY_QUESTIONS)[number];

export default function QuestionsPage() {
  const [items, setItems] = useState<LibQuestion[]>(LIBRARY_QUESTIONS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | QuestionCategory>("all");
  const [editing, setEditing] = useState<{ id: string; text: string; category: QuestionCategory; roleTag: string } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = items;
    if (category !== "all") list = list.filter((q) => q.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (item) =>
          item.text.toLowerCase().includes(q) ||
          item.roleTag.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, query, category]);

  const addQuestion = () => {
    const id = `LQ-${Date.now()}`;
    setItems((qs) => [
      ...qs,
      { id, text: "", category: "behavioral", roleTag: "All roles", uses: 0 },
    ]);
    setEditing({ id, text: "", category: "behavioral", roleTag: "All roles" });
  };

  const saveEdit = () => {
    if (!editing || !editing.text.trim()) return;
    setItems((qs) =>
      qs.map((q) =>
        q.id === editing.id
          ? {
              ...q,
              text: editing.text.trim(),
              category: editing.category,
              roleTag: editing.roleTag,
            }
          : q
      )
    );
    setEditing(null);
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    setItems((qs) => {
      const target = qs.indexOf(filtered[idx]);
      const nextIdx = target + dir;
      if (target === -1 || nextIdx < 0 || nextIdx >= qs.length) return qs;
      const copy = [...qs];
      [copy[target], copy[nextIdx]] = [copy[nextIdx], copy[target]];
      return copy;
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-10">
      <PageHeader
        title="Question library"
        description="Reusable questions for building interviews. Edit anything — changes live only in this session."
        actions={
          <button onClick={addQuestion} className={buttonClasses("primary", "md")}>
            <Plus size={15} />
            Add question
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative sm:w-80">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0b4]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            aria-label="Search questions"
            className="h-10 w-full rounded-xl border border-hairline bg-surface pl-9 pr-3 text-[13.5px] text-ink shadow-card placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none"
          />
        </label>
        <div className="flex rounded-xl border border-hairline bg-surface p-1 shadow-card">
          {(["all", "technical", "behavioral", "situational"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                category === c ? "bg-lavender text-accent-strong" : "text-slate hover:text-ink"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#d8dce8] bg-surface px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender">
            <Library size={24} className="text-accent" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-ink">No questions found</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate">
            Add the first question for this filter, or clear your search to see the
            rest of the library.
          </p>
          <button onClick={addQuestion} className={buttonClasses("primary", "md", "mt-6")}>
            <Plus size={15} />
            Add question
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
          <div className="divide-y divide-hairline">
            {filtered.map((q, i) => (
              <div
                key={q.id}
                className="group flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-[#fafbfe]"
              >
                <div className="mt-0.5 flex flex-col">
                  <button
                    onClick={() => moveQuestion(i, -1)}
                    aria-label={`Move "${q.text.slice(0, 20)}…" up`}
                    className="rounded p-0.5 text-[#b7bccb] transition-colors hover:text-ink"
                  >
                    <MoveUp size={13} />
                  </button>
                  <button
                    onClick={() => moveQuestion(i, 1)}
                    aria-label={`Move "${q.text.slice(0, 20)}…" down`}
                    className="rounded p-0.5 text-[#b7bccb] transition-colors hover:text-ink"
                  >
                    <MoveDown size={13} />
                  </button>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender">
                  <Library size={14} className="text-accent" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-snug text-ink">
                    {q.text || <em className="text-slate">Untitled question</em>}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={categoryTone[q.category]}>{q.category}</Badge>
                    <Badge tone="outline">{q.roleTag}</Badge>
                    <span className="text-[11.5px] text-[#9aa0b4]">
                      Used in {q.uses} interviews
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() =>
                      setEditing({
                        id: q.id,
                        text: q.text,
                        category: q.category,
                        roleTag: q.roleTag,
                      })
                    }
                    aria-label={`Edit question`}
                    title="Edit"
                    className="rounded-lg p-2 text-slate transition-colors hover:bg-[#f1f2f7] hover:text-ink"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirm(q.id)}
                    aria-label={`Delete question`}
                    title="Delete"
                    className="rounded-lg p-2 text-slate transition-colors hover:bg-[#fdf3f3] hover:text-[#c23b3b]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={items.some((q) => q.id === editing?.id && q.text) ? "Edit question" : "Add question"}
        description="Stored in this browser session only (frontend demo)."
      >
        {editing && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Question</span>
              <textarea
                autoFocus
                rows={3}
                value={editing.text}
                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                className="w-full resize-none rounded-xl border border-hairline px-3.5 py-2.5 text-[14px] text-ink placeholder:text-[#9aa0b4] focus:border-[#c9c6f5] focus:outline-none"
                placeholder="Write the question you want asked…" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Category</span>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value as QuestionCategory })}
                  className="w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-[14px] text-ink focus:border-[#c9c6f5] focus:outline-none"
                >
                  <option value="behavioral">behavioral</option>
                  <option value="technical">technical</option>
                  <option value="situational">situational</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Applies to</span>
                <select
                  value={editing.roleTag}
                  onChange={(e) => setEditing({ ...editing, roleTag: e.target.value })}
                  className="w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-[14px] text-ink focus:border-[#c9c6f5] focus:outline-none"
                >
                  <option>All roles</option>
                  <option>Frontend</option>
                  <option>Design</option>
                  <option>Data</option>
                </select>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button onClick={() => setEditing(null)} className={buttonClasses("outline", "md")}>
                Cancel
              </button>
              <button onClick={saveEdit} className={buttonClasses("primary", "md")}>
                Save question
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Delete question?"
        description="Removes the question from this page's local state only."
      >
        <div className="flex justify-end gap-2.5">
          <button className={buttonClasses("outline", "md")} onClick={() => setConfirm(null)}>
            Cancel
          </button>
          <button
            className={buttonClasses("primary", "md", "bg-[#c23b3b] hover:bg-[#a32f2f]")}
            onClick={() => {
              if (confirm) setItems((qs) => qs.filter((q) => q.id !== confirm));
              setConfirm(null);
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
