/**
 * Initialization utilities for setting up Codeplan in a project.
 */

export const CODEPLAN_FOLDER = ".codeplan";

export const DEFAULT_CONFIG_YAML = `project:
  name: My Project
  prefix: TASK

statuses:
  - backlog
  - todo
  - in-progress
  - review
  - done

types:
  - feature
  - bug
  - task
  - chore
  - spike

priorities:
  - low
  - medium
  - high
  - critical

labels: []
`;

export const README_TEMPLATE = `# Codeplan

This folder contains project tasks managed by [Codeplan](https://github.com/anthropics/codeplan).

## How it works

Tasks are stored as markdown files with YAML frontmatter. AI agents use MCP tools to manage tasks automatically.

## Task Types

| Type | Prefix | Description |
|------|--------|-------------|
| feature | FEAT | New functionality |
| bug | BUG | Defects to fix |
| task | TASK | General work items |
| chore | CHORE | Maintenance tasks |
| spike | SPIKE | Research/investigation |

## Statuses

\`backlog\` → \`todo\` → \`in-progress\` → \`review\` → \`done\`

## Folder Structure

\`\`\`
.codeplan/
├── config.yaml      # Project configuration
├── FEAT-001.md      # Active tasks
├── BUG-002.md
└── archive/         # Completed tasks (auto-archived)
    └── 2025-01/
\`\`\`
`;

export const CLAUDE_MD_SNIPPET = `## Task Management

This project uses [Codeplan](https://github.com/anthropics/codeplan) for task management.

Use the MCP tools to manage tasks:
- \`codeplan_create_task\` - Create new tasks, features, or bugs
- \`codeplan_list_tasks\` - List and filter tasks
- \`codeplan_update_status\` - Update task status
- \`codeplan_get_context\` - Get current work context
`;

/**
 * Returns all files needed to initialize a Codeplan project.
 */
export function getInitFiles(projectName: string = "My Project"): {
  path: string;
  content: string;
}[] {
  const config = DEFAULT_CONFIG_YAML.replace("My Project", projectName);

  return [
    { path: `${CODEPLAN_FOLDER}/config.yaml`, content: config },
    { path: `${CODEPLAN_FOLDER}/README.md`, content: README_TEMPLATE },
  ];
}

/**
 * Returns the snippet to add to CLAUDE.md
 */
export function getClaudeMdSnippet(): string {
  return CLAUDE_MD_SNIPPET;
}
