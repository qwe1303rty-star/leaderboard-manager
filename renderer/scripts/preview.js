const arrowUp = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
const arrowDown = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
const SLIDE_DURATION = 15000;
const SLIDE_DURATIONS = { 4: 30000 }; // слайд 4 (открытый опенспейс) показываем дольше
function slideDuration(slide) { return SLIDE_DURATIONS[slide] || SLIDE_DURATION; }

function toFileUrl(p) {
  if (!p) return p;
  if (/^(https?:|file:|data:)/.test(p)) return p;
  const withSlashes = p.replace(/\\/g, '/');
  const encoded = withSlashes.replace(/ /g, '%20');
  if (/^[a-zA-Z]:/.test(encoded)) return 'file:///' + encoded;
  return encoded;
}

const KPI = {
  target: 900,
  fact: 428,
  monthsToGoal: 15
};
KPI.progress = Math.min((KPI.fact / KPI.target) * 100, 100);

function plural(n) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return 'новых клиентов';
  if (b > 1 && b < 5) return 'новых клиента';
  if (b === 1) return 'новый клиент';
  return 'новых клиентов';
}

function initials(name) {
  return name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
}

function headsetIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 18v-6a9 9 0 1 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>';
}

function chartIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>';
}

function applyStyles(s) {
  const r = document.documentElement.style;
  const stage = document.getElementById('stage');
  if (stage) {
    const sc = typeof s.previewScale === 'number' ? s.previewScale : 1;
    stage.style.transform = sc === 1 ? '' : `scale(${sc})`;
  }
  r.setProperty('--bg', s.bgColor);
  r.setProperty('--bg-card', s.cardColor);
  r.setProperty('--gold', s.accentColor);
  r.setProperty('--gold-hi', s.accentColorHi);
  r.setProperty('--text', s.textColor);
  r.setProperty('--text-dim', s.textDim);
  r.setProperty('--green', s.greenColor);
  r.setProperty('--line', s.cardColor);
  r.setProperty('--line-gold', s.accentColor + '33');
  r.setProperty('--gold-dark', s.accentColor + '88');
  r.setProperty('--red', '#f87171');
  r.setProperty('--bg-card2', '#1b1b1e');
  r.setProperty('--gold-dim', '#a5823f');

  const bgPath = toFileUrl(s.bgImage || '../assets/bg.png');
  document.body.style.backgroundImage = `url('${bgPath}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundColor = s.bgColor;
  document.body.style.fontFamily = s.fontFamily;

  document.querySelectorAll('.deco-stroke').forEach(el => {
    el.setAttribute('stroke', s.accentColor);
  });

  const logoUrl = toFileUrl(s.logo);
  document.getElementById('logoImg').style.display = logoUrl ? '' : 'none';
  if (logoUrl) document.getElementById('logoImg').src = logoUrl;
  document.getElementById('logoImg2').style.display = logoUrl ? '' : 'none';
  if (logoUrl) document.getElementById('logoImg2').src = logoUrl;

  document.getElementById('crownSvg').style.display = s.showCrown ? '' : 'none';
  document.getElementById('liveBadge').style.display = s.showLiveBadge ? '' : 'none';

  const leaderCard = document.getElementById('leaderCard');
  leaderCard.style.background = `linear-gradient(160deg, ${s.accentColor}18, ${s.cardColor} 55%)`;
  leaderCard.style.borderColor = s.accentColor + '33';
  document.getElementById('leaderSep').style.background = `linear-gradient(90deg, transparent, ${s.accentColor}, transparent)`;

  const kcTitle = document.getElementById('kcTitle');
  kcTitle.style.background = `linear-gradient(180deg, ${s.accentColorHi}, ${s.accentColor} 60%, ${s.accentColor})`;
  kcTitle.style.webkitBackgroundClip = 'text';
  kcTitle.style.webkitTextFillColor = 'transparent';
  document.getElementById('kcSubtitle').style.color = s.textDim;

  document.getElementById('brandTitle2').style.color = s.accentColor;

  const datetime2 = document.getElementById('datetime2');
  datetime2.style.borderColor = s.accentColor + '1e';
  const items2 = datetime2.querySelectorAll('.item');
  items2.forEach(item => {
    item.style.color = s.accentColorHi;
    const svg = item.querySelector('svg');
    if (svg) svg.style.stroke = s.accentColor;
  });
  const sep2 = datetime2.querySelector('.sep');
  if (sep2) sep2.style.color = s.accentColor + '88';

  const kcLeaderLabel = document.getElementById('kcLeaderLabel');
  if (kcLeaderLabel) kcLeaderLabel.style.color = s.accentColor;
}

function render(data) {
  const s = data.settings;
  const sorted = data.leaders.slice().sort((a, b) => (b.avgLeads - a.avgLeads) || (b.avgSets - a.avgSets));

  applyStyles(s);

  document.getElementById('titleMain').textContent = s.title;
  document.getElementById('titleAccent').textContent = s.titleAccent;
  document.getElementById('subtitle').textContent = s.subtitle;

  document.getElementById('titleMain').style.color = s.textColor;
  document.getElementById('subtitle').style.color = s.textDim;

  const titleAccent = document.getElementById('titleAccent');
  titleAccent.style.background = `linear-gradient(180deg, ${s.accentColorHi}, ${s.accentColor} 60%, ${s.accentColor})`;
  titleAccent.style.webkitBackgroundClip = 'text';
  titleAccent.style.webkitTextFillColor = 'transparent';

  const brandSpan = document.getElementById('brandTitle');
  brandSpan.style.color = s.accentColor;

  const datetimeEl = document.querySelector('.slide.active .datetime');
  if (datetimeEl) {
    datetimeEl.style.borderColor = s.accentColor + '1e';
    const items = datetimeEl.querySelectorAll('.item');
    items.forEach(item => {
      item.style.color = s.accentColorHi;
      const svg = item.querySelector('svg');
      if (svg) svg.style.stroke = s.accentColor;
    });
    const sepEl = datetimeEl.querySelector('.sep');
    if (sepEl) sepEl.style.color = s.accentColor + '88';
  }

  const board = document.getElementById('board');
  board.innerHTML = '';

  sorted.forEach((e, i) => {
    const avatarHtml = e.avatar
      ? `<div class="avatar"><img src="${toFileUrl(e.avatar)}" alt=""></div>`
      : `<div class="avatar">${initials(e.name)}</div>`;

    const row = document.createElement('div');
    row.className = 'row' + (i === 0 ? ' top1' : '');
    row.style.animationDelay = (i * 0.07) + 's';
    row.style.background = i === 0
      ? `linear-gradient(90deg, ${s.accentColor}1a, ${s.cardColor} 65%)`
      : s.cardColor;
    row.style.borderColor = i === 0 ? s.accentColor + '33' : 'rgba(255,255,255,.08)';

    row.innerHTML =
      `<div class="rank">${i + 1}</div>` +
      avatarHtml +
      `<div class="lb-namewrap"><div class="name" style="color:${s.textColor}">${e.name}</div>${e.dept ? `<div class="lb-dept">${esc(e.dept)}</div>` : ''}</div>` +
      `<div class="lb-num"><span>лиды</span><b style="color:${i === 0 ? s.accentColorHi : s.textColor}">${e.avgLeads}</b></div>` +
      `<div class="lb-num"><span>наборы</span><b style="color:${i === 0 ? s.accentColorHi : s.textColor}">${e.avgSets}</b></div>`;
    board.appendChild(row);
  });

  sorted.forEach((_, i) => {
    const rank = document.querySelector(`#board .row:nth-child(${i + 1}) .rank`);
    if (!rank) return;
    if (i === 0) {
      rank.style.background = `linear-gradient(180deg, ${s.accentColorHi}, ${s.accentColor})`;
      rank.style.color = '#1a1408';
    } else if (i === 1) {
      rank.style.background = 'linear-gradient(180deg, #d9d9d9, #9a9a9a)';
      rank.style.color = '#1a1a1a';
    } else if (i === 2) {
      rank.style.background = 'linear-gradient(180deg, #b07d4f, #7d5427)';
      rank.style.color = '#1a1408';
    } else {
      rank.style.background = 'linear-gradient(180deg, #45454b, #2a2a30)';
      rank.style.color = '#fff';
    }
  });

  fitBoard(board);

  const top = sorted[0];
  if (top) {
    document.getElementById('leaderName').textContent = top.name;
    document.getElementById('leaderName').style.color = s.textColor;
    document.getElementById('leaderNum').textContent = top.avgLeads;
    document.getElementById('leaderNum').style.background = `linear-gradient(180deg, ${s.accentColorHi}, ${s.accentColor} 55%, ${s.accentColor})`;
    document.getElementById('leaderNum').style.webkitBackgroundClip = 'text';
    document.getElementById('leaderNum').style.webkitTextFillColor = 'transparent';
    document.getElementById('leaderSub').textContent = 'среднее кол-во лидов';
    document.getElementById('leaderSub').style.color = s.textDim;
    document.getElementById('leaderSetsNum').textContent = top.avgSets;
    document.getElementById('leaderSetsBlock').style.borderColor = s.accentColor + '33';
    document.getElementById('leaderSetsBlock').style.color = s.accentColorHi;
  }

  const liveBadge = document.getElementById('liveBadge');
  liveBadge.style.borderColor = 'rgba(255,255,255,.1)';
  liveBadge.style.color = s.textDim;
  const liveDot = liveBadge.querySelector('.dot');
  if (liveDot) liveDot.style.backgroundColor = s.greenColor;
  const liveSvg = liveBadge.querySelector('svg');
  if (liveSvg) liveSvg.style.stroke = s.accentColor;

  const leaderLabel = document.querySelector('.leader-label');
  if (leaderLabel) leaderLabel.style.color = s.accentColor;

  renderCallCenters(data);
  renderKpi(data);
  renderOpenspace(data);
}

