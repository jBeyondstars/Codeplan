---
id: FEAT-003
title: File system watcher
type: feature
status: backlog
priority: medium
sprint: 1
points: 3
labels:
  - backend
  - core
created: 2025-11-29
---

## Description

Watch the .backlog folder for changes and automatically refresh the UI when files are added, modified, or deleted.

## Acceptance Criteria

- [ ] Detect new files added to .backlog
- [ ] Detect file modifications
- [ ] Detect file deletions
- [ ] Trigger UI refresh on changes

## Tasks

- [ ] Research file watching in Next.js
- [ ] Implement watcher service
- [ ] Connect to Zustand store
- [ ] Test with manual file edits
