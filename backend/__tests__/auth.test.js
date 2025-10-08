const request = require('supertest');
const app = require('../server');

/**
 * Authentication API Tests
 * Tests for user registration, login, and authentication flows
 */

describe('Authentication API', () => {
  const testUser = {
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123'
  };

  let authToken;
  let userId;

  /**
   * Registration Tests
   */
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user).not.toHaveProperty('password_hash');

      authToken = res.body.token;
      userId = res.body.user.id;
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'test' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 if username is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'test@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('between 3 and 50 characters');
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@test.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('at least 6 characters');
    });

    it('should return 409 if username already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toContain('already exists');
    });
  });

  /**
   * Login Tests
   */
  describe('POST /api/auth/login', () => {
    it('should login with valid username and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should login with email instead of username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 400 if credentials are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  /**
   * Protected Route Tests
   */
  describe('Authentication Middleware', () => {
    it('should access protected route with valid token', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).not.toBe(401);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app).get('/api/games');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('token required');
    });

    it('should return 403 with invalid token', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Invalid or expired token');
    });

    it('should return 401 with malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('Authorization', 'InvalidFormat');

      expect(res.statusCode).toBe(401);
    });
  });
});