// равномерно подгоняет список под доступную высоту, чтобы последняя карточка никогда не обрезалась
function fitBoard(board) {
  if (!board) return;
  // сброс предыдущего масштаба и скролла
  board.style.transform = '';
  board.style.overflow = 'auto';
  // измеряем естественную высоту содержимого и доступную высоту контейнера
  const scrollH = board.scrollHeight;
  const clientH = board.clientHeight;
  if (clientH <= 0 || scrollH <= clientH) return; // помещается — оставляем как есть
  const k = clientH / scrollH;
  board.style.transform = 'scale(' + k.toFixed(4) + ')';
  board.style.transformOrigin = 'top center';
  board.style.overflow = 'hidden';
}

function renderCallCenters(data) {
  const s = data.settings;
  const kcs = data.callCenters || [];

  const filterByRank = (arr, prop, rank) => arr.filter((k) => Number(k[prop]) === rank);

  const labels = ['I МЕСТО', 'II МЕСТО', 'III МЕСТО', 'IV МЕСТО'];

  function medalSvg(i) {
    if (i >= 3) return ''; // IV место — без медали
    const medals = [
      { c1: s.accentColorHi, c2: s.accentColor, l1: '#5a471f', l2: '#3c2f14', t: '#1a1408' },
      { c1: '#e8e8e8', c2: '#9a9a9a', l1: '#8a8a8a', l2: '#5c5c5c', t: '#1a1a1a' },
      { c1: '#d79a58', c2: '#8a5a28', l1: '#5f3d1a', l2: '#3d2510', t: '#1a1408' }
    ];
    const m = medals[i];
    return `<svg class="kc-medal" viewBox="0 0 40 48" width="3.4vh" height="4vh" aria-hidden="true">
      <defs>
        <linearGradient id="kcmed${i}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${m.c1}"/><stop offset="1" stop-color="${m.c2}"/>
        </linearGradient>
      </defs>
      <path d="M8 2 H32 L28 22 H12 Z" fill="url(#kcmed${i})" stroke="${m.l1}" stroke-width="2"/>
      <circle cx="20" cy="32" r="12" fill="url(#kcmed${i})" stroke="${m.l1}" stroke-width="2"/>
      <circle cx="20" cy="32" r="8" fill="none" stroke="${m.l2}" stroke-width="2"/>
      <text x="20" y="37" text-anchor="middle" font-size="14" font-weight="bold" fill="${m.t}">${i + 1}</text>
    </svg>`;
  }

  const esc = (t) => String(t == null ? '' : t)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function badges(list, gold) {
    if (!list || !list.length) return '<span class="kc-empty">—</span>';
    return list.map((k) =>
      `<span class="kc-badge${gold ? ' gold' : ''}" style="color:${gold ? '#1a1408' : s.textColor}">${esc(k.name)}</span>`
    ).join('');
  }

  let html = '';
  html += '<div class="kc-cell kc-th place">МЕСТО</div>';
  html += '<div class="kc-cell kc-th">ПО KPI</div>';
  html += '<div class="kc-cell kc-th">ПО ВЫП. ПЛАНА</div>';
  for (let i = 0; i < 4; i++) {
    const rank = i + 1;
    const gold = i === 0;
    html += `<div class="kc-cell kc-tc place${gold ? ' kc-1st' : ''}">${medalSvg(i)}${labels[i]}</div>`;
    html += `<div class="kc-cell kc-tc cell">${badges(filterByRank(kcs, 'kpiRank', rank), gold)}</div>`;
    html += `<div class="kc-cell kc-tc cell">${badges(filterByRank(kcs, 'planRank', rank), gold)}</div>`;
  }

  const table = document.getElementById('kcTable');
  table.innerHTML = html;

  const kcInfoBadge = document.getElementById('kcInfoBadge');
  if (kcInfoBadge) {
    kcInfoBadge.style.color = s.textDim;
    const infoSvg = kcInfoBadge.querySelector('svg');
    if (infoSvg) infoSvg.style.stroke = s.accentColor;
  }
}

