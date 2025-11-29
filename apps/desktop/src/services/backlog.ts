import { readDir, readTextFile, mkdir, rename } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { parseItem, parseConfig, type BacklogItem, type BacklogConfig, ARCHIVE_FOLDER, getArchiveFolder } from "@codeplan/core";

let codeplanPath: string | null = null;

export function setCodeplanPath(path: string) {
  codeplanPath = path;
}

export function getCodeplanPath(): string | null {
  return codeplanPath;
}

export async function loadBacklog(): Promise<{
  items: BacklogItem[];
  config: BacklogConfig | null;
  error?: string;
}> {
  if (!codeplanPath) {
    return { items: [], config: null, error: "No project folder selected" };
  }

  try {
    const entries = await readDir(codeplanPath);

    // Load config
    let config: BacklogConfig | null = null;
    const configEntry = entries.find((e) => e.name === "config.yaml");
    if (configEntry) {
      const configPath = await join(codeplanPath, "config.yaml");
      const configContent = await readTextFile(configPath);
      config = parseConfig(configContent);
    }

    // Load items
    const mdFiles = entries.filter(
      (e) => e.name?.endsWith(".md") && e.name !== "README.md" && !e.isDirectory
    );
    const items: BacklogItem[] = [];

    for (const entry of mdFiles) {
      if (!entry.name) continue;
      try {
        const filePath = await join(codeplanPath, entry.name);
        const content = await readTextFile(filePath);
        const item = parseItem(content, entry.name);
        items.push(item);
      } catch (err) {
        console.error(`Failed to parse ${entry.name}:`, err);
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
  if (!codeplanPath) {
    return { success: false, error: "No project folder selected" };
  }

  try {
    const entries = await readDir(codeplanPath);
    const itemEntry = entries.find(
      (e) => e.name?.endsWith(".md") && e.name?.includes(itemId)
    );

    if (!itemEntry || !itemEntry.name) {
      return { success: false, error: `Item ${itemId} not found` };
    }

    const archiveFolder = await join(codeplanPath, getArchiveFolder());

    try {
      await mkdir(archiveFolder, { recursive: true });
    } catch {
    }

    const sourcePath = await join(codeplanPath, itemEntry.name);
    const destPath = await join(archiveFolder, itemEntry.name);

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
  if (!codeplanPath) {
    return { items: [], error: "No project folder selected" };
  }

  try {
    const archivePath = await join(codeplanPath, ARCHIVE_FOLDER);
    const items: BacklogItem[] = [];

    let monthFolders;
    try {
      monthFolders = await readDir(archivePath);
    } catch {
      return { items: [] };
    }

    for (const month of monthFolders) {
      if (!month.isDirectory || !month.name) continue;

      const monthPath = await join(archivePath, month.name);
      let files;

      try {
        files = await readDir(monthPath);
      } catch {
        continue;
      }

      for (const file of files) {
        if (!file.name?.endsWith(".md")) continue;

        try {
          const filePath = await join(monthPath, file.name);
          const content = await readTextFile(filePath);
          const item = parseItem(content, `${ARCHIVE_FOLDER}/${month.name}/${file.name}`);
          items.push(item);
        } catch (err) {
          console.error(`Failed to parse archived ${file.name}:`, err);
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
  if (!codeplanPath) {
    return { success: false, error: "No project folder selected" };
  }

  try {
    const archivePath = await join(codeplanPath, ARCHIVE_FOLDER);

    let monthFolders;
    try {
      monthFolders = await readDir(archivePath);
    } catch {
      return { success: false, error: "Archive folder not found" };
    }

    for (const month of monthFolders) {
      if (!month.isDirectory || !month.name) continue;

      const monthPath = await join(archivePath, month.name);
      let files;

      try {
        files = await readDir(monthPath);
      } catch {
        continue;
      }

      const itemFile = files.find(
        (f) => f.name?.endsWith(".md") && f.name?.includes(itemId)
      );

      if (itemFile && itemFile.name) {
        const sourcePath = await join(monthPath, itemFile.name);
        const destPath = await join(codeplanPath, itemFile.name);

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
