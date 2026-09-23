import { useState } from 'react'
import { parseGameSpec } from './gameSpec'
import { parsePiecesSpec } from './piecesSpec'
import { parseRulesSpec } from './rulesSpec'

function CreateGameModal({ onClose, onCreated }) {
  const [name, setName] = useState('')

  const [specFile, setSpecFile] = useState(null)
  const [spec, setSpec] = useState(null)
  const [specError, setSpecError] = useState('')

  const [aiSide, setAiSide] = useState('')

  const [piecesFile, setPiecesFile] = useState(null)
  const [pieces, setPieces] = useState(null)
  const [piecesError, setPiecesError] = useState('')

  const [rulesFile, setRulesFile] = useState(null)
  const [rules, setRules] = useState(null)
  const [rulesError, setRulesError] = useState('')

  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handlePickSpecFile = async () => {
    setSpecError('')
    const result = await window.dialog.pickSpecFile('Select game specification file')
    if (!result) return

    try {
      const parsed = parseGameSpec(result.content)
      setSpec(parsed)
      setSpecFile(result.filePath)
      setAiSide('')
    } catch (err) {
      setSpec(null)
      setSpecFile(null)
      setSpecError(err.message)
    }
  }

  const handlePickPiecesFile = async () => {
    setPiecesError('')
    const result = await window.dialog.pickSpecFile('Select game pieces file')
    if (!result) return

    try {
      setPieces(parsePiecesSpec(result.content))
      setPiecesFile(result.filePath)
    } catch (err) {
      setPieces(null)
      setPiecesFile(null)
      setPiecesError(err.message)
    }
  }

  const handlePickRulesFile = async () => {
    setRulesError('')
    const result = await window.dialog.pickSpecFile('Select game rules file')
    if (!result) return

    try {
      setRules(parseRulesSpec(result.content))
      setRulesFile(result.filePath)
    } catch (err) {
      setRules(null)
      setRulesFile(null)
      setRulesError(err.message)
    }
  }

  const detailsUnlocked = name.trim() && spec

  const canCreate = detailsUnlocked && aiSide && pieces && rules && !submitting

  const handleCreate = async () => {
    if (!canCreate) return
    setSubmitError('')

    const unknownAreaPieces = pieces.filter((p) => !spec.areas[p.areaId])
    if (unknownAreaPieces.length > 0) {
      const ids = unknownAreaPieces.map((p) => `${p.id} -> ${p.areaId}`).join(', ')
      setSubmitError(`Piece(s) reference unknown area(s): ${ids}`)
      return
    }

    const sideLookup = new Map(spec.sides.map((s) => [s.toLowerCase(), s]))
    const unknownSidePieces = pieces.filter((p) => !sideLookup.has(p.side.toLowerCase()))
    if (unknownSidePieces.length > 0) {
      const ids = unknownSidePieces.map((p) => `${p.id} -> ${p.side}`).join(', ')
      setSubmitError(`Piece(s) reference unknown side(s): ${ids}`)
      return
    }

    const normalizedPieces = pieces.map((p) => ({ ...p, side: sideLookup.get(p.side.toLowerCase()) }))

    setSubmitting(true)
    try {
      const game = await window.db.create(
        name,
        { sourceFile: specFile, areas: spec.areas },
        normalizedPieces,
        spec.sides,
        aiSide,
        rules,
      )
      onCreated(game)
      onClose()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create new game</h2>

        <label className="field-label" htmlFor="game-name">
          Game name
        </label>
        <input
          id="game-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a unique name"
        />

        <label className="field-label">Game specification</label>
        <button className="file-picker" onClick={handlePickSpecFile}>
          {specFile ? specFile.split(/[\\/]/).pop() : 'Choose game.spec file...'}
        </button>
        {spec && !specError && (
          <div className="field-hint">
            {spec.sides.length} side(s), {Object.keys(spec.areas).length} area(s) loaded
          </div>
        )}
        {specError && <div className="field-error">{specError}</div>}

        {detailsUnlocked && (
          <>
            <label className="field-label" htmlFor="ai-side">
              AI plays as
            </label>
            <select id="ai-side" value={aiSide} onChange={(e) => setAiSide(e.target.value)}>
              <option value="" disabled>
                Select a side
              </option>
              {spec.sides.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="field-label">Game pieces</label>
            <button className="file-picker" onClick={handlePickPiecesFile}>
              {piecesFile ? piecesFile.split(/[\\/]/).pop() : 'Choose pieces file...'}
            </button>
            {pieces && !piecesError && (
              <div className="field-hint">{pieces.length} piece(s) loaded</div>
            )}
            {piecesError && <div className="field-error">{piecesError}</div>}

            <label className="field-label">Game rules</label>
            <button className="file-picker" onClick={handlePickRulesFile}>
              {rulesFile ? rulesFile.split(/[\\/]/).pop() : 'Choose rules file...'}
            </button>
            {rules && !rulesError && (
              <div className="field-hint">{rules.length} rule(s) loaded</div>
            )}
            {rulesError && <div className="field-error">{rulesError}</div>}
          </>
        )}

        {submitError && <div className="field-error">{submitError}</div>}

        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!canCreate}>
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateGameModal
