import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { hashPassword } from '../src/utils/password';
import { generateToken } from '../src/utils/jwt';
import { testPrisma, cleanDatabase } from './helpers';

describe('Notes', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;

  beforeAll(async () => {
    try { await testPrisma.$connect(); } catch {}
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    try { await testPrisma.$disconnect(); } catch {}
  });

  beforeEach(async () => {
    await cleanDatabase();

    const user = await testPrisma.user.create({
      data: { email: 'test@example.com', password: await hashPassword('password123'), name: 'Test User' },
    });
    userId = user.id;
    token = generateToken({ userId: user.id, email: user.email, role: user.role });

    const workspace = await testPrisma.workspace.create({
      data: {
        name: 'Test Workspace', slug: 'test-workspace',
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    });
    workspaceId = workspace.id;
  });

  it('should create a new note', async () => {
    const res = await request(app)
      .post('/api/notes').set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Note', content: 'Test content.', workspaceId });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Note');
  });

  it('should reject without auth', async () => {
    const res = await request(app)
      .post('/api/notes').send({ title: 'Test', content: 'Test', workspaceId });
    expect(res.status).toBe(401);
  });

  it('should reject without workspace access', async () => {
    const other = await testPrisma.user.create({
      data: { email: 'other@example.com', password: await hashPassword('password123') },
    });
    const otherToken = generateToken({ userId: other.id, email: other.email, role: other.role });
    const res = await request(app)
      .post('/api/notes').set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Test', content: 'Test', workspaceId });
    expect(res.status).toBe(403);
  });

  it('should list notes for workspace', async () => {
    await testPrisma.note.createMany({
      data: [
        { title: 'Note 1', content: 'Content 1', workspaceId, authorId: userId },
        { title: 'Note 2', content: 'Content 2', workspaceId, authorId: userId },
      ],
    });
    const res = await request(app)
      .get(`/api/notes?workspaceId=${workspaceId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('should search notes by title', async () => {
    await testPrisma.note.create({
      data: { title: 'Note 1', content: 'Content 1', workspaceId, authorId: userId },
    });
    const res = await request(app)
      .get(`/api/notes?workspaceId=${workspaceId}&search=Note 1`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('should update a note', async () => {
    const note = await testPrisma.note.create({
      data: { title: 'Original', content: 'Original', workspaceId, authorId: userId },
    });
    const res = await request(app)
      .put(`/api/notes/${note.id}`).set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', content: 'Updated content' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('should create a version when content changes', async () => {
    const note = await testPrisma.note.create({
      data: { title: 'Original', content: 'Original', workspaceId, authorId: userId },
    });
    await request(app)
      .put(`/api/notes/${note.id}`).set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', content: 'Updated content' });
    const versions = await testPrisma.noteVersion.findMany({ where: { noteId: note.id } });
    expect(versions).toHaveLength(1);
  });

  it('should delete a note', async () => {
    const note = await testPrisma.note.create({
      data: { title: 'To Delete', content: 'Content', workspaceId, authorId: userId },
    });
    const res = await request(app)
      .delete(`/api/notes/${note.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    const deleted = await testPrisma.note.findUnique({ where: { id: note.id } });
    expect(deleted).toBeNull();
  });
});
