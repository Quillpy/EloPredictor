from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import chess.pgn
import io
import os
import numpy as np
from scipy.sparse import hstack, csr_matrix

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vectorizer = None
model_white = None
model_black = None

@app.on_event("startup")
def load_models():
    global vectorizer, model_white, model_black
    if os.path.exists("vectorizer.joblib"):
        vectorizer = joblib.load("vectorizer.joblib")
        model_white = joblib.load("model_white.joblib")
        model_black = joblib.load("model_black.joblib")

class PredictionRequest(BaseModel):
    pgn: str

def extract_features(moves):
    tokens = moves.split()

    num_moves = len(tokens)
    checks = sum('+' in t or '#' in t for t in tokens)
    captures = sum('x' in t for t in tokens)
    castles = sum(t in ['O-O', 'O-O-O'] for t in tokens)
    promotions = sum('=' in t for t in tokens)
    avg_len = np.mean([len(t) for t in tokens]) if tokens else 0

    return [
        num_moves,
        checks,
        captures,
        castles,
        promotions,
        avg_len
    ]

@app.post("/predict")
def predict_elo(req: PredictionRequest):
    if not vectorizer:
        raise HTTPException(status_code=503, detail="Models not loaded. Train and place .joblib files in backend dir.")
    
    pgn_io = io.StringIO(req.pgn)
    game = chess.pgn.read_game(pgn_io)
    
    if not game:
        raise HTTPException(status_code=400, detail="Invalid PGN")
        
    board = game.board()
    moves = []
    for move in game.mainline_moves():
        moves.append(board.san(move))
        board.push(move)
        
    moves_str = " ".join(moves)
    
    X_text = vectorizer.transform([moves_str])
    X_num = csr_matrix([extract_features(moves_str)])
    X = hstack([X_text, X_num])
    
    white_elo = model_white.predict(X)[0]
    black_elo = model_black.predict(X)[0]
    
    return {
        "white_elo": int(white_elo),
        "black_elo": int(black_elo)
    }
