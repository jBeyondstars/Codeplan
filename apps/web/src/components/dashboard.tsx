"use client";

import { useState, useTransition } from "react";
import type { BacklogItem, BacklogConfig } from "@codeplan/core";
import { KanbanBoard } from "./kanban-board";
import { BacklogTable } from "./backlog-table";
import { ArchiveView } from "./archive-view";
import { cn } from "@/lib/utils";
import {
  archiveItem,
  restoreItem,
  loadArchivedItems,
} from "@/actions/backlog";

type View = "kanban" | "table" | "archive";

interface DashboardProps {
  initialItems: BacklogItem[];
  initialConfig: BacklogConfig | null;
}

export function Dashboard({ initialItems, initialConfig }: DashboardProps) {
  const [view, setView] = useState<View>("kanban");
  const [items, setItems] = useState(initialItems);
  const [archivedItems, setArchivedItems] = useState<BacklogItem[]>([]);
  const [archiveLoaded, setArchiveLoaded] = useState(false);
  const [config] = useState(initialConfig);
  const [sortField, setSortField] = useState("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const statuses = config?.statuses || [
    "backlog",
    "todo",
    "in-progress",
    "review",
    "done",
  ];

  const filteredItems =
    filterStatus === "all"
      ? items
      : items.filter((item) => item.status === filterStatus);

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "priority": {
        const priorityOrder: Record<string, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      }
      case "created":
        comparison =
          new Date(a.created).getTime() - new Date(b.created).getTime();
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const itemsByStatus: Record<string, BacklogItem[]> = {};
  for (const status of statuses) {
    itemsByStatus[status] = filteredItems.filter(
      (item) => item.status === status
    );
  }

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleArchive = (id: string) => {
    startTransition(async () => {
      const result = await archiveItem(id);
      if (result.success) {
        const item = items.find((i) => i.id === id);
        if (item) {
          setItems(items.filter((i) => i.id !== id));
          setArchivedItems([...archivedItems, item]);
        }
      }
    });
  };

  const handleRestore = (id: string) => {
    startTransition(async () => {
      const result = await restoreItem(id);
      if (result.success) {
        const item = archivedItems.find((i) => i.id === id);
        if (item) {
          setArchivedItems(archivedItems.filter((i) => i.id !== id));
          setItems([...items, item]);
        }
      }
    });
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
    if (newView === "archive" && !archiveLoaded) {
      startTransition(async () => {
        const result = await loadArchivedItems();
        setArchivedItems(result.items);
        setArchiveLoaded(true);
      });
    }
  };

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {config?.project.name || "Codeplan"}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {items.length} items
              {archivedItems.length > 0 && ` · ${archivedItems.length} archived`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm",
                  view === "kanban"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "hover:bg-[var(--muted)]"
                )}
                onClick={() => handleViewChange("kanban")}
              >
                Board
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm",
                  view === "table"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "hover:bg-[var(--muted)]"
                )}
                onClick={() => handleViewChange("table")}
              >
                Table
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm",
                  view === "archive"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "hover:bg-[var(--muted)]"
                )}
                onClick={() => handleViewChange("archive")}
              >
                Archive
              </button>
            </div>
          </div>
        </div>

        {/* Filters - only show for kanban/table */}
        {view !== "archive" && (
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <main className={cn(isPending && "opacity-50 pointer-events-none")}>
        {view === "kanban" && (
          <KanbanBoard
            itemsByStatus={itemsByStatus}
            statuses={statuses}
            onArchive={handleArchive}
          />
        )}
        {view === "table" && (
          <BacklogTable
            items={sortedItems}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
        {view === "archive" && (
          <ArchiveView items={archivedItems} onRestore={handleRestore} />
        )}
      </main>
    </div>
  );
}
