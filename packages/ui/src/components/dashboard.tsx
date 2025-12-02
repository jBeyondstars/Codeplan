"use client";

import { useState, useEffect, useTransition } from "react";
import type { BacklogItem, BacklogConfig } from "@codeplan/core";
import { KanbanBoard } from "./kanban-board";
import { BacklogTable } from "./backlog-table";
import { ArchiveView } from "./archive-view";
import { ItemEditor } from "./item-editor";
import { Dialog } from "./dialog";
import { cn } from "../lib/utils";

type View = "kanban" | "table" | "archive";

interface DashboardProps {
  initialItems: BacklogItem[];
  initialConfig: BacklogConfig | null;
  onArchive?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onRestore?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onLoadArchived?: () => Promise<{ items: BacklogItem[]; error?: string }>;
  onStatusChange?: (itemId: string, newStatus: string) => Promise<{ success: boolean; error?: string }>;
  onCreateItem?: (itemData: Partial<BacklogItem>) => Promise<{ success: boolean; error?: string; item?: BacklogItem }>;
  onUpdateItem?: (itemId: string, updates: Partial<BacklogItem>) => Promise<{ success: boolean; error?: string; item?: BacklogItem }>;
}

export function Dashboard({
  initialItems,
  initialConfig,
  onArchive,
  onRestore,
  onLoadArchived,
  onStatusChange,
  onCreateItem,
  onUpdateItem
}: DashboardProps) {
  const [view, setView] = useState<View>("kanban");
  const [items, setItems] = useState(initialItems);
  const [archivedItems, setArchivedItems] = useState<BacklogItem[]>([]);
  const [archiveLoaded, setArchiveLoaded] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BacklogItem | undefined>(undefined);

  // Update items when initialItems changes (after loading)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Update config when initialConfig changes
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

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
    if (!onArchive) return;
    startTransition(async () => {
      const result = await onArchive(id);
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
    if (!onRestore) return;
    startTransition(async () => {
      const result = await onRestore(id);
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
    if (newView === "archive" && !archiveLoaded && onLoadArchived) {
      startTransition(async () => {
        const result = await onLoadArchived();
        setArchivedItems(result.items);
        setArchiveLoaded(true);
      });
    }
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    if (!onStatusChange) return;
    startTransition(async () => {
      const result = await onStatusChange(itemId, newStatus);
      if (result.success) {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId ? { ...item, status: newStatus as BacklogItem["status"] } : item
          )
        );
      }
    });
  };

  const handleOpenEditor = (item?: BacklogItem) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingItem(undefined);
  };

  const handleSaveItem = async (itemData: Partial<BacklogItem>) => {
    if (editingItem && onUpdateItem) {
      startTransition(async () => {
        const result = await onUpdateItem(editingItem.id, itemData);
        if (result.success && result.item) {
          setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === editingItem.id ? result.item! : item
            )
          );
          handleCloseEditor();
        }
      });
    } else if (onCreateItem) {
      startTransition(async () => {
        const result = await onCreateItem(itemData);
        if (result.success && result.item) {
          setItems((prevItems) => [...prevItems, result.item!]);
          handleCloseEditor();
        }
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
            {onCreateItem && (
              <button
                type="button"
                onClick={() => handleOpenEditor()}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-opacity"
              >
                + New Item
              </button>
            )}

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
            onStatusChange={handleStatusChange}
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

      <Dialog
        open={isEditorOpen}
        onClose={handleCloseEditor}
        title={editingItem ? "Edit Item" : "Create New Item"}
      >
        <ItemEditor
          item={editingItem}
          config={config}
          onSave={handleSaveItem}
          onCancel={handleCloseEditor}
        />
      </Dialog>
    </div>
  );
}
