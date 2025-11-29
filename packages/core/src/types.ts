import { z } from "zod";

export const ItemTypeSchema = z.enum([
  "feature",
  "bug",
  "task",
  "chore",
  "spike",
]);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const ItemStatusSchema = z.enum([
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const ItemPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export type ItemPriority = z.infer<typeof ItemPrioritySchema>;

export const TaskSchema = z.object({
  text: z.string(),
  done: z.boolean(),
});
export type Task = z.infer<typeof TaskSchema>;

export const BacklogItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: ItemTypeSchema,
  status: ItemStatusSchema,
  priority: ItemPrioritySchema,
  sprint: z.number().optional(),
  points: z.number().optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string()).optional(),
  created: z.coerce.date(),
  updated: z.coerce.date().optional(),
  due: z.coerce.date().optional(),
  parent: z.string().optional(),
  description: z.string(),
  tasks: z.array(TaskSchema).default([]),
});
export type BacklogItem = z.infer<typeof BacklogItemSchema>;

export const SprintConfigSchema = z.object({
  current: z.number(),
  duration: z.number(),
  start_date: z.coerce.date(),
});
export type SprintConfig = z.infer<typeof SprintConfigSchema>;

export const ProjectConfigSchema = z.object({
  name: z.string(),
  prefix: z.string(),
});
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export const BacklogConfigSchema = z.object({
  project: ProjectConfigSchema,
  statuses: z.array(z.string()),
  types: z.array(z.string()),
  priorities: z.array(z.string()),
  sprints: SprintConfigSchema.optional(),
  labels: z.array(z.string()).optional(),
});
export type BacklogConfig = z.infer<typeof BacklogConfigSchema>;
