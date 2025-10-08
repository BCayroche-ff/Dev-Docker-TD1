const request = require('supertest');
const app = require('../server');

/**
 * Game API Tests
 * Tests for game creation, joining, moves, and winner detection
 */

describe('Game API', () => {
  let player1Token, player2Token, player3Token;
  let player1Id, player2Id;
  let gameId;

  /**
   * Setup: Create test users before running game tests
   */
  beforeAll(async () => {
    // Create player 1
    const user1 = {
      username: `player1${Date.now()}`,
      email: `player1${Date.now()}@test.com`,
      password: 'password123'
    };
    const res1 = await request(app).post('/api/auth/register').send(user1);
    player1Token = res1.body.token;
    player1Id = res1.body.user.id;

    // Create player 2
    const user2 = {
      username: `player2${Date.now()}`,
      email: `player2${Date.now()}@test.com`,
      password: 'password123'
    };
    const res2 = await request(app).post('/api/auth/register').send(user2);
    player2Token = res2.body.token;
    player2Id = res2.body.user.id;

    // Create player 3
    const user3 = {
      username: `player3${Date.now()}`,
      email: `player3${Date.now()}@test.com`,
      password: 'password123'
    };
    const res3 = await request(app).post('/api/auth/register').send(user3);
    player3Token = res3.body.token;
  });

  /**
   * Game Creation Tests
   */
  describe('POST /api/games', () => {
    it('should create a new game', async () => {
      const res = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${player1Token}`);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('game');
      expect(res.body.game.status).toBe('waiting');
      expect(res.body.game.player_x_id).toBe(player1Id);
      expect(res.body.game.player_o_id).toBeNull();
      expect(Array.isArray(res.body.game.board)).toBe(true);
      expect(res.body.game.board.length).toBe(9);
      expect(res.body.game.board.every(cell => cell === '')).toBe(true);
      expect(res.body.game.current_turn).toBe('X');

      gameId = res.body.game.id;
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/api/games');
      expect(res.statusCode).toBe(401);
    });
  });

  /**
   * Game Listing Tests
   */
  describe('GET /api/games', () => {
    it('should get list of games', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('Authorization', `Bearer ${player1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('games');
      expect(Array.isArray(res.body.games)).toBe(true);
      expect(res.body.games.length).toBeGreaterThan(0);
    });

    it('should filter games by status', async () => {
      const res = await request(app)
        .get('/api/games?status=waiting')
        .set('Authorization', `Bearer ${player1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.games.every(g => g.status === 'waiting')).toBe(true);
    });
  });

  /**
   * Get Single Game Tests
   */
  describe('GET /api/games/:id', () => {
    it('should get a specific game', async () => {
      const res = await request(app)
        .get(`/api/games/${gameId}`)
        .set('Authorization', `Bearer ${player1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('game');
      expect(res.body.game.id).toBe(gameId);
    });

    it('should return 404 for non-existent game', async () => {
      const res = await request(app)
        .get('/api/games/99999')
        .set('Authorization', `Bearer ${player1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Game not found');
    });
  });

  /**
   * Join Game Tests
   */
  describe('POST /api/games/:id/join', () => {
    it('should allow player 2 to join the game', async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set('Authorization', `Bearer ${player2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.game.status).toBe('in_progress');
      expect(res.body.game.player_o_id).toBe(player2Id);
    });

    it('should not allow joining a full game', async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set('Authorization', `Bearer ${player3Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('not available');
    });

    it('should not allow joining own game', async () => {
      // Create new game
      const createRes = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${player1Token}`);

      const newGameId = createRes.body.game.id;

      // Try to join own game
      const res = await request(app)
        .post(`/api/games/${newGameId}/join`)
        .set('Authorization', `Bearer ${player1Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Cannot join your own game');
    });

    it('should return 404 for non-existent game', async () => {
      const res = await request(app)
        .post('/api/games/99999/join')
        .set('Authorization', `Bearer ${player2Token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  /**
   * Game Move Tests
   */
  describe('POST /api/games/:id/move', () => {
    it('should allow player X to make the first move', async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/move`)
        .set('Authorization', `Bearer ${player1Token}`)
        .send({ position: 0 });

      expect(res.statusCode).toBe(200);
      expect(res.body.game.board[0]).toBe('X');
      expect(res.body.game.current_turn).toBe('O');
    });

    it('should not allow player X to move when it is player O turn', async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/move`)
        .set('Authorization', `Bearer ${player1Token}`)
        .send({ position: 1 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Not your turn');
    });

    it('should allow player O to make a move', async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/move`)
        .set('Authorization', `Bearer ${player2Token}`)
        .send({ position: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.game.board[1]).toBe('O');
      expect(res.body.game.current_turn).toBe('X');
    });

    it('should not allow moving to an occupied position', async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/move`)
        .set('Authorization', `Bearer ${player1Token}`)
        .send({ position: 0 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Position already occupied');
    });

    it('should return 400 for invalid position', async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/move`)
        .set('Authorization', `Bearer ${player1Token}`)
        .send({ position: 10 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid position');
    });

    it('should not allow non-players to make moves', async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/move`)
        .set('Authorization', `Bearer ${player3Token}`)
        .send({ position: 2 });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('not a player');
    });
  });

  /**
   * Winner Detection Tests
   */
  describe('Winner Detection', () => {
    let winGameId;

    beforeAll(async () => {
      // Create new game for winner tests
      const createRes = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${player1Token}`);
      winGameId = createRes.body.game.id;

      // Player 2 joins
      await request(app)
        .post(`/api/games/${winGameId}/join`)
        .set('Authorization', `Bearer ${player2Token}`);
    });

    it('should detect horizontal win (top row)', async () => {
      // X plays positions 0, 1, 2 (top row)
      // O plays positions 3, 4 to avoid blocking
      await request(app)
        .post(`/api/games/${winGameId}/move`)
        .set('Authorization', `Bearer ${player1Token}`)
        .send({ position: 0 });

      await request(app)
        .post(`/api/games/${winGameId}/move`)
        .set('Authorization', `Bearer ${player2Token}`)
        .send({ position: 3 });

      await request(app)
        .post(`/api/games/${winGameId}/move`)
        .set('Authorization', `Bearer ${player1Token}`)
        .send({ position: 1 });

      await request(app)
        .post(`/api/games/${winGameId}/move`)
        .set('Authorization', `Bearer ${player2Token}`)
        .send({ position: 4 });

      const res = await request(app)
        .post(`/api/games/${winGameId}/move`)
        .set('Authorization', `Bearer ${player1Token}`)
        .send({ position: 2 });

      expect(res.statusCode).toBe(200);
      expect(res.body.game.winner).toBe('X');
      expect(res.body.game.status).toBe('finished');
      expect(res.body.message).toContain('wins');
    });
  });

  /**
   * Statistics Tests
   */
  describe('GET /api/games/stats/me', () => {
    it('should get user statistics', async () => {
      const res = await request(app)
        .get('/api/games/stats/me')
        .set('Authorization', `Bearer ${player1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('total_games');
      expect(res.body.stats).toHaveProperty('wins');
      expect(res.body.stats).toHaveProperty('losses');
      expect(res.body.stats).toHaveProperty('draws');
      expect(typeof res.body.stats.total_games).toBe('number');
    });

    it('should show at least one win for player 1', async () => {
      const res = await request(app)
        .get('/api/games/stats/me')
        .set('Authorization', `Bearer ${player1Token}`);

      expect(res.body.stats.wins).toBeGreaterThan(0);
    });
  });
});
