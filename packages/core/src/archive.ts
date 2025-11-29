/**
 * Archive utilities for moving completed items to archive folders.
 *
 * Structure:
 * .backlog/
 * ├── config.yaml
 * ├── FEAT-001.md      (active)
 * └── archive/
 *     └── 2025-11/
 *         └── TASK-003.md (archived)
 */

export const ARCHIVE_FOLDER = "archive";

/**
 * Check if a path is inside the archive folder.
 */
export function isArchived(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.includes(`/${ARCHIVE_FOLDER}/`) || normalized.startsWith(`${ARCHIVE_FOLDER}/`);
}

/**
 * Filter out archived files from a list of file paths.
 */
export function filterActiveFiles(files: string[]): string[] {
  return files.filter((file) => !isArchived(file));
}

/**
 * Get the archive path for an item based on current date.
 * Returns: archive/YYYY-MM/filename.md
 */
export function getArchivePath(filename: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${ARCHIVE_FOLDER}/${year}-${month}/${filename}`;
}

/**
 * Get the archive folder path for a given date.
 * Returns: archive/YYYY-MM
 */
export function getArchiveFolder(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${ARCHIVE_FOLDER}/${year}-${month}`;
}
