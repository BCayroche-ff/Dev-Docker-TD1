const express = require('express');
const pool = require('../db');

const router = express.Router();

/**
 * Check if there's a winner on the board
 * Checks all rows, columns, and diagonals
 *
 * @param {Array} board - 9-element array representing the game board
 * @returns {string|null} 'X', 'O', 'D' (draw), or null (game continues)
 */
const checkWinner = (board) => {
  // Winning combinations (indexes on a 3x3 grid)
  const winPatterns = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
  ];

  // Check each winning pattern
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Return 'X' or 'O'
    }
  }

  // Check for draw (all cells filled, no winner)
  if (board.every(cell => cell !== '')) {
    return 'D';
  }

  // Game continues
  return null;
};

/**
 * Create a new game
 * POST /api/games
 *
 * Creates a new tic-tac-toe game with the authenticated user as player X
 * Game status is 'waiting' until another player joins
 */
router.post('/', async (req, res) => {
  try {
    const playerId = req.user.id;

    // Create new game with current user as player X
    const result = await pool.query(
      'INSERT INTO games (player_x_id, status) VALUES ($1, $2) RETURNING *',
      [playerId, 'waiting']
    );

    const game = result.rows[0];

    res.status(201).json({
      message: 'Game created successfully',
      game: {
        id: game.id,
        player_x_id: game.player_x_id,
        player_o_id: game.player_o_id,
        board: JSON.parse(game.board),
        current_turn: game.current_turn,
        status: game.status,
        created_at: game.created_at
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

/**
 * Join an existing game
 * POST /api/games/:id/join
 *
 * Allows a user to join a waiting game as player O
 * Updates game status to 'in_progress'
 */
router.post('/:id/join', async (req, res) => {
  const { id } = req.params;
  const playerId = req.user.id;

  try {
    // Get the game
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [id]);

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    // Check if game is waiting for a player
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not available to join' });
    }

    // Check if user is trying to join their own game
    if (game.player_x_id === playerId) {
      return res.status(400).json({ error: 'Cannot join your own game' });
    }

    // Check if game already has player O
    if (game.player_o_id) {
      return res.status(400).json({ error: 'Game already has two players' });
    }

    // Update game with player O and change status to in_progress
    const updateResult = await pool.query(
      'UPDATE games SET player_o_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [playerId, 'in_progress', id]
    );

    const updatedGame = updateResult.rows[0];

    res.json({
      message: 'Joined game successfully',
      game: {
        id: updatedGame.id,
        player_x_id: updatedGame.player_x_id,
        player_o_id: updatedGame.player_o_id,
        board: JSON.parse(updatedGame.board),
        current_turn: updatedGame.current_turn,
        status: updatedGame.status,
        created_at: updatedGame.created_at
      }
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

/**
 * Make a move in a game
 * POST /api/games/:id/move
 *
 * Places a move on the board, checks for winner, and updates game state
 * Only the player whose turn it is can make a move
 *
 * @body {number} position - Position on board (0-8)
 */
router.post('/:id/move', async (req, res) => {
  const { id } = req.params;
  const { position } = req.body;
  const playerId = req.user.id;

  // Validate position
  if (position === undefined || position < 0 || position > 8) {
    return res.status(400).json({ error: 'Invalid position. Must be between 0 and 8' });
  }

  try {
    // Get the game
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [id]);

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    // Check if game is in progress
    if (game.status !== 'in_progress') {
      return res.status(400).json({ error: 'Game is not in progress' });
    }

    // Determine which player is making the move
    let playerSymbol;
    if (game.player_x_id === playerId) {
      playerSymbol = 'X';
    } else if (game.player_o_id === playerId) {
      playerSymbol = 'O';
    } else {
      return res.status(403).json({ error: 'You are not a player in this game' });
    }

    // Check if it's the player's turn
    if (game.current_turn !== playerSymbol) {
      return res.status(400).json({ error: 'Not your turn' });
    }

    // Parse the board
    const board = JSON.parse(game.board);

    // Check if position is already occupied
    if (board[position] !== '') {
      return res.status(400).json({ error: 'Position already occupied' });
    }

    // Make the move
    board[position] = playerSymbol;

    // Check for winner or draw
    const winner = checkWinner(board);

    // Determine next turn
    const nextTurn = playerSymbol === 'X' ? 'O' : 'X';

    // Update game state
    let updateQuery;
    let updateParams;

    if (winner) {
      // Game finished
      updateQuery = 'UPDATE games SET board = $1, current_turn = $2, winner = $3, status = $4, finished_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *';
      updateParams = [JSON.stringify(board), nextTurn, winner, 'finished', id];

      // Record in game history
      const winnerId = winner === 'X' ? game.player_x_id : (winner === 'O' ? game.player_o_id : null);
      const movesCount = board.filter(cell => cell !== '').length;

      await pool.query(
        'INSERT INTO game_history (game_id, player_x_id, player_o_id, winner_id, moves_count) VALUES ($1, $2, $3, $4, $5)',
        [id, game.player_x_id, game.player_o_id, winnerId, movesCount]
      );
    } else {
      // Game continues
      updateQuery = 'UPDATE games SET board = $1, current_turn = $2 WHERE id = $3 RETURNING *';
      updateParams = [JSON.stringify(board), nextTurn, id];
    }

    const updateResult = await pool.query(updateQuery, updateParams);
    const updatedGame = updateResult.rows[0];

    res.json({
      message: winner ? (winner === 'D' ? 'Game ended in a draw' : `Player ${winner} wins!`) : 'Move made successfully',
      game: {
        id: updatedGame.id,
        player_x_id: updatedGame.player_x_id,
        player_o_id: updatedGame.player_o_id,
        board: JSON.parse(updatedGame.board),
        current_turn: updatedGame.current_turn,
        winner: updatedGame.winner,
        status: updatedGame.status,
        finished_at: updatedGame.finished_at
      }
    });
  } catch (error) {
    console.error('Error making move:', error);
    res.status(500).json({ error: 'Failed to make move' });
  }
});

/**
 * Get all available games
 * GET /api/games
 *
 * Returns list of games, optionally filtered by status
 * @query {string} status - Filter by game status (waiting, in_progress, finished)
 */
router.get('/', async (req, res) => {
  const { status } = req.query;

  try {
    let query = 'SELECT * FROM games';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    const games = result.rows.map(game => ({
      id: game.id,
      player_x_id: game.player_x_id,
      player_o_id: game.player_o_id,
      board: JSON.parse(game.board),
      current_turn: game.current_turn,
      winner: game.winner,
      status: game.status,
      created_at: game.created_at,
      finished_at: game.finished_at
    }));

    res.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

/**
 * Get a specific game by ID
 * GET /api/games/:id
 *
 * Returns detailed information about a single game
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];

    res.json({
      game: {
        id: game.id,
        player_x_id: game.player_x_id,
        player_o_id: game.player_o_id,
        board: JSON.parse(game.board),
        current_turn: game.current_turn,
        winner: game.winner,
        status: game.status,
        created_at: game.created_at,
        finished_at: game.finished_at
      }
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

/**
 * Get user's game statistics
 * GET /api/games/stats/me
 *
 * Returns statistics for the authenticated user's games
 */
router.get('/stats/me', async (req, res) => {
  const userId = req.user.id;

  try {
    // Get total games played
    const totalGames = await pool.query(
      'SELECT COUNT(*) as count FROM game_history WHERE player_x_id = $1 OR player_o_id = $1',
      [userId]
    );

    // Get wins
    const wins = await pool.query(
      'SELECT COUNT(*) as count FROM game_history WHERE winner_id = $1',
      [userId]
    );

    // Get draws
    const draws = await pool.query(
      'SELECT COUNT(*) as count FROM game_history WHERE (player_x_id = $1 OR player_o_id = $1) AND winner_id IS NULL',
      [userId]
    );

    res.json({
      stats: {
        total_games: parseInt(totalGames.rows[0].count),
        wins: parseInt(wins.rows[0].count),
        draws: parseInt(draws.rows[0].count),
        losses: parseInt(totalGames.rows[0].count) - parseInt(wins.rows[0].count) - parseInt(draws.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
