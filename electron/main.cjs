const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { fetch: undiciFetch, Agent } = require('undici')
const store = require('./store.cjs')
const log = require('./log.cjs')

const isDev = process.env.NODE_ENV === 'development'
const OLLAMA_URL = 'http://localhost:11434/api/chat'
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:1.7b'

// Local LLM inference (especially "thinking" models on CPU) can easily take
// longer than undici's default 5-minute headers/body timeout, which would
// otherwise fail the request with UND_ERR_HEADERS_TIMEOUT before Ollama has
// finished generating a response. Node's global fetch is tied to its own
// bundled undici version, so a standalone Agent must be paired with undici's
// own fetch() rather than the global one, or the dispatcher handler protocol
// mismatches.
const ollamaAgent = new Agent({
  headersTimeout: 30 * 60 * 1000,
  bodyTimeout: 30 * 60 * 1000,
})

ipcMain.handle('db:list', () => store.listGames())
ipcMain.handle('db:get', (_event, id) => store.getGame(id))
ipcMain.handle('db:create', (_event, name, board, pieces, sides, aiSide, rules) =>
  store.createGame(name, board, pieces, sides, aiSide, rules),
)
ipcMain.handle('db:update', (_event, id, updates) => store.updateGame(id, updates))
ipcMain.handle('db:delete', (_event, id) => store.deleteGame(id))
ipcMain.handle('db:getCurrent', () => store.getCurrentGame())
ipcMain.handle('db:setCurrent', (_event, id) => store.setCurrentGame(id))

ipcMain.handle('log:list', () => log.listEntries())
ipcMain.handle('log:clear', () => log.clearLog())

ipcMain.handle('dialog:pickSpecFile', async (_event, title) => {
  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showOpenDialog(win, {
    title: title || 'Select specification file',
    properties: ['openFile'],
    filters: [
      { name: 'Spec Files', extensions: ['spec', 'txt', 'md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const filePath = result.filePaths[0]
  const content = fs.readFileSync(filePath, 'utf-8')
  return { filePath, content }
})

ipcMain.handle('chat:send', async (_event, messages, kind) => {
  const start = Date.now()
  const entryKind = kind || 'chat'

  try {
    const res = await undiciFetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, stream: false, think: true }),
      dispatcher: ollamaAgent,
    })

    if (!res.ok) {
      throw new Error(`Ollama request failed (${res.status}): ${await res.text()}`)
    }

    const data = await res.json()
    const content = data.message?.content ?? ''

    log.appendEntry({
      kind: entryKind,
      request: messages,
      response: content,
      elapsedSeconds: Math.round((Date.now() - start) / 1000),
    })

    return content
  } catch (err) {
    log.appendEntry({
      kind: entryKind,
      request: messages,
      error: err.message,
      elapsedSeconds: Math.round((Date.now() - start) / 1000),
    })
    throw err
  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
