/**
 * codeplan_update_status - Update the status of a task
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { parseItem, serializeItem } from "@codeplan/core";
import { findCodeplanFolder, formatDate } from "../utils.js";

export const updateStatusTool: Tool = {
  name: "codeplan_update_status",
  description:
    "Update the status of a task. Use this when starting work on a task, completing it, or moving it through the workflow.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The task ID (e.g., FEAT-001, BUG-042)",
      },
      status: {
        type: "string",
        enum: ["backlog", "todo", "in-progress", "review", "done"],
        description: "The new status",
      },
    },
    required: ["id", "status"],
  },
};

interface UpdateStatusArgs {
  id: string;
  status: string;
}

export async function handleUpdateStatus(args: unknown) {
  const { id, status } = args as UpdateStatusArgs;

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

  const filename = `${id}.md`;
  const filePath = join(codeplanPath, filename);

  try {
    // Read existing file
    const content = await readFile(filePath, "utf-8");
    const item = parseItem(content, filename);

    const oldStatus = item.status;

    // Update status and updated date
    item.status = status as "backlog" | "todo" | "in-progress" | "review" | "done";
    item.updated = new Date(formatDate());

    // Serialize and write back
    const newContent = serializeItem(item);
    await writeFile(filePath, newContent, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `Updated ${id}: ${oldStatus} → ${status}\n\nTask: ${item.title}`,
        },
      ],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        content: [
          {
            type: "text",
            text: `Error: Task ${id} not found. Check the ID and try again.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Error updating status: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}
