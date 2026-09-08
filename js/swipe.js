/* Liste etkileşimleri — TASARIM.md §5B (W~): kaydırma aksiyonları ve uzun basma
 * Satır HTML'i swipeWrap ile sarılır: sola kaydırınca sağdaki, sağa kaydırınca soldaki aksiyonlar açılır.
 * Dikey kaydırma tarayıcıya bırakılır (touch-action: pan-y); yatay hareket satırı kaydırır.
 * Uzun basma (400ms, hareketsiz) ayrı bir eylem tetikler; ardından gelen tık yutulur. */
import { esc, icon } from './ui.js';
import { t, isOp } from './i18n.js';

const ACTION_W = 72;
const LONG_PRESS = 400;
let openRow = null;

/** Satırı sar. left: sağa kaydırınca görünenler; right: sola kaydırınca görünenler. [{ key, icon, label, danger }] */
export function swipeWrap(rowHtml, key, { left = [], right = [] } = {}) {
  const acts = (list, side) => list.length ? `<div class="swipe-actions ${side}">${list.map((a) => `<button type="button" class="swipe-act ${a.danger ? 'danger' : ''}" data-swipe-act="${esc(a.key)}" aria-label="${esc(a.label)}">${icon(a.icon)}<span>${esc(a.label)}</span></button>`).join('')}</div>` : '';
  return `<div class="swipe" data-swipe="${esc(key)}" data-left="${left.length}" data-right="${right.length}">${acts(left, 'left')}${acts(right, 'right')}<div class="swipe-body">${rowHtml}</div></div>`;
}

/** Randevu satırı aksiyonları — her ekranda aynı (deneme bulgusu 1).
 *  planlı kontrol: sağa Geldi · sola Gelmedi; geciken: sağa Geldi · sola Yeniden planla; planlı işlem: sağa Yapıldı · sola Tarihi değiştir. */
export function apptActions(a, { overdue = false } = {}) {
  if (isOp(a)) return a.status === 'planned' ? { left: [{ key: 'attended', icon: 'check', label: t('swipe.done') }], right: [{ key: 'redate', icon: 'calendar', label: t('swipe.redate') }] } : {};
  if (overdue || a.status === 'missed') return { left: [{ key: 'attended', icon: 'check', label: t('swipe.attended') }], right: [{ key: 'reschedule', icon: 'clock', label: t('swipe.reschedule') }] };
  if (a.status === 'planned') return { left: [{ key: 'attended', icon: 'check', label: t('swipe.attended') }], right: [{ key: 'missed', icon: 'alert', label: t('swipe.missed'), danger: true }] };
  return {};
}

export function closeOpenRow() {
  if (!openRow) return;
  openRow.querySelector('.swipe-body').style.transform = '';
  openRow.classList.remove('open');
  openRow = null;
}

/**
 * scope içindeki tüm .swipe satırlarına jestleri bağlar.
 * onAction(key, actKey, rowEl); onLongPress(key, rowEl)
 */
export function bindSwipe(scope, { onAction, onLongPress } = {}) {
  scope.querySelectorAll('.swipe').forEach((row) => {
    const body = row.querySelector('.swipe-body');
    const leftW = (+row.dataset.left || 0) * ACTION_W;
    const rightW = (+row.dataset.right || 0) * ACTION_W;
    let x0 = 0, y0 = 0, dx = 0, dragging = false, decided = false, base = 0, timer = null, suppress = false, pid = null;
    const setX = (x, animate) => { body.style.transition = animate ? 'transform 200ms cubic-bezier(.2,.8,.2,1)' : 'none'; body.style.transform = x ? `translateX(${x}px)` : ''; };
    const clearLP = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const finish = (x) => {
      // Eşik: aksiyon genişliğinin yarısı → açık kal; değilse kapan
      if (x > 0 && leftW && x > leftW / 2) { setX(leftW, true); row.classList.add('open'); openRow = row; }
      else if (x < 0 && rightW && -x > rightW / 2) { setX(-rightW, true); row.classList.add('open'); openRow = row; }
      else { setX(0, true); row.classList.remove('open'); if (openRow === row) openRow = null; }
    };
    body.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (openRow && openRow !== row) closeOpenRow();
      pid = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0; dragging = false; decided = false;
      base = row.classList.contains('open') ? (row.querySelector('.swipe-body').style.transform.includes('-') ? -rightW : leftW) : 0;
      clearLP();
      if (onLongPress) timer = setTimeout(() => { timer = null; suppress = true; setTimeout(() => { suppress = false; }, 600); onLongPress(row.dataset.swipe, row); }, LONG_PRESS);
    });
    body.addEventListener('pointermove', (e) => {
      if (pid === null || e.pointerId !== pid) return;
      const mx = e.clientX - x0, my = e.clientY - y0;
      if (!decided) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        decided = true;
        if (Math.abs(my) > Math.abs(mx)) { clearLP(); pid = null; return; }   // dikey: tarayıcı kaydırsın
        dragging = true; clearLP();
        try { body.setPointerCapture(pid); } catch { /* yok say */ }
      }
      if (!dragging) return;
      let x = base + mx;
      // Aksiyon yoksa o yöne gitme; sınırı aşınca lastikli direnç
      if (x > 0) x = leftW ? Math.min(x, leftW + (x - leftW) * 0.25) : 0;
      if (x < 0) x = rightW ? Math.max(x, -rightW + (x + rightW) * 0.25) : 0;
      dx = x; setX(x, false);
    });
    const end = (e) => {
      if (pid === null || e.pointerId !== pid) { clearLP(); return; }
      clearLP(); pid = null;
      if (!dragging) return;
      dragging = false; suppress = true; setTimeout(() => { suppress = false; }, 350);
      finish(dx);
    };
    body.addEventListener('pointerup', end);
    body.addEventListener('pointercancel', end);
    // Kaydırma / uzun basma sonrası tık yutulur; açık satırda tık kapatır
    body.addEventListener('click', (e) => {
      if (suppress) { e.preventDefault(); e.stopPropagation(); return; }
      if (row.classList.contains('open')) { e.preventDefault(); e.stopPropagation(); closeOpenRow(); }
    }, true);
    row.addEventListener('contextmenu', (e) => { if (onLongPress) e.preventDefault(); });
    row.addEventListener('dragstart', (e) => e.preventDefault());   // fare ile bağlantı sürükleme pointercancel üretir
    row.querySelectorAll('[data-swipe-act]').forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); const k = b.dataset.swipeAct; closeOpenRow(); onAction?.(row.dataset.swipe, k, row); };
    });
  });
  // Dışarı dokununca açık satır kapanır
  if (!scope.__swipeOutside) {
    scope.__swipeOutside = true;
    document.addEventListener('pointerdown', (e) => { if (openRow && !openRow.contains(e.target)) closeOpenRow(); }, { passive: true });
  }
}
