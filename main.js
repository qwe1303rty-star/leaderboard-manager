const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const PACKAGED_DATA = path.join(__dirname, 'data', 'leaderboard.json');
const PACKAGED_AVATARS_DIR = path.join(__dirname, 'avatars');
const PACKAGED_ASSETS_DIR = path.join(__dirname, 'assets');

let adminWindow = null;
let previewWindow = null;

function getDataFile() {
  return path.join(app.getPath('userData'), 'data', 'leaderboard.json');
}

function getAvatarsDir() {
  return path.join(app.getPath('userData'), 'avatars');
}

function getAssetsDir() {
  return path.join(app.getPath('userData'), 'assets');
}

function ensureDirectories() {
  const dataDir = path.dirname(getDataFile());
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(getAvatarsDir())) {
    fs.mkdirSync(getAvatarsDir(), { recursive: true });
  }
  if (!fs.existsSync(getAssetsDir())) {
    fs.mkdirSync(getAssetsDir(), { recursive: true });
  }
}

function copyDirContents(srcDir, destDir, force = false) {
  if (!srcDir || !fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  let entries;
  try {
    entries = fs.readdirSync(srcDir);
  } catch (e) {
    return;
  }
  entries.forEach(name => {
    const src = path.join(srcDir, name);
    const dest = path.join(destDir, name);
    let stat;
    try { stat = fs.statSync(src); } catch (e) { return; }
    if (stat.isDirectory()) return;
    if (force || !fs.existsSync(dest)) {
      try { fs.copyFileSync(src, dest); } catch (e) {}
    }
  });
}

function seedUserData() {
  ensureDirectories();
  const dataFile = getDataFile();
  let reseed = !fs.existsSync(dataFile);
  if (!reseed) {
    try {
      const existing = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      const firstLeader = existing?.leaders?.[0]?.name || '';
      const titleAccent = existing?.settings?.titleAccent || '';
      reseed = titleAccent === 'ДНЯ' || firstLeader === 'Иванов Иван';
    } catch (e) {
      reseed = true;
    }
  }
  if (reseed) {
    try {
      const packagedData = fs.readFileSync(PACKAGED_DATA, 'utf8');
      fs.writeFileSync(dataFile, packagedData, 'utf8');
    } catch (e) {
      fs.writeFileSync(dataFile, JSON.stringify(getDefaultData(), null, 2), 'utf8');
    }
  }
  copyDirContents(PACKAGED_AVATARS_DIR, getAvatarsDir(), reseed);
  copyDirContents(PACKAGED_ASSETS_DIR, getAssetsDir(), reseed);
}

function getDefaultData() {
  try {
    return JSON.parse(fs.readFileSync(PACKAGED_DATA, 'utf8'));
  } catch (e) {
    return {
      settings: {
        title: 'ТОП ЛИДЕРОВ',
        titleAccent: 'МЕСЯЦА',
        subtitle: 'Новый месяц — новые достижения',
        logo: '../assets/logo.png',
        bgColor: '#0b0b0d',
        cardColor: '#151517',
        accentColor: '#d4a94e',
        accentColorHi: '#f0d58a',
        textColor: '#f2f0ea',
        textDim: '#9b988c',
        greenColor: '#4ade80',
        fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif',
        showCrown: true,
        showLiveBadge: true,
        bgImage: '../assets/bg.png',
        previewScale: 1
      },
      leaders: [],
      callCenters: [],
      kpi: { target: 900, fact: 428, monthsToGoal: 15 },
      openspace: { title: 'ЗАГРУЗКА ОПЕНСПЕЙСА', subtitle: 'Занятость рабочих мест по зонам в реальном времени', totalPlaces: 301, zones: [] }
    };
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function loadData() {
  try {
    const dataFile = getDataFile();
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf8');
      const data = JSON.parse(raw);
      if (!data.settings) data.settings = getDefaultData().settings;
      if (typeof data.settings.previewScale !== 'number') data.settings.previewScale = 1;
      if (!data.leaders) data.leaders = [];
      if (!data.callCenters) {
        data.callCenters = getDefaultData().callCenters;
      } else {
        data.callCenters.forEach(kc => { if (!('avatar' in kc)) kc.avatar = ''; });
        if (!data.callCenters.every(kc => ('kpiRank' in kc) && ('planRank' in kc))) {
          const kpiOrdered = data.callCenters.slice().sort((a, b) => (b.today || 0) - (a.today || 0));
          const planOrdered = data.callCenters.slice().sort((a, b) => (b.done || 0) - (a.done || 0));
          kpiOrdered.forEach((kc, i) => { if (!('kpiRank' in kc)) kc.kpiRank = Math.min(i + 1, 4); });
          planOrdered.forEach((kc, i) => { if (!('planRank' in kc)) kc.planRank = Math.min(i + 1, 4); });
        }
      }
      if (!data.kpi) {
        data.kpi = getDefaultData().kpi;
      }
      if (!data.openspace) {
        data.openspace = getDefaultData().openspace;
      } else {
        if (!Array.isArray(data.openspace.zones)) data.openspace.zones = [];
        if (data.openspace.totalPlaces === undefined || data.openspace.totalPlaces === null || isNaN(data.openspace.totalPlaces)) {
          delete data.openspace.totalPlaces;
        }
      }
      const defaultLogo = path.join(getAssetsDir(), 'logo.png');
      const defaultBg = path.join(getAssetsDir(), 'bg.png');
      if (data.settings.logo === '../assets/logo.png' || data.settings.logo === '') {
        data.settings.logo = fs.existsSync(defaultLogo) ? defaultLogo : '';
      }
      if (data.settings.bgImage === '../assets/bg.png' || data.settings.bgImage === '') {
        data.settings.bgImage = fs.existsSync(defaultBg) ? defaultBg : '';
      }
      const normalizeAvatar = (av) => {
        if (!av) return '';
        if (path.isAbsolute(av) && fs.existsSync(av)) return av;
        const full = path.join(getAvatarsDir(), path.basename(av));
        if (fs.existsSync(full)) return full;
        const packed = path.join(PACKAGED_AVATARS_DIR, path.basename(av));
        if (fs.existsSync(packed)) return packed;
        return av;
      };
      (data.leaders || []).forEach(l => {
        l.avatar = normalizeAvatar(l.avatar);
        if (!('dept' in l)) l.dept = '';
        if (!('avgLeads' in l)) l.avgLeads = 0;
        if (!('avgSets' in l)) l.avgSets = 0;
      });
      (data.callCenters || []).forEach(kc => { kc.avatar = normalizeAvatar(kc.avatar); });
      return data;
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return getDefaultData();
}

function saveData(data) {
  try {
    fs.writeFileSync(getDataFile(), JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error saving data:', e);
    return false;
  }
}

function createAdminWindow() {
  adminWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Leaderboard Manager - Админ-панель',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  adminWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  adminWindow.on('closed', () => {
    adminWindow = null;
    if (previewWindow) previewWindow.close();
    app.quit();
  });
}

function createPreviewWindow() {
  if (previewWindow) {
    previewWindow.focus();
    return;
  }

  previewWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: 'Leaderboard - Превью',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  previewWindow.loadFile(path.join(__dirname, 'renderer', 'preview.html'));

  previewWindow.on('closed', () => {
    previewWindow = null;
  });
}

function broadcastUpdate(data) {
  if (adminWindow && !adminWindow.isDestroyed()) {
    adminWindow.webContents.send('data-updated', data);
  }
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.webContents.send('data-updated', data);
  }
}

app.whenReady().then(() => {
  seedUserData();
  createAdminWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createAdminWindow();
  }
});

ipcMain.handle('load-data', () => {
  return loadData();
});

ipcMain.handle('save-data', (event, data) => {
  const result = saveData(data);
  if (result) broadcastUpdate(data);
  return result;
});

ipcMain.handle('open-preview', () => {
  createPreviewWindow();
  return true;
});

ipcMain.handle('close-preview', () => {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.close();
  }
  return true;
});

