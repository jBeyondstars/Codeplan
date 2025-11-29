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

This folder contains project tasks managed by [Codeplan](https://github.com/your-repo/codeplan).

## For AI Agents

To create a new task, create a markdown file in this folder with YAML frontmatter.

### File Naming

Use the pattern: \`{TYPE}-{NUMBER}.md\`

Examples: \`FEAT-001.md\`, \`BUG-042.md\`, \`TASK-015.md\`

### Template

\`\`\`markdown
---
id: FEAT-001
title: Your task title here
type: feature
status: backlog
priority: medium
labels:
  - frontend
created: 2025-01-15
---

## Description

Describe what needs to be done.

## Tasks

- [ ] Subtask 1
- [ ] Subtask 2
\`\`\`

### Required Fields

| Field | Description |
|-------|-------------|
| \`id\` | Unique identifier matching filename (e.g., FEAT-001) |
| \`title\` | Short description of the task |
| \`type\` | One of: \`feature\`, \`bug\`, \`task\`, \`chore\`, \`spike\` |
| \`status\` | One of: \`backlog\`, \`todo\`, \`in-progress\`, \`review\`, \`done\` |
| \`priority\` | One of: \`low\`, \`medium\`, \`high\`, \`critical\` |
| \`created\` | Date in YYYY-MM-DD format |

### Optional Fields

| Field | Description |
|-------|-------------|
| \`sprint\` | Sprint number (integer) |
| \`points\` | Story points (integer) |
| \`assignee\` | Person assigned |
| \`labels\` | Array of tags |
| \`due\` | Due date in YYYY-MM-DD format |
| \`parent\` | Parent item ID for subtasks |
| \`updated\` | Last updated date |

### Type Prefixes

| Type | Prefix | Example |
|------|--------|---------|
| feature | FEAT | FEAT-001.md |
| bug | BUG | BUG-001.md |
| task | TASK | TASK-001.md |
| chore | CHORE | CHORE-001.md |
| spike | SPIKE | SPIKE-001.md |

### Example: Creating a Feature

\`\`\`markdown
---
id: FEAT-012
title: Add user authentication
type: feature
status: backlog
priority: high
labels:
  - auth
  - backend
created: 2025-01-15
---

## Description

Implement OAuth2 authentication with Google and GitHub providers.

## Acceptance Criteria

- [ ] User can sign in with Google
- [ ] User can sign in with GitHub
- [ ] Session persists across browser restarts

## Tasks

- [ ] Set up OAuth providers
- [ ] Create login page
- [ ] Implement callback handlers
- [ ] Add session management
\`\`\`

## Folder Structure

\`\`\`
.codeplan/
├── config.yaml      # Project configuration
├── README.md        # This file
├── FEAT-001.md      # Active items
├── BUG-002.md
└── archive/         # Archived items
    └── 2025-01/
        └── TASK-003.md
\`\`\`

## Tips for AI Agents

1. **Check existing items** before creating to avoid duplicates
2. **Use next available number** for the ID (check existing files)
3. **Match the type prefix** to the item type
4. **Set status to \`backlog\`** for new items unless specified otherwise
5. **Include a Description section** explaining the task
6. **Add Tasks section** with checkboxes for subtasks when relevant
`;

export const CLAUDE_MD_SNIPPET = `## Task Management

This project uses [Codeplan](https://github.com/your-repo/codeplan) for task management. To create, view, or manage tasks, see \`.codeplan/README.md\` for instructions.

When the user asks you to create tasks, features, bugs, or any work items, follow the format in \`.codeplan/README.md\` and create files in the \`.codeplan/\` folder.
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
