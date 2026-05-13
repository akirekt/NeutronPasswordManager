import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Version info
const CURRENT_VERSION = '1.0.0' // Update this with each release
let updateInfo = { isUpdate: false, previousVersion: null }

// Initialize version tracking
function initializeVersionTracking() {
  const userDataPath = app.getPath('userData')
  const versionFilePath = path.join(userDataPath, 'version.json')

  try {
    if (fs.existsSync(versionFilePath)) {
      const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'))
      if (versionData.version && versionData.version !== CURRENT_VERSION) {
        // This is an update
        updateInfo = { isUpdate: true, previousVersion: versionData.version }
        console.log(`Update detected: ${versionData.version} → ${CURRENT_VERSION}`)
      }
    }
    // Write current version
    fs.writeFileSync(versionFilePath, JSON.stringify({ version: CURRENT_VERSION, lastUpdated: new Date().toISOString() }))
  } catch (error) {
    console.error('Error in version tracking:', error)
  }
}
  
let win: BrowserWindow | null

function createWindow() {
  const iconPath = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public', 'icon.ico')
    : path.join(path.dirname(app.getPath('exe')), 'resources', 'icon.ico')

  win = new BrowserWindow({
  title: "Neutron Password Manager",
  icon: iconPath,
  webPreferences: {
    preload: path.join(__dirname, 'preload.mjs'),
  },
})

  // Remove the default menu bar
  Menu.setApplicationMenu(null)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    // Send update info to renderer
    win?.webContents.send('update-info', updateInfo)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handlers for update info
ipcMain.handle('get-update-info', async () => {
  return updateInfo
})

ipcMain.handle('get-app-version', async () => {
  return CURRENT_VERSION
})

// IPC Handlers for opening new windows
ipcMain.handle('open-password-window', async (_event, options) => {
  const passwordWindow = new BrowserWindow({
    width: 600,
    height: 500,
    parent: win || undefined,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    passwordWindow.loadURL(VITE_DEV_SERVER_URL + '#/password-modal')
  } else {
    passwordWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  passwordWindow.webContents.send('password-window-data', options)

  return new Promise((resolve) => {
    ipcMain.once('password-window-close', (_event, result) => {
      passwordWindow.close()
      resolve(result)
    })
  })
})

app.whenReady().then(() => {
  initializeVersionTracking()
  createWindow()
})
