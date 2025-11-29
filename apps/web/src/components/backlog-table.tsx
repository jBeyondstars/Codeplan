"use client";

import type { BacklogItem } from "@codeplan/core";
import { StatusBadge, TypeBadge, PriorityBadge } from "./badge";
import { cn } from "@/lib/utils";

interface BacklogTableProps {
  items: BacklogItem[];
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

function SortHeader({
  field,
  currentField,
  sortOrder,
  onSort,
  children,
}: {
  field: string;
  currentField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  children: React.ReactNode;
}) {
  const isActive = field === currentField;

  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer",
        "hover:bg-[var(--muted)] transition-colors",
        isActive && "text-[var(--foreground)]"
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && (
          <span className="text-[var(--muted-foreground)]">
            {sortOrder === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function BacklogTable({
  items,
  sortField,
  sortOrder,
  onSort,
}: BacklogTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)]">
        No items found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full">
        <thead className="bg-[var(--muted)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-24">
              ID
            </th>
            <SortHeader
              field="title"
              currentField={sortField}
              sortOrder={sortOrder}
              onSort={onSort}
            >
              Title
            </SortHeader>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Type
            </th>
            <SortHeader
              field="status"
              currentField={sortField}
              sortOrder={sortOrder}
              onSort={onSort}
            >
              Status
            </SortHeader>
            <SortHeader
              field="priority"
              currentField={sortField}
              sortOrder={sortOrder}
              onSort={onSort}
            >
              Priority
            </SortHeader>
            <SortHeader
              field="created"
              currentField={sortField}
              sortOrder={sortOrder}
              onSort={onSort}
            >
              Created
            </SortHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-[var(--muted)] transition-colors cursor-pointer"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-[var(--muted-foreground)]">
                  {item.id}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-sm">{item.title}</span>
              </td>
              <td className="px-4 py-3">
                <TypeBadge type={item.type} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={item.priority} />
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatDate(item.created)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