function renderKpi(data) {
  const s = data.settings;
  const kpi = data.kpi || KPI;
  const target = kpi.target || KPI.target;
  const fact = kpi.fact || KPI.fact;
  const monthsToGoal = kpi.monthsToGoal || KPI.monthsToGoal;
  const pct = Math.min((fact / target) * 100, 100);
  const pctStr = pct.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '% от цели';

  const kpiTitle = document.getElementById('kpiTitle');
  kpiTitle.style.background = `linear-gradient(180deg, ${s.accentColorHi}, ${s.accentColor} 60%, ${s.accentColor})`;
  kpiTitle.style.webkitBackgroundClip = 'text';
  kpiTitle.style.webkitTextFillColor = 'transparent';
  document.getElementById('kpiSubtitle').style.color = s.textDim;

  document.getElementById('kpiTargetLabel').style.color = s.accentColor;
  const kpiTarget = document.getElementById('kpiTargetValue');
  kpiTarget.textContent = target;
  kpiTarget.style.background = `linear-gradient(180deg, ${s.accentColorHi}, ${s.accentColor})`;
  kpiTarget.style.webkitBackgroundClip = 'text';
  kpiTarget.style.webkitTextFillColor = 'transparent';

  document.getElementById('kpiFactLabel').style.color = s.textDim;
  const kpiFact = document.getElementById('kpiFactValue');
  kpiFact.textContent = fact;
  kpiFact.style.color = s.textColor;

  document.getElementById('kpiDivider').style.background = `linear-gradient(180deg, transparent, ${s.accentColor}55, transparent)`;

  document.getElementById('kpiProgressFill').style.width = pct + '%';
  document.getElementById('kpiProgressLabel').textContent = pctStr;
  document.getElementById('kpiProgressLabel').style.color = s.accentColorHi;

  document.getElementById('kpiTimeLabel').style.color = s.textDim;
  const kpiTimeVal = document.getElementById('kpiTimeValue');
  kpiTimeVal.textContent = monthsToGoal;
  kpiTimeVal.style.background = `linear-gradient(180deg, ${s.accentColorHi}, ${s.accentColor})`;
  kpiTimeVal.style.webkitBackgroundClip = 'text';
  kpiTimeVal.style.webkitTextFillColor = 'transparent';
  document.getElementById('kpiTimeUnit').style.color = s.textDim;

  const logoUrl3 = toFileUrl(s.logo);
  document.getElementById('brandTitle3').style.color = s.accentColor;
  document.getElementById('logoImg3').style.display = logoUrl3 ? '' : 'none';
  if (logoUrl3) document.getElementById('logoImg3').src = logoUrl3;

  const dt3 = document.getElementById('datetime3');
  if (dt3) {
    dt3.style.borderColor = s.accentColor + '1e';
    dt3.querySelectorAll('.item').forEach(item => {
      item.style.color = s.accentColorHi;
      const svg = item.querySelector('svg');
      if (svg) svg.style.stroke = s.accentColor;
    });
    const sep = dt3.querySelector('.sep');
    if (sep) sep.style.color = s.accentColor + '88';
  }

  const lb3 = document.getElementById('liveBadge3');
  if (lb3) {
    lb3.style.borderColor = 'rgba(255,255,255,.1)';
    lb3.style.color = s.textDim;
    const dot = lb3.querySelector('.dot');
    if (dot) dot.style.backgroundColor = s.greenColor;
    const svg = lb3.querySelector('svg');
    if (svg) svg.style.stroke = s.accentColor;
  }
}

