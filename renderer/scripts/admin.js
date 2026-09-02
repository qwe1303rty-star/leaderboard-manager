let appData = null;
let cropState = null;

function toFileUrl(p) {
  if (!p) return p;
  if (/^(https?:|file:|data:)/.test(p)) return p;
  const withSlashes = p.replace(/\\/g, '/');
  const encoded = withSlashes.replace(/ /g, '%20');
  if (/^[a-zA-Z]:/.test(encoded)) return 'file:///' + encoded;
  return encoded;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function initials(name) {
  return name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
}

function rankOptions(value) {
  let html = '';
  for (let i = 1; i <= 4; i++) {
    html += `<option value="${i}"${Number(value) === i ? ' selected' : ''}>${i}</option>`;
  }
  return html;
}

function openCropModal(entityId, sourcePath, entityType) {
  const modal = document.getElementById('cropModal');
  const stage = document.getElementById('cropStage');
  const img = document.getElementById('cropImage');
  const zoom = document.getElementById('cropZoom');
  const type = entityType || 'leader';
  const list = type === 'kc' ? appData.callCenters : appData.leaders;
  const entity = list.find(e => e.id === entityId);
  if (!entity) return;

  cropState = {
    entityId,
    entityType: type,
    sourcePath,
    img,
    stage,
    zoom,
    scale: 1,
    x: 0,
    y: 0,
    baseWidth: 0,
    baseHeight: 0,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    lastPinchDistance: 0,
    lastPinchScale: 1,
    active: false
  };

  img.onload = () => {
    const rect = stage.getBoundingClientRect();
    const scaleToCover = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    cropState.baseWidth = img.naturalWidth * scaleToCover;
    cropState.baseHeight = img.naturalHeight * scaleToCover;
    cropState.scale = 1;
    cropState.x = (rect.width - cropState.baseWidth) / 2;
    cropState.y = (rect.height - cropState.baseHeight) / 2;
    zoom.value = '1';
    renderCropImage();
  };

  img.src = sourcePath;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeCropModal() {
  const modal = document.getElementById('cropModal');
  modal.hidden = true;
  document.body.style.overflow = '';
  cropState = null;
}

function renderCropImage() {
  if (!cropState) return;
  const { img, baseWidth, baseHeight, x, y, scale } = cropState;
  const width = baseWidth * scale;
  const height = baseHeight * scale;
  img.style.width = `${width}px`;
  img.style.height = `${height}px`;
  img.style.transform = `translate(${x}px, ${y}px)`;
}

function clampCropPosition() {
  if (!cropState) return;
  const rect = cropState.stage.getBoundingClientRect();
  const width = cropState.baseWidth * cropState.scale;
  const height = cropState.baseHeight * cropState.scale;
  if (width <= rect.width) {
    cropState.x = Math.min(rect.width - width, Math.max(0, cropState.x));
  } else {
    cropState.x = Math.min(0, Math.max(rect.width - width, cropState.x));
  }
  if (height <= rect.height) {
    cropState.y = Math.min(rect.height - height, Math.max(0, cropState.y));
  } else {
    cropState.y = Math.min(0, Math.max(rect.height - height, cropState.y));
  }
}

function updateCropScale(nextScale, anchorX, anchorY) {
  if (!cropState) return;
  const rect = cropState.stage.getBoundingClientRect();
  const oldScale = cropState.scale;
  const newScale = Math.min(3, Math.max(0.4, nextScale));
  const oldWidth = cropState.baseWidth * oldScale;
  const oldHeight = cropState.baseHeight * oldScale;
  const newWidth = cropState.baseWidth * newScale;
  const newHeight = cropState.baseHeight * newScale;
  const relX = (anchorX - cropState.x) / oldWidth;
  const relY = (anchorY - cropState.y) / oldHeight;
  cropState.scale = newScale;
  cropState.x = anchorX - relX * newWidth;
  cropState.y = anchorY - relY * newHeight;
  clampCropPosition();
  renderCropImage();
}

function stagePointFromEvent(e) {
  const rect = cropState.stage.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function distanceBetweenTouches(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

async function commitCrop() {
  if (!cropState) return;
  const rect = cropState.stage.getBoundingClientRect();
  const scaleRatio = cropState.img.naturalWidth / cropState.baseWidth;
  const sourceX = Math.max(0, Math.round(-cropState.x * scaleRatio / cropState.scale));
  const sourceY = Math.max(0, Math.round(-cropState.y * scaleRatio / cropState.scale));
  const sourceW = Math.round(rect.width * scaleRatio / cropState.scale);
  const sourceH = Math.round(rect.height * scaleRatio / cropState.scale);
  const filePath = await window.api.saveAvatarCrop({
    leaderId: cropState.entityId,
    sourcePath: cropState.sourcePath,
    crop: { x: sourceX, y: sourceY, width: sourceW, height: sourceH }
  });
  if (filePath) {
    if (cropState.entityType === 'kc') {
      const kc = appData.callCenters.find(k => k.id === cropState.entityId);
      if (kc) {
        kc.avatar = filePath;
        renderCallCenters();
        showToast('Аватарка КЦ загружена!');
      }
    } else {
      const leader = appData.leaders.find(l => l.id === cropState.entityId);
      if (leader) {
        leader.avatar = filePath;
        renderAvatars();
        renderLeaders();
        showToast('Аватарка загружена!');
      }
    }
  }
  closeCropModal();
}

function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 2500);
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${name}"]`).classList.add('active');
  document.getElementById(`tab-${name}`).classList.add('active');

  if (name === 'avatars') renderAvatars();
  if (name === 'callcenters') renderCallCenters();
  if (name === 'kpi') renderKpiTab();
  if (name === 'openspace') renderOpenspaceTab();
}

function renderLeaders() {
  const list = document.getElementById('leadersList');
  list.innerHTML = '';

  const sorted = appData.leaders.slice().sort((a, b) => (b.avgLeads - a.avgLeads) || (b.avgSets - a.avgSets));

  sorted.forEach((leader, i) => {
    const row = document.createElement('div');
    row.className = 'leader-row';
    row.dataset.id = leader.id;

    const avatarHtml = leader.avatar
      ? `<img src="${toFileUrl(leader.avatar)}" alt="">`
      : initials(leader.name);

    row.innerHTML = `
      <div class="rank-badge">${i + 1}</div>
      <div class="leader-avatar-sm">${avatarHtml}</div>
      <div class="field">
        <div class="col-label">Имя</div>
        <input type="text" class="ldr-name" value="${leader.name}" placeholder="Имя">
      </div>
      <div class="field">
        <div class="col-label">Отдел</div>
        <input type="text" class="ldr-dept" value="${leader.dept || ''}" placeholder="КЦ 1">
      </div>
      <div class="field">
        <div class="col-label">Сред. лиды</div>
        <input type="number" class="ldr-avg-leads" value="${leader.avgLeads}" min="0">
      </div>
      <div class="field">
        <div class="col-label">Сред. наборы</div>
        <input type="number" class="ldr-avg-sets" value="${leader.avgSets}" min="0">
      </div>
      <div class="leader-actions">
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${leader.id}">Удалить</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.ldr-name').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const id = e.target.closest('.leader-row').dataset.id;
      const l = appData.leaders.find(l => l.id === id);
      if (l) l.name = e.target.value;
    });
  });

  list.querySelectorAll('.ldr-dept').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const id = e.target.closest('.leader-row').dataset.id;
      const l = appData.leaders.find(l => l.id === id);
      if (l) l.dept = e.target.value;
    });
  });

  list.querySelectorAll('.ldr-avg-leads').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const id = e.target.closest('.leader-row').dataset.id;
      const l = appData.leaders.find(l => l.id === id);
      if (l) l.avgLeads = parseInt(e.target.value) || 0;
    });
  });

  list.querySelectorAll('.ldr-avg-sets').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const id = e.target.closest('.leader-row').dataset.id;
      const l = appData.leaders.find(l => l.id === id);
      if (l) l.avgSets = parseInt(e.target.value) || 0;
    });
  });

  list.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      appData.leaders = appData.leaders.filter(l => l.id !== id);
      renderLeaders();
    });
  });
}

function renderCallCenters() {
  const list = document.getElementById('callCentersList');
  list.innerHTML = '';

  if (!appData.callCenters) appData.callCenters = [];

  const sorted = appData.callCenters.slice().sort((a, b) => (a.kpiRank || 4) - (b.kpiRank || 4));

  sorted.forEach((kc, i) => {
    const row = document.createElement('div');
    row.className = 'kc-row';
    row.dataset.id = kc.id;

    const avatarHtml = kc.avatar
      ? `<img src="${toFileUrl(kc.avatar)}" alt="">`
      : initials(kc.name);

    row.innerHTML = `
      <div class="rank-badge">${i + 1}</div>
      <div class="kc-avatar-circle">${avatarHtml}</div>
      <div class="field">
        <div class="col-label">Название</div>
        <input type="text" class="kc-name" value="${kc.name}" placeholder="КЦ">
      </div>
      <div class="field">
        <div class="col-label">Место (KPI) 1–4</div>
        <select class="kc-kpi-rank">${rankOptions(kc.kpiRank)}</select>
      </div>
      <div class="field">
        <div class="col-label">Место (план) 1–4</div>
        <select class="kc-plan-rank">${rankOptions(kc.planRank)}</select>
      </div>
      <div style="display:flex; gap:8px; align-items:flex-end;">
        <button class="btn btn-primary btn-sm" data-action="upload-kc-avatar" data-id="${kc.id}">Фото</button>
        ${kc.avatar ? `<button class="btn btn-danger btn-sm" data-action="remove-kc-avatar" data-id="${kc.id}">Удалить</button>` : ''}
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('[data-action="upload-kc-avatar"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const filePath = await window.api.pickAvatarSource();
      if (filePath) openCropModal(id, filePath, 'kc');
    });
  });

  list.querySelectorAll('[data-action="remove-kc-avatar"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const kc = appData.callCenters.find(k => k.id === id);
      if (kc) {
        kc.avatar = '';
        renderCallCenters();
      }
    });
  });

  list.querySelectorAll('.kc-name').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const id = e.target.closest('.kc-row').dataset.id;
      const kc = appData.callCenters.find(k => k.id === id);
      if (kc) kc.name = e.target.value;
    });
  });

  list.querySelectorAll('.kc-kpi-rank').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const id = e.target.closest('.kc-row').dataset.id;
      const kc = appData.callCenters.find(k => k.id === id);
      if (kc) kc.kpiRank = parseInt(e.target.value, 10) || 4;
    });
  });

  list.querySelectorAll('.kc-plan-rank').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const id = e.target.closest('.kc-row').dataset.id;
      const kc = appData.callCenters.find(k => k.id === id);
      if (kc) kc.planRank = parseInt(e.target.value, 10) || 4;
    });
  });
}

