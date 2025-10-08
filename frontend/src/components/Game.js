import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Game.css';

/**
 * Game Component
 * Main tic-tac-toe game board and logic
 * Handles moves, displays winner, and manages game state
 */
const Game = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [makingMove, setMakingMove] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  /**
   * Fetch game data from the server
   */
  const fetchGame = async () => {
    try {
      const response = await fetch(`${API_URL}/api/games/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Game not found');
        }
        throw new Error('Failed to fetch game');
      }

      const data = await response.json();
      setGame(data.game);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load game on mount
  useEffect(() => {
    fetchGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Set up polling for real-time updates
  useEffect(() => {
    // Only poll if game is waiting or in progress
    if (!game || (game.status !== 'waiting' && game.status !== 'in_progress')) {
      return;
    }

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      fetchGame();
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  /**
   * Handle cell click - make a move
   * @param {number} position - Position on the board (0-8)
   */
  const handleCellClick = async (position) => {
    // Prevent moves if game is not in progress
    if (!game || game.status !== 'in_progress') {
      return;
    }

    // Prevent moves if cell is occupied
    if (game.board[position] !== '') {
      return;
    }

    // Check if it's the player's turn
    const playerSymbol = game.player_x_id === user.id ? 'X' : 'O';
    if (game.current_turn !== playerSymbol) {
      setError('Not your turn!');
      setTimeout(() => setError(''), 2000);
      return;
    }

    setMakingMove(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/games/${id}/move`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to make move');
      }

      // Refresh game state
      await fetchGame();
    } catch (err) {
      setError(err.message);
    } finally {
      setMakingMove(false);
    }
  };

  /**
   * Render a single cell on the board
   * @param {number} index - Cell index (0-8)
   */
  const renderCell = (index) => {
    const value = game.board[index];
    const isClickable = game.status === 'in_progress' && value === '' && !makingMove;

    return (
      <div
        key={index}
        className={`cell ${value} ${isClickable ? 'clickable' : ''}`}
        onClick={() => handleCellClick(index)}
      >
        {value}
      </div>
    );
  };

  /**
   * Get winner message
   */
  const getWinnerMessage = () => {
    if (!game.winner) return null;

    if (game.winner === 'D') {
      return "It's a draw!";
    }

    const winnerId = game.winner === 'X' ? game.player_x_id : game.player_o_id;
    if (winnerId === user.id) {
      return 'You won! 🎉';
    } else {
      return 'You lost! 😔';
    }
  };

  /**
   * Get current player symbol
   */
  const getPlayerSymbol = () => {
    if (!game) return null;
    return game.player_x_id === user.id ? 'X' : 'O';
  };

  /**
   * Check if it's current user's turn
   */
  const isMyTurn = () => {
    if (!game || game.status !== 'in_progress') return false;
    return game.current_turn === getPlayerSymbol();
  };

  if (loading) {
    return <div className="loading">Loading game...</div>;
  }

  if (error && !game) {
    return (
      <div className="game-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/games')} className="btn-back">
          Back to Games
        </button>
      </div>
    );
  }

  if (!game) {
    return <div className="loading">No game data</div>;
  }

  return (
    <div className="game-container">
      <div className="game-wrapper">
        <header className="game-header">
          <button onClick={() => navigate('/games')} className="btn-back">
            ← Back to Games
          </button>
          <h1>Tic-Tac-Toe - Game #{id}</h1>
        </header>

        <div className="game-content">
          <div className="game-info-panel">
            <div className="info-card">
              <h3>Game Status</h3>
              {game.status === 'waiting' && (
                <p className="status-waiting">Waiting for opponent...</p>
              )}
              {game.status === 'in_progress' && (
                <>
                  <p className="status-playing">Game in progress</p>
                  <p className={`turn-indicator ${isMyTurn() ? 'my-turn' : ''}`}>
                    {isMyTurn() ? "Your turn!" : "Opponent's turn"}
                  </p>
                </>
              )}
              {game.status === 'finished' && (
                <p className="status-finished">{getWinnerMessage()}</p>
              )}
            </div>

            <div className="info-card">
              <h3>Players</h3>
              <p className={getPlayerSymbol() === 'X' ? 'you' : ''}>
                Player X {game.player_x_id === user.id && '(You)'}
              </p>
              <p className={getPlayerSymbol() === 'O' ? 'you' : ''}>
                Player O {game.player_o_id === user.id && '(You)'}
                {!game.player_o_id && ' - Waiting...'}
              </p>
            </div>

            <div className="info-card">
              <h3>Your Symbol</h3>
              <div className={`player-symbol ${getPlayerSymbol()}`}>
                {getPlayerSymbol()}
              </div>
            </div>
          </div>

          <div className="board-container">
            {error && <div className="error-banner">{error}</div>}

            <div className="board">
              {game.board.map((_, index) => renderCell(index))}
            </div>

            {game.status === 'finished' && (
              <button
                onClick={() => navigate('/games')}
                className="btn-new-game"
              >
                Back to Game List
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
