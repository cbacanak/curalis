/* Uygulama girişi: yönlendirici, servis çalışanı */
import { openDB, purgeExpired } from './db.js';
import { currentPath, setActiveNav } from './nav.js';
import { requestPersist, renderNotice } from './storage.js';
import { initLock } from './lock.js';
import { initViewportFix, initDynamicType } from './viewport.js';
import { setIsland, closeSearch, setDock } from './dock.js';
import { toast, emptyState } from './ui.js';
import { t, applyStaticText } from './i18n.js';

const routes = [
  { re: /^\/?$/, nav: 'patients', load: () => import('./views/patients.js'), params: () => ({}) },
  { re: /^\/patients$/, nav: 'patients', load: () => import('./views/patients.js'), params: () => ({}) },
  { re: /^\/patients\/new$/, nav: 'patients', load: () => import('./views/patients.js'), params: () => ({ newPatient: true }) },
  { re: /^\/patient\/([^/]+)(?:\/([a-z]+))?$/, nav: 'patients', load: () => import('./views/patient.js'), params: (m) => ({ id: m[1], tab: m[2] }) },
  { re: /^\/camera(?:\/([^/]+))?$/, nav: 'camera', load: () => import('./views/camera.js'), params: (m) => ({ id: m[1] || null }) },
  { re: /^\/calendar$/, nav: 'calendar', load: () => import('./views/calendar.js'), params: () => ({}) },
  { re: /^\/settings$/, nav: 'settings', load: () => import('./views/settings.js'), params: () => ({}) },
];

let cleanup = null;
let renderToken = 0;
const wideQuery = window.matchMedia('(min-width: 768px)');
let masterKey = null;   // son çizilen master (activeId + veri sürümü)
let dataVersion = 0;
window.addEventListener('curalis:data', () => { dataVersion++; if (document.body.classList.contains('split')) scheduleMaster(); });
let masterTimer = null;
function scheduleMaster() { clearTimeout(masterTimer); masterTimer = setTimeout(() => renderMaster(currentActiveId()), 120); }
const currentActiveId = () => (currentPath().match(/^\/patient\/([^/]+)/) || [])[1] || null;
async function renderMaster(activeId) {
  const key = `${activeId || ''}#${dataVersion}`;
  if (key === masterKey) return;
  masterKey = key;
  const master = document.getElementById('master');
  const mod = await import('./views/patients.js');
  const keepScroll = master.scrollTop;
  await mod.render(master, { embedded: true, activeId });
  master.scrollTop = keepScroll;
}

async function route() {
  const path = currentPath();
  const root = document.getElementById('view');
  const token = ++renderToken;
  if (cleanup) { try { cleanup(); } catch { /* yok say */ } cleanup = null; }
  document.getElementById('layer').querySelectorAll('.sheet-backdrop, .viewer').forEach((e) => e.remove());
  closeSearch(); setIsland(null); setDock(true); document.getElementById('navtop')?.remove();

  for (const r of routes) {
    const m = path.match(r.re);
    if (!m) continue;
    setActiveNav(r.nav);
    window.scrollTo(0, 0);
    root.classList.remove('has-hero');
    // iPad / geniş ekran: hasta listesi sol sütunda, kart sağda (§5B)
    const split = wideQuery.matches && r.nav === 'patients' && !m[0].startsWith('/patients/new');
    document.body.classList.toggle('split', split);
    const master = document.getElementById('master');
    master.hidden = !split;
    if (split) {
      const activeId = m[1] || null;
      await renderMaster(activeId);
      if (token !== renderToken) return;
      if (!activeId) {   // liste rotası: sağda yer tutucu
        root.innerHTML = `<div class="screen">${emptyState({ title: t('split.pick'), text: t('split.pickText') })}</div>`;
        const { setTopbar } = await import('./nav.js'); setTopbar({ title: t('patients.title'), hidden: true });
        return;
      }
    } else { master.innerHTML = ''; masterKey = null; }
    // Yükleme sırasında iskelet (spinner yok)
    root.innerHTML = r.nav === 'patients' && m[1]
      ? ''
      : '<div class="skeleton"><div class="sk title"></div><div class="sk line"></div><div class="sk block" style="margin-top:8px"></div><div class="sk row"></div><div class="sk row"></div><div class="sk row"></div></div>';
    try {
      const mod = await r.load();
      if (token !== renderToken) return;
      const result = await mod.render(root, r.params(m));
      if (typeof result === 'function') cleanup = result;
    } catch (err) {
      console.error(err);
      root.innerHTML = emptyState({ title: t('common.error'), text: err.message || String(err), action: `<a class="btn btn-primary" href="#/">${t('common.home')}</a>` });
    }
    return;
  }
  location.hash = '#/';
}

async function start() {
  applyStaticText();
  try {
    await openDB();
  } catch (err) {
    document.getElementById('view').innerHTML = emptyState({ title: t('common.dbFail'), text: err.message });
    return;
  }
  // PIN varsa önce kilit ekranı; açılana kadar hiçbir görünüm çizilmez
  await initLock();
  window.addEventListener('hashchange', route);
  route();
  initViewportFix();   // iOS: alt çubuk açılışta yukarıda kalmasın
  initDynamicType();   // iOS Dynamic Type → --dt (rem ölçeği)
  wideQuery.addEventListener('change', route);   // 768px eşiği geçilince yerleşim değişir
  // Klavye kısayolları (iPad / masaüstü): ⌘N yeni hasta, ⌘F ara; Esc sheet'lerde zaten kapatır
  document.addEventListener('keydown', async (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'n') { e.preventDefault(); const { patientForm } = await import('./forms.js'); const p = await patientForm(); if (p) { toast(t('patients.added')); location.hash = `#/patient/${p.id}`; } }
    else if (k === 'f') {
      const input = [...document.querySelectorAll('.search input')].find((i) => i.offsetParent);
      const island = document.getElementById('search-island');
      if (input) { e.preventDefault(); input.focus(); input.select(); }
      else if (island && !island.hidden) { e.preventDefault(); island.click(); }
    }
  });
  // Silinenler: süresi dolanlar kalıcı olarak kaldırılır (en iyi çaba)
  purgeExpired().catch(() => { /* bir sonraki açılışta yeniden denenir */ });
  // Verilerin tarayıcı tarafından yer açmak için silinmemesini iste; riskli ortamda uyar
  requestPersist();
  renderNotice(document.getElementById('notice'));

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) toast(t('common.newVersion'));
        });
      });
    }).catch(() => { /* çevrimdışı destek isteğe bağlı */ });
  }
}

start();
