/**
 * codeplan_create_task - Create a new task/feature/bug in the backlog
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { serializeItem } from "@codeplan/core";
import {
  findCodeplanFolder,
  getNextId,
  getTypePrefix,
  formatDate,
} from "../utils.js";

export const createTaskTool: Tool = {
  name: "codeplan_create_task",
  description:
    "Create a new task, feature, bug, or other work item in the project backlog. Use this when the user asks to track work, create a task, add a feature, report a bug, etc.",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short title describing the task (required)",
      },
      type: {
        type: "string",
        enum: ["feature", "bug", "task", "chore", "spike"],
        description:
          "Type of work item. Use 'feature' for new functionality, 'bug' for defects, 'task' for general work, 'chore' for maintenance, 'spike' for research.",
        default: "task",
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Priority level",
        default: "medium",
      },
      description: {
        type: "string",
        description: "Detailed description of what needs to be done",
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Optional labels/tags for categorization",
      },
      status: {
        type: "string",
        enum: ["backlog", "todo", "in-progress", "review", "done"],
        description: "Initial status (defaults to 'backlog')",
        default: "backlog",
      },
    },
    required: ["title"],
  },
};

interface CreateTaskArgs {
  title: string;
  type?: string;
  priority?: string;
  description?: string;
  labels?: string[];
  status?: string;
}

export async function handleCreateTask(args: unknown) {
  const {
    title,
    type = "task",
    priority = "medium",
    description = "",
    labels = [],
    status = "backlog",
  } = args as CreateTaskArgs;

  // Find .codeplan folder
  const codeplanPath = await findCodeplanFolder();
  if (!codeplanPath) {
    return {
      content: [
        {
          type: "text",
          text: "Error: No .codeplan folder found. Initialize Codeplan first by creating a .codeplan directory with a config.yaml file.",
        },
      ],
      isError: true,
    };
  }

  // Generate next ID
  const prefix = getTypePrefix(type);
  const id = await getNextId(codeplanPath, prefix);
  const filename = `${id}.md`;
  const created = formatDate();

  // Create the item
  const item = {
    id,
    title,
    type: type as "feature" | "bug" | "task" | "chore" | "spike",
    status: status as "backlog" | "todo" | "in-progress" | "review" | "done",
    priority: priority as "low" | "medium" | "high" | "critical",
    labels,
    created: new Date(created),
    description: description || `## Description\n\nDescribe what needs to be done.\n\n## Tasks\n\n- [ ] TODO`,
    tasks: [],
  };

  // Serialize and write
  const content = serializeItem(item);
  const filePath = join(codeplanPath, filename);

  try {
    await writeFile(filePath, content, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `Created ${type} "${title}" with ID ${id}\n\nFile: ${filename}\nStatus: ${status}\nPriority: ${priority}${labels.length > 0 ? `\nLabels: ${labels.join(", ")}` : ""}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating task: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}
