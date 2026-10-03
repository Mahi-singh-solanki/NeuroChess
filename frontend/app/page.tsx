'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  GitBranch,
  GitCompare,
  Maximize2,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Undo2,
  UserRound,
  Zap,
} from 'lucide-react'
import { Chess } from 'chess.js'

const API_URL = 'http://127.0.0.1:8000'

const pieceSymbols: Record<string, string> = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚',
}

type Candidate = {
  move: string
  uci: string
  neural: string
  symbolic: string
  hybrid: string
  note: string
}

function SectionLabel({
  children,
  tone = 'cyan',
}: {
  children: React.ReactNode
  tone?: 'cyan' | 'violet' | 'muted' | 'amber'
}) {
  return (
    <div className={`section-label ${tone}`}>
      <span className="label-line" />
      {children}
    </div>
  )
}

function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <section className={`panel ${className}`}>{children}</section>
}

function ChessBoard({
  fen,
  selected,
  onSelect,
  mini = false,
}: {
  fen: string
  selected: string | null
  onSelect: (square: string) => void
  mini?: boolean
}) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  const board = useMemo(() => {
    try {
      const chess = new Chess(fen)
      return chess.board()
    } catch {
      return new Chess().board()
    }
  }, [fen])

  return (
    <div className={`board-frame ${mini ? 'mini-board' : ''}`}>
      <div className="board-coordinates top">
        {files.map((file) => (
          <span key={file}>{file}</span>
        ))}
      </div>

      <div className="board-body">
        <div className="board-coordinates left">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
            <span key={rank}>{rank}</span>
          ))}
        </div>

        <div
          className="chess-board"
          role="grid"
          aria-label="Interactive chess board"
        >
          {board.flatMap((rankRow, rankIndex) =>
            rankRow.map((piece, fileIndex) => {
              const file = files[fileIndex]
              const rank = 8 - rankIndex
              const square = `${file}${rank}`

              const isLight =
                (fileIndex + rankIndex) % 2 === 0

              const isSelected = selected === square

              return (
                <button
                  key={square}
                  type="button"
                  role="gridcell"
                  aria-label={`Square ${square}${piece
                    ? `, ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}`
                    : ''
                    }`}
                  className={`square ${isLight ? 'light' : 'dark'
                    } ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(square)}
                >
                  {piece && (
                    <span
                      className={`piece ${piece.color === 'w'
                        ? 'white-piece'
                        : 'black-piece'
                        }`}
                    >
                      {pieceSymbols[`${piece.color}${piece.type}`]}
                    </span>
                  )}
                </button>
              )
            }),
          )}
        </div>

        <div className="board-coordinates right">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
            <span key={rank}>{rank}</span>
          ))}
        </div>
      </div>

      <div className="board-coordinates bottom">
        {files.map((file) => (
          <span key={file}>{file}</span>
        ))}
      </div>
    </div>
  )
}

function Pipeline({
  aiMove,
  legalMoves,
  depth,
  nodes,
}: {
  aiMove: string
  legalMoves: number
  depth: number
  nodes: number
}) {
  const stages = [
    {
      icon: BrainCircuit,
      label: 'Neural evaluation',
      value: 'ACTIVE',
      color: 'cyan',
    },
    {
      icon: Target,
      label: 'Legal candidates',
      value: `${legalMoves} moves`,
      color: 'blue',
    },
    {
      icon: ShieldCheck,
      label: 'Symbolic verification',
      value: 'PASS',
      color: 'violet',
    },
    {
      icon: GitBranch,
      label: 'Minimax search',
      value: `${depth} ply`,
      color: 'violet',
    },
    {
      icon: Zap,
      label: 'Hybrid decision',
      value: aiMove || 'WAITING',
      color: 'amber',
    },
  ]

  return (
    <div className="pipeline">
      {stages.map((stage, index) => (
        <div className="pipeline-stage-wrap" key={stage.label}>
          <div className={`pipeline-stage ${stage.color}`}>
            <stage.icon size={15} />

            <div>
              <span>{stage.label}</span>
              <strong>{stage.value}</strong>
            </div>

            <span className="pulse-dot" />
          </div>

          {index < stages.length - 1 && (
            <div className="pipeline-arrow">
              <ArrowDown size={14} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Metric({
  label,
  value,
  accent = 'cyan',
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={accent}>{value}</strong>
    </div>
  )
}

export default function Page() {
  const [activeTab, setActiveTab] = useState('ANALYSIS')

  const [fen, setFen] = useState(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  )

  const [selected, setSelected] = useState<string | null>(null)

  const [evaluation, setEvaluation] = useState<number | null>(null)

  const [legalMoves, setLegalMoves] = useState<string[]>([])

  const [aiMove, setAiMove] = useState('')

  const [aiEvaluation, setAiEvaluation] = useState<number | null>(null)

  const [searchDepth, setSearchDepth] = useState(2)

  const [nodesSearched, setNodesSearched] = useState(0)

  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  const [loadingAI, setLoadingAI] = useState(false)

  const [backendError, setBackendError] = useState('')

  const [showWhy, setShowWhy] = useState(false)

  const [showCompare, setShowCompare] = useState(false)

  const [playInput, setPlayInput] = useState('')

  const [interpretation, setInterpretation] = useState(false)

  const [moveHistory, setMoveHistory] = useState<string[]>([])

  const [historyStack, setHistoryStack] = useState<string[]>([])
  const [playerColor] = useState<'w' | 'b'>('w')
  const [aiThinking, setAiThinking] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const chess = useMemo(() => {
    try {
      return new Chess(fen)
    } catch {
      return new Chess()
    }
  }, [fen])

  const currentTurn = chess.turn() === 'w' ? 'WHITE' : 'BLACK'

  const formattedEvaluation =
    evaluation === null
      ? '--'
      : `${evaluation >= 0 ? '+' : ''}${evaluation.toFixed(3)}`

  const formattedAiEvaluation =
    aiEvaluation === null
      ? '--'
      : `${aiEvaluation >= 0 ? '+' : ''}${aiEvaluation.toFixed(3)}`

  /*
   * ------------------------------------------
   * BACKEND POSITION ANALYSIS
   * ------------------------------------------
   */

  const analyzePosition = async (positionFen: string) => {
    setLoadingAnalysis(true)
    setBackendError('')

    try {
      const response = await fetch(`${API_URL}/position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: positionFen,
        }),
      })

      if (!response.ok) {
        throw new Error('Backend failed to analyze position')
      }

      const data = await response.json()

      setEvaluation(data.evaluation)
      setLegalMoves(data.legal_moves || [])
    } catch (error) {
      console.error(error)
      setBackendError(
        'Cannot connect to NeuroChess backend. Make sure FastAPI is running on port 8000.',
      )
    } finally {
      setLoadingAnalysis(false)
    }
  }

  useEffect(() => {
    analyzePosition(fen)
  }, [fen])

  /*
   * ------------------------------------------
   * AI MOVE
   * ------------------------------------------
   */

  const getAIMove = async (positionFen: string = fen) => {
    setAiThinking(true)
    setLoadingAI(true)
    setBackendError('')
    setShowWhy(false)

    try {
      const response = await fetch(`${API_URL}/ai-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: positionFen,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)

        throw new Error(
          errorData?.detail || 'AI move request failed',
        )
      }

      const data = await response.json()

      setAiMove(data.move)
      setAiEvaluation(data.evaluation)
      setSearchDepth(data.depth)
      setNodesSearched(data.nodes_searched)

      // Apply AI move through backend
      const moveResponse = await fetch(`${API_URL}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: positionFen,
          move: data.move,
        }),
      })

      if (!moveResponse.ok) {
        throw new Error('Backend rejected AI move')
      }

      const moveData = await moveResponse.json()

      setHistoryStack((previous) => [
        ...previous,
        positionFen,
      ])

      setFen(moveData.fen)

      setMoveHistory((previous) => [
        ...previous,
        data.move,
      ])

      setSelected(null)

      setGameOver(moveData.game_over)

    } catch (error) {
      console.error(error)

      setBackendError(
        error instanceof Error
          ? error.message
          : 'Failed to get AI move',
      )
    } finally {
      setAiThinking(false)
      setLoadingAI(false)
    }
  }

  /*
   * ------------------------------------------
   * HUMAN MOVE
   * ------------------------------------------
   */

  const makeMove = async (
    from: string,
    to: string,
  ) => {
    const tempGame = new Chess(fen)

    try {
      const move = tempGame.move({
        from,
        to,
        promotion: 'q',
      })

      if (!move) {
        setSelected(null)
        return
      }

      const uciMove = `${from}${to}${move.promotion || ''}`

      // Send player's move to backend
      const response = await fetch(`${API_URL}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen,
          move: uciMove,
        }),
      })

      if (!response.ok) {
        throw new Error('Backend rejected the move')
      }

      const data = await response.json()

      // Save current position for undo
      setHistoryStack((previous) => [
        ...previous,
        fen,
      ])

      // Update board with player's move
      setFen(data.fen)

      setMoveHistory((previous) => [
        ...previous,
        move.san,
      ])

      setSelected(null)

      setAiMove('')
      setAiEvaluation(null)

      // Check game over
      if (data.game_over) {
        setGameOver(true)
        return
      }

      /*
       * ------------------------------------------
       * AI'S TURN
       * ------------------------------------------
       */

      const aiPosition = data.fen

      // Small delay so the UI visibly changes
      await new Promise((resolve) =>
        setTimeout(resolve, 300),
      )

      await getAIMove(aiPosition)

    } catch (error) {
      console.error(error)

      setBackendError(
        error instanceof Error
          ? error.message
          : 'Illegal move',
      )

      setSelected(null)
    }
  }
  /*
   * ------------------------------------------
   * BOARD CLICK
   * ------------------------------------------
   */

  const handleSquareClick = (square: string) => {
    setBackendError('')

    // Game over
    if (gameOver) {
      return
    }

    // AI is thinking
    if (aiThinking) {
      return
    }

    // Only allow player to move White
    if (chess.turn() !== playerColor) {
      return
    }

    if (!selected) {
      const piece = chess.get(square as any)

      if (!piece) {
        return
      }

      // Player can only control White pieces
      if (piece.color !== playerColor) {
        return
      }

      setSelected(square)
      return
    }

    // Click same square
    if (selected === square) {
      setSelected(null)
      return
    }

    const clickedPiece = chess.get(square as any)

    // Selecting another white piece
    if (
      clickedPiece &&
      clickedPiece.color === playerColor
    ) {
      setSelected(square)
      return
    }

    // Try player's move
    makeMove(selected, square)
  }

  /*
   * ------------------------------------------
   * RESET GAME
   * ------------------------------------------
   */

  const resetGame = () => {
    const initialFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

    setFen(initialFen)
    setSelected(null)
    setAiMove('')
    setAiEvaluation(null)
    setEvaluation(null)
    setMoveHistory([])
    setHistoryStack([])
    setBackendError('')
  }

  /*
   * ------------------------------------------
   * UNDO
   * ------------------------------------------
   */

  const undoMove = () => {
    if (historyStack.length === 0) {
      return
    }

    const previousFen =
      historyStack[historyStack.length - 1]

    setFen(previousFen)

    setHistoryStack((previous) =>
      previous.slice(0, -1),
    )

    setMoveHistory((previous) =>
      previous.slice(0, -1),
    )

    setSelected(null)
    setAiMove('')
    setAiEvaluation(null)
  }

  /*
   * ------------------------------------------
   * CANDIDATE DATA
   * ------------------------------------------
   */

  const candidate: Candidate | null = aiMove
    ? {
      move: aiMove,
      uci: aiMove,
      neural: formattedAiEvaluation,
      symbolic: 'LEGAL',
      hybrid: formattedAiEvaluation,
      note: 'Selected through neural evaluation + symbolic legal-move verification + minimax search.',
    }
    : null

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="noise" />

      {/* -------------------------------- HEADER -------------------------------- */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <span>∿</span>
            <span>♞</span>
          </div>

          <div>
            <div className="brand-name">
              NEURO<span>CHESS</span>
            </div>

            <div className="brand-sub">
              NEURO-SYMBOLIC CHESS LAB
            </div>
          </div>
        </div>

        <nav
          className="main-nav"
          aria-label="Primary navigation"
        >
          {[
            'PLAY',
            'ANALYSIS',
            'NEURAL MODEL',
            'SYMBOLIC ENGINE',
            'EXPERIMENTS',
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                activeTab === tab ? 'active' : ''
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <div className="system-status">
            <span className="status-dot" />

            <div>
              <strong>SYSTEM ONLINE</strong>
              <small>Hybrid inference active</small>
            </div>
          </div>

          <button
            className="icon-button"
            aria-label="Settings"
          >
            <Settings2 size={17} />
          </button>

          <button
            className="avatar"
            aria-label="Profile"
          >
            <UserRound size={16} />
          </button>
        </div>
      </header>

      <div className="content-wrap">
        {/* -------------------------------- INTRO -------------------------------- */}

        <section className="intro-row">
          <div>
            <SectionLabel>
              EXPERIMENTAL RESEARCH INTERFACE
            </SectionLabel>

            <h1>
              Where <em>intuition</em>
              <br />
              meets logic.
            </h1>

            <p className="intro-copy">
              NeuroChess combines neural positional
              evaluation with symbolic chess rules and
              game-tree search to produce explainable
              chess decisions.
            </p>
          </div>

          <div className="intro-signal">
            <div className="signal-line">
              <span>NEURAL</span>
              <ArrowRight size={16} />
              <span>SYMBOLIC</span>
              <ArrowRight size={16} />
              <span className="signal-final">
                DECISION
              </span>
            </div>

            <div className="signal-wave">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>

            <span className="micro-copy">
              LIVE INFERENCE PIPELINE / V2.4.1
            </span>
          </div>
        </section>

        <section className="principles">
          <div>
            <BrainCircuit size={18} />

            <div>
              <strong>NEURAL</strong>
              <span>
                Learn positional patterns and evaluate
                positions.
              </span>
            </div>
          </div>

          <div>
            <ShieldCheck size={18} />

            <div>
              <strong>SYMBOLIC</strong>
              <span>
                Verify rules, constraints, and legal
                moves.
              </span>
            </div>
          </div>

          <div>
            <Sparkles size={18} />

            <div>
              <strong>HYBRID</strong>
              <span>
                Combine learned evaluation with formal
                reasoning.
              </span>
            </div>
          </div>
        </section>

        {/* ============================================
            ANALYSIS
        ============================================ */}

        {activeTab === 'ANALYSIS' && (
          <>
            <div className="workspace-heading">
              <div>
                <SectionLabel>
                  LIVE POSITION ANALYSIS
                </SectionLabel>

                <h2>
                  {gameOver
                    ? 'Game Over'
                    : currentTurn === 'WHITE'
                      ? 'Your turn'
                      : 'NeuroChess is thinking'}
                  <span> · </span>
                  {currentTurn === 'WHITE'
                    ? 'You are White'
                    : 'AI is Black'}
                </h2>
              </div>

              <div className="heading-actions">
                <button
                  className="ghost-button"
                  onClick={resetGame}
                >
                  <RotateCcw size={14} />
                  RESET POSITION
                </button>

                <span className="live-chip">
                  <span className="status-dot" />
                  LIVE
                </span>
              </div>
            </div>

            {backendError && (
              <Panel className="error-panel">
                <ShieldCheck size={16} />

                <div>
                  <strong>BACKEND CONNECTION ERROR</strong>
                  <span>{backendError}</span>
                </div>
              </Panel>
            )}

            <div className="analysis-grid">
              {/* BOARD */}

              <div className="board-column">
                <Panel className="board-panel">
                  <div className="panel-topline">
                    <span>
                      POSITION / LIVE BOARD
                    </span>

                    <span>
                      FEN {fen}
                    </span>
                  </div>

                  <ChessBoard
                    fen={fen}
                    selected={selected}
                    onSelect={handleSquareClick}
                  />

                  <div className="board-caption">
                    <div>
                      <span className="caption-label">
                        {currentTurn}
                      </span>

                      <strong>
                        {legalMoves.length} LEGAL MOVES
                      </strong>
                    </div>

                    <div className="eval-track">
                      <span
                        className="eval-fill"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              ((evaluation || 0) + 1) *
                              50,
                              0,
                            ),
                            100,
                          )}%`,
                        }}
                      />

                      <span className="eval-marker">
                        {formattedEvaluation}
                      </span>
                    </div>

                    <div className="black-clock">
                      <span className="caption-label">
                        MODEL
                      </span>

                      <strong>
                        {loadingAnalysis
                          ? 'ANALYZING'
                          : 'READY'}
                      </strong>
                    </div>
                  </div>
                </Panel>

                {/* MOVE HISTORY */}

                <Panel className="history-panel">
                  <div className="panel-heading">
                    <div>
                      <SectionLabel tone="muted">
                        GAME TRACE
                      </SectionLabel>

                      <h3>Move history</h3>
                    </div>

                    <span className="mono-muted">
                      {moveHistory.length} MOVES
                    </span>
                  </div>

                  <div className="move-list">
                    {moveHistory.length === 0 ? (
                      <span className="mono-muted">
                        No moves yet
                      </span>
                    ) : (
                      moveHistory.map((move, index) => (
                        <span
                          key={`${move}-${index}`}
                        >
                          {index % 2 === 0 && (
                            <b>
                              {Math.floor(index / 2) + 1}.
                            </b>
                          )}

                          {move}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="history-actions">
                    <button
                      className="ghost-button"
                      onClick={undoMove}
                      disabled={
                        historyStack.length === 0
                      }
                    >
                      <Undo2 size={14} />
                      UNDO
                    </button>

                    <button
                      className="ghost-button"
                      onClick={resetGame}
                    >
                      <RotateCcw size={14} />
                      RESET
                    </button>
                  </div>
                </Panel>
              </div>

              {/* INSIGHT */}

              <div className="insight-column">
                <Panel className="recommendation-panel">
                  <div className="panel-topline">
                    <span>
                      HYBRID RECOMMENDATION
                    </span>

                    <span className="confidence-badge">
                      {candidate
                        ? 'AI RECOMMENDATION'
                        : 'WAITING'}
                    </span>
                  </div>

                  <div className="recommendation-main">
                    <div>
                      <span className="position-meta">
                        DEPTH {searchDepth}
                        <i />
                        {nodesSearched} NODES
                        <i />
                        {currentTurn} TO MOVE
                      </span>

                      <div className="recommendation-move">
                        {loadingAI
                          ? '...'
                          : candidate
                            ? candidate.move
                            : '--'}
                      </div>

                      <p>
                        {candidate
                          ? candidate.note
                          : 'Ask NeuroChess to analyze the current position.'}
                      </p>
                    </div>

                    <div className="recommendation-score">
                      <span>NEURAL EVALUATION</span>

                      <strong>
                        {formattedAiEvaluation}
                      </strong>

                      <small>
                        LEGAL MOVES{' '}
                        <b>{legalMoves.length}</b>
                      </small>
                    </div>
                  </div>

                  <div className="rec-actions">
                    <button
                      className="primary-button"
                      onClick={() => getAIMove(fen)}
                      disabled={loadingAI || aiThinking || gameOver}
                    >
                      <Play size={15} />

                      {aiThinking
                        ? 'AI THINKING...'
                        : 'ANALYZE POSITION'}
                    </button>

                    <button
                      className={`outline-button ${showWhy ? 'active' : ''
                        }`}
                      onClick={() =>
                        setShowWhy(!showWhy)
                      }
                      disabled={!candidate}
                    >
                      <CircleHelp size={15} />
                      WHY?
                    </button>

                    <button
                      className="outline-button"
                      onClick={() =>
                        setShowCompare(!showCompare)
                      }
                      disabled={!candidate}
                    >
                      <GitCompare size={15} />
                      COMPARE
                    </button>
                  </div>
                </Panel>

                {/* PIPELINE */}

                <Panel className="pipeline-panel">
                  <div className="panel-heading">
                    <div>
                      <SectionLabel tone="violet">
                        DECISION PATH
                      </SectionLabel>

                      <h3>
                        Neuro-symbolic reasoning
                      </h3>
                    </div>

                    <span className="streaming">
                      <span className="status-dot" />
                      LIVE
                    </span>
                  </div>

                  <Pipeline
                    aiMove={aiMove}
                    legalMoves={legalMoves.length}
                    depth={searchDepth}
                    nodes={nodesSearched}
                  />
                </Panel>

                {/* TWO CARDS */}

                <div className="two-cards">
                  <Panel>
                    <div className="card-heading">
                      <BrainCircuit size={17} />

                      <div>
                        <span>
                          NEURAL EVALUATION
                        </span>

                        <small>
                          PyTorch position evaluator
                        </small>
                      </div>

                      <b>
                        {formattedEvaluation}
                      </b>
                    </div>

                    <div className="concepts">
                      <span>
                        <ShieldCheck size={12} />
                        69-D INPUT
                      </span>

                      <span>
                        <ShieldCheck size={12} />
                        Tanh OUTPUT
                      </span>

                      <span>
                        <ShieldCheck size={12} />
                        CPU INFERENCE
                      </span>
                    </div>

                    <div className="candidate-bars">
                      <div className="candidate active">
                        <span>POSITION</span>

                        <i>
                          <em
                            style={{
                              width: `${Math.min(
                                Math.abs(
                                  evaluation || 0,
                                ) * 100,
                                100,
                              )}%`,
                            }}
                          />
                        </i>

                        <b>
                          {formattedEvaluation}
                        </b>
                      </div>
                    </div>
                  </Panel>

                  <Panel>
                    <div className="card-heading violet-heading">
                      <ShieldCheck size={17} />

                      <div>
                        <span>
                          SYMBOLIC REASONING
                        </span>

                        <small>
                          python-chess rule engine
                        </small>
                      </div>

                      <b>PASS</b>
                    </div>

                    <div className="checks">
                      <div>
                        <span>LEGAL MOVE CHECK</span>

                        <strong>
                          PASS ✓
                        </strong>
                      </div>

                      <div>
                        <span>KING SAFETY</span>

                        <strong>
                          VERIFIED ✓
                        </strong>
                      </div>

                      <div>
                        <span>LEGAL CANDIDATES</span>

                        <strong>
                          {legalMoves.length}
                        </strong>
                      </div>

                      <div>
                        <span>SEARCH NODES</span>

                        <strong>
                          {nodesSearched}
                        </strong>
                      </div>
                    </div>

                    <div className="symbolic-footer">
                      <span>
                        SEARCH DEPTH{' '}
                        <b>{searchDepth}</b>
                      </span>

                      <span>
                        AI MOVE{' '}
                        <b>{aiMove || '--'}</b>
                      </span>
                    </div>
                  </Panel>
                </div>
              </div>
            </div>

            {/* WHY PANEL */}

            {showWhy && candidate && (
              <Panel className="why-panel">
                <div className="why-header">
                  <div>
                    <SectionLabel tone="amber">
                      EXPLAINABILITY TRACE
                    </SectionLabel>

                    <h3>
                      Why did NeuroChess choose{' '}
                      {candidate.move}?
                    </h3>
                  </div>

                  <button
                    className="icon-button"
                    onClick={() =>
                      setShowWhy(false)
                    }
                    aria-label="Collapse explanation"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                <div className="reasoning-timeline">
                  {[
                    [
                      '01',
                      'NEURAL EVALUATION',
                      `The neural model evaluated the current board at ${formattedAiEvaluation}.`,
                    ],
                    [
                      '02',
                      'LEGAL MOVE GENERATION',
                      `${legalMoves.length} legal moves were available from the symbolic chess engine.`,
                    ],
                    [
                      '03',
                      'SYMBOLIC VALIDATION',
                      `${candidate.move} was verified against the chess rules before being selected.`,
                    ],
                    [
                      '04',
                      'MINIMAX SEARCH',
                      `The engine searched to depth ${searchDepth} and examined ${nodesSearched} nodes.`,
                    ],
                    [
                      '05',
                      'FINAL DECISION',
                      `${candidate.move} was returned as the engine's selected move.`,
                    ],
                  ].map(
                    ([number, title, copy]) => (
                      <div
                        key={number}
                        className="reason-step"
                      >
                        <span>{number}</span>

                        <div>
                          <strong>{title}</strong>
                          <p>{copy}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </Panel>
            )}

            {/* LIVE OUTPUT */}

            <div className="lower-grid">
              <Panel className="candidate-table">
                <div className="panel-heading">
                  <div>
                    <SectionLabel tone="muted">
                      LIVE OUTPUT
                    </SectionLabel>

                    <h3>
                      Engine result
                    </h3>
                  </div>

                  <span className="mono-muted">
                    DEPTH {searchDepth}
                  </span>
                </div>

                <div className="table-head">
                  <span>FIELD</span>
                  <span>VALUE</span>
                  <span />
                  <span />
                  <span />
                </div>

                {[
                  [
                    'AI MOVE',
                    aiMove || '--',
                  ],
                  [
                    'NEURAL EVALUATION',
                    formattedAiEvaluation,
                  ],
                  [
                    'SEARCH DEPTH',
                    String(searchDepth),
                  ],
                  [
                    'NODES SEARCHED',
                    String(nodesSearched),
                  ],
                  [
                    'LEGAL MOVES',
                    String(legalMoves.length),
                  ],
                ].map(([label, value], index) => (
                  <div
                    className="table-row"
                    key={label}
                  >
                    <span>
                      0{index + 1}
                    </span>

                    <strong>{label}</strong>

                    <span>{value}</span>

                    <span />

                    <b />

                    <ChevronRight size={14} />
                  </div>
                ))}
              </Panel>

              <Panel className="hybrid-card">
                <div className="panel-topline">
                  <span>HYBRID DECISION</span>
                  <Sparkles size={15} />
                </div>

                <div className="hybrid-move">
                  {aiMove || '--'}
                </div>

                <div className="score-stack">
                  <Metric
                    label="POSITION SCORE"
                    value={formattedEvaluation}
                  />

                  <Metric
                    label="AI SCORE"
                    value={formattedAiEvaluation}
                    accent="violet-text"
                  />

                  <Metric
                    label="SEARCH DEPTH"
                    value={String(searchDepth)}
                    accent="amber-text"
                  />
                </div>

                <div className="hybrid-confidence">
                  <span>NODES SEARCHED</span>

                  <strong>
                    {nodesSearched}
                  </strong>

                  <i>
                    <em
                      style={{
                        width: `${Math.min(
                          nodesSearched / 2,
                          100,
                        )}%`,
                      }}
                    />
                  </i>
                </div>
              </Panel>
            </div>
          </>
        )}

        {/* ============================================
            NEURAL MODEL
        ============================================ */}

        {activeTab === 'NEURAL MODEL' && (
          <ModelView evaluation={evaluation} />
        )}

        {/* ============================================
            SYMBOLIC ENGINE
        ============================================ */}

        {activeTab === 'SYMBOLIC ENGINE' && (
          <SymbolicView
            legalMoves={legalMoves.length}
            nodes={nodesSearched}
            depth={searchDepth}
          />
        )}

        {/* ============================================
            EXPERIMENTS
        ============================================ */}

        {activeTab === 'EXPERIMENTS' && (
          <ExperimentsView />
        )}

        {/* ============================================
            PLAY
        ============================================ */}

        {activeTab === 'PLAY' && (
          <PlayView
            fen={fen}
            selected={selected}
            onSelect={handleSquareClick}
            playInput={playInput}
            setPlayInput={setPlayInput}
            interpretation={interpretation}
            setInterpretation={setInterpretation}
            aiMove={aiMove}
            evaluation={evaluation}
            getAIMove={getAIMove}
            loadingAI={loadingAI}
            currentTurn={currentTurn}
            aiThinking={aiThinking}
            gameOver={gameOver}
          />
        )}
      </div>

      {/* -------------------------------- FOOTER -------------------------------- */}

      <footer>
        <div className="brand-name">
          NEURO<span>CHESS</span>
        </div>

        <span>
          An experimental Neuro-Symbolic AI project.
        </span>

        <div className="footer-links">
          <a href="#">GitHub</a>
          <a href="#">Research</a>
          <a href="#">Documentation</a>

          <span className="prototype-status">
            <span className="status-dot" />
            PROTOTYPE
          </span>
        </div>
      </footer>

      {/* -------------------------------- COMPARE MODAL -------------------------------- */}

      {showCompare && candidate && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCompare(false)}
        >
          <div
            className="compare-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="panel-heading">
              <div>
                <SectionLabel>
                  ENGINE ANALYSIS
                </SectionLabel>

                <h3>
                  Current AI recommendation
                </h3>
              </div>

              <button
                className="icon-button"
                onClick={() =>
                  setShowCompare(false)
                }
                aria-label="Close comparison"
              >
                ×
              </button>
            </div>

            <div className="compare-grid">
              <div className="compare-card winner">
                <span>01</span>

                <strong>{candidate.move}</strong>

                <small>
                  Selected by the current
                  neural + symbolic + minimax
                  pipeline.
                </small>

                <b>{formattedAiEvaluation}</b>
              </div>

              <div className="compare-card">
                <span>02</span>

                <strong>
                  {legalMoves.length}
                </strong>

                <small>
                  Legal moves available in the
                  current position.
                </small>

                <b>LEGAL</b>
              </div>

              <div className="compare-card">
                <span>03</span>

                <strong>
                  {nodesSearched}
                </strong>

                <small>
                  Search nodes examined by the
                  engine.
                </small>

                <b>
                  {searchDepth} PLY
                </b>
              </div>
            </div>

            <button
              className="primary-button full"
              onClick={() =>
                setShowCompare(false)
              }
            >
              RETURN TO POSITION
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

/* ============================================================
   NEURAL MODEL VIEW
============================================================ */

function ModelView({
  evaluation,
}: {
  evaluation: number | null
}) {
  return (
    <div className="view-shell">
      <div className="workspace-heading">
        <div>
          <SectionLabel>
            MODEL INSPECTION / 02
          </SectionLabel>

          <h2>Neural intuition engine</h2>

          <p className="view-lede">
            The PyTorch model evaluates chess positions
            from a 69-feature board representation.
          </p>
        </div>

        <span className="live-chip">
          <span className="status-dot" />
          MODEL READY
        </span>
      </div>

      <div className="metric-grid">
        <Panel>
          <Metric
            label="CURRENT EVALUATION"
            value={
              evaluation === null
                ? '--'
                : evaluation.toFixed(3)
            }
          />

          <div className="metric-spark">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </Panel>

        <Panel>
          <Metric
            label="INPUT FEATURES"
            value="69"
          />

          <div className="metric-spark">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </Panel>

        <Panel>
          <Metric
            label="HIDDEN LAYER 1"
            value="128"
          />

          <div className="metric-spark">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </Panel>

        <Panel>
          <Metric
            label="HIDDEN LAYER 2"
            value="64"
          />

          <div className="metric-spark">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </Panel>
      </div>

      <div className="model-grid">
        <Panel>
          <div className="panel-heading">
            <div>
              <SectionLabel>
                BOARD REPRESENTATION
              </SectionLabel>

              <h3>
                Neural input encoding
              </h3>
            </div>

            <span className="mono-muted">
              69 FEATURES
            </span>
          </div>

          <p className="panel-copy">
            The board is represented using 64 square
            features plus side-to-move and castling
            information.
          </p>

          <div className="attention-board">
            {Array.from(
              { length: 64 },
              (_, index) => (
                <span
                  key={index}
                  style={{
                    opacity:
                      0.15 +
                      ((index * 7) % 6) / 30,
                  }}
                />
              ),
            )}
          </div>

          <div className="heat-legend">
            <span>EMPTY</span>
            <i />
            <i />
            <i />
            <i />
            <span>PIECE VALUE</span>
          </div>
        </Panel>

        <Panel className="architecture">
          <div className="panel-heading">
            <div>
              <SectionLabel tone="violet">
                MODEL GRAPH
              </SectionLabel>

              <h3>Architecture</h3>
            </div>

            <span className="mono-muted">
              PYTORCH
            </span>
          </div>

          {[
            [
              '01',
              'Board encoder',
              '69 input features',
            ],
            [
              '02',
              'Hidden layer',
              '69 → 128 / ReLU',
            ],
            [
              '03',
              'Hidden layer',
              '128 → 64 / ReLU',
            ],
            [
              '04',
              'Output',
              '64 → 1 / Tanh',
            ],
          ].map(([number, label, detail]) => (
            <div
              className="arch-row"
              key={number}
            >
              <span>{number}</span>

              <div>
                <strong>{label}</strong>
                <small>{detail}</small>
              </div>

              <ChevronRight size={15} />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

/* ============================================================
   SYMBOLIC VIEW
============================================================ */

function SymbolicView({
  legalMoves,
  nodes,
  depth,
}: {
  legalMoves: number
  nodes: number
  depth: number
}) {
  return (
    <div className="view-shell">
      <div className="workspace-heading">
        <div>
          <SectionLabel>
            ENGINE DEBUGGER / 03
          </SectionLabel>

          <h2>Symbolic reasoning engine</h2>

          <p className="view-lede">
            Explicit chess rules and minimax search are
            kept separate from neural evaluation.
          </p>
        </div>

        <span className="live-chip">
          <span className="status-dot" />
          ENGINE ACTIVE
        </span>
      </div>

      <div className="engine-stats">
        {[
          [
            'LEGAL MOVE GENERATION',
            `${legalMoves} MOVES`,
          ],
          [
            'CONSTRAINT CHECKING',
            'ACTIVE',
          ],
          [
            'GAME TREE SEARCH',
            `${nodes} NODES`,
          ],
          [
            'SEARCH DEPTH',
            `${depth} PLY`,
          ],
        ].map(([label, value]) => (
          <Panel key={label}>
            <ShieldCheck size={16} />

            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </Panel>
        ))}
      </div>

      <div className="symbolic-grid">
        <Panel>
          <div className="panel-heading">
            <div>
              <SectionLabel tone="violet">
                SYMBOLIC RULES
              </SectionLabel>

              <h3>
                Rule verification
              </h3>
            </div>

            <span className="mono-muted">
              python-chess
            </span>
          </div>

          <div className="tree">
            {[
              'Move legality',
              'King safety',
              'Check detection',
              'Checkmate detection',
              'Stalemate detection',
              'Castling constraints',
              'Promotion constraints',
            ].map((rule, index) => (
              <div
                className="tree-branch"
                key={rule}
              >
                <div className="tree-move">
                  <span className="tree-node violet-node" />

                  {rule}

                  <b>PASS</b>
                </div>

                <div className="tree-leaves">
                  <span>
                    └── rule {index + 1}
                    <i>validated</i>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="constraint-panel">
          <div className="panel-heading">
            <div>
              <SectionLabel>
                CONSTRAINT LOG
              </SectionLabel>

              <h3>
                Verification stream
              </h3>
            </div>

            <Activity
              size={16}
              className="cyan-text"
            />
          </div>

          {[
            'Legal move generation active',
            'King safety constraint active',
            'Opponent response generation active',
            'Minimax frontier expanded',
            'Neural evaluation connected',
          ].map((item, index) => (
            <div
              className="log-line"
              key={item}
            >
              <span>0{index + 1}</span>

              <ShieldCheck size={13} />

              <strong>{item}</strong>

              <small>ACTIVE</small>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

/* ============================================================
   EXPERIMENTS
============================================================ */

function ExperimentsView() {
  return (
    <div className="view-shell">
      <div className="workspace-heading">
        <div>
          <SectionLabel>
            BENCHMARK SUITE / 04
          </SectionLabel>

          <h2>Engine experiments</h2>

          <p className="view-lede">
            Compare the components of the NeuroChess
            architecture during the workshop.
          </p>
        </div>

        <span className="demo-label">
          WORKSHOP MODE
        </span>
      </div>

      <div className="match-grid">
        {[
          [
            'NEURAL EVALUATOR',
            'ACTIVE',
            'cyan',
          ],
          [
            'SYMBOLIC RULES',
            'ACTIVE',
            'violet',
          ],
          [
            'MINIMAX SEARCH',
            'ACTIVE',
            'amber',
          ],
        ].map(([label, value, color]) => (
          <Panel
            key={label}
            className={`match-card ${color}`}
          >
            <span>{label}</span>

            <strong>{value}</strong>

            <small>ENGINE COMPONENT</small>

            <div className="match-bar">
              <i style={{ width: '100%' }} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="experiment-grid">
        <Panel>
          <div className="panel-heading">
            <div>
              <SectionLabel>
                PIPELINE
              </SectionLabel>

              <h3>
                Neuro-symbolic flow
              </h3>
            </div>

            <span className="mono-muted">
              LIVE ARCHITECTURE
            </span>
          </div>

          <div className="chart">
            <div className="chart-gridlines">
              <i />
              <i />
              <i />
              <i />
            </div>

            <svg
              viewBox="0 0 700 240"
              preserveAspectRatio="none"
              aria-label="Neuro symbolic pipeline"
            >
              <polyline
                points="20,180 160,120 300,150 440,80 580,110 680,55"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>

            <div className="chart-x">
              <span>POSITION</span>
              <span>NEURAL</span>
              <span>SYMBOLIC</span>
              <span>SEARCH</span>
            </div>
          </div>
        </Panel>

        <Panel className="quality-panel">
          <div className="panel-heading">
            <div>
              <SectionLabel tone="amber">
                CURRENT SYSTEM
              </SectionLabel>

              <h3>
                Component status
              </h3>
            </div>

            <BarChart3 size={16} />
          </div>

          {[
            [
              'Neural model',
              'READY',
            ],
            [
              'Symbolic engine',
              'READY',
            ],
            [
              'Minimax',
              'READY',
            ],
            [
              'FastAPI',
              'CONNECTED',
            ],
          ].map(([label, value]) => (
            <div
              className="quality-row"
              key={label}
            >
              <div>
                <span>{label}</span>
                <b>{value}</b>
              </div>

              <i>
                <em style={{ width: '100%' }} />
              </i>

              <small>ONLINE</small>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

/* ============================================================
   PLAY VIEW
============================================================ */

function PlayView({
  fen,
  selected,
  onSelect,
  playInput,
  setPlayInput,
  interpretation,
  setInterpretation,
  aiMove,
  evaluation,
  getAIMove,
  loadingAI,
  aiThinking,
  gameOver,
  currentTurn,
}: {
  fen: string
  selected: string | null
  onSelect: (square: string) => void
  playInput: string
  setPlayInput: (value: string) => void
  interpretation: boolean
  setInterpretation: (value: boolean) => void
  aiMove: string
  evaluation: number | null
  getAIMove: (positionFen?: string) => Promise<void>
  aiThinking: boolean
  gameOver: boolean
  loadingAI: boolean
  currentTurn: string
}) {
  return (
    <div className="view-shell">
      <div className="workspace-heading">
        <div>
          <SectionLabel>
            INTERACTIVE PLAYGROUND / 01
          </SectionLabel>

          <h2>
            Play against NeuroChess
          </h2>

          <p className="view-lede">
            Click a piece and then a destination square,
            or ask the neural-symbolic engine to choose
            a move.
          </p>
        </div>

        <span className="live-chip">
          <span className="status-dot" />
          {currentTurn} TO MOVE
        </span>
      </div>

      <div className="play-grid">
        <Panel className="play-board">
          <ChessBoard
            fen={fen}
            selected={selected}
            onSelect={onSelect}
          />

          <div className="your-turn">
            <span className="status-dot" />

            {gameOver
              ? 'GAME OVER'
              : aiThinking
                ? 'NEUROCHESS IS THINKING'
                : 'YOUR TURN'}

            <small>
              {gameOver
                ? 'The game has ended.'
                : aiThinking
                  ? 'Neural evaluation + symbolic search in progress...'
                  : 'You are White. Select a white piece and destination square.'}
            </small>
          </div>
        </Panel>

        <Panel className="command-panel">
          <SectionLabel tone="violet">
            NEUROCHESS CONTROL
          </SectionLabel>

          <h3>
            Ask the engine to analyze
          </h3>

          <p>
            The natural-language field is a workshop
            interface. The actual chess decision is
            still verified by the symbolic engine.
          </p>

          <div className="command-suggestions">
            {[
              'Analyze the current position.',
              'Find the best move.',
              'Look for a tactical opportunity.',
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() =>
                  setPlayInput(suggestion)
                }
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="command-input">
            <input
              value={playInput}
              onChange={(event) =>
                setPlayInput(event.target.value)
              }
              placeholder="Describe what you want to explore..."
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  setInterpretation(true)
                }
              }}
            />

            <button
              className="primary-button"
              onClick={() =>
                setInterpretation(true)
              }
            >
              <ArrowRight size={15} />
            </button>
          </div>

          {interpretation && (
            <div className="interpretation">
              <div className="interpretation-heading">
                <BrainCircuit size={16} />

                <span>
                  NEURO-SYMBOLIC INTERPRETATION
                </span>

                <b>
                  {evaluation === null
                    ? '--'
                    : evaluation.toFixed(3)}
                </b>
              </div>

              <div className="intent-row">
                <span>REQUEST</span>

                <strong>
                  {playInput || 'ANALYZE_POSITION'}
                </strong>
              </div>

              <div className="intent-row">
                <span>AI RECOMMENDATION</span>

                <strong>
                  {aiMove || '--'}
                </strong>
              </div>

              <div className="symbolic-check">
                <span>
                  SYMBOLIC CHECK
                </span>

                <strong>
                  ✓ LEGAL MOVE &nbsp; ✓ KING SAFETY
                  &nbsp; ✓ VALID POSITION
                </strong>
              </div>

              <button
                className="primary-button full"
                onClick={getAIMove}
                disabled={loadingAI}
              >
                <Play size={15} />

                {loadingAI
                  ? 'ANALYZING...'
                  : 'RUN NEUROCHESS'}
              </button>

              {aiMove && (
                <button
                  className="outline-button full"
                  onClick={() =>
                    setInterpretation(false)
                  }
                >
                  CLOSE ANALYSIS
                </button>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}