function renderKpiTab() {
  const kpi = appData.kpi || { target: 900, fact: 428, monthsToGoal: 15 };
  document.getElementById('kpiTarget').value = kpi.target;
  document.getElementById('kpiFact').value = kpi.fact;
  document.getElementById('kpiMonths').value = kpi.monthsToGoal;
  updateKpiPercent();
}

function updateKpiPercent() {
  const target = parseFloat(document.getElementById('kpiTarget').value) || 0;
  const fact = parseFloat(document.getElementById('kpiFact').value) || 0;
  const pct = target > 0 ? Math.min((fact / target) * 100, 100) : 0;
  const pctStr = pct.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  document.getElementById('kpiPercentDisplay').textContent = pctStr;
}

function collectKpi() {
  const target = parseFloat(document.getElementById('kpiTarget').value) || 0;
  const fact = parseFloat(document.getElementById('kpiFact').value) || 0;
  const monthsToGoal = parseInt(document.getElementById('kpiMonths').value) || 0;
  appData.kpi = { target, fact, monthsToGoal };
}

function defaultOpenspace() {
  return {
    title: 'ЗАГРУЗКА ОПЕНСПЕЙСА',
    subtitle: 'Занятость рабочих мест по зонам в реальном времени',
    totalPlaces: 0,
    zones: [
      { name: 'Зона А — Продажи',   total: 40, occupied: 37 },
      { name: 'Зона Б — Поддержка', total: 32, occupied: 24 },
      { name: 'Зона В — Аналитика', total: 24, occupied: 12 },
      { name: 'Переговорные',       total: 8,  occupied: 8 }
    ]
  };
}

