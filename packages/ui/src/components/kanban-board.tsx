"use client";

import type { BacklogItem } from "@codeplan/core";
import { ItemCard } from "./item-card";
import { cn } from "../lib/utils";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface SortableItemCardProps {
  item: BacklogItem;
  showArchiveButton: boolean;
  onArchive?: (id: string) => void;
}

function SortableItemCard({ item, showArchiveButton, onArchive }: SortableItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ItemCard
        item={item}
        showArchiveButton={showArchiveButton}
        onArchive={onArchive}
      />
    </div>
  );
}

interface KanbanColumnProps {
  status: string;
  items: BacklogItem[];
  onArchive?: (id: string) => void;
}

function KanbanColumn({ status, items, onArchive }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

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

      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 rounded-lg bg-[var(--muted)] p-2",
            "flex flex-col gap-2 min-h-[200px]",
            isOver && "ring-2 ring-[var(--primary)] ring-opacity-50"
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
              <SortableItemCard
                key={item.id}
                item={item}
                showArchiveButton={isDone}
                onArchive={onArchive}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface KanbanBoardProps {
  itemsByStatus: Record<string, BacklogItem[]>;
  statuses: string[];
  onArchive?: (id: string) => void;
  onStatusChange?: (itemId: string, newStatus: string) => void;
}

export function KanbanBoard({
  itemsByStatus,
  statuses,
  onArchive,
  onStatusChange,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which status the item is being dropped into
    const overStatus = statuses.find(
      (status) =>
        overId === status ||
        itemsByStatus[status]?.some((item) => item.id === overId)
    );

    if (!overStatus || !onStatusChange) return;

    // Find current status of the dragged item
    const currentStatus = statuses.find((status) =>
      itemsByStatus[status]?.some((item) => item.id === activeId)
    );

    if (currentStatus && currentStatus !== overStatus) {
      onStatusChange(activeId, overStatus);
    }
  };

  const activeItem = activeId
    ? Object.values(itemsByStatus)
        .flat()
        .find((item) => item.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
      <DragOverlay>
        {activeItem ? (
          <ItemCard item={activeItem} className="rotate-3 cursor-grabbing" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
