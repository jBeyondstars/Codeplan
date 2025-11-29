"use client";

import type { BacklogItem } from "@codeplan/core";
import { ItemCard } from "./item-card";
import { cn } from "../lib/utils";

interface KanbanColumnProps {
  status: string;
  items: BacklogItem[];
  onArchive?: (id: string) => void;
}

function KanbanColumn({ status, items, onArchive }: KanbanColumnProps) {
  const statusLabels: Record<string, string> = {
    backlog: "Backlog",
    todo: "To Do",
    "in-progress": "In Progress",
    review: "Review",
    done: "Done",
  };

  const isDone = status === "done";

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-semibold text-sm">
          {statusLabels[status] || status}
        </h2>
        <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <div
        className={cn(
          "flex-1 rounded-lg bg-[var(--muted)] p-2",
          "flex flex-col gap-2 min-h-[200px]"
        )}
      >
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs text-[var(--muted-foreground)]">
              No items
            </span>
          </div>
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              showArchiveButton={isDone}
              onArchive={onArchive}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  itemsByStatus: Record<string, BacklogItem[]>;
  statuses: string[];
  onArchive?: (id: string) => void;
}

export function KanbanBoard({
  itemsByStatus,
  statuses,
  onArchive,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          items={itemsByStatus[status] || []}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
