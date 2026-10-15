# Product Requirements Document (PRD) - TODO App Upgrade

## 1. Overview

Upgrade the basic TODO app, which currently supports task titles and completion status, with due dates, priorities, and filters so users can organize tasks and identify what needs attention. Keep the MVP simple and teachable, with local storage only and no backend changes.

Requirements sources:
- [September 16 requirements meeting](artifacts/09162025-requirements-meeting.vtt).
- [September 17 Slack follow-up](artifacts/09172025-slack-conversation-export.txt).

The Slack follow-up establishes the final release scope and supersedes the meeting where they differ: overdue highlighting and automatic sorting are Post-MVP. Meeting requirements not changed by Slack, including filter completion behavior and priority badge colors, are retained.

Open decision: the sources do not specify the timezone or day-boundary convention for determining "Today" and "Overdue"; confirm before implementation.

---

## 2. MVP Scope

- Preserve task titles and completion status; `title` remains required.
- Add an optional `dueDate` in ISO date-only format, `YYYY-MM-DD`.
  - Ignore invalid due-date values and treat them as absent.
  - Tasks may have no due date.
- Add a `priority` enum with exactly three values: `P1`, `P2`, and `P3`.
  - Default priority to `P3`.
  - Display color-coded priority badges: red for `P1`, orange for `P2`, and gray for `P3`, as requested in the meeting.
- Provide three filter tabs:
  - **All:** show all tasks, including completed tasks and tasks without a due date.
  - **Today:** show only incomplete tasks with a valid due date matching the current date.
  - **Overdue:** show only incomplete tasks with a valid due date before the current date.
  - Tasks with absent or invalid due dates do not appear in Today or Overdue.
- Keep task storage local; do not introduce backend changes or external storage.
- Overdue filtering is part of MVP; overdue visual highlighting and automatic sorting are not.

---

## 3. Post-MVP Scope

- Visually highlight overdue tasks so they stand out; red highlighting was suggested in the meeting. This is separate from the MVP priority badges.
- Automatically sort tasks using the agreed order:
  - Overdue tasks first.
  - Then priority, from `P1` to `P3`.
  - Then due date in ascending order.
  - Tasks without a due date last.
- Before implementing sorting, clarify whether "undated last" applies globally or within priority groups, and how completed tasks are ordered in All; the sources do not explicitly resolve these details.

---

## 4. Out of Scope

- Notifications.
- Recurring tasks.
- Multi-user functionality.
- Keyboard navigation and special accessibility features, as excluded in the meeting and reaffirmed for keyboard navigation in Slack.
- External storage; storage remains local only.
- Backend changes for this upgrade.