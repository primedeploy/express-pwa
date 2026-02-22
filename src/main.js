const { app, BrowserWindow, ipcMain, nativeTheme, shell } = require('electron');
const path = require('path');
const Database = require('./database');
const PWAGenerator = require('./pwa-generator');
const BrowserDetector = require('./browser-detector');

let mainWindow;
let db;
let pwaGenerator;
let browserDetector;

async function createWindow() {
  const isDark = nativeTheme.shouldUseDarkColors;
  
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    frame: false,
    backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
    icon: path.join(__dirname, 'images', 'icon.png'),
    title: 'Express PWA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  
  mainWindow.setTitle('Express PWA');

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('theme-changed', isDark ? 'dark' : 'light');
  });
}

nativeTheme.on('updated', () => {
  const isDark = nativeTheme.shouldUseDarkColors;
  if (mainWindow) {
    mainWindow.webContents.send('theme-changed', isDark ? 'dark' : 'light');
  }
});

app.whenReady().then(async () => {
  db = new Database();
  await db.ready;
  pwaGenerator = new PWAGenerator();
  browserDetector = new BrowserDetector();
  
  
  pwaGenerator.removeDesktopFile(0, 'Orphaned ID 0 Cleanup');

  console.log('[Main] Syncing existing PWAs...');
  const existingPWAs = pwaGenerator.scanExistingPWAs();
  let syncedCount = 0;
  
  existingPWAs.forEach(pwa => {
    const synced = db.syncApp(pwa);
    if (synced) {
      syncedCount++;
      console.log(`[Main] Synced PWA: ${pwa.title}`);
    }
  });
  
  if (syncedCount > 0) {
    console.log(`[Main] Synced ${syncedCount} PWA(s) from system to database`);
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('pwas-synced', syncedCount);
    });
  } else {
    console.log('[Main] All PWAs are already in sync');
  }
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('get-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-close', () => {
  mainWindow.close();
});

ipcMain.handle('get-browsers', () => {
  return browserDetector.getBrowserList();
});

ipcMain.handle('get-browser-command', (event, browserId, url) => {
  return browserDetector.getLaunchCommand(browserId, url);
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('db-get-apps', async () => {
  await db.ready;
  return db.getAllApps();
});

ipcMain.handle('db-get-app', async (event, id) => {
  await db.ready;
  return db.getApp(id);
});

ipcMain.handle('db-create-app', async (event, data) => {
  await db.ready;
  const createdApp = db.createApp(data);
  
  const result = pwaGenerator.generateDesktopFile(createdApp);
  
  return { ...createdApp, pwaResult: result };
});

ipcMain.handle('db-update-app', async (event, id, data) => {
  await db.ready;
  
  const oldApp = db.getApp(id);
  if (oldApp) {
    pwaGenerator.prepareUpdate(id, oldApp.title, data.title);
  }
  
  const updatedApp = db.updateApp(id, data);
  
  const result = pwaGenerator.generateDesktopFile(updatedApp);
  
  return { ...updatedApp, pwaResult: result };
});

ipcMain.handle('db-delete-app', async (event, id) => {
  await db.ready;
  
  const appToDelete = db.getApp(id);
  if (appToDelete) {
    pwaGenerator.removeDesktopFile(id, appToDelete.title);
  }
  
  return db.deleteApp(id);
});