function renderOpenspaceTab() {
  const os = appData.openspace || defaultOpenspace();
  if (!appData.openspace) appData.openspace = os;

  document.getElementById('osTitle').value = os.title || '';
  document.getElementById('osSubtitle').value = os.subtitle || '';

  const zoneSum = (os.zones || []).reduce((a, z) => a + (z.total || 0), 0);
  document.getElementById('osTotalPlaces').value = (os.totalPlaces && os.totalPlaces > 0) ? os.totalPlaces : zoneSum;

  renderOsZones(os.zones || []);
  wireOsTitle();
}

function renderOsZones(zones) {
  const list = document.getElementById('osZonesList');
  list.innerHTML = '';

  if (!zones.length) {
    const empty = document.createElement('div');
    empty.className = 'os-hint';
    empty.textContent = 'Пока нет зон. Нажмите «+ Добавить зону», чтобы создать первую.';
    list.appendChild(empty);
    return;
  }

  zones.forEach((zone, i) => {
    const row = document.createElement('div');
    row.className = 'os-zone-row';
    row.dataset.index = i;

    row.innerHTML = `
      <div class="os-zone-field">
        <span class="col-label">Название зоны</span>
        <input type="text" class="os-name" value="${escAttr(zone.name || '')}" placeholder="Зона ...">
      </div>
      <div class="os-zone-field">
        <span class="col-label">Всего мест</span>
        <input type="number" class="os-total" min="0" value="${zone.total || 0}">
      </div>
      <div class="os-zone-field">
        <span class="col-label">Занято</span>
        <input type="number" class="os-occupied" min="0" value="${zone.occupied || 0}">
      </div>
      <button class="os-zone-del" type="button" title="Удалить">✕</button>
    `;

    row.querySelector('.os-name').addEventListener('input', updateOsZone);
    row.querySelector('.os-total').addEventListener('input', updateOsZone);
    row.querySelector('.os-occupied').addEventListener('input', updateOsZone);
    row.querySelector('.os-zone-del').addEventListener('click', () => {
      appData.openspace.zones.splice(i, 1);
      renderOpenspaceTab();
    });

    list.appendChild(row);
  });
}

