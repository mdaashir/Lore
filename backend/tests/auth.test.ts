import request from 'supertest';
import app from '../src/app';
import { hashPassword } from '../src/utils/password';
import { testPrisma, cleanDatabase } from './helpers';

describe('Auth', () => {
  beforeAll(async () => {
    try { await testPrisma.$connect(); } catch {}
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    try { await testPrisma.$disconnect(); } catch {}
  });

  describe('POST /api/auth/register', () => {
    beforeEach(async () => {
      await cleanDatabase();
    });

    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body).toHaveProperty('token');
    });

    it('should reject duplicate email', async () => {
      await testPrisma.user.create({
        data: { email: 'test@example.com', password: await hashPassword('password123') },
      });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });

    it('should validate input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await cleanDatabase();
      await testPrisma.user.create({
        data: { email: 'test@example.com', password: await hashPassword('password123'), name: 'Test User' },
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      await cleanDatabase();
      await testPrisma.user.create({
        data: { email: 'test@example.com', password: await hashPassword('password123'), name: 'Test User' },
      });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
