from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chess

from chess_engine import ChessEngine
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(
    title="NeuroChess API",
    description="Neuro-Symbolic Chess Engine",
    version="1.0.0"
)

# Load engine once when the server starts
engine = ChessEngine(
    model_path="model.pth",
    depth=2
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class PositionRequest(BaseModel):
    fen: str


class MoveRequest(BaseModel):
    fen: str
    move: str


@app.get("/")
def root():
    return {
        "message": "NeuroChess API",
        "status": "running"
    }


@app.post("/position")
def analyze_position(request: PositionRequest):

    try:
        board = chess.Board(request.fen)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid FEN"
        )

    legal_moves = [
        move.uci()
        for move in board.legal_moves
    ]

    evaluation = engine.evaluate(board)

    return {
        "fen": board.fen(),
        "turn": "white" if board.turn else "black",
        "evaluation": evaluation,
        "legal_moves": legal_moves,
        "game_over": board.is_game_over()
    }


@app.post("/move")
def make_move(request: MoveRequest):

    try:
        board = chess.Board(request.fen)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid FEN"
        )

    try:
        move = chess.Move.from_uci(request.move)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid move format"
        )

    if move not in board.legal_moves:
        raise HTTPException(
            status_code=400,
            detail="Illegal move"
        )

    board.push(move)

    return {
        "fen": board.fen(),
        "turn": "white" if board.turn else "black",
        "game_over": board.is_game_over(),
        "legal_moves": [
            m.uci()
            for m in board.legal_moves
        ]
    }


@app.post("/ai-move")
def ai_move(request: PositionRequest):

    try:
        board = chess.Board(request.fen)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid FEN"
        )

    if board.is_game_over():
        raise HTTPException(
            status_code=400,
            detail="Game is already over"
        )

    result = engine.get_best_move(board)

    return {
        "move": result["move"],
        "evaluation": result["evaluation"],
        "depth": result["depth"],
        "nodes_searched": result["nodes_searched"]
    }