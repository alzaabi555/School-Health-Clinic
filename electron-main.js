import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

async function createWindow() {
  // Start the Express server as a child process
  const serverPath = path.join(__dirname, 'dist-server', 'server.js');
  
  // Get a safe, writable directory for the database (AppData/Roaming/...)
  const dbPath = path.join(app.getPath('userData'), 'school_health.db');

  serverProcess = spawn(process.execPath, [serverPath], {
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1', // Prevents infinite window loop
      DB_PATH: dbPath            // Ensures DB is saved in a writable folder
    },
    stdio: 'inherit'
  });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'نظام إدارة غرفة الصحة المدرسية',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Intercept window.open to open in default OS browser/app (fixes WhatsApp white screen issue)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('whatsapp:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Remove default menu
  mainWindow.setMenu(null);

  // Wait a bit for the server to start, then load the URL
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 2000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
