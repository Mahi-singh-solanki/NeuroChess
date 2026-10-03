import chess

from neural_model import NeuralEvaluator
from symbolic_rules import SymbolicChessRules


class ChessEngine:

    def __init__(self, model_path="model.pth", depth=2):

        self.neural = NeuralEvaluator(model_path)
        self.rules = SymbolicChessRules()

        self.depth = depth
        self.nodes_searched = 0

    def evaluate(self, board):
        """
        Neural evaluation.
        Positive = White advantage
        Negative = Black advantage
        """
        return self.neural.evaluate(board)

    def minimax(self, board, depth, alpha, beta):

        self.nodes_searched += 1

        # Terminal position
        if depth == 0 or board.is_game_over():
            return self.evaluate(board), None

        legal_moves = list(board.legal_moves)

        # White maximizes evaluation
        if board.turn == chess.WHITE:

            best_score = float("-inf")
            best_move = None

            for move in legal_moves:

                new_board = board.copy()
                new_board.push(move)

                score, _ = self.minimax(
                    new_board,
                    depth - 1,
                    alpha,
                    beta
                )

                if score > best_score:
                    best_score = score
                    best_move = move

                alpha = max(alpha, best_score)

                if beta <= alpha:
                    break

            return best_score, best_move

        # Black minimizes evaluation
        else:

            best_score = float("inf")
            best_move = None

            for move in legal_moves:

                new_board = board.copy()
                new_board.push(move)

                score, _ = self.minimax(
                    new_board,
                    depth - 1,
                    alpha,
                    beta
                )

                if score < best_score:
                    best_score = score
                    best_move = move

                beta = min(beta, best_score)

                if beta <= alpha:
                    break

            return best_score, best_move

    def get_best_move(self, board):

        self.nodes_searched = 0

        score, move = self.minimax(
            board,
            self.depth,
            float("-inf"),
            float("inf")
        )

        return {
            "move": move.uci() if move else None,
            "evaluation": score,
            "depth": self.depth,
            "nodes_searched": self.nodes_searched
        }