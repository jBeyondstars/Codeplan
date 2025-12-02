import { readDir, readTextFile, mkdir, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { parseItem, parseConfig, serializeItem, generateItemId, type BacklogItem, type BacklogConfig, ARCHIVE_FOLDER, getArchiveFolder } from "@codeplan/core";

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

export async function updateItemStatus(
  itemId: string,
  newStatus: string
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

    const filePath = await join(codeplanPath, itemEntry.name);
    const content = await readTextFile(filePath);
    const item = parseItem(content, itemEntry.name);

    item.status = newStatus;
    item.updated = new Date().toISOString().split("T")[0];

    const updatedContent = serializeItem(item);
    await writeTextFile(filePath, updatedContent);

    return { success: true };
  } catch (err) {
    console.error(`Failed to update status for ${itemId}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update item status",
    };
  }
}

export async function createItem(
  itemData: Partial<BacklogItem>,
  config: BacklogConfig | null
): Promise<{ success: boolean; error?: string; item?: BacklogItem }> {
  if (!codeplanPath) {
    return { success: false, error: "No project folder selected" };
  }

  try {
    const entries = await readDir(codeplanPath);
    const existingIds = entries
      .filter((e) => e.name?.endsWith(".md") && e.name !== "README.md")
      .map((e) => {
        const match = e.name?.match(/^([A-Z]+-\d+)\.md$/);
        return match ? match[1] : null;
      })
      .filter((id): id is string => id !== null);

    const typeToPrefix: Record<string, string> = {
      feature: "FEAT",
      bug: "BUG",
      task: "TASK",
      chore: "CHORE",
      spike: "SPIKE",
    };

    const prefix = typeToPrefix[itemData.type || "task"] || config?.project.prefix || "TASK";
    const id = generateItemId(prefix, existingIds);

    const now = new Date();
    const item: BacklogItem = {
      id,
      title: itemData.title || "Untitled",
      type: itemData.type || "task",
      status: itemData.status || "backlog",
      priority: itemData.priority || "medium",
      description: itemData.description || "",
      created: now,
      tasks: [],
      ...itemData,
    };

    const content = serializeItem(item);
    const filePath = await join(codeplanPath, `${id}.md`);
    await writeTextFile(filePath, content);

    return { success: true, item };
  } catch (err) {
    console.error("Failed to create item:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create item",
    };
  }
}

export async function updateItem(
  itemId: string,
  updates: Partial<BacklogItem>
): Promise<{ success: boolean; error?: string; item?: BacklogItem }> {
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

    const filePath = await join(codeplanPath, itemEntry.name);
    const content = await readTextFile(filePath);
    const item = parseItem(content, itemEntry.name);

    const updatedItem: BacklogItem = {
      ...item,
      ...updates,
      id: item.id,
      updated: new Date(),
    };

    const updatedContent = serializeItem(updatedItem);
    await writeTextFile(filePath, updatedContent);

    return { success: true, item: updatedItem };
  } catch (err) {
    console.error(`Failed to update item ${itemId}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update item",
    };
  }
}
