import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './GameList.css';

/**
 * GameList Component
 * Displays available games and allows creating/joining games
 * Shows user stats and provides logout functionality
 */
const GameList = () => {
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  /**
   * Fetch available games from the server
   * Filters to show only waiting and user's in-progress games
   */
  const fetchGames = async () => {
    try {
      const response = await fetch(`${API_URL}/api/games`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch games');

      const data = await response.json();
      // Show waiting games and user's in-progress games
      const filteredGames = data.games.filter(game =>
        game.status === 'waiting' ||
        (game.status === 'in_progress' &&
         (game.player_x_id === user.id || game.player_o_id === user.id))
      );
      setGames(filteredGames);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Fetch user's game statistics
   */
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/games/stats/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGames(), fetchStats()]);
      setLoading(false);
    };

    loadData();
    // Refresh games list every 3 seconds
    const interval = setInterval(fetchGames, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Create a new game
   */
  const handleCreateGame = async () => {
    setCreating(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to create game');

      const data = await response.json();
      navigate(`/game/${data.game.id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  /**
   * Join an existing game
   */
  const handleJoinGame = async (gameId) => {
    try {
      const response = await fetch(`${API_URL}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join game');
      }

      navigate(`/game/${gameId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Continue an in-progress game
   */
  const handleContinueGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading games...</div>;
  }

  return (
    <div className="game-list-container">
      <header className="game-list-header">
        <div>
          <h1>Tic-Tac-Toe</h1>
          <p>Welcome, {user.username}!</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>

      {stats && (
        <div className="stats-card">
          <h2>Your Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Games</span>
              <span className="stat-value">{stats.total_games}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Wins</span>
              <span className="stat-value win">{stats.wins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Losses</span>
              <span className="stat-value loss">{stats.losses}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Draws</span>
              <span className="stat-value draw">{stats.draws}</span>
            </div>
          </div>
        </div>
      )}

      <div className="game-actions">
        <button
          onClick={handleCreateGame}
          className="btn-create"
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create New Game'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="games-section">
        <h2>Available Games</h2>
        {games.length === 0 ? (
          <p className="no-games">No games available. Create one to get started!</p>
        ) : (
          <div className="games-grid">
            {games.map(game => (
              <div key={game.id} className="game-card">
                <div className="game-info">
                  <h3>Game #{game.id}</h3>
                  <p className="game-status">{game.status === 'waiting' ? 'Waiting for opponent' : 'In Progress'}</p>
                  {game.status === 'in_progress' && (
                    <p className="current-turn">
                      Current turn: {game.current_turn}
                    </p>
                  )}
                </div>
                <div className="game-actions-card">
                  {game.status === 'waiting' && game.player_x_id !== user.id && (
                    <button
                      onClick={() => handleJoinGame(game.id)}
                      className="btn-join"
                    >
                      Join Game
                    </button>
                  )}
                  {game.status === 'waiting' && game.player_x_id === user.id && (
                    <span className="waiting-text">Waiting...</span>
                  )}
                  {game.status === 'in_progress' && (
                    <button
                      onClick={() => handleContinueGame(game.id)}
                      className="btn-continue"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameList;
