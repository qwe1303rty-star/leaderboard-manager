const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  openPreview: () => ipcRenderer.invoke('open-preview'),
  closePreview: () => ipcRenderer.invoke('close-preview'),
  pickAvatarSource: () => ipcRenderer.invoke('pick-avatar-source'),
  uploadAvatar: (leaderId) => ipcRenderer.invoke('upload-avatar', leaderId),
  saveAvatarCrop: (payload) => ipcRenderer.invoke('save-avatar-crop', payload),
  uploadLogo: () => ipcRenderer.invoke('upload-logo'),
  uploadBg: () => ipcRenderer.invoke('upload-bg'),
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),
  getAvatarPath: (avatarPath) => ipcRenderer.invoke('get-avatar-path', avatarPath),
  onDataUpdated: (callback) => {
    ipcRenderer.on('data-updated', (event, data) => callback(data));
  }
});
