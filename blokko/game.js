/* Blokko – colorful block puzzle. Vanilla JS, no dependencies. */
(() => {
'use strict';

// ---------- i18n ----------
const STR = {
  tr: {
    play:'Oyna', cont:'Devam Et', daily:'Günün Bulmacası', how:'Nasıl Oynanır?', privacy:'Gizlilik', best:'En İyi',
    paused:'Duraklatıldı', resume:'Devam Et', restart:'Yeniden Başla', home:'Ana Menü',
    noMoves:'Yer kalmadı!', score:'Puan', newBest:'Yeni Rekor! 🎉', rescue:'Yeni Parçalar (1 kez)', again:'Tekrar Oyna',
    settings:'Ayarlar', sound:'Ses', haptics:'Titreşim', language:'Dil', theme:'Tema', ok:'Tamam',
    how1:'Alttaki parçaları sürükleyip tahtaya bırak.', how2:'Bir satırı ya da sütunu tamamen doldur: patlasın!',
    how3:'Art arda patlatarak kombo yap, puanı katla.', how4:'Hiçbir parça sığmazsa oyun biter. Acele yok, süre yok!',
    gotIt:'Anladım!', combo:'Kombo', allClear:'Tertemiz!', goal:'Hedef', goalDone:'Hedef tamam! ⭐', dailyDone:'tamamlandı ⭐',
    praise:['Güzel!','Harika!','Süper!','Muhteşem!','İnanılmaz!','Efsane!'],
    months:['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'],
  },
  en: {
    play:'Play', cont:'Continue', daily:'Daily Puzzle', how:'How to Play', privacy:'Privacy', best:'Best',
    paused:'Paused', resume:'Resume', restart:'Restart', home:'Main Menu',
    noMoves:'No space left!', score:'Score', newBest:'New Record! 🎉', rescue:'New Pieces (once)', again:'Play Again',
    settings:'Settings', sound:'Sound', haptics:'Vibration', language:'Language', theme:'Theme', ok:'OK',
    how1:'Drag the pieces below onto the board.', how2:'Fill a whole row or column to pop it!',
    how3:'Pop lines in a row for combos and multiply your score.', how4:'The game ends when no piece fits. No rush, no timer!',
    gotIt:'Got it!', combo:'Combo', allClear:'All Clear!', goal:'Goal', goalDone:'Goal reached! ⭐', dailyDone:'done ⭐',
    praise:['Nice!','Great!','Super!','Amazing!','Incredible!','Legendary!'],
    months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  }
};

// ---------- persistence ----------
const KEY = 'blokko.v1';
const store = (() => {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  const lang0 = (navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  d.settings = Object.assign({ sound: true, haptic: true, lang: lang0, theme: 'candy', seenHow: false }, d.settings);
  d.best = d.best || 0;
  d.daily = d.daily || {};
  return d;
})();
function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
const S = store.settings;
const t = k => STR[S.lang][k] ?? STR.en[k];

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const screens = { menu: $('menu'), game: $('game') };
function showScreen(n) { for (const k in screens) screens[k].classList.toggle('active', k === n); if (n === 'game') resize(); }
function overlay(id, on) { $(id).classList.toggle('show', on); }

// preload mascot poses so mood swaps never flash
for (const n of ['wave', 'jump', 'wow', 'sad']) { const im = new Image(); im.src = `assets/mascot-${n}.png`; }
function mascot(mood, ms = 900) {
  const m = $('gameMascot');
  m.classList.remove('happy', 'wow', 'sad'); void m.offsetWidth;
  if (mood) { m.classList.add(mood); clearTimeout(mascot.tm); if (ms) mascot.tm = setTimeout(() => m.classList.remove(mood), ms); }
}

function applyI18n() {
  document.documentElement.lang = S.lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  refreshMenu();
}
function applyTheme() { document.body.dataset.theme = S.theme; }

// ---------- audio ----------
let AC = null;
function audio() {
  if (!S.sound) return null;
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, dur = 0.12, type = 'sine', vol = 0.18, when = 0, slide = 0) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
const sfx = {
  pick() { tone(660, 0.06, 'triangle', 0.12); },
  place() { tone(330, 0.09, 'sine', 0.22, 0, 1.6); tone(990, 0.05, 'triangle', 0.06, 0.02); },
  bad() { tone(160, 0.14, 'sine', 0.15, 0, 0.7); },
  clear(n, combo) {
    const base = [523, 587, 659, 784, 880, 1047][Math.min(combo, 5)];
    const steps = Math.min(3 + n, 7);
    for (let i = 0; i < steps; i++) tone(base * Math.pow(1.122, i * 2), 0.16, 'triangle', 0.13, i * 0.055);
    tone(base * 2, 0.4, 'sine', 0.06, steps * 0.055);
  },
  over() { [523, 440, 349, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.14, i * 0.16)); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.13, i * 0.08)); },
};
function haptic(kind = 'light') {
  if (!S.haptic) return;
  const H = window.Capacitor?.Plugins?.Haptics;
  if (H) { H.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }).catch(() => {}); return; }
  if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 40 : kind === 'medium' ? 20 : 8);
}

