"use client";

import type { BacklogItem } from "@codeplan/core";
import { cn } from "../lib/utils";
import { TypeBadge, PriorityBadge } from "./badge";

interface ItemCardProps {
  item: BacklogItem;
  className?: string;
  showArchiveButton?: boolean;
  showRestoreButton?: boolean;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
}

export function ItemCard({
  item,
  className,
  showArchiveButton,
  showRestoreButton,
  onArchive,
  onRestore,
}: ItemCardProps) {
  const completedTasks = item.tasks.filter((t) => t.done).length;
  const totalTasks = item.tasks.length;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 shadow-sm",
        "hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-[var(--muted-foreground)]">
          {item.id}
        </span>
        <PriorityBadge priority={item.priority} />
      </div>

      <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.title}</h3>

      <div className="flex items-center justify-between">
        <TypeBadge type={item.type} />

        {totalTasks > 0 && (
          <span className="text-xs text-[var(--muted-foreground)]">
            {completedTasks}/{totalTasks}
          </span>
        )}
      </div>

      {item.labels && item.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.labels.map((label) => (
            <span
              key={label}
              className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {showArchiveButton && onArchive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(item.id);
          }}
          className="mt-2 w-full text-xs py-1 px-2 rounded border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        >
          Archive
        </button>
      )}

      {showRestoreButton && onRestore && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRestore(item.id);
          }}
          className="mt-2 w-full text-xs py-1 px-2 rounded border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        >
          Restore
        </button>
      )}
    </div>
  );
}
