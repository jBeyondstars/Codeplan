/**
 * Utility functions for the MCP server
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { parseItem, parseConfig, type BacklogItem, type BacklogConfig } from "@codeplan/core";

const CODEPLAN_FOLDER = ".codeplan";

/**
 * Find the .codeplan folder by walking up from cwd
 */
export async function findCodeplanFolder(): Promise<string | null> {
  let current = process.cwd();

  while (current !== dirname(current)) {
    const candidate = join(current, CODEPLAN_FOLDER);
    try {
      const stats = await stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch {
      // Not found, continue up
    }
    current = dirname(current);
  }

  return null;
}

/**
 * Load all active (non-archived) items from .codeplan
 */
export async function loadItems(codeplanPath: string): Promise<BacklogItem[]> {
  const files = await readdir(codeplanPath);
  const mdFiles = files.filter(
    (f) => f.endsWith(".md") && f !== "README.md"
  );

  const items: BacklogItem[] = [];

  for (const file of mdFiles) {
    try {
      const content = await readFile(join(codeplanPath, file), "utf-8");
      const item = parseItem(content, file);
      items.push(item);
    } catch (err) {
      // Skip invalid files
      console.error(`Failed to parse ${file}:`, err);
    }
  }

  return items;
}

/**
 * Load config from .codeplan/config.yaml
 */
export async function loadConfig(codeplanPath: string): Promise<BacklogConfig | null> {
  try {
    const content = await readFile(join(codeplanPath, "config.yaml"), "utf-8");
    return parseConfig(content);
  } catch {
    return null;
  }
}

/**
 * Get the next available ID for a given type prefix
 */
export async function getNextId(codeplanPath: string, prefix: string): Promise<string> {
  const items = await loadItems(codeplanPath);

  const existingNumbers = items
    .filter((item) => item.id.startsWith(prefix))
    .map((item) => {
      const match = item.id.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  const nextNumber = maxNumber + 1;

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Get type prefix from item type
 */
export function getTypePrefix(type: string): string {
  const prefixes: Record<string, string> = {
    feature: "FEAT",
    bug: "BUG",
    task: "TASK",
    chore: "CHORE",
    spike: "SPIKE",
  };
  return prefixes[type] || "TASK";
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}