function updateOsZone(e) {
  const row = e.target.closest('.os-zone-row');
  if (!row) return;
  const i = parseInt(row.dataset.index, 10);
  const zones = appData.openspace.zones;
  if (!zones[i]) return;
  zones[i].name = row.querySelector('.os-name').value;
  zones[i].total = parseInt(row.querySelector('.os-total').value, 10) || 0;
  zones[i].occupied = parseInt(row.querySelector('.os-occupied').value, 10) || 0;
}

function escAttr(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wireOsTitle() {
  const os = appData.openspace;
  document.getElementById('osTitle').addEventListener('input', () => { os.title = document.getElementById('osTitle').value; });
  document.getElementById('osSubtitle').addEventListener('input', () => { os.subtitle = document.getElementById('osSubtitle').value; });
  document.getElementById('osTotalPlaces').addEventListener('input', () => {
    os.totalPlaces = parseInt(document.getElementById('osTotalPlaces').value, 10) || 0;
  });
}

function collectOpenspace() {
  if (!appData.openspace || !Array.isArray(appData.openspace.zones)) {
    appData.openspace = defaultOpenspace();
  }
  const tp = document.getElementById('osTotalPlaces');
  if (tp) appData.openspace.totalPlaces = parseInt(tp.value, 10) || 0;
}

function renderAvatars() {
  const grid = document.getElementById('avatarsGrid');
  grid.innerHTML = '';

  appData.leaders.forEach(leader => {
    const card = document.createElement('div');
    card.className = 'avatar-card';

    const avatarContent = leader.avatar
      ? `<img src="${toFileUrl(leader.avatar)}" alt="">`
      : initials(leader.name);

    card.innerHTML = `
      <div class="avatar-circle">${avatarContent}</div>
      <div class="avatar-name">${leader.name}</div>
      <div class="avatar-stat">лиды ${leader.avgLeads} · наборы ${leader.avgSets}</div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary btn-sm" data-action="upload-avatar" data-id="${leader.id}">Загрузить фото</button>
        ${leader.avatar ? `<button class="btn btn-danger btn-sm" data-action="remove-avatar" data-id="${leader.id}">Удалить</button>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('[data-action="upload-avatar"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const filePath = await window.api.pickAvatarSource();
      if (filePath) openCropModal(id, filePath);
    });
  });

  grid.querySelectorAll('[data-action="remove-avatar"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const leader = appData.leaders.find(l => l.id === id);
      if (leader) {
        leader.avatar = '';
        renderAvatars();
        renderLeaders();
      }
    });
  });
}

