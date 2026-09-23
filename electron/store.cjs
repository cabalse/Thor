const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { app } = require('electron')

function dbPath() {
  return path.join(app.getPath('userData'), 'games.json')
}

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(dbPath(), 'utf-8'))
  } catch {
    return { games: [] }
  }
}

function writeDb(data) {
  fs.mkdirSync(path.dirname(dbPath()), { recursive: true })
  fs.writeFileSync(dbPath(), JSON.stringify(data, null, 2))
}

function listGames() {
  return readDb().games
}

function getGame(id) {
  return readDb().games.find((g) => g.id === id) ?? null
}

function createGame(name, board, pieces, sides, aiSide, rules) {
  const trimmedName = (name || '').trim()
  if (!trimmedName) {
    throw new Error('Game name is required')
  }

  const db = readDb()
  const nameTaken = db.games.some((g) => g.name.toLowerCase() === trimmedName.toLowerCase())
  if (nameTaken) {
    throw new Error(`A game named "${trimmedName}" already exists`)
  }

  const sidesList = sides ?? []
  const matchedAiSide = sidesList.find((s) => s.toLowerCase() === (aiSide || '').toLowerCase())
  if (!matchedAiSide) {
    throw new Error('AI side must be one of the defined sides')
  }

  const game = {
    id: crypto.randomUUID(),
    name: trimmedName,
    createdAt: new Date().toISOString(),
    board: board ?? { areas: {} },
    sides: sidesList,
    aiSide: matchedAiSide,
    rules: rules ?? [],
    pieces: pieces ?? [],
    stats: {},
  }
  db.games.push(game)
  db.currentGameId = game.id
  writeDb(db)
  return game
}

function updateGame(id, updates) {
  const db = readDb()
  const idx = db.games.findIndex((g) => g.id === id)
  if (idx === -1) return null
  db.games[idx] = { ...db.games[idx], ...updates }
  writeDb(db)
  return db.games[idx]
}

function deleteGame(id) {
  const db = readDb()
  db.games = db.games.filter((g) => g.id !== id)
  if (db.currentGameId === id) {
    db.currentGameId = null
  }
  writeDb(db)
}

function getCurrentGame() {
  const db = readDb()
  if (!db.currentGameId) return null
  return db.games.find((g) => g.id === db.currentGameId) ?? null
}

function setCurrentGame(id) {
  const db = readDb()
  const game = db.games.find((g) => g.id === id)
  if (!game) {
    throw new Error('Game not found')
  }
  db.currentGameId = id
  writeDb(db)
  return game
}

module.exports = {
  listGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  getCurrentGame,
  setCurrentGame,
}