// ---------- RNG ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
let rnd = Math.random;

// ---------- pieces ----------
const N = 8;
const COLORS = ['#ff5c7a', '#ff9f43', '#ffd43b', '#3ddc97', '#4cc9f0', '#5b7cfa', '#a66cff'];
function norm(cells) {
  const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
function rotations(cells, mirror) {
  const out = [], seen = new Set();
  let variants = [cells];
  if (mirror) variants.push(cells.map(([x, y]) => [-x, y]));
  for (let v of variants) for (let r = 0; r < 4; r++) {
    v = v.map(([x, y]) => [-y, x]);
    const n = norm(v), k = JSON.stringify(n);
    if (!seen.has(k)) { seen.add(k); out.push(n); }
  }
  return out;
}
// [cells, weight, mirror, minLevel(score)]
const BASE = [
  [[[0, 0]], 3],
  [[[0, 0], [1, 0]], 4],
  [[[0, 0], [1, 0], [2, 0]], 4],
  [[[0, 0], [1, 0], [2, 0], [3, 0]], 3],
  [[[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], 2],
  [[[0, 0], [1, 0], [0, 1], [1, 1]], 4],
  [[[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], 1.4],
  [[[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], 1.6],
  [[[0, 0], [0, 1], [1, 1]], 4],
  [[[0, 0], [0, 1], [0, 2], [1, 2]], 3, true],
  [[[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], 2],
  [[[0, 0], [1, 0], [2, 0], [1, 1]], 2.5],
  [[[1, 0], [2, 0], [0, 1], [1, 1]], 2, true],
  [[[0, 0], [1, 1]], 1.2],
];
const SHAPES = [];
for (const [cells, w, mir] of BASE) {
  const rs = rotations(cells, mir);
  for (const r of rs) SHAPES.push({ cells: r, w: w / rs.length, size: r.length,
    pw: Math.max(...r.map(c => c[0])) + 1, ph: Math.max(...r.map(c => c[1])) + 1 });
}
const TOTAL_W = SHAPES.reduce((s, p) => s + p.w, 0);
function randomShape(small) {
  const pool = small ? SHAPES.filter(s => s.size <= 3) : SHAPES;
  const tw = small ? pool.reduce((s, p) => s + p.w, 0) : TOTAL_W;
  let r = rnd() * tw;
  for (const s of pool) { if ((r -= s.w) <= 0) return s; }
  return pool[pool.length - 1];
}
function makePiece(shape) { return { shape, color: Math.floor(rnd() * COLORS.length) }; }

// ---------- game state ----------
let G = null; // {board, tray, score, combo, miss, mode, date, goal, goalHit, rescued, over}
const newBoard = () => Array.from({ length: N }, () => Array(N).fill(-1));

function canPlace(board, shape, gx, gy) {
  for (const [x, y] of shape.cells) {
    const X = gx + x, Y = gy + y;
    if (X < 0 || Y < 0 || X >= N || Y >= N || board[Y][X] >= 0) return false;
  }
  return true;
}
function fitsAnywhere(board, shape) {
  for (let y = 0; y <= N - shape.ph; y++) for (let x = 0; x <= N - shape.pw; x++) if (canPlace(board, shape, x, y)) return true;
  return false;
}
function fillTray() {
  // Fair-ish generator: try to give a set where at least one piece fits; earlier in game be kinder.
  let best = null;
  for (let tries = 0; tries < 30; tries++) {
    const set = [0, 1, 2].map(() => makePiece(randomShape(false)));
    const fits = set.filter(p => fitsAnywhere(G.board, p.shape)).length;
    if (!best || fits > best.fits) best = { set, fits };
    if (fits >= 2 || (fits >= 1 && tries > 8)) break;
  }
  G.tray = best.set;
}
function newGame(mode = 'classic') {
  const today = dayKey();
  rnd = mode === 'daily' ? mulberry32(hash(today)) : Math.random;
  G = { board: newBoard(), tray: [], score: 0, shown: 0, combo: 0, miss: 0, mode, date: today, goal: 0, goalHit: false, rescued: false, over: false };
  if (mode === 'daily') {
    // Symmetric starter pattern, never a full line.
    for (let i = 0; i < 7; i++) {
      const x = Math.floor(rnd() * 4), y = Math.floor(rnd() * N), c = Math.floor(rnd() * COLORS.length);
      G.board[y][x] = c; G.board[y][N - 1 - x] = c;
    }
    G.goal = 1000 + Math.floor(rnd() * 6) * 100;
  }
  fillTray();
  save();
}
function save() {
  if (!G) return;
  if (G.over) { delete store.save; } else {
    store.save = { board: G.board, tray: G.tray.map(p => p && { i: SHAPES.indexOf(p.shape), c: p.color }), score: G.score, combo: G.combo, miss: G.miss,
      mode: G.mode, date: G.date, goal: G.goal, goalHit: G.goalHit, rescued: G.rescued };
  }
  persist();
}
function load() {
  const s = store.save; if (!s) return false;
  if (s.mode === 'daily' && s.date !== dayKey()) { delete store.save; return false; }
  G = Object.assign({}, s, { shown: s.score, over: false, tray: s.tray.map(p => p && { shape: SHAPES[p.i], color: p.c }) });
  rnd = s.mode === 'daily' ? mulberry32(hash(s.date) ^ s.score) : Math.random;
  return true;
}
function dayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---------- layout & sprites ----------
let W = 0, H = 0, DPR = 1, cell = 40, bx = 0, by = 0, bs = 320, trayY = 0, trayH = 0;
const spriteCache = new Map();
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  const r = cv.getBoundingClientRect();
  W = r.width; H = r.height;
  if (!W || !H) return;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cell = Math.floor(Math.min((W - 28) / N, (H - 16) / (N + 4.4)));
  bs = cell * N; bx = Math.round((W - bs) / 2);
  const total = bs + cell * 4.4;
  by = Math.round(Math.max(8, (H - total) * 0.4));
  trayY = by + bs + cell * 0.4; trayH = Math.max(cell * 4, Math.min(H - trayY - 8, cell * 5.5));
  spriteCache.clear();
}
window.addEventListener('resize', resize);

function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function sprite(ci, s) {
  const k = ci + ':' + s; let sp = spriteCache.get(k); if (sp) return sp;
  const px = Math.ceil(s * DPR);
  sp = document.createElement('canvas'); sp.width = sp.height = px;
  const c = sp.getContext('2d'); c.scale(DPR, DPR);
  const col = COLORS[ci], pad = s * 0.04, w = s - pad * 2, r = s * 0.24;
  // base
  rr(c, pad, pad, w, w, r); c.fillStyle = shade(col, -0.28); c.fill();
  // body
  const g = c.createLinearGradient(0, pad, 0, pad + w);
  g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.08));
  rr(c, pad, pad, w, w - s * 0.09, r); c.fillStyle = g; c.fill();
  // gloss
  c.globalAlpha = 0.55; rr(c, pad + w * 0.14, pad + w * 0.1, w * 0.72, w * 0.26, w * 0.13); c.fillStyle = '#fff'; c.fill();
  c.globalAlpha = 0.9; c.beginPath(); c.arc(pad + w * 0.24, pad + w * 0.22, w * 0.06, 0, 7); c.fill();
  c.globalAlpha = 1;
  spriteCache.set(k, sp); return sp;
}
function drawBlock(ci, x, y, s, alpha = 1, scale = 1) {
  const sp = sprite(ci, s);
  ctx.globalAlpha = alpha;
  if (scale !== 1) { const d = s * (1 - scale) / 2; ctx.drawImage(sp, x + d, y + d, s * scale, s * scale); }
  else ctx.drawImage(sp, x, y, s, s);
  ctx.globalAlpha = 1;
}

// ---------- effects ----------
const parts = [], floats = [], clearing = [];
let shake = 0;
function burst(x, y, ci, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = rnd2() * Math.PI * 2, v = 1.5 + rnd2() * 5;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, c: COLORS[ci], s: cell * (0.12 + rnd2() * 0.18), star: rnd2() < 0.3 });
  }
}
function rnd2() { return Math.random(); } // visual randomness never consumes the seeded stream
function toast(text) { const el = $('toast'); el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

// ---------- input ----------
let drag = null; // {i, piece, x, y, lift, gx, gy, ok}
function trayRect(i) { const w = W / 3; return { x: w * i, y: trayY, w, h: trayH }; }
function pos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
cv.addEventListener('pointerdown', e => {
  if (!G || G.over || drag) return;
  const p = pos(e);
  if (p.y < trayY - cell * 0.3) return;
  const i = Math.min(2, Math.max(0, Math.floor(p.x / (W / 3))));
  const piece = G.tray[i]; if (!piece) return;
  audio();
  cv.setPointerCapture(e.pointerId);
  drag = { i, piece, x: p.x, y: p.y, lift: e.pointerType === 'mouse' ? cell * 0.4 : cell * 2.2, gx: 0, gy: 0, ok: false, t: 0 };
  sfx.pick(); haptic('light'); updateDrag(p);
});
cv.addEventListener('pointermove', e => { if (drag) updateDrag(pos(e)); });
cv.addEventListener('pointerup', e => { if (drag) { updateDrag(pos(e)); drop(); } });
cv.addEventListener('pointercancel', () => { drag = null; });

function updateDrag(p) {
  drag.x = p.x; drag.y = p.y;
  const sh = drag.piece.shape;
  const left = p.x - sh.pw * cell / 2, top = p.y - drag.lift - sh.ph * cell / 2;
  drag.gx = Math.round((left - bx) / cell); drag.gy = Math.round((top - by) / cell);
  drag.ok = canPlace(G.board, sh, drag.gx, drag.gy);
  drag.lines = drag.ok ? linesIf(sh, drag.gx, drag.gy) : null;
}
function linesIf(sh, gx, gy) {
  const b = G.board.map(r => r.slice());
  for (const [x, y] of sh.cells) b[gy + y][gx + x] = 1;
  const rows = [], cols = [];
  for (let i = 0; i < N; i++) { if (b[i].every(v => v >= 0)) rows.push(i); if (b.every(r => r[i] >= 0)) cols.push(i); }
  return { rows, cols };
}
function drop() {
  const d = drag; drag = null;
  if (!d.ok) { sfx.bad(); return; }
  const sh = d.piece.shape;
  for (const [x, y] of sh.cells) G.board[d.gy + y][d.gx + x] = d.piece.color;
  G.tray[d.i] = null;
  G.placedAt = performance.now(); G.placedCells = sh.cells.map(([x, y]) => [d.gx + x, d.gy + y]);
  let gained = sh.size;
  sfx.place(); haptic('light');

  const { rows, cols } = d.lines;
  const n = rows.length + cols.length;
  if (n) {
    G.combo += 1; G.miss = 0;
    const table = [0, 10, 30, 60, 100, 150, 210, 280];
    let pts = table[Math.min(n, 7)] * G.combo;
    const cells = new Map();
    for (const r of rows) for (let x = 0; x < N; x++) cells.set(r * N + x, [x, r]);
    for (const c of cols) for (let y = 0; y < N; y++) cells.set(y * N + c, [c, y]);
    const now = performance.now(); let k = 0;
    // stagger outward from the dropped piece
    const cx = d.gx + sh.pw / 2, cy = d.gy + sh.ph / 2;
    const list = [...cells.values()].sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
    for (const [x, y] of list) {
      clearing.push({ x, y, c: G.board[y][x], t0: now + (k++) * 14 });
      G.board[y][x] = -1;
    }
    if (G.board.every(r => r.every(v => v < 0))) { pts += 300; setTimeout(() => toast(t('allClear') + ' +300'), 250); }
    gained += pts;
    floats.push({ x: bx + (d.gx + sh.pw / 2) * cell, y: by + (d.gy + sh.ph / 2) * cell, text: '+' + pts, life: 1 });
    sfx.clear(n, G.combo - 1); haptic(n >= 2 ? 'heavy' : 'medium');
    shake = Math.min(14, 4 + n * 3);
    const praise = t('praise');
    if (G.combo >= 2) toast(`${t('combo')} x${G.combo}`);
    else if (n >= 2) toast(praise[Math.min(n - 1, praise.length - 1)]);
    mascot(G.combo >= 2 || n >= 2 ? 'wow' : 'happy');
  } else {
    G.miss += 1; if (G.miss >= 3) G.combo = 0;
  }
  G.score += gained;
  bumpScore();
  if (G.mode === 'daily' && !G.goalHit && G.score >= G.goal) {
    G.goalHit = true; store.daily[G.date] = Object.assign(store.daily[G.date] || {}, { done: true });
    setTimeout(() => { toast(t('goalDone')); sfx.win(); haptic('heavy'); }, 500);
  }
  if (G.tray.every(p => !p)) fillTray();
  updateModeTag();
  if (!G.tray.some(p => p && fitsAnywhere(G.board, p.shape))) gameOver();
  save();
}
function bumpScore() {
  const el = $('score'); el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 150);
}

