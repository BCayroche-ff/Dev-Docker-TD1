const request = require('supertest');
const app = require('../server');

jest.mock('../db', () => ({
  query: jest.fn(),
  on: jest.fn()
}));

const pool = require('../db');

describe('API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' }
      ];

      pool.query.mockResolvedValue({ rows: mockUsers });

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users ORDER BY id ASC');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = { name: 'Charlie', email: 'charlie@example.com' };
      const createdUser = { id: 3, ...newUser, created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [createdUser] });

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newUser.name);
      expect(response.body.email).toBe(newUser.email);
    });

    it('should return 400 when name or email is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const deletedUser = { id: 1, name: 'Alice', email: 'alice@example.com' };

      pool.query.mockResolvedValue({ rows: [deletedUser] });

      const response = await request(app).delete('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body.user).toEqual(deletedUser);
    });
  });
});
