/* iOS (Ana Ekran'a eklenmiş uygulama): açılışta yerleşim görünümü durum çubuğu kadar kısa hesaplanabiliyor;
 * sabit alt çubuk ilk kaydırmaya dek o eksik ölçüye göre yukarıda durur. İçerik kısaysa kaydırma da olmaz.
 * Burada görünür alan (visualViewport) ile yerleşim görünümü arasındaki fark ölçülür ve --vv-fix olarak
 * alt çubuk / yapışkan eylem çubuğu / bildirim konumlarına eklenir; ayrıca alt çubuk yeniden yerleştirilir. */
let lastFix = null;

function measure() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  const layoutH = document.documentElement.clientHeight;
  const diff = Math.round(vv.height + vv.offsetTop - layoutH);
  return diff > 0 && diff < 200 ? diff : 0;   // yalnızca makul bir fark (durum çubuğu / ev göstergesi ölçeğinde)
}

/** Alt çubuğu yeniden yerleştir: gizle-göster ile sabit konum yeniden hesaplanır (iOS yeniden düzenleme) */
export function relayoutBars() {
  const fix = measure();
  if (fix !== lastFix) { document.documentElement.style.setProperty('--vv-fix', `${fix}px`); lastFix = fix; }
  document.querySelectorAll('.tabbar, .action-bar.sticky').forEach((el) => {
    const prev = el.style.display; el.style.display = 'none'; void el.offsetHeight; el.style.display = prev;
  });
}

export function initViewportFix() {
  const vv = window.visualViewport;
  if (vv) { vv.addEventListener('resize', relayoutBars); vv.addEventListener('scroll', relayoutBars); }
  window.addEventListener('pageshow', relayoutBars);
  window.addEventListener('orientationchange', () => setTimeout(relayoutBars, 100));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) relayoutBars(); });
  relayoutBars();
  [250, 1000, 2500].forEach((ms) => setTimeout(relayoutBars, ms));   // açılış sonrası birkaç kez
}
