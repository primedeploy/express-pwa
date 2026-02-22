const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTheme: () => ipcRenderer.invoke('get-theme'),
  onThemeChanged: (callback) => ipcRenderer.on('theme-changed', (event, theme) => callback(theme)),
  onPWAsSynced: (callback) => ipcRenderer.on('pwas-synced', (event, count) => callback(count)),
  getVersion: () => ipcRenderer.invoke('get-version'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  close: () => ipcRenderer.invoke('window-close'),
  getBrowsers: () => ipcRenderer.invoke('get-browsers'),
  getBrowserCommand: (browserId, url) => ipcRenderer.invoke('get-browser-command', browserId, url),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getApps: () => ipcRenderer.invoke('db-get-apps'),
  getApp: (id) => ipcRenderer.invoke('db-get-app', id),
  createApp: (data) => ipcRenderer.invoke('db-create-app', data),
  updateApp: (id, data) => ipcRenderer.invoke('db-update-app', id, data),
  deleteApp: (id) => ipcRenderer.invoke('db-delete-app', id)
});
