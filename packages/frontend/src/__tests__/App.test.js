import React, { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock server to intercept API requests for tasks
const server = setupServer(
  // GET /api/tasks handler
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, title: 'Test Task 1', description: 'Desc 1', due_date: '2025-09-30', completed: 0 },
        { id: 2, title: 'Test Task 2', description: 'Desc 2', due_date: '2025-10-01', completed: 1 },
      ])
    );
  }),

  // POST /api/tasks handler
  rest.post('/api/tasks', (req, res, ctx) => {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Task title is required' })
      );
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        title,
        description: req.body.description || '',
        due_date: req.body.due_date || null,
        completed: 0,
      })
    );
  }),

  // PUT /api/tasks/:id handler
  rest.put('/api/tasks/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ ...req.body, id: Number(req.params.id), completed: 0 })
    );
  }),

  // PATCH /api/tasks/:id handler
  rest.patch('/api/tasks/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ id: Number(req.params.id), completed: req.body.completed ? 1 : 0 })
    );
  }),

  // DELETE /api/tasks/:id handler
  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
beforeEach(() => localStorage.clear());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TODO App', () => {
  test('renders the main UI', async () => {
    render(<App />);
    await screen.findByText('Test Task 1');
    expect(screen.getByText('TODO App')).toBeInTheDocument();
    expect(screen.getByTestId('submit-task')).toBeInTheDocument();
      // Removed 'Tasks' assertion, as the header is 'TODO App'
  });

  test('loads and displays tasks', async () => {
    render(<App />);
    expect(await screen.findByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  test('adds a new task', async () => {
    let tasks = [
      { id: 1, title: 'Test Task 1', description: 'Desc 1', due_date: '2025-09-30', completed: 0 },
      { id: 2, title: 'Test Task 2', description: 'Desc 2', due_date: '2025-10-01', completed: 1 },
    ];
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(tasks));
      }),
      rest.post('/api/tasks', (req, res, ctx) => {
        const { title, description } = req.body;
        const newTask = {
          id: 3,
          title,
          description: description || '',
          due_date: req.body.due_date || null,
          completed: 0,
        };
        tasks = [...tasks, newTask];
        return res(ctx.status(201), ctx.json(newTask));
      })
    );
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });
    await act(async () => {
      await user.type(screen.getByTestId('title-input'), 'New Test Task');
    });
    await act(async () => {
      await user.type(screen.getByTestId('description-input'), 'Task description');
    });
    await act(async () => {
      await user.click(screen.getByTestId('submit-task'));
    });
    await waitFor(() => {
      expect(screen.getByText(/New Test Task/i)).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('No tasks found.')).toBeInTheDocument();
    });
  });

  describe('priority', () => {
    let tasks;
    let saveRequest;

    beforeEach(() => {
      tasks = [{ id: 1, title: 'Priority task', description: 'Keep this', priority: 'P2' }];
      saveRequest = jest.fn();
      server.use(
        rest.get('/api/tasks', (req, res, ctx) => res(ctx.json(tasks))),
        rest.post('/api/tasks', (req, res, ctx) => {
          saveRequest(req.body);
          const task = { ...req.body, id: 2 };
          tasks = [...tasks, task];
          return res(ctx.status(201), ctx.json(task));
        }),
        rest.put('/api/tasks/:id', (req, res, ctx) => {
          saveRequest(req.body);
          tasks = tasks.map(task => task.id === Number(req.params.id)
            ? { ...task, ...req.body } : task);
          return res(ctx.json(tasks.find(task => task.id === Number(req.params.id))));
        })
      );
    });

    test.each(['P1', 'P2', 'P3'])('creates a task with priority %s', async priority => {
      const user = userEvent.setup();
      render(<App />);
      await screen.findByText('Priority task');
      const formPriority = within(screen.getByRole('radiogroup', { name: 'Task priority' }));
      expect(formPriority.getByRole('radio', { name: 'P3' })).toBeChecked();
      await act(async () => {
        await user.click(formPriority.getByRole('radio', { name: priority }));
      });
      await act(async () => {
        await user.type(screen.getByTestId('title-input'), 'New priority task');
      });
      await act(async () => {
        await user.click(screen.getByTestId('submit-task'));
      });
      await screen.findByText('New priority task');
      expect(saveRequest).toHaveBeenCalledWith(expect.objectContaining({ priority }));
      expect(formPriority.getByRole('radio', { name: 'P3' })).toBeChecked();
      const taskPriority = within(screen.getByRole('radiogroup', {
        name: 'Priority for New priority task',
      }));
      expect(taskPriority.getByRole('radio', { name: priority })).toBeChecked();
    });

    test('normalizes legacy items to P3 and serializes priority', async () => {
      tasks = [{ id: 1, name: 'Legacy task' }];
      render(<App />);
      const group = await screen.findByRole('radiogroup', { name: 'Priority for Legacy task' });
      expect(within(group).getByRole('radio', { name: 'P3' })).toBeChecked();
      expect(JSON.parse(localStorage.getItem('tasks'))).toEqual([
        { id: 1, name: 'Legacy task', title: 'Legacy task', priority: 'P3' },
      ]);
    });

    test('updates priority with PUT, keeps one selection, and persists across reloads', async () => {
      const user = userEvent.setup();
      const view = render(<App />);
      const group = await screen.findByRole('radiogroup', { name: 'Priority for Priority task' });
      await act(async () => {
        await user.click(within(group).getByRole('radio', { name: 'P1' }));
      });
      await waitFor(() => expect(within(group).getByRole('radio', { name: 'P1' })).toBeChecked());
      expect(within(group).getAllByRole('radio', { checked: true })).toHaveLength(1);
      expect(saveRequest).toHaveBeenCalledWith({ priority: 'P1' });
      expect(JSON.parse(localStorage.getItem('tasks'))[0].priority).toBe('P1');
      view.unmount();
      render(<App />);
      const reloaded = await screen.findByRole('radiogroup', { name: 'Priority for Priority task' });
      expect(within(reloaded).getByRole('radio', { name: 'P1' })).toBeChecked();
    });

    test('loads and changes priority in the edit form', async () => {
      const user = userEvent.setup();
      render(<App />);
      await screen.findByText('Priority task');
      await act(async () => { await user.click(screen.getByRole('button', { name: 'edit' })); });
      const group = within(screen.getByRole('radiogroup', { name: 'Task priority' }));
      expect(group.getByRole('radio', { name: 'P2' })).toBeChecked();
      await act(async () => { await user.click(group.getByRole('radio', { name: 'P1' })); });
      await act(async () => { await user.click(screen.getByTestId('submit-task')); });
      await waitFor(() => expect(saveRequest).toHaveBeenCalledWith({
        title: 'Priority task', description: 'Keep this', due_date: '', priority: 'P1',
      }));
      const row = await screen.findByRole('radiogroup', { name: 'Priority for Priority task' });
      expect(within(row).getByRole('radio', { name: 'P1' })).toBeChecked();
    });

    test('keeps the selected priority and supports retry after a failed PUT', async () => {
      const user = userEvent.setup();
      server.use(rest.put('/api/tasks/:id', (req, res, ctx) => res.once(ctx.status(500))));
      render(<App />);
      const group = await screen.findByRole('radiogroup', { name: 'Priority for Priority task' });
      await act(async () => { await user.click(within(group).getByRole('radio', { name: 'P1' })); });
      expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update priority');
      expect(within(group).getByRole('radio', { name: 'P2' })).toBeChecked();
      expect(JSON.parse(localStorage.getItem('tasks'))[0].priority).toBe('P2');
      await act(async () => { await user.click(within(group).getByRole('radio', { name: 'P1' })); });
      await waitFor(() => expect(within(group).getByRole('radio', { name: 'P1' })).toBeChecked());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('preserves unsaved form edits when priority changes in the task row', async () => {
      const user = userEvent.setup();
      render(<App />);
      const row = await screen.findByRole('radiogroup', { name: 'Priority for Priority task' });
      await act(async () => { await user.click(screen.getByRole('button', { name: 'edit' })); });
      await act(async () => { await user.type(screen.getByTestId('title-input'), ' draft'); });
      await act(async () => { await user.click(within(row).getByRole('radio', { name: 'P1' })); });
      const form = within(screen.getByRole('radiogroup', { name: 'Task priority' }));
      await waitFor(() => expect(form.getByRole('radio', { name: 'P1' })).toBeChecked());
      expect(screen.getByTestId('title-input')).toHaveValue('Priority task draft');
    });

    test('preserves form values when creation fails', async () => {
      const user = userEvent.setup();
      server.use(rest.post('/api/tasks', (req, res, ctx) => res(ctx.status(500))));
      render(<App />);
      await screen.findByText('Priority task');
      const group = within(screen.getByRole('radiogroup', { name: 'Task priority' }));
      await act(async () => { await user.type(screen.getByTestId('title-input'), 'Unsaved'); });
      await act(async () => { await user.click(group.getByRole('radio', { name: 'P1' })); });
      await act(async () => { await user.click(screen.getByTestId('submit-task')); });
      expect(await screen.findByRole('alert')).toHaveTextContent('Failed to save task');
      expect(screen.getByTestId('title-input')).toHaveValue('Unsaved');
      expect(group.getByRole('radio', { name: 'P1' })).toBeChecked();
    });

    test('restores cached priority when the API is unavailable', async () => {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      server.use(rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(500))));
      render(<App />);
      const group = await screen.findByRole('radiogroup', { name: 'Priority for Priority task' });
      expect(within(group).getByRole('radio', { name: 'P2' })).toBeChecked();
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch tasks');
    });

    test('ignores malformed local storage and loads tasks from the API', async () => {
      localStorage.setItem('tasks', 'not json');
      render(<App />);
      const group = await screen.findByRole('radiogroup', { name: 'Priority for Priority task' });
      expect(within(group).getByRole('radio', { name: 'P2' })).toBeChecked();
    });
  });
});
