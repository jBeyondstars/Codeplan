/**
 * codeplan_get_context - Get tasks relevant to the current work context
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { BacklogItem } from "@codeplan/core";
import { findCodeplanFolder, loadItems } from "../utils.js";

export const getContextTool: Tool = {
  name: "codeplan_get_context",
  description:
    "Get tasks relevant to the current work. Returns in-progress tasks and high-priority items. Use this to understand what work is active and what should be prioritized.",
  inputSchema: {
    type: "object",
    properties: {
      includeBacklog: {
        type: "boolean",
        description: "Include high-priority backlog items (default: true)",
        default: true,
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        description:
          "Optional keywords to filter tasks (matches title, description, or labels)",
      },
    },
  },
};

interface GetContextArgs {
  includeBacklog?: boolean;
  keywords?: string[];
}

export async function handleGetContext(args: unknown) {
  const { includeBacklog = true, keywords = [] } = (args || {}) as GetContextArgs;

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
    const allItems = await loadItems(codeplanPath);

    // Get in-progress items
    const inProgress = allItems.filter((item) => item.status === "in-progress");

    // Get items in review
    const inReview = allItems.filter((item) => item.status === "review");

    // Get high-priority backlog/todo items
    let upcoming: BacklogItem[] = [];
    if (includeBacklog) {
      upcoming = allItems.filter(
        (item) =>
          (item.status === "backlog" || item.status === "todo") &&
          (item.priority === "critical" || item.priority === "high")
      );
    }

    // Apply keyword filter if provided
    let filtered = [...inProgress, ...inReview, ...upcoming];
    if (keywords.length > 0) {
      const lowerKeywords = keywords.map((k) => k.toLowerCase());
      filtered = filtered.filter((item) => {
        const searchText = [
          item.title,
          item.description,
          ...(item.labels || []),
        ]
          .join(" ")
          .toLowerCase();
        return lowerKeywords.some((kw) => searchText.includes(kw));
      });
    }

    // Remove duplicates (in case an item matches multiple categories)
    const seen = new Set<string>();
    filtered = filtered.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: keywords.length > 0
              ? `No tasks found matching keywords: ${keywords.join(", ")}`
              : "No active or high-priority tasks found.",
          },
        ],
      };
    }

    // Format output
    const output = formatContext(inProgress, inReview, upcoming, keywords);

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
          text: `Error getting context: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}

function formatContext(
  inProgress: BacklogItem[],
  inReview: BacklogItem[],
  upcoming: BacklogItem[],
  keywords: string[]
): string {
  const sections: string[] = [];

  if (keywords.length > 0) {
    sections.push(`Filtering by keywords: ${keywords.join(", ")}\n`);
  }

  if (inProgress.length > 0) {
    sections.push("## In Progress\n");
    for (const item of inProgress) {
      sections.push(formatItem(item));
    }
  }

  if (inReview.length > 0) {
    sections.push("\n## In Review\n");
    for (const item of inReview) {
      sections.push(formatItem(item));
    }
  }

  if (upcoming.length > 0) {
    sections.push("\n## High Priority (Upcoming)\n");
    for (const item of upcoming) {
      sections.push(formatItem(item));
    }
  }

  return sections.join("\n");
}

function formatItem(item: BacklogItem): string {
  const labels = item.labels?.length ? ` [${item.labels.join(", ")}]` : "";
  return `- **${item.id}** (${item.priority})${labels}\n  ${item.title}`;
}
