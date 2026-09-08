/* Küçük UI yardımcıları: şablon, ikon, tarih, sheet, onay, toast */
import { t, locale, upper } from './i18n.js';
import { relayoutSoon } from './viewport.js';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => upper(w[0])).join('');
}

/* ---------------- İkonlar ---------------- */
const ICONS = {
  back: '<path d="m15 18-6-6 6-6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  compare: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  note: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  zoom: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  backspace: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6M12 9l6 6"/>',
  swap: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5z"/>',
  share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------------- Tarih (dile göre yerel biçim) ---------------- */

export function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  // "YYYY-MM-DD" veya "YYYY-MM-DDTHH:mm" yerel saat olarak yorumlanır
  const d = new Date(v.length === 10 ? v + 'T00:00:00' : v);
  return isNaN(d) ? null : d;
}

export function fmtDate(v, opts = {}) {
  const d = parseDate(v);
  if (!d) return '—';
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', ...opts });
}

export function fmtDateLong(v) {
  const d = parseDate(v);
  if (!d) return '—';
  return d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function fmtTime(v) {
  const d = parseDate(v);
  if (!d) return '';
  return d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

export function fmtDateTime(v) {
  const d = parseDate(v);
  if (!d) return '—';
  return `${fmtDate(d)} · ${fmtTime(d)}`;
}

export function fmtDayMonth(v) {
  const d = parseDate(v);
  if (!d) return '—';
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

export function weekdayShort(v) {
  const d = parseDate(v);
  return d ? d.toLocaleDateString(locale(), { weekday: 'short' }) : '';
}

export function age(birth) {
  const d = parseDate(birth);
  if (!d) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
}

/** "Bugün", "Yarın", "3 gün sonra", "2 gün önce" */
export function relDay(v) {
  const d = parseDate(v);
  if (!d) return '';
  const n = daysBetween(new Date(), d);
  if (n === 0) return t('common.today');
  if (n === 1) return t('common.tomorrow');
  if (n === -1) return t('common.yesterday');
  const rel = (k, u) => t(n > 0 ? 'rel.after' : 'rel.before', { n: Math.abs(k), u: t(u) });
  if (Math.abs(n) < 30) return rel(n, 'unit.day');
  if (Math.abs(n) < 90) return rel(Math.round(n / 7), 'unit.week');
  if (Math.abs(n) < 365) return rel(Math.round(n / 30), 'unit.month');
  return rel(Math.round(n / 365), 'unit.year');
}

/** İşlem tarihine göre "3. gün", "2. hafta" vb. */
export function sinceProcedure(procDate, at = new Date()) {
  const n = daysBetween(parseDate(procDate), at);
  if (n < 0) return t('since.pre');
  if (n === 0) return t('since.day0');
  const nth = (k, u) => t('since.nth', { n: k, u: t(u) });
  if (n < 7) return nth(n, 'unit1.day');
  if (n < 28) return nth(Math.floor(n / 7), 'unit1.week');
  if (n < 365) return nth(Math.floor(n / 30), 'unit1.month');
  return nth(Math.floor(n / 365), 'unit1.year');
}

export function phoneHref(phone) {
  return 'tel:' + (phone || '').replace(/[^\d+]/g, '');
}
/** WhatsApp bağlantısı: 05xx → 905xx; +90… → 90… */
export function waHref(phone) {
  let d = (phone || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '90' + d.slice(1);
  else if (d.length === 10 && d.startsWith('5')) d = '90' + d;
  return 'https://wa.me/' + d;
}

/* ---------------- Katman: sheet / confirm / toast ---------------- */
const layer = () => document.getElementById('layer');

/* Sheet açıkken arka plandaki sayfanın kaymasını engeller (iOS dahil) */
let openSheets = 0;
let savedScrollY = 0;
/* Kaydırma kilidi: gövde sabit konuma ALINMAZ (iOS Ana Ekran uygulamasında yerleşim görünümünü durum çubuğu kadar
 * kısaltıyor ve o bandın altına hiçbir sabit katman çizilmiyordu). Bunun yerine html/body overflow gizlenir; katman
 * (sheet, menü, kilit) tüm ekranı kapladığı ve touch-action: none olduğu için dokunma zaten sayfaya ulaşmaz. */
export function lockScroll() {
  if (openSheets++ > 0) return;
  savedScrollY = window.scrollY;
  document.documentElement.classList.add('scroll-locked');
  relayoutSoon();
}
export function unlockScroll() {
  if (--openSheets > 0) return;
  openSheets = 0;
  document.documentElement.classList.remove('scroll-locked');
  if (Math.abs(window.scrollY - savedScrollY) > 1) window.scrollTo(0, savedScrollY);
  relayoutSoon();
}

/**
 * Alt sayfa (mobil) / diyalog (masaüstü). content: HTML string veya element.
 * Döner: { el, body, close(result) , result: Promise }
 */
export function sheet({ title, content, footer = '', size = 'md', onClose, closeText = null, half = false } = {}) {
  closeText = closeText ?? t('common.cancel');
  const root = el(`
    <div class="sheet-backdrop" role="presentation">
      <div class="sheet sheet-${size} ${half ? 'sheet-half' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title || '')}">
        <div class="sheet-head">
          <div class="sheet-grip" aria-hidden="true"></div>
          <h2 class="sheet-title">${esc(title || '')}</h2>
          <button class="sheet-close" type="button">${esc(closeText)}</button>
        </div>
        <div class="sheet-body"></div>
        ${footer ? `<div class="sheet-foot">${footer}</div>` : ''}
      </div>
    </div>`);
  const body = root.querySelector('.sheet-body');
  if (typeof content === 'string') body.innerHTML = content; else if (content) body.appendChild(content);

  let resolve;
  const result = new Promise((r) => { resolve = r; });
  let closed = false;
  const close = (val = null) => {
    if (closed || !root.isConnected) return;
    closed = true;
    root.classList.add('closing');
    document.removeEventListener('keydown', onKey);
    unlockScroll();
    setTimeout(() => { root.remove(); onClose?.(val); resolve(val); }, 180);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(null); };
  root.addEventListener('click', (e) => { if (e.target === root) close(null); });
  root.querySelector('.sheet-close').addEventListener('click', () => close(null));
  enableSwipeToClose(root, root.querySelector('.sheet'), body, close);
  document.addEventListener('keydown', onKey);
  lockScroll();
  layer().appendChild(root);
  setTimeout(() => root.classList.add('open'), 10);
  const first = body.querySelector('input:not([type=hidden]),select,textarea,button');
  if (first && window.matchMedia('(min-width: 880px)').matches) setTimeout(() => first.focus(), 200);
  /** Kademeli sheet (§5B): yarıdan tam yüksekliğe */
  const expand = () => { root.querySelector('.sheet').classList.remove('sheet-half'); };
  root.querySelectorAll('[data-act=expand]').forEach((b) => { b.onclick = expand; });
  return { el: root, body, close, result, expand };
}

/*
 * Aşağı kaydırarak kapatma (mobil). Başlık alanından her zaman; gövdeden yalnızca içerik en üstteyken
 * (aksi hâlde normal kaydırma). Yatay ağırlıklı hareketler yok sayılır. Eşik: yükseklik %35'i ya da 140px,
 * veya hızlı fırlatma. Bırakınca eşiğin altındaysa yerine döner. Masaüstü diyaloğunda kapalı.
 */
function enableSwipeToClose(root, sheetEl, body, close) {
  if (window.matchMedia('(min-width: 880px)').matches) return;
  const head = sheetEl.querySelector('.sheet-head');
  let sx = null, sy = null, dy = 0, t0 = 0, fromBody = false, active = false;
  const reset = () => { sx = sy = null; active = false; sheetEl.classList.remove('dragging'); sheetEl.style.transform = ''; root.style.opacity = ''; };
  const start = (e, isBody) => {
    if (e.touches.length !== 1 || sy !== null) return;
    if (isBody && body.scrollTop > 0) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; t0 = Date.now(); dy = 0; fromBody = isBody; active = false;
  };
  const move = (e) => {
    if (sy === null) return;
    const x = e.touches[0].clientX - sx, y = e.touches[0].clientY - sy;
    if (!active) {
      if (!fromBody && y < -16 && sheetEl.classList.contains('sheet-half')) { sheetEl.classList.remove('sheet-half'); sx = sy = null; return; }   // yarı sheet: yukarı çekince tam
      if (Math.abs(x) > Math.abs(y) || (fromBody && y < 0)) { sx = sy = null; return; }   // yatay ya da yukarı: bırak
      if (y < 8) return;
      active = true; sheetEl.classList.add('dragging');
    }
    if (fromBody && body.scrollTop > 0) { reset(); return; }
    dy = Math.max(0, y);
    if (e.cancelable) e.preventDefault();
    sheetEl.style.transform = `translateY(${dy}px)`;
    root.style.opacity = String(1 - Math.min(0.5, dy / sheetEl.offsetHeight));
  };
  const end = () => {
    if (sy === null) return;
    const v = dy / Math.max(1, Date.now() - t0);   // px/ms
    const shouldClose = active && (dy > Math.min(140, sheetEl.offsetHeight * 0.35) || v > 0.6);
    if (!shouldClose) { reset(); return; }
    sheetEl.classList.remove('dragging');
    root.style.opacity = '';
    sheetEl.style.transform = 'translateY(100%)';   // bulunduğu yerden aşağı kayarak kapanır
    sx = sy = null;
    close(null);
  };
  head.addEventListener('touchstart', (e) => start(e, false), { passive: true });
  body.addEventListener('touchstart', (e) => start(e, true), { passive: true });
  sheetEl.addEventListener('touchmove', move, { passive: false });
  sheetEl.addEventListener('touchend', end);
  sheetEl.addEventListener('touchcancel', reset);
}

/** Silme / geri alınamaz eylem onayı — alttan çıkan iOS eylem sayfası (TASARIM.md §5) */
export function confirmDialog({ title = null, message = '', okText = null, cancelText = null, danger = false } = {}) {
  title = title ?? t('common.sure'); okText = okText ?? t('common.yes'); cancelText = cancelText ?? t('common.cancel');
  return new Promise((resolve) => {
    const root = el(`
      <div class="action-sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="as-group">
          <div class="as-card">
            <div class="as-head"><div class="as-title">${esc(title)}</div>${message ? `<div class="as-text">${esc(message)}</div>` : ''}</div>
            <button class="as-btn ${danger ? 'danger' : 'primary'}" type="button" data-act="ok">${esc(okText)}</button>
          </div>
          <button class="as-cancel" type="button" data-act="cancel">${esc(cancelText)}</button>
        </div>
      </div>`);
    let done = false;
    const close = (v) => {
      if (done) return; done = true;
      root.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      setTimeout(() => { root.remove(); resolve(v); }, 200);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    root.addEventListener('click', (e) => { if (e.target === root) close(false); });
    root.querySelector('[data-act=ok]').onclick = () => close(true);
    root.querySelector('[data-act=cancel]').onclick = () => close(false);
    document.addEventListener('keydown', onKey);
    lockScroll();
    layer().appendChild(root);
    requestAnimationFrame(() => root.classList.add('open'));
  });
}

/** Basit eylem menüsü: items [{label, icon, danger, value}] */
export function actionMenu(title, items) {
  const s = sheet({
    title,
    size: 'sm',
    content: `<div class="menu">${items.map((it, i) => `
      <button class="menu-item ${it.danger ? 'danger' : ''}" data-i="${i}" type="button" ${it.disabled ? 'disabled' : ''}>
        ${it.icon ? icon(it.icon) : ''}<span class="menu-main"><span>${esc(it.label)}</span>${it.sub ? `<span class="menu-sub">${esc(it.sub)}</span>` : ''}</span>${it.checked ? `<span class="check-mark">${icon('check')}</span>` : ''}
      </button>`).join('')}</div>`,
  });
  s.body.querySelectorAll('.menu-item').forEach((b) => {
    b.onclick = () => s.close(items[+b.dataset.i].value ?? items[+b.dataset.i].label);
  });
  return s.result;
}

let toastTimer;
export function toast(msg, { kind = 'default', duration = 2600 } = {}) {
  let t = document.getElementById('toast');
  if (!t) {
    t = el('<div id="toast" class="toast" role="status" aria-live="polite"></div>');
    layer().appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast toast-${kind} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

/** Geri al kapsülü (§5B): işlem yapılır, 5 sn cam kapsül "… · Geri al". Onay sorulmaz. */
let undoTimer = null;
export function undoToast(msg, onUndo, { duration = 5000 } = {}) {
  document.getElementById('undo')?.remove();
  clearTimeout(undoTimer);
  const u = el(`<div id="undo" class="undo glass" role="status" aria-live="polite"><span class="undo-text">${esc(msg)}</span><button type="button" class="undo-btn">${esc(t('common.undo'))}</button></div>`);
  layer().appendChild(u);
  document.body.classList.add('has-undo');
  requestAnimationFrame(() => u.classList.add('show'));
  const hide = () => { clearTimeout(undoTimer); u.classList.remove('show'); document.body.classList.remove('has-undo'); setTimeout(() => u.remove(), 250); };
  undoTimer = setTimeout(hide, duration);
  u.querySelector('.undo-btn').onclick = async () => { hide(); await onUndo?.(); };
  return hide;
}

/* ---------------- Form yardımcıları ---------------- */
export function formData(form) {
  const out = {};
  new FormData(form).forEach((v, k) => { out[k] = typeof v === 'string' ? v.trim() : v; });
  form.querySelectorAll('input[type=checkbox]').forEach((c) => { out[c.name] = c.checked; });
  return out;
}

/** Alan etiketi: zorunlu değilse "· isteğe bağlı" (optional: false ile kapatılır) */
export function fieldLabel(label, { required = false, optional = true } = {}) {
  return `<span class="field-label">${esc(label)}${!required && optional ? ` <span class="opt">${esc(t('common.optional'))}</span>` : ''}</span>`;
}

export function field({ label, name, type = 'text', value = '', placeholder = '', required = false, optional = true, hint = '', attrs = '' }) {
  const input = `<input class="input" type="${type}" name="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} ${attrs}>`;
  // iOS Safari tarih/saat kutularına içsel genişlik dayatır; sabit boyutlu sarmalayıcı bunu geçersiz kılar. Sağda ikon; dokununca native seçici.
  const isDate = type === 'date' || type === 'time' || type === 'datetime-local';
  return `
    <label class="field">
      ${fieldLabel(label, { required, optional })}
      ${isDate ? `<span class="date-wrap">${input}${icon(type === 'time' ? 'clock' : 'calendar', 'date-icon')}</span>` : input}
      ${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}
    </label>`;
}

export function selectField({ label, name, value = '', options = [], required = false, optional = true, hint = '' }) {
  return `
    <label class="field">
      ${fieldLabel(label, { required, optional })}
      <span class="select-wrap">
        <select class="input" name="${name}" ${required ? 'required' : ''}>
          ${options.map((o) => {
            const [v, l] = Array.isArray(o) ? o : [o, o];
            return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`;
          }).join('')}
        </select>${icon('down', 'select-caret')}
      </span>
      ${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}
    </label>`;
}

export function textareaField({ label, name, value = '', placeholder = '', rows = 3, optional = true }) {
  return `
    <label class="field">
      ${fieldLabel(label, { required: false, optional })}
      <textarea class="input" name="${name}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>
    </label>`;
}

/** Segment (sekme) kontrolü; value seçili olanı işaretler */
export function segmented({ name, value, options, cls = '' }) {
  return `<div class="seg ${cls}" role="tablist" data-name="${name}">
    ${options.map(([v, l]) => `<button type="button" role="tab" class="seg-btn ${String(v) === String(value) ? 'on' : ''}" data-value="${esc(v)}" aria-selected="${String(v) === String(value)}">${l}</button>`).join('')}
  </div>`;
}

/** Kısa seçim (cinsiyet, tema): segment kontrol + gizli input. bindChoiceFields(form) ile bağlanır. */
export function segmentField({ label, name, value = '', options = [], required = false, optional = true }) {
  return `
    <div class="field">
      ${label ? fieldLabel(label, { required, optional }) : ''}
      <input type="hidden" name="${name}" value="${esc(value)}">
      ${segmented({ name, value, options, cls: 'seg-field' })}
    </div>`;
}

/** Çok seçenekli kısa liste (işlem türü, kontrol dönemleri): chip grubu + gizli input (çoklu seçimde virgülle) */
export function chipField({ label, name, value = '', options = [], multiple = false, required = false, optional = true }) {
  const selected = new Set(multiple ? String(value || '').split(',').filter(Boolean) : [String(value)]);
  // Çoklu seçimde seçili chip onay işareti taşır ve etikette canlı sayaç görünür
  return `
    <div class="field">
      ${label ? `<span class="field-label">${esc(label)}${multiple ? ` <span class="opt" data-count-for="${name}">${esc(t('common.selected', { n: selected.size }))}</span>` : (!required && optional ? ` <span class="opt">${esc(t('common.optional'))}</span>` : '')}</span>` : ''}
      <input type="hidden" name="${name}" value="${esc(value)}">
      <div class="chip-group" data-chips="${name}" data-multiple="${multiple ? '1' : ''}">
        ${options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<button type="button" class="chip ${selected.has(String(v)) ? 'on' : ''}" data-value="${esc(v)}" aria-pressed="${selected.has(String(v))}">${multiple ? icon('check') : ''}${esc(l)}</button>`; }).join('')}
      </div>
    </div>`;
}

/** Formdaki segment ve chip alanlarını gizli input'larına bağlar */
export function bindChoiceFields(form) {
  form.querySelectorAll('.seg-field').forEach((seg) => {
    const hidden = form.querySelector(`input[type=hidden][name="${seg.dataset.name}"]`);
    bindSegmented(seg, (v) => { if (hidden) { hidden.value = v; hidden.dispatchEvent(new Event('change', { bubbles: true })); } });
  });
  form.querySelectorAll('[data-chips]').forEach((group) => {
    const hidden = form.querySelector(`input[type=hidden][name="${group.dataset.chips}"]`);
    const multiple = !!group.dataset.multiple;
    const counter = form.querySelector(`[data-count-for="${group.dataset.chips}"]`);
    group.querySelectorAll('.chip').forEach((b) => {
      b.addEventListener('click', () => {
        if (multiple) {
          b.classList.toggle('on');
          const on = [...group.querySelectorAll('.chip.on')];
          hidden.value = on.map((x) => x.dataset.value).join(',');
          if (counter) counter.textContent = t('common.selected', { n: on.length });
        } else {
          group.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
          hidden.value = b.dataset.value;
        }
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
        group.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.classList.contains('on')));
      });
    });
  });
}

export function bindSegmented(segEl, onChange) {
  segEl.querySelectorAll('.seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      segEl.querySelectorAll('.seg-btn').forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
      b.classList.add('on');
      b.setAttribute('aria-selected', 'true');
      onChange?.(b.dataset.value);
    });
  });
}

/** Durum düz metin olarak; renk yalnızca gerektiğinde (gecikmiş / gelmedi) */
export function statusText(status, { overdue = false, today = false } = {}) {
  if (overdue) return `<span class="status danger">${esc(t('status.late'))}</span>`;
  const map = { planned: [today ? t('common.today') : t('status.planned'), ''], attended: [t('status.attended'), 'muted'], missed: [t('status.missed'), 'warning'], cancelled: [t('status.cancelled'), 'muted'] };
  const [l, c] = map[status] || [status, ''];
  return `<span class="status ${c}">${esc(l)}</span>`;
}
export const statusPill = statusText;

export function emptyState({ title, text = '', action = '', center = false }) {
  return `<div class="empty ${center ? 'center' : ''}">
    <div class="empty-title">${esc(title)}</div>
    ${text ? `<div class="empty-text">${esc(text)}</div>` : ''}
    ${action}
  </div>`;
}
