/* iOS (Ana Ekran'a eklenmiş uygulama): yerleşim görünümü zaman zaman durum çubuğu kadar kısa hesaplanıyor
 * (açılışta; gövde kaydırması kilitlenip açıldığında). Sabit katmanlar — alt çubuk, sheet, aksiyon menüsü,
 * kilit, kamera, görüntüleyici — ekranın gerçek altından o kadar yukarıda biter; ilk kaydırmaya dek düzelmez.
 * Burada fark ölçülür ve --vv-fix olarak bu katmanların alt kenarına eklenir; alt çubuk yeniden yerleştirilir. */
let lastFix = null;
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);

/** Ölçüm ayrıntıları (tanı paneli için de kullanılır) */
export function metrics() {
  const de = document.documentElement;
  const vv = window.visualViewport;
  const layoutH = de.clientHeight;
  const portrait = innerHeight >= innerWidth;
  const fullH = screen ? (portrait ? Math.max(screen.height, screen.width) : Math.min(screen.height, screen.width)) : 0;
  const vvDiff = vv ? Math.round(vv.height + vv.offsetTop - layoutH) : 0;
  const screenDiff = isIOS() && isStandalone() && fullH ? Math.round(fullH - layoutH) : 0;
  const tab = document.querySelector('.tabbar');
  return {
    ios: isIOS(), standalone: isStandalone(), portrait,
    innerH: innerHeight, clientH: layoutH, vvH: vv ? Math.round(vv.height) : null, vvTop: vv ? Math.round(vv.offsetTop) : null,
    screenH: screen?.height ?? null, screenW: screen?.width ?? null, fullH,
    safeT: getComputedStyle(de).getPropertyValue('--safe-t').trim(), safeB: getComputedStyle(de).getPropertyValue('--safe-b').trim(),
    vvDiff, screenDiff, fix: lastFix, tabBottom: tab ? Math.round(tab.getBoundingClientRect().bottom) : null, scrollY: Math.round(scrollY),
    bodyCls: document.body.className,
  };
}

function measure() {
  const m = metrics();
  const diff = Math.max(m.vvDiff, m.screenDiff);
  return diff > 0 && diff < 200 ? diff : 0;   // yalnızca makul bir fark (durum çubuğu ölçeğinde); klavye vb. dışlanır
}

/** Alt çubuğu yeniden yerleştir: fark yazılır, gizle-göster ile sabit konum yeniden hesaplanır */
export function relayoutBars() {
  const fix = measure();
  if (fix !== lastFix) { document.documentElement.style.setProperty('--vv-fix', `${fix}px`); lastFix = fix; }
  // Klavye: yerleşim görünümü küçülmediyse görünür alandan farkı --kb ile ver (arama kapsülü klavyenin üstüne oturur)
  const vv = window.visualViewport;
  const kb = vv ? Math.max(0, Math.round(document.documentElement.clientHeight - (vv.height + vv.offsetTop))) : 0;
  document.documentElement.style.setProperty('--kb', `${kb}px`);
  document.querySelectorAll('.navdock, .action-bar.sticky').forEach((el) => {
    const prev = el.style.display; el.style.display = 'none'; void el.offsetHeight; el.style.display = prev;
  });
}

/** Birkaç kez ölç: iOS düzeltmeyi gecikmeli yapıyor */
export function relayoutSoon() { requestAnimationFrame(relayoutBars); [120, 400, 900].forEach((ms) => setTimeout(relayoutBars, ms)); }

export function initViewportFix() {
  const vv = window.visualViewport;
  if (vv) { vv.addEventListener('resize', relayoutBars); vv.addEventListener('scroll', relayoutBars); }
  window.addEventListener('resize', relayoutBars);
  window.addEventListener('pageshow', relayoutSoon);
  window.addEventListener('orientationchange', relayoutSoon);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) relayoutSoon(); });
  relayoutSoon(); setTimeout(relayoutBars, 2500);
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
  box.querySelector('[data-act=fix]').onclick = () => { relayoutBars(); paint(); };
  box.querySelector('[data-act=copy]').onclick = () => { navigator.clipboard?.writeText(JSON.stringify(metrics())); };
  box.querySelector('[data-act=close]').onclick = () => { clearInterval(timer); box.remove(); };
}
