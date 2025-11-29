"use server";

import { readdir, readFile, mkdir, rename } from "node:fs/promises";
import { join, basename } from "node:path";
import {
  parseItem,
  parseConfig,
  type BacklogItem,
  type BacklogConfig,
  ARCHIVE_FOLDER,
  getArchiveFolder,
} from "@codeplan/core";

const CODEPLAN_PATH = join(process.cwd(), "..", "..", ".codeplan");

export async function loadBacklog(): Promise<{
  items: BacklogItem[];
  config: BacklogConfig | null;
  error?: string;
}> {
  try {
    const files = await readdir(CODEPLAN_PATH);

    // Load config
    let config: BacklogConfig | null = null;
    if (files.includes("config.yaml")) {
      const configContent = await readFile(
        join(CODEPLAN_PATH, "config.yaml"),
        "utf-8"
      );
      config = parseConfig(configContent);
    }

    // Load items (exclude archive folder, README, and non-md files)
    const mdFiles = files.filter(
      (f) => f.endsWith(".md") && f !== ARCHIVE_FOLDER && f !== "README.md"
    );
    const items: BacklogItem[] = [];

    for (const file of mdFiles) {
      try {
        const content = await readFile(join(CODEPLAN_PATH, file), "utf-8");
        const item = parseItem(content, file);
        items.push(item);
      } catch (err) {
        console.error(`Failed to parse ${file}:`, err);
      }
    }

    return { items, config };
  } catch (err) {
    console.error("Failed to load backlog:", err);
    return {
      items: [],
      config: null,
      error: err instanceof Error ? err.message : "Failed to load backlog",
    };
  }
}

export async function archiveItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const files = await readdir(CODEPLAN_PATH);
    const itemFile = files.find(
      (f) => f.endsWith(".md") && f.includes(itemId)
    );

    if (!itemFile) {
      return { success: false, error: `Item ${itemId} not found` };
    }

    const archiveFolder = join(CODEPLAN_PATH, getArchiveFolder());

    // Create archive folder if it doesn't exist
    await mkdir(archiveFolder, { recursive: true });

    // Move file to archive
    const sourcePath = join(CODEPLAN_PATH, itemFile);
    const destPath = join(archiveFolder, itemFile);

    await rename(sourcePath, destPath);

    return { success: true };
  } catch (err) {
    console.error(`Failed to archive ${itemId}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to archive item",
    };
  }
}

export async function loadArchivedItems(): Promise<{
  items: BacklogItem[];
  error?: string;
}> {
  try {
    const archivePath = join(CODEPLAN_PATH, ARCHIVE_FOLDER);
    const items: BacklogItem[] = [];

    // Check if archive folder exists
    let monthFolders: string[];
    try {
      monthFolders = await readdir(archivePath);
    } catch {
      // Archive folder doesn't exist yet
      return { items: [] };
    }

    // Read items from each month folder
    for (const month of monthFolders) {
      const monthPath = join(archivePath, month);
      let files: string[];

      try {
        files = await readdir(monthPath);
      } catch {
        continue;
      }

      const mdFiles = files.filter((f) => f.endsWith(".md"));

      for (const file of mdFiles) {
        try {
          const content = await readFile(join(monthPath, file), "utf-8");
          const item = parseItem(content, `${ARCHIVE_FOLDER}/${month}/${file}`);
          items.push(item);
        } catch (err) {
          console.error(`Failed to parse archived ${file}:`, err);
        }
      }
    }

    return { items };
  } catch (err) {
    console.error("Failed to load archived items:", err);
    return {
      items: [],
      error: err instanceof Error ? err.message : "Failed to load archived items",
    };
  }
}

export async function restoreItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const archivePath = join(CODEPLAN_PATH, ARCHIVE_FOLDER);

    // Search through archive month folders
    let monthFolders: string[];
    try {
      monthFolders = await readdir(archivePath);
    } catch {
      return { success: false, error: "Archive folder not found" };
    }

    for (const month of monthFolders) {
      const monthPath = join(archivePath, month);
      let files: string[];

      try {
        files = await readdir(monthPath);
      } catch {
        continue;
      }

      const itemFile = files.find(
        (f) => f.endsWith(".md") && f.includes(itemId)
      );

      if (itemFile) {
        const sourcePath = join(monthPath, itemFile);
        const destPath = join(CODEPLAN_PATH, itemFile);

        await rename(sourcePath, destPath);
        return { success: true };
      }
    }

    return { success: false, error: `Item ${itemId} not found in archive` };
  } catch (err) {
    console.error(`Failed to restore ${itemId}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to restore item",
    };
  }
}
