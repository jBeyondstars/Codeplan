import matter from "gray-matter";
import { BacklogItemSchema, type BacklogItem, type Task } from "./types";

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly filePath?: string,
  ) {
    super(filePath ? `${message} in ${filePath}` : message);
    this.name = "ParseError";
  }
}

function parseCheckboxes(content: string): Task[] {
  const tasks: Task[] = [];
  const checkboxRegex = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;

  let match: RegExpExecArray | null;
  while ((match = checkboxRegex.exec(content)) !== null) {
    tasks.push({
      done: match[1].toLowerCase() === "x",
      text: match[2].trim(),
    });
  }

  return tasks;
}

function extractDescription(content: string): string {
  const lines = content.split("\n");
  const descriptionLines: string[] = [];
  let inDescription = false;
  let skipNextSection = false;

  for (const line of lines) {
    if (line.startsWith("## Description")) {
      inDescription = true;
      continue;
    }

    if (line.startsWith("## ") && inDescription) {
      break;
    }

    if (inDescription) {
      descriptionLines.push(line);
    }
  }

  return descriptionLines.join("\n").trim();
}

export function parseItem(
  markdown: string,
  filePath?: string,
): BacklogItem {
  const { data: frontmatter, content } = matter(markdown);

  if (!frontmatter.id) {
    throw new ParseError("Missing required field: id", filePath);
  }

  if (!frontmatter.title) {
    throw new ParseError("Missing required field: title", filePath);
  }

  const tasks = parseCheckboxes(content);
  const description = extractDescription(content);

  const item = {
    ...frontmatter,
    description: description || "",
    tasks,
    created: frontmatter.created || new Date(),
    updated: frontmatter.updated || frontmatter.created || new Date(),
  };

  const result = BacklogItemSchema.safeParse(item);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ParseError(`Invalid item: ${errors}`, filePath);
  }

  return result.data;
}

export function parseItems(
  files: { path: string; content: string }[],
): BacklogItem[] {
  return files.map((file) => parseItem(file.content, file.path));
}
