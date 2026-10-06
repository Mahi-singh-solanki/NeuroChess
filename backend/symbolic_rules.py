import chess


class SymbolicChessRules:

    def __init__(self):
        pass

    def get_legal_moves(self, board):
        """
        Return all legal moves in UCI notation.
        """
        return [
            move.uci()
            for move in board.legal_moves
        ]

    def is_legal_move(self, board, move_uci):
        """
        Check whether a move is legally allowed.
        """
        try:
            move = chess.Move.from_uci(move_uci)
        except ValueError:
            return False

        return move in board.legal_moves

    def make_move(self, board, move_uci):
        """
        Apply a legal move and return the new board.
        """
        move = chess.Move.from_uci(move_uci)

        if move not in board.legal_moves:
            raise ValueError(
                f"Illegal chess move: {move_uci}"
            )

        new_board = board.copy()
        new_board.push(move)

        return new_board

    def game_status(self, board):
        """
        Determine the current symbolic game state.
        """

        #Fix me 3: Constraints
        return "playing"

    def get_state(self, board):
        """
        Return useful symbolic information about the position.
        """

        return {
            "fen": board.fen(),
            "turn": "white" if board.turn == chess.WHITE else "black",
            "legal_moves": self.get_legal_moves(board),
            "status": self.game_status(board),
            "is_check": board.is_check(),
            "is_checkmate": board.is_checkmate(),
        }