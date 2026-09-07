/* Depolama sağlığı: ortam tespiti, kalıcı depolama isteği, yedek al / geri yükle */
import { exportAll, importAll, audit, SCHEMA } from './db.js';
import { esc, icon, sheet, toast } from './ui.js';
import { t, locale } from './i18n.js';

const ua = navigator.userAgent || '';

export function isIOS() {
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}
/** Uygulama içi tarayıcı (WhatsApp, Instagram, Telegram, Android WebView…) — depolama çoğunlukla geçicidir */
export function isInAppBrowser() {
  if (isStandalone()) return false;
  if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger|Telegram|Snapchat|TikTok|Bytedance|; wv\)|WebView/i.test(ua)) return true;
  // iOS'ta Safari dışı gömülü görünümlerin UA'sında "Safari/" bulunmaz (CriOS/FxiOS'ta bulunur)
  return isIOS() && /Mobile\//.test(ua) && !/Safari\//.test(ua);
}
export function isMobile() {
  return isIOS() || /Android/i.test(ua);
}

/** Tarayıcıdan verilerin baskı altında silinmemesini ister. Sessizce çalışır. */
export async function requestPersist() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}

export async function storageInfo() {
  const info = { standalone: isStandalone(), ios: isIOS(), inApp: isInAppBrowser(), persisted: null, usage: null, quota: null };
  try { if (navigator.storage?.persisted) info.persisted = await navigator.storage.persisted(); } catch { /* yok say */ }
  try {
    if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); info.usage = e.usage ?? null; info.quota = e.quota ?? null; }
  } catch { /* yok say */ }
  return info;
}

export function fmtBytes(n) {
  if (n == null) return '—';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

/* ---------------- Uyarı bandı ---------------- */
const NOTICE_KEY = 'curalis:notice-dismissed';
function dismissed(id) { try { return localStorage.getItem(NOTICE_KEY) === id; } catch { return false; } }
function dismiss(id) { try { localStorage.setItem(NOTICE_KEY, id); } catch { /* yok say */ } }

/** Ortama göre gösterilecek uyarı: { id, kind, title, text } ya da null */
export function storageNotice() {
  if (isInAppBrowser()) {
    return {
      id: 'inapp', kind: 'danger', dismissable: false,
      title: t('n.inApp.title'), text: t('n.inApp.text'),
    };
  }
  if (isIOS() && !isStandalone()) {
    return {
      id: 'ios-tab', kind: 'warn', dismissable: true,
      title: t('n.ios.title'), text: t('n.ios.text'),
    };
  }
  if (isMobile() && !isStandalone()) {
    return {
      id: 'mobile-tab', kind: 'info', dismissable: true,
      title: t('n.mobile.title'), text: t('n.mobile.text'),
    };
  }
  return null;
}

export function renderNotice(host) {
  const n = storageNotice();
  host.innerHTML = '';
  if (!n || (n.dismissable && dismissed(n.id))) return;
  host.innerHTML = `
    <div class="notice notice-${n.kind}" role="status">
      <div class="notice-main"><b>${esc(n.title)}</b><div>${esc(n.text)}</div></div>
      ${n.dismissable ? `<button class="btn-icon" type="button" data-act="dismiss" aria-label="${esc(t('common.close'))}">${icon('x')}</button>` : ''}
    </div>`;
  const b = host.querySelector('[data-act=dismiss]');
  if (b) b.onclick = () => { dismiss(n.id); host.innerHTML = ''; };
}

/* ---------------- Yedek al / geri yükle ---------------- */
function backupName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${t('b.fileName')}-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

/** Yedeği dosya olarak verir: iOS'ta paylaşım sayfası, diğerlerinde indirme. */
export async function downloadBackup() {
  const data = await exportAll();
  audit('backup', 'data', null, `${(data.patients || []).length} patients`);
  const json = JSON.stringify(data);
  const name = backupName();
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && isMobile()) {
    try {
      await navigator.share({ files: [file], title: t('b.shareTitle') });
      return { shared: true, name, size: file.size };
    } catch (e) {
      if (e && e.name === 'AbortError') return null; // kullanıcı vazgeçti
      /* paylaşım olmadı — indirmeye düş */
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { shared: false, name, size: file.size };
}

export function pickBackupFile() {
  return new Promise((res) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.onchange = () => res(input.files[0] || null);
    input.click();
  });
}

export async function readBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { throw new Error(t('b.unreadable')); }
  if (!data || data.app !== 'curalis') throw new Error(t('b.notBackup'));
  if (data.schema !== SCHEMA) throw new Error(t('b.oldSchema'));
  return data;
}

/** Kullanıcıya birleştir / değiştir / vazgeç seçeneği sunar, seçime göre içe aktarır. */
export async function restoreBackup(file) {
  const data = await readBackup(file);
  const c = { patients: (data.patients || []).length, photos: (data.photos || []).length, appointments: (data.appointments || []).length };
  const when = data.exportedAt ? new Date(data.exportedAt).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const s = sheet({
    title: t('b.restoreTitle'),
    size: 'sm',
    content: `
      <p class="muted" style="margin:0 0 10px">${when ? esc(t('b.datedBackup', { when })) : esc(t('b.backup'))}${t('b.contents', c)}</p>
      <p class="muted small" style="margin:0">${t('b.modes')}</p>`,
    footer: `<button class="btn btn-ghost" data-act="cancel">${esc(t('common.cancel'))}</button>
             <button class="btn btn-danger-soft" data-act="replace">${esc(t('b.replace'))}</button>
             <button class="btn btn-primary" data-act="merge">${esc(t('b.merge'))}</button>`,
  });
  s.el.querySelector('[data-act=cancel]').onclick = () => s.close(null);
  s.el.querySelector('[data-act=replace]').onclick = () => s.close('replace');
  s.el.querySelector('[data-act=merge]').onclick = () => s.close('merge');
  const mode = await s.result;
  if (!mode) return null;
  await importAll(data, { replace: mode === 'replace' });
  toast(t('b.restored', { n: c.patients }), { kind: 'ok' });
  return c;
}
