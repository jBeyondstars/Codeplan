import YAML from "yaml";
import { BacklogConfigSchema, type BacklogConfig } from "./types";
import { ParseError } from "./parser";

export const DEFAULT_CONFIG: BacklogConfig = {
  project: {
    name: "My Project",
    prefix: "TASK",
  },
  statuses: ["backlog", "todo", "in-progress", "review", "done"],
  types: ["feature", "bug", "task", "chore", "spike"],
  priorities: ["low", "medium", "high", "critical"],
  labels: [],
};

export function parseConfig(
  yamlContent: string,
  filePath?: string,
): BacklogConfig {
  const parsed = YAML.parse(yamlContent);

  if (!parsed) {
    return DEFAULT_CONFIG;
  }

  const result = BacklogConfigSchema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ParseError(`Invalid config: ${errors}`, filePath);
  }

  return result.data;
}

export function serializeConfig(config: BacklogConfig): string {
  return YAML.stringify(config);
}

export function getTypePrefix(type: string): string {
  const prefixes: Record<string, string> = {
    feature: "FEAT",
    bug: "BUG",
    task: "TASK",
    chore: "CHORE",
    spike: "SPIKE",
  };

  return prefixes[type] || "ITEM";
}
