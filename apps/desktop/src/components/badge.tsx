import { cn } from "../lib/utils";
import type { ItemType, ItemStatus, ItemPriority } from "@codeplan/core";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

const statusColors: Record<ItemStatus, string> = {
  backlog: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  todo: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "in-progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  review: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <Badge className={statusColors[status]}>{status}</Badge>;
}

const typeColors: Record<ItemType, string> = {
  feature: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  bug: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  task: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  chore: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  spike: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
};

const typeIcons: Record<ItemType, string> = {
  feature: "✦",
  bug: "●",
  task: "○",
  chore: "◇",
  spike: "◈",
};

export function TypeBadge({ type }: { type: ItemType }) {
  return (
    <Badge className={typeColors[type]}>
      <span className="mr-1">{typeIcons[type]}</span>
      {type}
    </Badge>
  );
}

const priorityColors: Record<ItemPriority, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function PriorityBadge({ priority }: { priority: ItemPriority }) {
  return <Badge className={priorityColors[priority]}>{priority}</Badge>;
}
