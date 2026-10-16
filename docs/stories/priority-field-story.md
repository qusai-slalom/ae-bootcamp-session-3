# Story: Add priority field with default P3

## Acceptance Criteria

- New tasks created without an explicit priority are stored with priority value "P3".
- Priority field supports only values "P1", "P2", "P3".

## Technical Requirements

- Extend in-memory task object shape in frontend state to include `priority`.
- The current backend uses `/api/tasks`. Preserve its stored `priority` when mapping responses;
	default older tasks without a priority (including legacy `{id,name}` items) to `priority: 'P3'`.
- Update local storage serialization to persist `priority`.
- Add radio-like P1/P2/P3 controls to the task form and each task row.
- Store priority in the task model with a P3 default and reject values outside P1/P2/P3.
- Support `PUT /api/tasks/:id` with `{ "priority": "P1" }` without changing other task fields.
- Persist task priorities in the browser's `tasks` local-storage cache. Successful API responses
	remain authoritative; cached tasks are available when fetching fails. The backend database
	remains in-memory and resets when the server restarts.

## UI Reference

![Priority field UI sketch](priority-field-ui-sketch.png)

- Exactly one priority is selected per task.
- Unselected controls use gray `#7A7A7A`.
- Selected controls use blue `#07F2E6`, as specified in the sketch.
- Use dark labels for readable contrast and a visible keyboard focus indicator.
