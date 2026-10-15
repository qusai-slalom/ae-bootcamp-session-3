# TODO App Epics and Stories

## MVP

- Epic: Local Task Management
  - Story: Persist tasks locally while preserving titles and completion
    - Acceptance Criteria:
      - A task requires a non-empty title; adding due dates or priorities does not remove title or completion support.
      - Users can create tasks and mark them complete or incomplete; those changes survive a page reload in the same browser.
      - Task titles, completion status, valid due dates, and priorities are stored locally, without backend changes or external storage.
      - Existing local tasks without the new fields remain usable, with no due date and priority P3.
- Epic: Task Due Dates
  - Story: Add optional due dates to tasks
    - Acceptance Criteria:
      - Users can create a task with or without a due date.
      - A valid due date is represented as a date-only ISO `YYYY-MM-DD` value and is retained after reload.
      - Leaving the due date empty does not prevent task creation or assign an implicit date.
  - Story: Treat invalid due dates as absent
    - Acceptance Criteria:
      - Malformed values and impossible calendar dates, such as `2026-02-30`, are ignored and treated as absent.
      - A task with an invalid due date remains usable rather than being rejected solely because of that date.
      - Invalid dates restored from local storage receive the same treatment as invalid dates supplied during task creation.
      - Absent and invalid dates do not qualify a task for Today or Overdue.
- Epic: Task Priorities
  - Story: Add task priority with a P3 default
    - Acceptance Criteria:
      - Users can select exactly P1, P2, or P3 when creating a task.
      - A task created without an explicit priority receives P3.
      - The selected priority survives reload and changes to completion status.
  - Story: Display color-coded priority badges
    - Acceptance Criteria:
      - Every displayed task shows a badge with its priority label.
      - P1 badges are red, P2 badges are orange, and P3 badges are gray.
      - Badges remain visible in every applicable filter view, including completed tasks in All.
      - Badge color indicates priority, not overdue status; overdue task highlighting remains Post-MVP.
- Epic: Task Filters
  - Story: Add All, Today, and Overdue filter tabs
    - Acceptance Criteria:
      - Users can switch among All, Today, and Overdue tabs.
      - All includes complete and incomplete tasks, including tasks with absent or invalid due dates.
      - Today includes only incomplete tasks whose valid due date equals the current date.
      - Overdue includes only incomplete tasks whose valid due date is before the current date; tasks due today are not overdue.
      - Completed tasks, future-dated tasks, and tasks with absent or invalid due dates are excluded from Today and Overdue.
      - Completing a task in Today or Overdue removes it from that view while preserving it in All; switching tabs does not change stored tasks.
      - An empty result displays an empty list state without an error.
      - Before implementation, confirm the timezone and day-boundary convention with the product owner; no convention is assumed here.
      - MVP filtering does not introduce automatic sorting or overdue highlighting.

## Post-MVP

- Epic: Overdue Task Highlighting
  - Story: Visually highlight overdue tasks
    - Acceptance Criteria:
      - Incomplete tasks with a valid due date before the current date are visually distinguished wherever they appear.
      - Completed tasks and tasks due today, due in the future, or with absent or invalid due dates receive no overdue highlighting.
      - Highlighting is removed when a task is completed and remains distinct from its priority badge.
      - Confirm the visual treatment before implementation; the PRD suggests red but does not mandate a final style.
      - Highlighting uses the same confirmed current-date convention as the filters.
- Epic: Task Ordering
  - Story: Sort tasks by overdue status, priority, and due date
    - Acceptance Criteria:
      - Applicable tasks are ordered overdue first, then priority P1 through P3, then due date ascending, with undated tasks last.
      - Within the same overdue status and priority, valid due dates appear earliest first; invalid dates behave as absent dates.
      - Before implementation, confirm whether undated-last placement is global or within priority groups, and how completed tasks are ordered in All.
      - Sorting works with each filter without changing its membership or any stored task values.
      - Ordering is recalculated when task data changes, using the same current-date convention as filtering and highlighting.