const OS_DEFAULT = {
  title: 'ЗАГРУЗКА ОПЕНСПЕЙСА',
  subtitle: 'Занятость рабочих мест по зонам в реальном времени',
  zones: [
    { name: 'Зона А — Продажи',   total: 40, occupied: 37 },
    { name: 'Зона Б — Поддержка', total: 32, occupied: 24 },
    { name: 'Зона В — Аналитика', total: 24, occupied: 12 },
    { name: 'Переговорные',       total: 8,  occupied: 8 }
  ]
};

const osIconDesk = '<svg viewBox="0 0 24 24" fill="none" stroke="url(#gOsGold)" stroke-width="1.6"><path d="M3 18h18M5 18V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10"/><path d="M9 6v3M12 6v3M15 6v3M7 12v2M11 12v2M15 12v2M19 12v2"/></svg>';
const osIconMeet = '<svg viewBox="0 0 24 24" fill="none" stroke="url(#gOsGold)" stroke-width="1.6"><path d="M4 20a8 8 0 0 1 16 0"/><circle cx="12" cy="8" r="4"/><path d="M12 4v.5M12 11.5v.5M4 12l.5.5M19.5 12l.5-.5"/></svg>';

function renderOpenspace(data) {
  const s = data.settings;
  const os = data.openspace || {};
  const zones = Array.isArray(os.zones) && os.zones.length ? os.zones : OS_DEFAULT.zones;

  const osTitle = document.getElementById('osTitle');
  osTitle.textContent = os.title || OS_DEFAULT.title;
  osTitle.style.background = `linear-gradient(180deg, ${s.accentColorHi}, ${s.accentColor} 60%, ${s.accentColor})`;
  osTitle.style.webkitBackgroundClip = 'text';
  osTitle.style.webkitTextFillColor = 'transparent';
  const osSubtitle = document.getElementById('osSubtitle');
  osSubtitle.textContent = os.subtitle || OS_DEFAULT.subtitle;
  osSubtitle.style.color = s.textDim;

  const logoUrl4 = toFileUrl(s.logo);
  document.getElementById('brandTitle4').style.color = s.accentColor;
  document.getElementById('logoImg4').style.display = logoUrl4 ? '' : 'none';
  if (logoUrl4) document.getElementById('logoImg4').src = logoUrl4;

  const dt4 = document.getElementById('datetime4');
  if (dt4) {
    dt4.style.borderColor = s.accentColor + '1e';
    dt4.querySelectorAll('.item').forEach(item => {
      item.style.color = s.accentColorHi;
      const svg = item.querySelector('svg');
      if (svg) svg.style.stroke = s.accentColor;
    });
    const sep = dt4.querySelector('.sep');
    if (sep) sep.style.color = s.accentColor + '88';
  }

  const lb4 = document.getElementById('liveBadge4');
  if (lb4) {
    lb4.style.borderColor = 'rgba(255,255,255,.1)';
    lb4.style.color = s.textDim;
    const dot = lb4.querySelector('.dot');
    if (dot) dot.style.backgroundColor = s.greenColor;
    const svg = lb4.querySelector('svg');
    if (svg) svg.style.stroke = s.accentColor;
  }

  const container = document.getElementById('osZones');
  const osPrevScroll = container.scrollTop; // сохраняем прокрутку на время обновления данных (без мерцания/скачков)

  let sumTotal = 0;
  let sumOcc = 0;

  zones.forEach((z, i) => {
    const total = z.total || 0;
    const occ = Math.min(z.occupied || 0, total);
    const pct = total > 0 ? (occ / total) * 100 : 0;
    sumTotal += total;
    sumOcc += occ;

    let statusClass = '';
    let statusTxt = '';
    if (total - occ >= 1) { statusTxt = 'Есть места'; }
    else { statusClass = 'full'; statusTxt = 'Мест нет'; }

    let row = container.children[i];
    if (!row) {
      // новая карточка — создаём (только для неё анимация появления)
      row = document.createElement('div');
      row.className = 'os-zone';
      row.style.animationDelay = (i * 0.1) + 's';
      row.innerHTML =
        '<div class="os-zone-icon"></div>' +
        '<div class="os-zone-info"><div class="os-zname"></div><div class="os-zmeta"></div></div>' +
        '<div class="os-zone-stat"><div class="os-pct"></div><div class="os-occ"></div><div class="os-status"></div></div>';
      const barWrap = document.createElement('div');
      barWrap.className = 'os-zone-bar-bg';
      barWrap.appendChild(document.createElement('div'));
      row.children[1].appendChild(barWrap);
      container.appendChild(row);
    }
    // для существующих карточек данные просто обновляются на месте — без пересоздания и без мерцания/повтора анимации
    row.style.background = s.cardColor + 'cc';
    row.style.borderColor = (total > 0 && occ >= total) ? '#5a2626' : s.accentColor + '2a';
    row.children[0].innerHTML = (/перегов|meet|соvок|каб/i.test(z.name || '') ? osIconMeet : osIconDesk);
    row.children[1].children[0].innerHTML = esc(z.name);
    row.children[1].children[0].style.color = s.textColor;
    row.children[1].children[1].innerHTML = 'Свободно <b style="color:' + s.greenColor + '">' + (total - occ) + '</b> из ' + total + ' мест';
    row.children[2].children[0].textContent = pct.toFixed(0) + '%';
    row.children[2].children[0].className = 'os-pct' + (statusClass === 'full' ? ' full' : '');
    row.children[2].children[1].textContent = occ + ' / ' + total;
    row.children[2].children[2].textContent = statusTxt;
    row.children[2].children[2].className = 'os-status' + (statusClass ? ' ' + statusClass : '');
    const barWrapEl = row.children[1].children[2];
    const barEl = barWrapEl.children[0];
    barEl.className = 'os-zone-bar' + (statusClass === 'full' ? ' full' : '');
    barEl.style.width = pct + '%';
  });

  // удаляем лишние карточки, которых больше нет среди отделов
  while (container.children.length > zones.length) {
    container.removeChild(container.lastChild);
  }

  container.scrollTop = osPrevScroll; // восстанавливаем прокрутку

  const totalPlaces = (os.totalPlaces && os.totalPlaces > 0) ? os.totalPlaces : sumTotal;
  const totalPct = totalPlaces > 0 ? Math.round((sumOcc / totalPlaces) * 100) : 0;

  const fill = document.getElementById('osGaugeFill');
  if (fill) {
    fill.setAttribute('stroke-dasharray', '552.9');
    fill.setAttribute('stroke-dashoffset', String(552.9 * (1 - (totalPct / 100))));
  }
  const pctEl = document.getElementById('osTotalPct');
  if (pctEl) pctEl.textContent = totalPct + '%';

  document.getElementById('osStTotal').textContent = totalPlaces;
  document.getElementById('osStOcc').textContent = sumOcc;
  document.getElementById('osStFree').textContent = Math.max(totalPlaces - sumOcc, 0);

  startOsAutoScroll(container);
}

