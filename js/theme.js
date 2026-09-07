/* Tema: Açık / Koyu / Sistem — TASARIM.md §2.1
 * Seçim localStorage'da tutulur ve index.html'deki satır içi betik CSS yüklenmeden önce uygular (yanıp sönme olmaz). */
const KEY = 'hasta-takip:theme';
export const THEMES = [['light', 'Açık'], ['dark', 'Koyu'], ['system', 'Sistem']];

export const DEFAULT_THEME = 'dark'; // seçim yapılmadıysa koyu

export function getTheme() {
  try { const t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' || t === 'system' ? t : DEFAULT_THEME; } catch { return DEFAULT_THEME; }
}

export function applyTheme(mode) {
  const el = document.documentElement;
  if (mode === 'light' || mode === 'dark') el.setAttribute('data-theme', mode); else el.removeAttribute('data-theme');
  try { localStorage.setItem(KEY, mode); } catch { /* yok say */ }
}

/** Etkin görünüm ('light' | 'dark'), sistem tercihi çözülmüş hâliyle */
export function effectiveTheme() {
  const t = getTheme();
  if (t !== 'system') return t;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
