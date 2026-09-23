function GameStateModal({ game, onClose }) {
  const changedIds = new Set(game.lastTurn?.changedPieceIds ?? [])
  const eliminated = game.lastTurn?.eliminated ?? []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Game state: {game.name}</h2>

        <label className="field-label">Sides</label>
        <div className="field-hint">
          {game.sides.map((s) => (s === game.aiSide ? `${s} (AI)` : s)).join(', ')}
        </div>

        <label className="field-label">Pieces</label>
        <div className="state-list">
          {game.pieces.map((p) => (
            <div className={`state-row${changedIds.has(p.id) ? ' changed' : ''}`} key={p.id}>
              <span className="state-id">{p.id}</span>
              <span className="state-name">{p.name}</span>
              <span className="state-side">{p.side}</span>
              <span className="state-area">{p.areaId}</span>
              <span className="state-stats">
                m:{p.stats.m} a:{p.stats.a} d:{p.stats.d}
              </span>
              {p.status && <span className={`status-badge ${p.status}`}>{p.status}</span>}
            </div>
          ))}
        </div>

        {eliminated.length > 0 && (
          <>
            <label className="field-label">Eliminated last turn</label>
            <div className="state-list">
              {eliminated.map((p) => (
                <div className="state-row eliminated" key={p.id}>
                  <span className="state-id">{p.id}</span>
                  <span className="state-name">{p.name}</span>
                  <span className="state-side">{p.side}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameStateModal
