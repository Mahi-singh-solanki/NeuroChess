import chess
import numpy as np
import torch
import torch.nn as nn


class ChessEvaluator(nn.Module):
    def __init__(self):
        super().__init__()
        #Fix me 1
        # Architecture

    def forward(self, x):
        return self.network(x)


class NeuralEvaluator:

    def __init__(self, model_path="model.pth"):

        self.device = torch.device("cpu")

        self.model = ChessEvaluator()

        checkpoint = torch.load(
            model_path,
            map_location=self.device,
            weights_only=False
        )

        self.model.load_state_dict(
            checkpoint["model_state_dict"]
        )

        self.model.eval()

    def encode_board(self, board):

        x = np.zeros(64, dtype=np.float32)

        #fix me 2. Encoding
        piece_values = {}

        for square, piece in board.piece_map().items():

            value = piece_values[piece.piece_type]

            if piece.color == chess.BLACK:
                value = -value

            row = 7 - chess.square_rank(square)
            col = chess.square_file(square)

            index = row * 8 + col

            x[index] = value

        # Side to move
        turn = 1.0 if board.turn == chess.WHITE else -1.0

        # Castling rights
        white_kingside = (
            1.0 if board.has_kingside_castling_rights(chess.WHITE)
            else 0.0
        )

        white_queenside = (
            1.0 if board.has_queenside_castling_rights(chess.WHITE)
            else 0.0
        )

        black_kingside = (
            1.0 if board.has_kingside_castling_rights(chess.BLACK)
            else 0.0
        )

        black_queenside = (
            1.0 if board.has_queenside_castling_rights(chess.BLACK)
            else 0.0
        )

        features = np.concatenate([
            x,
            [turn],
            [
                white_kingside,
                white_queenside,
                black_kingside,
                black_queenside
            ]
        ])

        return features

    def evaluate(self, board):

        features = self.encode_board(board)

        tensor = torch.tensor(
            features,
            dtype=torch.float32
        ).unsqueeze(0)

        with torch.no_grad():
            evaluation = self.model(tensor).item()

        return evaluation