/* Navigasyon katmanı — TASARIM.md §5A (iOS 26 kalıbı)
 * Yüzen cam tab bar (index.html'de), yanında arama adası; adaya dokununca klavye üstünde cam arama kapsülü.
 * İçerik katmanı mat kalır; yalnızca bu katman cam kullanır. */
import { esc, icon } from './ui.js';
import { t } from './i18n.js';

let islandHandler = null;
let active = null;   // açık arama kapsülü

/** Arama adası: handler verilirse görünür (Hastalar, Ajanda, Fotoğraflar); null ise gizlenir */
export function setIsland(handler) {
  islandHandler = handler;
  const b = document.getElementById('search-island');
  if (!b) return;
  b.hidden = !handler;
  b.onclick = () => { if (islandHandler) islandHandler(); };
}

/**
 * Klavye üstü arama kapsülü. Tab bar bu sırada gizlenir (body.searching).
 * onInput(q) her tuşta; onClose() kapanınca (Vazgeç, Esc, rota değişimi). focus çağıranın dokunma jestinde yapılır.
 */
export function openSearch({ placeholder = '', value = '', onInput, onClose } = {}) {
  closeSearch();
  const dock = document.createElement('div');
  dock.className = 'search-dock';
  dock.innerHTML = `
    <div class="search-glass glass">
      ${icon('search')}
      <input type="search" placeholder="${esc(placeholder)}" value="${esc(value)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" aria-label="${esc(placeholder)}">
      <button type="button" class="search-cancel">${esc(t('common.cancel'))}</button>
    </div>`;
  document.getElementById('layer').appendChild(dock);
  document.body.classList.add('searching');
  const input = dock.querySelector('input');
  input.addEventListener('input', () => onInput?.(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); closeSearch(); } if (e.key === 'Enter') input.blur(); });
  dock.querySelector('.search-cancel').onclick = () => closeSearch();
  active = { dock, onClose };
  input.focus({ preventScroll: true });
  requestAnimationFrame(() => dock.classList.add('open'));
  return { input, close: closeSearch };
}

export function closeSearch() {
  if (!active) return;
  const { dock, onClose } = active;
  active = null;
  document.body.classList.remove('searching');
  dock.remove();
  onClose?.();
}
export const isSearching = () => !!active;

/** Tab bar: alt ekranlarda (hasta kartı) gizlenir; rota değişince app.js yeniden gösterir */
export function setDock(visible) { document.body.classList.toggle('no-dock', !visible); }
export const isMobile = () => window.matchMedia('(max-width: 879px)').matches;
