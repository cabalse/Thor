const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { app } = require('electron')

const MAX_ENTRIES = 50

function logPath() {
  return path.join(app.getPath('userData'), 'log.json')
}

function readLog() {
  try {
    return JSON.parse(fs.readFileSync(logPath(), 'utf-8'))
  } catch {
    return { entries: [] }
  }
}

function writeLog(data) {
  fs.mkdirSync(path.dirname(logPath()), { recursive: true })
  fs.writeFileSync(logPath(), JSON.stringify(data, null, 2))
}

function appendEntry(entry) {
  const db = readLog()
  const full = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  }
  db.entries = [full, ...db.entries].slice(0, MAX_ENTRIES)
  writeLog(db)
  return full
}

function listEntries() {
  return readLog().entries
}

function clearLog() {
  writeLog({ entries: [] })
}

module.exports = { appendEntry, listEntries, clearLog }
