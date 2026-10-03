import chess

from chess_engine import ChessEngine


engine = ChessEngine(
    model_path="model.pth",
    depth=2
)

board = chess.Board()

result = engine.get_best_move(board)

print("AI Analysis")
print("-" * 30)

print("Best move:", result["move"])
print("Evaluation:", result["evaluation"])
print("Search depth:", result["depth"])
print("Nodes searched:", result["nodes_searched"])