function gameOver() {
  G.over = true;
  setTimeout(() => {
    sfx.over(); haptic('heavy');
    let isBest = false;
    if (G.mode === 'classic' && G.score > store.best) { store.best = G.score; isBest = true; }
    if (G.mode === 'daily') {
      const rec = store.daily[G.date] || {};
      if (!rec.best || G.score > rec.best) { rec.best = G.score; isBest = G.score > 0; }
      store.daily[G.date] = rec;
    }
    $('finalScore').textContent = G.score;
    $('newBest').classList.toggle('show', isBest);
    $('btnRescue').style.display = G.rescued ? 'none' : '';
    overlay('ovOver', true);
    save(); refreshMenu();
  }, 650);
}
function rescue() {
  G.rescued = true; G.over = false;
  const set = [];
  for (let tries = 0; set.length < 3 && tries < 200; tries++) {
    const p = makePiece(randomShape(true));
    if (fitsAnywhere(G.board, p.shape)) set.push(p);
  }
  while (set.length < 3) set.push(makePiece(SHAPES[0]));
  G.tray = set;
  overlay('ovOver', false); save(); mascot('happy');
}

// ---------- render ----------
function render(now) {
  requestAnimationFrame(render);
  if (!screens.game.classList.contains('active') || !G || !W) return;
  // score count-up
  if (G.shown < G.score) { G.shown += Math.max(1, Math.ceil((G.score - G.shown) * 0.18)); $('score').textContent = G.shown; }
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (shake > 0.2) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.85; }

  // board panel
  const pad = cell * 0.18;
  rr(ctx, bx - pad, by - pad, bs + pad * 2, bs + pad * 2, cell * 0.45);
  ctx.fillStyle = 'rgba(40,10,80,.28)'; ctx.fill();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    rr(ctx, bx + x * cell + cell * 0.06, by + y * cell + cell * 0.06, cell * 0.88, cell * 0.88, cell * 0.2);
    ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.fill();
  }

  // preview lines get recoloured to the dragged piece colour
  let hl = null;
  if (drag && drag.ok && drag.lines && (drag.lines.rows.length || drag.lines.cols.length)) hl = drag.lines;
  const pulse = 0.75 + 0.25 * Math.sin(now / 90);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = G.board[y][x]; if (v < 0) continue;
    let ci = v, sc = 1;
    if (hl && (hl.rows.includes(y) || hl.cols.includes(x))) ci = drag.piece.color;
    if (G.placedCells && now - G.placedAt < 180 && G.placedCells.some(c => c[0] === x && c[1] === y)) sc = 1.12 - 0.12 * (now - G.placedAt) / 180;
    drawBlock(ci, bx + x * cell, by + y * cell, cell, 1, sc);
  }
  // ghost
  if (drag && drag.ok) {
    for (const [x, y] of drag.piece.shape.cells) drawBlock(drag.piece.color, bx + (drag.gx + x) * cell, by + (drag.gy + y) * cell, cell, 0.35);
    if (hl) {
      ctx.globalAlpha = 0.18 * pulse; ctx.fillStyle = '#fff';
      for (const r of hl.rows) ctx.fillRect(bx, by + r * cell, bs, cell);
      for (const c of hl.cols) ctx.fillRect(bx + c * cell, by, cell, bs);
      ctx.globalAlpha = 1;
    }
  }
  // clearing animation
  for (let i = clearing.length - 1; i >= 0; i--) {
    const c = clearing[i], k = (now - c.t0) / 260;
    if (k < 0) { drawBlock(c.c, bx + c.x * cell, by + c.y * cell, cell); continue; }
    if (k >= 1) { clearing.splice(i, 1); continue; }
    if (!c.burst) { c.burst = true; burst(bx + (c.x + 0.5) * cell, by + (c.y + 0.5) * cell, c.c, 5); }
    const sc = k < 0.3 ? 1 + k : 1.3 * (1 - (k - 0.3) / 0.7);
    drawBlock(c.c, bx + c.x * cell, by + c.y * cell, cell, 1 - k * 0.6, Math.max(0.01, sc));
    ctx.globalAlpha = (1 - k) * 0.7; ctx.fillStyle = '#fff';
    rr(ctx, bx + c.x * cell + 2, by + c.y * cell + 2, cell - 4, cell - 4, cell * 0.2); ctx.fill(); ctx.globalAlpha = 1;
  }

  // tray
  for (let i = 0; i < 3; i++) {
    const p = G.tray[i]; if (!p || (drag && drag.i === i)) continue;
    const r = trayRect(i), s = Math.min(cell * 0.8, (r.w - 14) / Math.max(p.shape.pw, 3), (r.h - 10) / Math.max(p.shape.ph, 3));
    const fits = fitsAnywhere(G.board, p.shape);
    const ox = r.x + (r.w - p.shape.pw * s) / 2, oy = r.y + (r.h - p.shape.ph * s) / 2;
    const bob = Math.sin(now / 500 + i) * 2;
    for (const [x, y] of p.shape.cells) drawBlock(p.color, ox + x * s, oy + y * s + bob, s, fits ? 1 : 0.35);
  }
  // dragged piece
  if (drag) {
    const sh = drag.piece.shape;
    const left = drag.x - sh.pw * cell / 2, top = drag.y - drag.lift - sh.ph * cell / 2;
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
    for (const [x, y] of sh.cells) drawBlock(drag.piece.color, left + x * cell, top + y * cell, cell, 1, 1.04);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  ctx.restore();

  // particles
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.022;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    ctx.globalAlpha = p.life; ctx.fillStyle = p.c;
    if (p.star) { star(p.x, p.y, p.s * 1.4, '#fff'); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  // floating score
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.life -= 0.015; f.y -= 0.9;
    if (f.life <= 0) { floats.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.font = `800 ${Math.round(cell * 0.75)}px "Baloo 2", system-ui, sans-serif`;
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(60,20,90,.6)'; ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = '#fff'; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
function star(x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
  ctx.closePath(); ctx.fill();
}
requestAnimationFrame(render);

// ---------- UI wiring ----------
function fmtDay() { const d = new Date(); return `${d.getDate()} ${t('months')[d.getMonth()]}`; }
function refreshMenu() {
  $('menuBest').textContent = store.best;
  $('best').textContent = G && G.mode === 'daily' ? (store.daily[G.date]?.best || 0) : store.best;
  const hasSave = store.save && store.save.mode === 'classic';
  $('btnPlay').firstElementChild.textContent = hasSave ? t('cont') : t('play');
  const rec = store.daily[dayKey()];
  $('dailyTag').textContent = fmtDay() + (rec?.done ? ' · ' + t('dailyDone') : '');
}
function updateModeTag() {
  const el = $('modeTag');
  if (G.mode === 'daily') { el.textContent = `📅 ${fmtDay()} · 🎯 ${t('goal')} ${G.goal}${G.goalHit ? ' ⭐' : ''}`; el.classList.add('show'); }
  else el.classList.remove('show');
}
function enterGame() {
  showScreen('game'); updateModeTag(); refreshMenu();
  $('score').textContent = G.shown = G.score;
  if (!S.seenHow) { S.seenHow = true; persist(); overlay('ovHow', true); }
}
$('btnPlay').onclick = () => { audio(); if (!(store.save && store.save.mode === 'classic' && load())) newGame('classic'); enterGame(); };
$('btnDaily').onclick = () => { audio(); if (!(store.save && store.save.mode === 'daily' && store.save.date === dayKey() && load())) newGame('daily'); enterGame(); };
$('btnPause').onclick = () => overlay('ovPause', true);
$('btnResume').onclick = () => overlay('ovPause', false);
$('btnRestart').onclick = () => { overlay('ovPause', false); newGame(G.mode); enterGame(); };
const goHome = () => { overlay('ovPause', false); overlay('ovOver', false); save(); refreshMenu(); showScreen('menu'); };
$('btnHome').onclick = goHome; $('btnHome2').onclick = goHome;
$('btnAgain').onclick = () => { overlay('ovOver', false); newGame(G.mode); enterGame(); };
$('btnRescue').onclick = rescue;
$('btnHow').onclick = () => overlay('ovHow', true);
$('btnCloseHow').onclick = () => overlay('ovHow', false);
$('btnSettings').onclick = () => { syncSettings(); overlay('ovSettings', true); };
$('btnCloseSettings').onclick = () => overlay('ovSettings', false);
function syncSettings() {
  $('optSound').checked = S.sound; $('optHaptic').checked = S.haptic;
  for (const b of $('optLang').children) b.classList.toggle('on', b.dataset.v === S.lang);
  for (const b of $('optTheme').children) b.classList.toggle('on', b.dataset.v === S.theme);
}
$('optSound').onchange = e => { S.sound = e.target.checked; persist(); if (S.sound) sfx.pick(); };
$('optHaptic').onchange = e => { S.haptic = e.target.checked; persist(); haptic('medium'); };
$('optLang').onclick = e => { const v = e.target.dataset.v; if (!v) return; S.lang = v; persist(); applyI18n(); syncSettings(); };
$('optTheme').onclick = e => { const v = e.target.dataset.v; if (!v) return; S.theme = v; persist(); applyTheme(); syncSettings(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); if (screens.game.classList.contains('active') && G && !G.over) overlay('ovPause', true); } });
document.addEventListener('contextmenu', e => e.preventDefault());

applyTheme(); applyI18n();
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(() => {});

// test hook (used by automated checks only)
window.__blokko = { get G() { return G; }, SHAPES, canPlace, newGame, drop: (i, gx, gy) => { drag = { i, piece: G.tray[i], gx, gy, ok: canPlace(G.board, G.tray[i].shape, gx, gy) }; drag.lines = drag.ok ? linesIf(G.tray[i].shape, gx, gy) : null; drop(); } };
})();
