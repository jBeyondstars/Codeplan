/**
 * codeplan_list_tasks - List tasks from the backlog with optional filters
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { BacklogItem } from "@codeplan/core";
import { findCodeplanFolder, loadItems } from "../utils.js";

export const listTasksTool: Tool = {
  name: "codeplan_list_tasks",
  description:
    "List tasks from the project backlog. Use filters to narrow down results by status, type, priority, or labels.",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["backlog", "todo", "in-progress", "review", "done"],
        description: "Filter by status",
      },
      type: {
        type: "string",
        enum: ["feature", "bug", "task", "chore", "spike"],
        description: "Filter by type",
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Filter by priority",
      },
      label: {
        type: "string",
        description: "Filter by label (items containing this label)",
      },
      limit: {
        type: "number",
        description: "Maximum number of items to return (default: 20)",
        default: 20,
      },
    },
  },
};

interface ListTasksArgs {
  status?: string;
  type?: string;
  priority?: string;
  label?: string;
  limit?: number;
}

export async function handleListTasks(args: unknown) {
  const { status, type, priority, label, limit = 20 } = (args || {}) as ListTasksArgs;

  // Find .codeplan folder
  const codeplanPath = await findCodeplanFolder();
  if (!codeplanPath) {
    return {
      content: [
        {
          type: "text",
          text: "Error: No .codeplan folder found. Initialize Codeplan first.",
        },
      ],
      isError: true,
    };
  }

  try {
    let items = await loadItems(codeplanPath);

    // Apply filters
    if (status) {
      items = items.filter((item) => item.status === status);
    }
    if (type) {
      items = items.filter((item) => item.type === type);
    }
    if (priority) {
      items = items.filter((item) => item.priority === priority);
    }
    if (label) {
      items = items.filter((item) => item.labels?.includes(label));
    }

    // Sort by priority (critical > high > medium > low), then by created date
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    items.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });

    // Apply limit
    items = items.slice(0, limit);

    if (items.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No tasks found matching the criteria.",
          },
        ],
      };
    }

    // Format output
    const output = formatTaskList(items);

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing tasks: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}

function formatTaskList(items: BacklogItem[]): string {
  const lines = [`Found ${items.length} task(s):\n`];

  for (const item of items) {
    const labels = item.labels?.length ? ` [${item.labels.join(", ")}]` : "";
    lines.push(
      `- **${item.id}** (${item.type}, ${item.status}, ${item.priority})${labels}`
    );
    lines.push(`  ${item.title}`);
  }

  return lines.join("\n");
}
