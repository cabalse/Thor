import { useEffect, useState } from 'react'
import './App.css'
import CreateGameModal from './CreateGameModal'
import GamesListModal from './GamesListModal'
import GameStateModal from './GameStateModal'
import ChatModal from './ChatModal'
import LogModal from './LogModal'
import { buildMoveMessages, describeActions } from './movePrompt'
import { parseMoveResponse, applyMoveActions } from './moveResponse'
import { formatElapsed } from './formatElapsed'

function App() {
  const [chatMessages, setChatMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendElapsed, setSendElapsed] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [gamesModalOpen, setGamesModalOpen] = useState(false)
  const [gameStateModalOpen, setGameStateModalOpen] = useState(false)
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [currentGame, setCurrentGame] = useState(null)
  const [movePending, setMovePending] = useState(false)
  const [moveElapsed, setMoveElapsed] = useState(0)
  const [lastMoveResult, setLastMoveResult] = useState(null)
  const [toast, setToast] = useState('')

  const runTimed = async (task, onTick) => {
    const start = Date.now()
    const timer = setInterval(() => onTick(Math.floor((Date.now() - start) / 1000)), 1000)
    try {
      const result = await task()
      return { result, elapsedSeconds: Math.round((Date.now() - start) / 1000) }
    } catch (err) {
      err.elapsedSeconds = Math.round((Date.now() - start) / 1000)
      throw err
    } finally {
      clearInterval(timer)
    }
  }

  useEffect(() => {
    window.db?.getCurrent().then(setCurrentGame).catch(() => {})
  }, [])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 2000)
  }

  // Free chat is a plain, standalone conversation with the model — used for
  // querying it about its decisions, not for playing the game. It never
  // includes game state and its history is never touched by the move
  // pipeline, so the two stay fully independent.
  const handleSend = async () => {
    const content = input.trim()
    if (!content || sending) return

    const nextMessages = [...chatMessages, { role: 'user', content }]
    setChatMessages(nextMessages)
    setInput('')
    setSending(true)
    setSendElapsed(0)

    try {
      const { result: reply, elapsedSeconds } = await runTimed(
        () => window.chat.send(nextMessages, 'chat'),
        setSendElapsed,
      )
      setChatMessages([...nextMessages, { role: 'assistant', content: reply, elapsedSeconds }])
    } catch (err) {
      setChatMessages([
        ...nextMessages,
        { role: 'assistant', content: `Error: ${err.message}`, elapsedSeconds: err.elapsedSeconds },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleGameCreated = (game) => {
    setCurrentGame(game)
    showToast(`Created "${game.name}"`)
  }

  const handleGameLoaded = (game) => {
    setCurrentGame(game)
    showToast(`Loaded "${game.name}"`)
  }

  const handleGameDeleted = (id) => {
    if (currentGame?.id === id) {
      setCurrentGame(null)
    }
  }

  const handleMakeMove = async () => {
    if (!currentGame || movePending) return
    setMovePending(true)
    setMoveElapsed(0)

    try {
      const request = buildMoveMessages(currentGame)
      const { result: reply, elapsedSeconds } = await runTimed(
        () => window.chat.send(request, 'move'),
        setMoveElapsed,
      )

      try {
        const actions = parseMoveResponse(reply)
        const updated = applyMoveActions(currentGame, actions)

        await window.db.update(currentGame.id, { pieces: updated.pieces, lastTurn: updated.lastTurn })
        setCurrentGame(updated)
        setLastMoveResult({ content: describeActions(actions), elapsedSeconds })
      } catch (err) {
        setLastMoveResult({ content: `Move error: ${err.message}`, elapsedSeconds })
      }
    } catch (err) {
      setLastMoveResult({ content: `Move error: ${err.message}`, elapsedSeconds: err.elapsedSeconds })
    } finally {
      setMovePending(false)
    }
  }

  return (
    <div className="page">
      <button className="hamburger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
        ☰
      </button>

      {menuOpen && (
        <>
          <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
          <div className="menu">
            <button
              onClick={() => {
                setMenuOpen(false)
                setCreateModalOpen(true)
              }}
            >
              Create new game
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                setGamesModalOpen(true)
              }}
            >
              Games
            </button>
            <button
              disabled={!currentGame}
              onClick={() => {
                setMenuOpen(false)
                setGameStateModalOpen(true)
              }}
            >
              Game state
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                setChatModalOpen(true)
              }}
            >
              Chat
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                setLogModalOpen(true)
              }}
            >
              Log
            </button>
          </div>
        </>
      )}

      {createModalOpen && (
        <CreateGameModal onClose={() => setCreateModalOpen(false)} onCreated={handleGameCreated} />
      )}

      {gamesModalOpen && (
        <GamesListModal
          onClose={() => setGamesModalOpen(false)}
          currentGameId={currentGame?.id}
          onLoaded={handleGameLoaded}
          onDeleted={handleGameDeleted}
        />
      )}

      {gameStateModalOpen && currentGame && (
        <GameStateModal game={currentGame} onClose={() => setGameStateModalOpen(false)} />
      )}

      {chatModalOpen && (
        <ChatModal
          onClose={() => setChatModalOpen(false)}
          messages={chatMessages}
          input={input}
          setInput={setInput}
          sending={sending}
          sendElapsed={sendElapsed}
          onSend={handleSend}
        />
      )}

      {logModalOpen && <LogModal onClose={() => setLogModalOpen(false)} />}

      {toast && <div className="toast">{toast}</div>}

      <div className="latest-response">
        {lastMoveResult ? (
          <>
            <div className="latest-response-content">{lastMoveResult.content}</div>
            {lastMoveResult.elapsedSeconds != null && (
              <div className="message-timing">Responded in {formatElapsed(lastMoveResult.elapsedSeconds)}</div>
            )}
          </>
        ) : (
          <div className="latest-response-empty">No response yet</div>
        )}
        {movePending && (
          <div className="latest-response-pending">
            Thinking... {formatElapsed(moveElapsed)}
            <div className="message-timing">Thor hasn't frozen — still waiting on the model</div>
          </div>
        )}
      </div>

      <div className="current-game-bar">
        {currentGame ? (
          <>
            <span>
              Current game: {currentGame.name}  AI Side: {currentGame.aiSide}
            </span>
            <button className="make-move-button" onClick={handleMakeMove} disabled={movePending}>
              {movePending ? `Thinking... ${formatElapsed(moveElapsed)}` : 'Make AI move'}
            </button>
          </>
        ) : (
          'No game loaded'
        )}
      </div>
    </div>
  )
}

export default App
