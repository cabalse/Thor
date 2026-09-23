import { useEffect, useState } from 'react'

function GameInfo({ game }) {
  const areaCount = Object.keys(game.board?.areas ?? {}).length
  const sides = game.sides ?? []

  return (
    <span className="info-icon">
      !
      <div className="info-tooltip">
        <div>
          Sides: {sides.map((s) => (s === game.aiSide ? `${s} (AI)` : s)).join(', ')}
        </div>
        <div>Board: {areaCount} area(s)</div>
        <div>
          Pieces:{' '}
          {sides.map((s) => `${s}: ${(game.pieces ?? []).filter((p) => p.side === s).length}`).join(', ')}
        </div>
      </div>
    </span>
  )
}

function GamesListModal({ onClose, currentGameId, onLoaded, onDeleted }) {
  const [games, setGames] = useState([])

  useEffect(() => {
    window.db?.list().then(setGames).catch(() => {})
  }, [])

  const handleLoad = async (id) => {
    const game = await window.db.setCurrent(id)
    onLoaded(game)
    onClose()
  }

  const handleDelete = async (id) => {
    await window.db.delete(id)
    setGames((prev) => prev.filter((g) => g.id !== id))
    onDeleted(id)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Games</h2>

        {games.length === 0 && <div className="field-hint">No games yet</div>}

        <div className="games-list">
          {games.map((g) => (
            <div className="game-row" key={g.id}>
              <span className="game-name">
                {g.name}
                {g.id === currentGameId && <span className="current-badge">current</span>}
              </span>
              <GameInfo game={g} />
              <button className="link-button" onClick={() => handleLoad(g.id)}>
                Load
              </button>
              <button className="link-button danger" onClick={() => handleDelete(g.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default GamesListModal