function loadStylesToUI() {
  const s = appData.settings;
  document.getElementById('styleBgColor').value = s.bgColor;
  document.getElementById('valBgColor').textContent = s.bgColor;
  document.getElementById('styleCardColor').value = s.cardColor;
  document.getElementById('valCardColor').textContent = s.cardColor;
  document.getElementById('styleAccentColor').value = s.accentColor;
  document.getElementById('valAccentColor').textContent = s.accentColor;
  document.getElementById('styleAccentHi').value = s.accentColorHi;
  document.getElementById('valAccentHi').textContent = s.accentColorHi;
  document.getElementById('styleTextColor').value = s.textColor;
  document.getElementById('valTextColor').textContent = s.textColor;
  document.getElementById('styleTextDim').value = s.textDim;
  document.getElementById('valTextDim').textContent = s.textDim;
  document.getElementById('styleGreen').value = s.greenColor;
  document.getElementById('valGreen').textContent = s.greenColor;
  document.getElementById('styleFontFamily').value = s.fontFamily;
  document.getElementById('styleShowCrown').checked = s.showCrown;
  document.getElementById('styleShowLive').checked = s.showLiveBadge;
  const sc = typeof s.previewScale === 'number' ? s.previewScale : 1;
  const scalePct = Math.round(sc * 100);
  document.getElementById('stylePreviewScale').value = scalePct;
  const scaleVal = document.getElementById('valPreviewScale');
  if (scaleVal) scaleVal.textContent = scalePct;

  const bgPrev = document.getElementById('bgPreview');
  const removeBgBtn = document.getElementById('btnRemoveBg');
  if (s.bgImage) {
    bgPrev.innerHTML = `<img src="${toFileUrl(s.bgImage)}" alt="bg">`;
    removeBgBtn.style.display = '';
  } else {
    bgPrev.textContent = 'Нет фона';
    removeBgBtn.style.display = 'none';
  }
}

function loadHeaderToUI() {
  const s = appData.settings;
  document.getElementById('hdrTitle').value = s.title;
  document.getElementById('hdrTitleAccent').value = s.titleAccent;
  document.getElementById('hdrSubtitle').value = s.subtitle;

  const logoPrev = document.getElementById('logoPreview');
  const removeLogoBtn = document.getElementById('btnRemoveLogo');
  if (s.logo) {
    logoPrev.innerHTML = `<img src="${toFileUrl(s.logo)}" alt="logo">`;
    removeLogoBtn.style.display = '';
  } else {
    logoPrev.textContent = 'Нет логотипа';
    removeLogoBtn.style.display = 'none';
  }
}