const OS_SCROLL_SPEED = 50;   // px/сек — небыстрая плавная прокрутка
const OS_EDGE_DWELL_MS = 3000; // пауза в начале (первый отдел) и в конце (последний отдел)

let osScrollRAF = null;
let osScrollPos = 0;
let osScrollPass = 0;       // 0 = едем вниз, 1 = едем вверх
let osScrollDone = false;   // true после одного прохода вниз+вверх
let osScrollIdleUntil = 0;
let osScrollPauseUntil = 0;
let osScrollEl = null;

function osScrollStart(scrollEl) {
  osScrollEl = scrollEl;
  osScrollPos = 0;
  osScrollPass = 0;
  osScrollDone = false;
  osScrollIdleUntil = Date.now() + OS_EDGE_DWELL_MS;
  scrollEl.scrollTop = 0;
}

function osScrollFrame() {
  const wrap = osScrollEl;
  if (!wrap) return;
  const maxScroll = wrap.scrollHeight - wrap.clientHeight;
  if (maxScroll <= 1) {
    osScrollRAF = requestAnimationFrame(osScrollFrame);
    return;
  }

  if (osScrollDone) {
    osScrollRAF = requestAnimationFrame(osScrollFrame);
    return;
  }

  const now = Date.now();
  if (now < osScrollPauseUntil || now < osScrollIdleUntil) {
    // стоим: ручная пауза или пауза у края списка (читать первый/последний отделы)
    osScrollRAF = requestAnimationFrame(osScrollFrame);
    return;
  }

  const step = OS_SCROLL_SPEED / 60; // px за кадр (~60fps)

  if (osScrollPass === 0) {
    // едем вниз к последнему отделу
    osScrollPos += step;
    if (osScrollPos >= maxScroll) {
      osScrollPos = maxScroll;
      osScrollPass = 1;
      osScrollIdleUntil = now + OS_EDGE_DWELL_MS;
    }
  } else {
    // возвращаемся вверх, после верха — конец (один проход)
    osScrollPos -= step;
    if (osScrollPos <= 0) {
      osScrollPos = 0;
      osScrollDone = true;
      osScrollIdleUntil = now + OS_EDGE_DWELL_MS;
    }
  }

  wrap.scrollTop = osScrollPos;
  osScrollRAF = requestAnimationFrame(osScrollFrame);
}

