import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";
import { Dashboard } from "@codeplan/ui";
import type { BacklogItem } from "@codeplan/core";
import { useBacklogStore } from "./store/backlog";
import {
  loadBacklog,
  archiveItem,
  restoreItem,
  updateItemStatus,
  createItem,
  updateItem,
  setCodeplanPath,
} from "./services/backlog";
import "./index.css";

function App() {
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setItems, setConfig, items, config } = useBacklogStore();

  const selectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select project folder",
      });

      if (selected && typeof selected === "string") {
        const codeplanDir = await join(selected, ".codeplan");
        const hasCodeplan = await exists(codeplanDir);

        if (!hasCodeplan) {
          setError("Selected folder does not contain a .codeplan directory. Run 'npx @codeplan/cli init' first.");
          return;
        }

        setCodeplanPath(codeplanDir);
        setProjectPath(selected);
        setError(null);

        const result = await loadBacklog();
        if (result.error) {
          setError(result.error);
        } else {
          setItems(result.items);
          if (result.config) {
            setConfig(result.config);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select folder");
    }
  };

  const handleArchive = async (itemId: string) => {
    const result = await archiveItem(itemId);
    if (result.success) {
      const backlog = await loadBacklog();
      setItems(backlog.items);
    }
    return result;
  };

  const handleRestore = async (itemId: string) => {
    const result = await restoreItem(itemId);
    if (result.success) {
      const backlog = await loadBacklog();
      setItems(backlog.items);
    }
    return result;
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    const result = await updateItemStatus(itemId, newStatus);
    if (result.success) {
      const backlog = await loadBacklog();
      setItems(backlog.items);
    }
    return result;
  };

  const handleCreateItem = async (itemData: Partial<BacklogItem>) => {
    const result = await createItem(itemData, config);
    if (result.success) {
      const backlog = await loadBacklog();
      setItems(backlog.items);
    }
    return result;
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<BacklogItem>) => {
    const result = await updateItem(itemId, updates);
    if (result.success) {
      const backlog = await loadBacklog();
      setItems(backlog.items);
    }
    return result;
  };

  if (!projectPath) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Codeplan</h1>
          <p className="text-[var(--muted-foreground)] mb-8">
            AI-native project planning for developers
          </p>

          <button
            onClick={selectFolder}
            className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Open Project Folder
          </button>

          {error && (
            <p className="mt-4 text-red-500 text-sm">{error}</p>
          )}

          <p className="mt-8 text-sm text-[var(--muted-foreground)]">
            Select a folder containing a <code className="bg-[var(--muted)] px-1 rounded">.codeplan</code> directory
          </p>
        </div>
      </main>
    );
  }

  return (
    <Dashboard
      initialItems={items}
      initialConfig={config}
      onArchive={handleArchive}
      onRestore={handleRestore}
      onStatusChange={handleStatusChange}
      onCreateItem={handleCreateItem}
      onUpdateItem={handleUpdateItem}
    />
  );
}

export default App;
