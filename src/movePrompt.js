import { MOVE_INSTRUCTIONS } from './moveInstructions.js'

function ensureMoveReady(game) {
  if (!game.aiSide) {
    throw new Error('This game has no AI side defined and cannot make an AI move.')
  }
  if (!Array.isArray(game.sides) || game.sides.length < 2) {
    throw new Error('This game is missing its sides definition and cannot make an AI move.')
  }
  if (!game.board?.areas || Object.keys(game.board.areas).length === 0) {
    throw new Error('This game has no board areas defined and cannot make an AI move.')
  }
  if (!Array.isArray(game.pieces)) {
    throw new Error('This game has no pieces defined and cannot make an AI move.')
  }
}

export function buildMoveMessages(game) {
  ensureMoveReady(game)

  const rules = Array.isArray(game.rules) ? game.rules : []
  const rulesText = rules.length > 0
    ? rules.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : '(no rules provided for this game)'

  const areasText = Object.entries(game.board.areas)
    .map(([id, a]) => `${id} - ${a.terrain} - ${a.connections.join(', ')}`)
    .join('\n')

  const piecesText = game.pieces
    .map((p) => {
      const statusPart = p.status ? ` (status: ${p.status})` : ''
      return `${p.id} - ${p.name} - ${p.side} - ${p.areaId} - [m: ${p.stats.m}, a: ${p.stats.a}, d: ${p.stats.d}]${statusPart}`
    })
    .join('\n')

  const system = [
    `You are playing the side "${game.aiSide}" in a turn-based strategy game called "${game.name}".`,
    '',
    'Game rules:',
    rulesText,
    '',
    'Response format instructions:',
    MOVE_INSTRUCTIONS,
  ].join('\n')

  const user = [
    'Current game state:',
    '',
    'Sides: ' + game.sides.join(', '),
    '',
    'Board areas (AreaId - Terrain - ConnectedAreaIds):',
    areasText,
    '',
    'Pieces (PieceId - Name - Side - AreaId - [m,a,d stats]):',
    piecesText,
    '',
    `Make your move for side "${game.aiSide}".`,
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export function describeActions(actions) {
  return actions
    .map((a) => {
      if (a.type === 'move') {
        return `${a.pieceId} moved ${a.fromAreaId} → ${a.toAreaId}`
      }
      return `${a.pieceId} attacked ${a.targetAreaId}: ${a.resultPieceId} ${a.status}`
    })
    .join('\n')
}
