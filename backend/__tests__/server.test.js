const request = require('supertest');
const app = require('../server');

/**
 * Basic Server Tests
 * Tests for health check endpoint
 */

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
      expect(response.body.message).toBe('Tic-Tac-Toe API is running');
    });
  });
});