ipcMain.handle('upload-avatar', async (event, leaderId) => {
  const result = await dialog.showOpenDialog(adminWindow, {
    title: 'Выберите фотографию',
    filters: [
      { name: 'Изображения', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths[0]) return null;

  const filePath = result.filePaths[0];
  const ext = path.extname(filePath);
  const fileName = `${leaderId}${ext}`;
  const destPath = path.join(getAvatarsDir(), fileName);

  try {
    fs.copyFileSync(filePath, destPath);
  } catch (e) {
    console.error('Error copying avatar:', e);
    return null;
  }
  return destPath;
});

ipcMain.handle('pick-avatar-source', async () => {
  const result = await dialog.showOpenDialog(adminWindow, {
    title: 'Выберите фотографию',
    filters: [
      { name: 'Изображения', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('save-avatar-crop', async (event, payload) => {
  if (!payload || !payload.sourcePath || !payload.leaderId) return null;

  const { sourcePath, leaderId, crop } = payload;
  const image = nativeImage.createFromPath(sourcePath);
  if (image.isEmpty()) return null;

  const size = image.getSize();
  const x = Math.max(0, Math.round((crop && crop.x) || 0));
  const y = Math.max(0, Math.round((crop && crop.y) || 0));
  const width = Math.max(1, Math.round((crop && crop.width) || size.width));
  const height = Math.max(1, Math.round((crop && crop.height) || size.height));

  const cropped = image.crop({ x, y, width, height });
  const ext = path.extname(sourcePath) || '.png';
  const fileName = `${leaderId}${ext}`;
  const destPath = path.join(getAvatarsDir(), fileName);

  try {
    fs.writeFileSync(destPath, cropped.toPNG());
  } catch (e) {
    console.error('Error saving avatar crop:', e);
    return null;
  }
  return destPath;
});

ipcMain.handle('upload-logo', async () => {
  const result = await dialog.showOpenDialog(adminWindow, {
    title: 'Выберите логотип',
    filters: [
      { name: 'Изображения', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths[0]) return null;

  const filePath = result.filePaths[0];
  const ext = path.extname(filePath);
  const fileName = `logo${ext}`;
  const destPath = path.join(getAvatarsDir(), fileName);

  try {
    fs.copyFileSync(filePath, destPath);
  } catch (e) {
    console.error('Error copying logo:', e);
    return null;
  }
  return destPath;
});

ipcMain.handle('upload-bg', async () => {
  const result = await dialog.showOpenDialog(adminWindow, {
    title: 'Выберите фоновое изображение',
    filters: [
      { name: 'Изображения', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths[0]) return null;

  const filePath = result.filePaths[0];
  const ext = path.extname(filePath);
  const fileName = `bg${ext}`;
  const destPath = path.join(getAssetsDir(), fileName);

  try {
    fs.copyFileSync(filePath, destPath);
  } catch (e) {
    console.error('Error copying bg:', e);
    return null;
  }
  return destPath;
});

ipcMain.handle('export-data', async () => {
  const result = await dialog.showSaveDialog(adminWindow, {
    title: 'Экспорт данных',
    defaultPath: 'leaderboard-backup.json',
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  });

  if (result.canceled || !result.filePath) return false;

  const data = loadData();
  fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');
  return true;
});

ipcMain.handle('import-data', async () => {
  const result = await dialog.showOpenDialog(adminWindow, {
    title: 'Импорт данных',
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths[0]) return null;

  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf8');
    const data = JSON.parse(raw);
    if (data.settings && data.leaders) {
      saveData(data);
      broadcastUpdate(data);
      return data;
    }
    return null;
  } catch (e) {
    return null;
  }
});

ipcMain.handle('get-avatar-path', (event, avatarPath) => {
  if (!avatarPath) return '';
  if (path.isAbsolute(avatarPath) && fs.existsSync(avatarPath)) {
    return avatarPath;
  }
  const fullPath = path.join(getAvatarsDir(), path.basename(avatarPath));
  if (fs.existsSync(fullPath)) return fullPath;
  return '';
});
