/* Görünür alanın alt kenarı — iOS (Ana Ekran'a eklenmiş uygulama) için
 * iOS zaman zaman yerleşim görünümünü durum çubuğu kadar kısa hesaplar (açılışta, gövde kilidinde) ve
 * sonradan sessizce düzeltir; 'bottom: 0' ile konumlanan katmanlar ya yukarıda kalır ya da taşar.
 * Bu yüzden alt katmanlar (tab bar, arama kapsülü, sheet, menü, kilit, kamera, görüntüleyici, bildirim)
 * 'bottom' yerine ölçülen alt kenardan (--vv-h) yukarı doğru konumlanır: top = --vv-h - yükseklik.
 * Alt kenar: klavye açıkken visualViewport'un altı; değilse iOS Ana Ekran modunda ekran yüksekliği,
 * diğer ortamlarda yerleşim/görünür alanın büyüğü. Klavye, kaydırma, görünüm olaylarında sürekli ölçülür. */
let last = { h: null, pad: null };
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
const safeB = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-b')) || 0;

/** Ölçüm ayrıntıları (tanı paneli için de) */
export function metrics() {
  const de = document.documentElement;
  const vv = window.visualViewport;
  const clientH = de.clientHeight;
  const vvEdge = vv ? Math.round(vv.offsetTop + vv.height) : clientH;
  const portrait = innerHeight >= innerWidth;
  const screenH = screen ? (portrait ? Math.max(screen.height, screen.width) : Math.min(screen.height, screen.width)) : 0;
  const ios = isIOS() && isStandalone();
  // Klavye: görünür alan yerleşimden belirgin kısa ya da (iOS resizes-content) yerleşim ekrandan belirgin kısa
  const kbOpen = !!(vv && vv.height < clientH - 120) || (ios && screenH > 0 && clientH < screenH - 150);
  let edge;
  if (kbOpen) edge = vvEdge;
  else if (ios && screenH > 0 && screenH - clientH >= 0 && screenH - clientH < 200) edge = screenH;   // tam ekran web görünümü: gerçek alt kenar ekranın altı
  else edge = Math.max(clientH, vvEdge);
  const tab = document.querySelector('.navdock');
  return {
    ios, standalone: isStandalone(), portrait, kbOpen, edge, clientH, innerH: innerHeight, vvH: vv ? Math.round(vv.height) : null, vvTop: vv ? Math.round(vv.offsetTop) : null,
    screenH, safeT: getComputedStyle(de).getPropertyValue('--safe-t').trim(), safeB: safeB(),
    vvHVar: de.style.getPropertyValue('--vv-h'), dockBottom: tab ? Math.round(tab.getBoundingClientRect().bottom) : null, scrollY: Math.round(scrollY), bodyCls: document.body.className,
  };
}

/** Değişkenleri yaz; değiştiyse yüzen katmanları yeniden yerleştir (gizle-göster ile sabit konum tazelenir) */
export function relayoutBars(force = false) {
  const m = metrics();
  const pad = m.kbOpen ? 12 : 16 + safeB();   // alt kenardan boşluk: klavye üstünde 12px, değilse 16px + safe-area
  const changed = m.edge !== last.h || pad !== last.pad;
  if (changed) {
    const de = document.documentElement;
    de.style.setProperty('--vv-h', `${m.edge}px`);
    de.style.setProperty('--vv-fix', `${m.edge - m.clientH}px`);
    de.style.setProperty('--edge-pad', `${pad}px`);
    last = { h: m.edge, pad };
  }
  if (changed || force) {
    document.querySelectorAll('.navdock, .search-dock, .action-bar.sticky').forEach((el) => {
      const prev = el.style.display; el.style.display = 'none'; void el.offsetHeight; el.style.display = prev;
    });
  }
}

/** Birkaç kez ölç: iOS düzeltmeyi gecikmeli yapıyor */
export function relayoutSoon() { requestAnimationFrame(() => relayoutBars(true)); [120, 400, 900].forEach((ms) => setTimeout(() => relayoutBars(), ms)); }

export function initViewportFix() {
  const vv = window.visualViewport;
  const soft = () => relayoutBars();
  if (vv) { vv.addEventListener('resize', soft); vv.addEventListener('scroll', soft); }
  window.addEventListener('resize', soft);
  window.addEventListener('scroll', soft, { passive: true });
  window.addEventListener('pageshow', relayoutSoon);
  window.addEventListener('orientationchange', relayoutSoon);
  document.addEventListener('focusin', relayoutSoon);    // klavye açılışı
  document.addEventListener('focusout', relayoutSoon);   // klavye kapanışı
  document.addEventListener('visibilitychange', () => { if (!document.hidden) relayoutSoon(); });
  setInterval(() => { if (!document.hidden) relayoutBars(); }, 1000);   // sessiz düzeltmeleri yakala
  relayoutSoon(); setTimeout(() => relayoutBars(), 2500);
}

/* ---------------- Tanı paneli (Ayarlar → sürüm yazısına 5 kez dokun) ---------------- */
export function showViewportDebug() {
  document.getElementById('vv-debug')?.remove();
  const box = document.createElement('div');
  box.id = 'vv-debug';
  box.innerHTML = `<pre></pre><div class="vv-debug-actions"><button type="button" data-act="fix">Yeniden ölç</button><button type="button" data-act="copy">Kopyala</button><button type="button" data-act="close">Kapat</button></div>`;
  document.body.appendChild(box);
  const pre = box.querySelector('pre');
  const paint = () => { pre.textContent = JSON.stringify(metrics(), null, 1).replace(/[{}"]/g, '').trim(); };
  const timer = setInterval(paint, 500); paint();
  box.querySelector('[data-act=fix]').onclick = () => { relayoutBars(true); paint(); };
  box.querySelector('[data-act=copy]').onclick = () => { navigator.clipboard?.writeText(JSON.stringify(metrics())); };
  box.querySelector('[data-act=close]').onclick = () => { clearInterval(timer); box.remove(); };
}
