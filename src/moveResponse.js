const VALID_STATUSES = ['damaged', 'retreat', 'eliminated']

// Models don't always follow "respond with ONLY a list of actions" — they may
// wrap valid action lines in markdown commentary, headers, or bullet-point
// explanations. Rather than hard-failing the whole response over stray prose,
// only lines that actually match the action grammar are treated as actions;
// everything else is silently ignored here (the unmodified raw response is
// still preserved in full via the request log, so nothing is lost).
const ACTION_LINE = /^([^-]+?)-\s*(move|attack)\s*:\s*(.+)$/i

export function parseMoveResponse(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) {
    throw new Error('Response is empty')
  }

  const actions = []

  for (const line of lines) {
    const match = line.match(ACTION_LINE)
    if (!match) continue

    const pieceId = match[1].trim()
    const actionType = match[2].toLowerCase()
    const params = match[3].trim()
    if (!pieceId) continue

    if (actionType === 'move') {
      const moveDash = params.indexOf('-')
      if (moveDash === -1) {
        throw new Error(`Expected "FromAreaId-ToAreaId" in line: "${line}"`)
      }
      const fromAreaId = params.slice(0, moveDash).trim()
      const toAreaId = params.slice(moveDash + 1).trim()
      if (!fromAreaId || !toAreaId) {
        throw new Error(`Malformed move in line: "${line}"`)
      }
      actions.push({ pieceId, type: 'move', fromAreaId, toAreaId })
      continue
    }

    const resultMatch = params.match(/^(.+?)\s+Result:\s*(.+)$/i)
    if (!resultMatch) {
      throw new Error(`Expected "TargetAreaId Result: PieceId-Status" in line: "${line}"`)
    }

    const targetAreaId = resultMatch[1].trim()
    const resultPart = resultMatch[2].trim()
    const resultDash = resultPart.indexOf('-')
    if (resultDash === -1) {
      throw new Error(`Expected "PieceId-Status" in result of line: "${line}"`)
    }

    const resultPieceId = resultPart.slice(0, resultDash).trim()
    const status = resultPart.slice(resultDash + 1).trim().toLowerCase()
    if (!resultPieceId) {
      throw new Error(`Missing result piece id in line: "${line}"`)
    }
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status "${status}" in line: "${line}"`)
    }

    actions.push({ pieceId, type: 'attack', targetAreaId, resultPieceId, status })
  }

  if (actions.length === 0) {
    throw new Error('No valid actions found in response')
  }

  return actions
}

export function applyMoveActions(game, actions) {
  const pieces = game.pieces.map((p) => ({ ...p }))
  const findPiece = (id) => pieces.find((p) => p.id === id)

  const changedPieceIds = new Set()
  const eliminated = []

  for (const action of actions) {
    const actor = findPiece(action.pieceId)
    if (!actor) {
      throw new Error(`Unknown piece "${action.pieceId}"`)
    }
    changedPieceIds.add(action.pieceId)

    if (action.type === 'move') {
      if (actor.areaId !== action.fromAreaId) {
        throw new Error(
          `Piece "${action.pieceId}" is at "${actor.areaId}", not "${action.fromAreaId}"`,
        )
      }
      if (!game.board.areas[action.toAreaId]) {
        throw new Error(`Unknown area "${action.toAreaId}"`)
      }
      actor.areaId = action.toAreaId
      continue
    }

    if (action.type === 'attack') {
      if (!game.board.areas[action.targetAreaId]) {
        throw new Error(`Unknown area "${action.targetAreaId}"`)
      }
      const resultPiece = findPiece(action.resultPieceId)
      if (!resultPiece) {
        throw new Error(`Unknown piece "${action.resultPieceId}" in attack result`)
      }
      changedPieceIds.add(action.resultPieceId)
      resultPiece.status = action.status
      if (action.status === 'eliminated') {
        eliminated.push({ id: resultPiece.id, name: resultPiece.name, side: resultPiece.side })
      }
    }
  }

  const survivors = pieces.filter((p) => p.status !== 'eliminated')
  return {
    ...game,
    pieces: survivors,
    lastTurn: {
      actions,
      changedPieceIds: [...changedPieceIds],
      eliminated,
      timestamp: new Date().toISOString(),
    },
  }
}
