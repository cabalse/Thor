const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('chat', {
  send: (messages, kind) => ipcRenderer.invoke('chat:send', messages, kind),
})

contextBridge.exposeInMainWorld('log', {
  list: () => ipcRenderer.invoke('log:list'),
  clear: () => ipcRenderer.invoke('log:clear'),
})

contextBridge.exposeInMainWorld('db', {
  list: () => ipcRenderer.invoke('db:list'),
  get: (id) => ipcRenderer.invoke('db:get', id),
  create: (name, board, pieces, sides, aiSide, rules) =>
    ipcRenderer.invoke('db:create', name, board, pieces, sides, aiSide, rules),
  update: (id, updates) => ipcRenderer.invoke('db:update', id, updates),
  delete: (id) => ipcRenderer.invoke('db:delete', id),
  getCurrent: () => ipcRenderer.invoke('db:getCurrent'),
  setCurrent: (id) => ipcRenderer.invoke('db:setCurrent', id),
})

contextBridge.exposeInMainWorld('dialog', {
  pickSpecFile: (title) => ipcRenderer.invoke('dialog:pickSpecFile', title),
})
