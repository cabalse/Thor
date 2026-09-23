import { useEffect, useState } from 'react'

function LogModal({ onClose }) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    window.log?.list().then(setEntries).catch(() => {})
  }, [])

  const handleClear = async () => {
    await window.log?.clear()
    setEntries([])
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Model log</h2>

        {entries.length === 0 && <div className="field-hint">No requests logged yet</div>}

        <div className="log-list">
          {entries.map((e) => (
            <div key={e.id} className="log-entry">
              <div className="log-entry-header">
                <span className="log-entry-kind">{e.kind}</span>
                <span>{new Date(e.timestamp).toLocaleString()}</span>
                {e.elapsedSeconds != null && <span>{e.elapsedSeconds}s</span>}
              </div>
              <div className={`log-entry-body ${e.error ? 'error' : ''}`}>
                {e.error ? `Error: ${e.error}` : e.response}
              </div>
              <details className="log-entry-request">
                <summary>Request sent to model</summary>
                {e.request.map((m, i) => (
                  <div key={i} className="log-entry-message">
                    <div className="log-entry-role">{m.role}</div>
                    <pre>{m.content}</pre>
                  </div>
                ))}
              </details>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="secondary" onClick={handleClear}>
            Clear log
          </button>
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogModal
