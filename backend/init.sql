-- Initialize database schema for Tic-Tac-Toe game with authentication

-- Create users table with authentication support
-- Stores user credentials and profile information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create games table to track tic-tac-toe game sessions
-- Stores game state, players, and results
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    player_x_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    player_o_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    board TEXT NOT NULL DEFAULT '["","","","","","","","",""]', -- JSON array representing 3x3 grid
    current_turn CHAR(1) CHECK (current_turn IN ('X', 'O')) DEFAULT 'X',
    winner CHAR(1) CHECK (winner IN ('X', 'O', 'D')), -- D for Draw
    status VARCHAR(20) CHECK (status IN ('waiting', 'in_progress', 'finished')) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);

-- Create game history table for analytics and stats
-- Tracks all completed games for user statistics
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_x_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    player_o_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    moves_count INTEGER,
    duration_seconds INTEGER,
    finished_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_player_x ON games(player_x_id);
CREATE INDEX IF NOT EXISTS idx_games_player_o ON games(player_o_id);
CREATE INDEX IF NOT EXISTS idx_game_history_player_x ON game_history(player_x_id);
CREATE INDEX IF NOT EXISTS idx_game_history_player_o ON game_history(player_o_id);