function startOsAutoScroll(wrap) {
  if (!wrap) return;
  if (osScrollEl !== wrap) {
    if (osScrollEl) {
      osScrollEl.removeEventListener('wheel', osScrollInterrupt);
      osScrollEl.removeEventListener('touchstart', osScrollInterrupt);
      osScrollEl.removeEventListener('mousedown', osScrollInterrupt);
    }
    osScrollEl = wrap;
    wrap.addEventListener('wheel', osScrollInterrupt, { passive: true });
    wrap.addEventListener('touchstart', osScrollInterrupt, { passive: true });
    wrap.addEventListener('mousedown', osScrollInterrupt);
    osScrollStart(wrap);
    if (osScrollRAF) cancelAnimationFrame(osScrollRAF);
    osScrollRAF = requestAnimationFrame(osScrollFrame);
  } else if (!osScrollRAF) {
    // данные обновились, слайд активен: не сбрасываем на топ (иначе мерцание),
    // просто обеспечиваем работу цикла
    osScrollRAF = requestAnimationFrame(osScrollFrame);
  }
}

function osScrollInterrupt() {
  osScrollPauseUntil = Date.now() + 4000;
}

function esc(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tickClock() {
  const now = new Date();
  const months = ['ЯНВАРЯ','ФЕВРАЛЯ','МАРТА','АПРЕЛЯ','МАЯ','ИЮНЯ','ИЮЛЯ','АВГУСТА','СЕНТЯБРЯ','ОКТЯБРЯ','НОЯБРЯ','ДЕКАБРЯ'];
  const dateStr = now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  document.getElementById('dateNow').textContent = dateStr;
  document.getElementById('timeNow').textContent = timeStr;
  document.getElementById('dateNow2').textContent = dateStr;
  document.getElementById('timeNow2').textContent = timeStr;

  const dateNow3 = document.getElementById('dateNow3');
  if (dateNow3) dateNow3.textContent = dateStr;
  const timeNow3 = document.getElementById('timeNow3');
  if (timeNow3) timeNow3.textContent = timeStr;

  const dateNow4 = document.getElementById('dateNow4');
  if (dateNow4) dateNow4.textContent = dateStr;
  const timeNow4 = document.getElementById('timeNow4');
  if (timeNow4) timeNow4.textContent = timeStr;

  const kcUpdateTime = document.getElementById('kcUpdateTime');
  if (kcUpdateTime) kcUpdateTime.textContent = timeStr;

  const osUpdTime = document.getElementById('osUpdTime');
  if (osUpdTime) osUpdTime.textContent = timeStr;
}

async function loadData() {
  const data = await window.api.loadData();
  render(data);
}

let currentSlide = 1;
let slideRAF = null;
let slideStartTime = 0;
const TOTAL_SLIDES = 4;

function rotateSlides() {
  currentSlide = currentSlide >= TOTAL_SLIDES ? 1 : currentSlide + 1;
  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    document.getElementById('slide' + i).classList.toggle('active', currentSlide === i);
  }
  // как только слайд опенспейса показан — сбросить список к верху, пауза 3 c, потом один проход вниз+вверх
  if (currentSlide === 4 && osScrollEl) {
    osScrollStart(osScrollEl);
  }
}

function startSlideTimer() {
  cancelSlideTimer();
  slideStartTime = performance.now();

  const fills = [
    document.getElementById('slideProgressFill1'),
    document.getElementById('slideProgressFill2'),
    document.getElementById('slideProgressFill3'),
    document.getElementById('slideProgressFill4')
  ];
  fills.forEach(f => { if (f) f.style.width = '0%'; });

  function animate(now) {
    const elapsed = now - slideStartTime;
    const dur = slideDuration(currentSlide);
    const progress = Math.min(elapsed / dur, 1);

    const activeFill = fills[currentSlide - 1];
    if (activeFill) activeFill.style.width = (progress * 100) + '%';

    if (progress < 1) {
      slideRAF = requestAnimationFrame(animate);
    } else {
      rotateSlides();
      startSlideTimer();
    }
  }

  slideRAF = requestAnimationFrame(animate);
}

function cancelSlideTimer() {
  if (slideRAF) {
    cancelAnimationFrame(slideRAF);
    slideRAF = null;
  }
}

loadData();
tickClock();
setInterval(tickClock, 1000);
setInterval(loadData, 30000);
startSlideTimer();

window.api.onDataUpdated((data) => {
  render(data);
});
