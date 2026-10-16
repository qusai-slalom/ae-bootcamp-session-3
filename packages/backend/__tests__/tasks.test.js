const request = require('supertest');
const { app, db } = require('../src/app');

afterAll(() => {
  if (db) db.close();
});

describe('Tasks API', () => {
  let taskId;

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', description: 'A test task', due_date: '2025-09-30' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Task');
    expect(res.body.description).toBe('A test task');
    expect(res.body.due_date).toBe('2025-09-30');
    expect(res.body.completed).toBe(0);
    expect(res.body.priority).toBe('P3');
    taskId = res.body.id;
  });

  it('should get all tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a single task by id', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(taskId);
  });

  it('should update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Updated Task', description: 'Updated', due_date: '2025-10-01' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Task');
    expect(res.body.description).toBe('Updated');
    expect(res.body.due_date).toBe('2025-10-01');
  });

  it('should mark a task as completed', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(1);
  });

  it('should delete a task', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(204);
  });

  it.each(['P1', 'P2', 'P3'])('should create and retrieve priority %s', async (priority) => {
    const created = await request(app).post('/api/tasks').send({ title: 'Priority task', priority });
    expect(created.status).toBe(201);
    expect(created.body.priority).toBe(priority);
    const detail = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(detail.body.priority).toBe(priority);
    const list = await request(app).get('/api/tasks');
    expect(list.body).toContainEqual(expect.objectContaining({ id: created.body.id, priority }));
  });

  it.each(['P1', 'P2', 'P3'])('should update only priority to %s', async (priority) => {
    const created = await request(app).post('/api/tasks').send({
      title: 'Keep title', description: 'Keep description', due_date: '2026-10-20',
    });
    const updated = await request(app)
      .put(`/api/tasks/${created.body.id}`).send({ priority });
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ ...created.body, priority });
    const edited = await request(app)
      .put(`/api/tasks/${created.body.id}`).send({ title: 'Edited title' });
    expect(edited.body.priority).toBe(priority);
  });

  it.each(['P0', 'P4', 'p1', '', null, 1, [], {}])('should reject invalid priority %j', async (priority) => {
    const rejected = await request(app).post('/api/tasks').send({ title: 'Invalid', priority });
    expect(rejected.status).toBe(400);
    const created = await request(app).post('/api/tasks').send({ title: 'Unchanged' });
    const updated = await request(app)
      .put(`/api/tasks/${created.body.id}`).send({ priority });
    expect(updated.status).toBe(400);
    const detail = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(detail.body).toEqual(created.body);
  });

  it('should return 404 when updating priority for a missing task', async () => {
    const response = await request(app).put('/api/tasks/999999').send({ priority: 'P1' });
    expect(response.status).toBe(404);
  });
});
