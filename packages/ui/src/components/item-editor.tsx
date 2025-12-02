"use client";

import { useState, useEffect } from "react";
import type { BacklogItem, BacklogConfig } from "@codeplan/core";
import { cn } from "../lib/utils";

interface ItemEditorProps {
  item?: BacklogItem;
  config: BacklogConfig | null;
  onSave: (item: Partial<BacklogItem>) => void | Promise<void>;
  onCancel: () => void;
}

export function ItemEditor({ item, config, onSave, onCancel }: ItemEditorProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [type, setType] = useState<BacklogItem["type"]>(item?.type || "task");
  const [status, setStatus] = useState<BacklogItem["status"]>(item?.status || "backlog");
  const [priority, setPriority] = useState<BacklogItem["priority"]>(item?.priority || "medium");
  const [assignee, setAssignee] = useState(item?.assignee || "");
  const [sprint, setSprint] = useState(item?.sprint?.toString() || "");
  const [points, setPoints] = useState(item?.points?.toString() || "");
  const [labels, setLabels] = useState(item?.labels?.join(", ") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statuses = config?.statuses || ["backlog", "todo", "in-progress", "review", "done"];
  const types: BacklogItem["type"][] = ["feature", "bug", "task", "chore", "spike"];
  const priorities: BacklogItem["priority"][] = ["low", "medium", "high", "critical"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const itemData: Partial<BacklogItem> = {
      title,
      description,
      type,
      status,
      priority,
    };

    if (item?.id) itemData.id = item.id;
    if (assignee) itemData.assignee = assignee;
    if (sprint) itemData.sprint = parseInt(sprint, 10);
    if (points) itemData.points = parseInt(points, 10);
    if (labels) itemData.labels = labels.split(",").map((l) => l.trim()).filter(Boolean);

    try {
      await onSave(itemData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title *
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
          placeholder="Enter task title"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1">
            Type *
          </label>
          <select
            id="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as BacklogItem["type"])}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status *
          </label>
          <select
            id="status"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value as BacklogItem["status"])}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Priority *
          </label>
          <select
            id="priority"
            required
            value={priority}
            onChange={(e) => setPriority(e.target.value as BacklogItem["priority"])}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assignee" className="block text-sm font-medium mb-1">
            Assignee
          </label>
          <input
            id="assignee"
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sprint" className="block text-sm font-medium mb-1">
            Sprint
          </label>
          <input
            id="sprint"
            type="number"
            value={sprint}
            onChange={(e) => setSprint(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
            placeholder="Optional"
          />
        </div>

        <div>
          <label htmlFor="points" className="block text-sm font-medium mb-1">
            Story Points
          </label>
          <input
            id="points"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label htmlFor="labels" className="block text-sm font-medium mb-1">
          Labels
        </label>
        <input
          id="labels"
          type="text"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
          placeholder="Comma-separated (e.g., frontend, ui, bug-fix)"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
          placeholder="Describe the task..."
        />
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium",
            "hover:opacity-90 transition-opacity",
            isSubmitting && "opacity-50 cursor-not-allowed"
          )}
        >
          {isSubmitting ? "Saving..." : item ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
