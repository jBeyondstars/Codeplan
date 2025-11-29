import type { BacklogItem } from "./types";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTasks(tasks: BacklogItem["tasks"]): string {
  if (tasks.length === 0) return "";

  const lines = tasks.map(
    (task) => `- [${task.done ? "x" : " "}] ${task.text}`,
  );

  return `## Tasks\n\n${lines.join("\n")}`;
}

export function serializeItem(item: BacklogItem): string {
  const frontmatter: Record<string, unknown> = {
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    priority: item.priority,
  };

  if (item.sprint !== undefined) frontmatter.sprint = item.sprint;
  if (item.points !== undefined) frontmatter.points = item.points;
  if (item.assignee) frontmatter.assignee = item.assignee;
  if (item.labels && item.labels.length > 0) frontmatter.labels = item.labels;
  if (item.created) frontmatter.created = formatDate(item.created);
  if (item.updated) frontmatter.updated = formatDate(item.updated);
  if (item.due) frontmatter.due = formatDate(item.due);
  if (item.parent) frontmatter.parent = item.parent;

  const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
    }
    return `${key}: ${value}`;
  });

  const parts = [
    "---",
    yamlLines.join("\n"),
    "---",
    "",
    "## Description",
    "",
    item.description || "",
  ];

  const tasksSection = formatTasks(item.tasks);
  if (tasksSection) {
    parts.push("", tasksSection);
  }

  return parts.join("\n") + "\n";
}

export function generateItemId(
  prefix: string,
  existingIds: string[],
): string {
  const prefixPattern = new RegExp(`^${prefix}-(\\d+)$`);
  let maxNumber = 0;

  for (const id of existingIds) {
    const match = id.match(prefixPattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  }

  const nextNumber = maxNumber + 1;
  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}
