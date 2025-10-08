const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Health check endpoint
 * GET /api/health
 *
 * Checks if the server and database are running properly
 * Returns server status and database connection status
 */
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'Tic-Tac-Toe API is running',
      database: 'Connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
// Apply authenticateToken middleware to all /api/games routes
app.use('/api/games', authenticateToken, gameRoutes);

// Apply authenticateToken to the /me endpoint
const authRouter = express.Router();
authRouter.get('/me', authenticateToken, require('./routes/auth'));
app.use('/api/auth', authRouter);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tic-Tac-Toe API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
