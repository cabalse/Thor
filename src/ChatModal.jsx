import { useEffect, useRef } from 'react'
import { formatElapsed } from './formatElapsed'

function ChatModal({ onClose, messages, input, setInput, sending, sendElapsed, onSend }) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide modal-chat" onClick={(e) => e.stopPropagation()}>
        <h2>Chat</h2>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              {m.content}
              {m.elapsedSeconds != null && (
                <div className="message-timing">Responded in {formatElapsed(m.elapsedSeconds)}</div>
              )}
            </div>
          ))}
          {sending && (
            <div className="message assistant pending">
              Thinking... {formatElapsed(sendElapsed)}
              <div className="message-timing">Thor hasn't frozen — still waiting on the model</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />
          <button onClick={onSend} disabled={sending}>
            Send
          </button>
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

export default ChatModal