function collectStyles() {
  appData.settings.bgColor = document.getElementById('styleBgColor').value;
  appData.settings.cardColor = document.getElementById('styleCardColor').value;
  appData.settings.accentColor = document.getElementById('styleAccentColor').value;
  appData.settings.accentColorHi = document.getElementById('styleAccentHi').value;
  appData.settings.textColor = document.getElementById('styleTextColor').value;
  appData.settings.textDim = document.getElementById('styleTextDim').value;
  appData.settings.greenColor = document.getElementById('styleGreen').value;
  appData.settings.fontFamily = document.getElementById('styleFontFamily').value;
  appData.settings.showCrown = document.getElementById('styleShowCrown').checked;
  appData.settings.showLiveBadge = document.getElementById('styleShowLive').checked;
  appData.settings.previewScale = (parseInt(document.getElementById('stylePreviewScale').value, 10) || 100) / 100;
  appData.settings.bgImage = appData.settings.bgImage || '../assets/bg.png';
}

function collectHeader() {
  appData.settings.title = document.getElementById('hdrTitle').value;
  appData.settings.titleAccent = document.getElementById('hdrTitleAccent').value;
  appData.settings.subtitle = document.getElementById('hdrSubtitle').value;
}

async function saveAll() {
  collectStyles();
  collectHeader();
  collectKpi();
  collectOpenspace();
  const ok = await window.api.saveData(appData);
  if (ok) {
    showToast('Данные сохранены!');
  } else {
    showToast('Ошибка сохранения!', true);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  appData = await window.api.loadData();

  renderLeaders();
  renderCallCenters();
  renderKpiTab();
  renderOpenspaceTab();
  loadStylesToUI();
  loadHeaderToUI();

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('btnAddLeader').addEventListener('click', () => {
    appData.leaders.push({
      id: generateId(),
      name: 'Новый лидер',
      dept: '',
      avgLeads: 0,
      avgSets: 0,
      avatar: ''
    });
    renderLeaders();
    showToast('Лидер добавлен');
  });

  document.getElementById('btnSave').addEventListener('click', saveAll);

  document.getElementById('btnPreview').addEventListener('click', async () => {
    await saveAll();
    await window.api.openPreview();
    showToast('Превью открыто');
  });

  document.getElementById('btnAddZone').addEventListener('click', () => {
    if (!Array.isArray(appData.openspace.zones)) appData.openspace.zones = [];
    appData.openspace.zones.push({ name: 'Новая зона', total: 10, occupied: 0 });
    renderOsZones(appData.openspace.zones);
  });

  document.querySelectorAll('#tab-styles input[type="color"]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const valId = 'val' + e.target.id.replace('style', '');
      const valEl = document.getElementById(valId);
      if (valEl) valEl.textContent = e.target.value;
    });
  });

  document.getElementById('stylePreviewScale').addEventListener('input', (e) => {
    const valEl = document.getElementById('valPreviewScale');
    if (valEl) valEl.textContent = e.target.value;
  });

  document.getElementById('btnUploadLogo').addEventListener('click', async () => {
    const filePath = await window.api.uploadLogo();
    if (filePath) {
      appData.settings.logo = filePath;
      loadHeaderToUI();
      showToast('Логотип загружен!');
    }
  });

  document.getElementById('btnRemoveLogo').addEventListener('click', () => {
    appData.settings.logo = '';
    loadHeaderToUI();
  });

  document.getElementById('btnUploadBg').addEventListener('click', async () => {
    const filePath = await window.api.uploadBg();
    if (filePath) {
      appData.settings.bgImage = filePath;
      loadStylesToUI();
      showToast('Фон загружен!');
    }
  });

  document.getElementById('btnRemoveBg').addEventListener('click', () => {
    appData.settings.bgImage = '';
    loadStylesToUI();
  });

  ['kpiTarget', 'kpiFact'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateKpiPercent);
  });

  document.getElementById('btnExport').addEventListener('click', async () => {
    collectStyles();
    collectHeader();
    const ok = await window.api.exportData();
    if (ok) showToast('Данные экспортированы!');
  });

  document.getElementById('btnImport').addEventListener('click', async () => {
    const data = await window.api.importData();
    if (data) {
      appData = data;
      renderLeaders();
      loadStylesToUI();
      loadHeaderToUI();
      showToast('Данные импортированы!');
    } else {
      showToast('Ошибка импорта или отмена', true);
    }
  });

  window.api.onDataUpdated((data) => {
    appData = data;
    renderLeaders();
    renderCallCenters();
    renderKpiTab();
    loadStylesToUI();
    loadHeaderToUI();
  });

  const cropModal = document.getElementById('cropModal');
  const cropStage = document.getElementById('cropStage');
  const cropZoom = document.getElementById('cropZoom');
  const cropImage = document.getElementById('cropImage');

  document.getElementById('cropCloseBtn').addEventListener('click', closeCropModal);
  document.getElementById('cropCancelBtn').addEventListener('click', closeCropModal);
  document.getElementById('cropSaveBtn').addEventListener('click', commitCrop);

  cropZoom.addEventListener('input', (e) => {
    if (!cropState) return;
    const rect = cropStage.getBoundingClientRect();
    updateCropScale(parseFloat(e.target.value), rect.width / 2, rect.height / 2);
  });

  cropStage.addEventListener('pointerdown', (e) => {
    if (!cropState) return;
    cropState.dragging = true;
    cropState.pointerId = e.pointerId;
    cropStage.setPointerCapture(e.pointerId);
    cropState.startX = e.clientX;
    cropState.startY = e.clientY;
    cropState.startPosX = cropState.x;
    cropState.startPosY = cropState.y;
  });

  cropStage.addEventListener('pointermove', (e) => {
    if (!cropState) return;
    if (cropState.dragging && cropState.pointerId === e.pointerId) {
      cropState.x = cropState.startPosX + (e.clientX - cropState.startX);
      cropState.y = cropState.startPosY + (e.clientY - cropState.startY);
      clampCropPosition();
      renderCropImage();
    }
  });

  const endDrag = (e) => {
    if (!cropState || cropState.pointerId !== e.pointerId) return;
    cropState.dragging = false;
    cropState.pointerId = null;
  };

  cropStage.addEventListener('pointerup', endDrag);
  cropStage.addEventListener('pointercancel', endDrag);

  cropStage.addEventListener('wheel', (e) => {
    if (!cropState) return;
    e.preventDefault();
    const rect = cropStage.getBoundingClientRect();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    updateCropScale(cropState.scale + delta, e.clientX - rect.left, e.clientY - rect.top);
    cropZoom.value = String(cropState.scale);
  }, { passive: false });

  cropStage.addEventListener('touchstart', (e) => {
    if (!cropState) return;
    if (e.touches.length === 2) {
      cropState.lastPinchDistance = distanceBetweenTouches(e.touches);
      cropState.lastPinchScale = cropState.scale;
    }
  }, { passive: true });

  cropStage.addEventListener('touchmove', (e) => {
    if (!cropState) return;
    if (e.touches.length === 1 && cropState.dragging) {
      const touch = e.touches[0];
      cropState.x = cropState.startPosX + (touch.clientX - cropState.startX);
      cropState.y = cropState.startPosY + (touch.clientY - cropState.startY);
      clampCropPosition();
      renderCropImage();
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dist = distanceBetweenTouches(e.touches);
      const nextScale = cropState.lastPinchScale * (dist / cropState.lastPinchDistance);
      const rect = cropStage.getBoundingClientRect();
      updateCropScale(nextScale, rect.width / 2, rect.height / 2);
      cropZoom.value = String(cropState.scale);
    }
  }, { passive: false });

  cropStage.addEventListener('touchend', () => {
    if (!cropState) return;
    cropState.dragging = false;
  }, { passive: true });
});
