import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import axios from 'axios';
import './index.css';

function App() {
  const [game, setGame] = useState(new Chess());
  const [pgn, setPgn] = useState('');
  const [whiteElo, setWhiteElo] = useState(null);
  const [blackElo, setBlackElo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const newGame = new Chess();
      if (pgn.trim()) {
        newGame.loadPgn(pgn);
      }
      setGame(newGame);
      setError(null);
    } catch (err) {
      setError('Invalid PGN format');
    }
  }, [pgn]);

  const predictElo = async () => {
    if (!pgn.trim()) {
      setError('Please enter a PGN');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:8000/predict', { pgn });
      setWhiteElo(response.data.white_elo);
      setBlackElo(response.data.black_elo);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to predict ELO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="board-section">
        <Chessboard position={game.fen()} boardWidth={500} />
      </div>
      <div className="control-section">
        <h2>Chess ELO Predictor</h2>
        <textarea
          placeholder="Paste PGN here..."
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
        />
        <button onClick={predictElo} disabled={loading}>
          {loading ? 'Predicting...' : 'Predict ELO'}
        </button>
        {error && <div className="error">{error}</div>}
        {(whiteElo !== null && blackElo !== null) && (
          <div className="results">
            <div className="result-card white-result">
              <h3>White ELO</h3>
              <p>{whiteElo}</p>
            </div>
            <div className="result-card black-result">
              <h3>Black ELO</h3>
              <p>{blackElo}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
