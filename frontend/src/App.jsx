import { useState, useEffect, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import axios from 'axios';
import './index.css';

const boardTheme = {
  light: { type: 'matrix', color: '#1e293b' },
  dark: { type: 'matrix', color: '#0f172a' },
};

const pieceTheme = (piece) => {
  const pieces = {
    w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
    b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
  };
  return (
    <div style={{
      color: piece.startsWith('w') ? '#f8fafc' : '#475569',
      fontSize: '42px',
      lineHeight: 0.85,
      fontFamily: 'Georgia, serif',
    }}>
      {pieces[piece.charAt(0)][piece.charAt(1)]}
    </div>
  );
};

function App() {
  const [game, setGame] = useState(new Chess());
  const [pgn, setPgn] = useState('');
  const [whiteElo, setWhiteElo] = useState(null);
  const [blackElo, setBlackElo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timeoutId;
    const updateBoard = () => {
      try {
        const newGame = new Chess();
        if (pgn.trim()) {
          newGame.loadPgn(pgn);
        }
        setGame(newGame);
        setError(null);
      } catch (err) {
      }
    };
    timeoutId = setTimeout(updateBoard, 300);
    return () => clearTimeout(timeoutId);
  }, [pgn]);

  const predictElo = async () => {
    if (!pgn.trim()) {
      setError('Please enter a PGN');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('https://elopredictor.onrender.com/predict', { pgn });
      setWhiteElo(Math.round(response.data.white_elo));
      setBlackElo(Math.round(response.data.black_elo));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to predict ELO');
    } finally {
      setLoading(false);
    }
  };

  const getRatingPercent = (elo) => {
    const minElo = 800;
    const maxElo = 2800;
    return Math.min(100, Math.max(0, ((elo - minElo) / (maxElo - minElo)) * 100));
  };

  return (
    <div className="container">
      <div className="board-section">
        <Chessboard 
          position={game.fen()} 
          boardWidth={450}
          customBoardStyle={{
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
          customDarkSquareStyle={{ backgroundColor: '#0f172a', border: 'none' }}
          customLightSquareStyle={{ backgroundColor: '#1e293b', border: 'none' }}
          customPieces={pieceTheme}
        />
      </div>
      <div className="control-section">
        <div className="header">
          <h1>Chess ELO Predictor</h1>
          <p className="subtitle">Paste a PGN to predict player ratings</p>
        </div>
        
        <div className="pgn-input-wrapper">
          <label>PGN Input</label>
          <textarea
            placeholder="Paste your PGN here (e.g., 1. e4 e5 2. Nf3 Nc6 ...)"
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
          />
        </div>
        
        <button onClick={predictElo} disabled={loading}>
          {loading ? 'Analyzing...' : 'Predict ELO'}
        </button>
        
        {error && <div className="error">{error}</div>}
        
        {(whiteElo !== null && blackElo !== null) && (
          <div className="results">
            <div className="result-card white">
              <h3>White</h3>
              <p className="elo-value">{whiteElo}</p>
              <p className="elo-label">predicted ELO</p>
              <div className="rating-bar">
                <div 
                  className="rating-fill" 
                  style={{ width: `${getRatingPercent(whiteElo)}%` }}
                />
              </div>
            </div>
            <div className="result-card black">
              <h3>Black</h3>
              <p className="elo-value">{blackElo}</p>
              <p className="elo-label">predicted ELO</p>
              <div className="rating-bar">
                <div 
                  className="rating-fill" 
                  style={{ width: `${getRatingPercent(blackElo)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;