"use client";

import type { BacklogItem } from "@codeplan/core";
import { ItemCard } from "./item-card";

interface ArchiveViewProps {
  items: BacklogItem[];
  onRestore: (id: string) => void;
}

export function ArchiveView({ items, onRestore }: ArchiveViewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)]">
        No archived items
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          showRestoreButton
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}
