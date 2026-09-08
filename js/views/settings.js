/* Ayarlar — bölüm etiketi + hairline satırlar; yıkıcı eylem yalnızca kırmızı metin */
import { counts, clearAllData, Templates, trashCount, Audit } from '../db.js';
import { templatesSheet, trashSheet, auditSheet } from './manage.js';
import { TRASH_DAYS } from '../model.js';
import { esc, icon, toast, confirmDialog, actionMenu } from '../ui.js';
import { setTopbar } from '../nav.js';
import { storageInfo, requestPersist, fmtBytes, downloadBackup, pickBackupFile, restoreBackup } from '../storage.js';
import { hasPin, getLockDelay, setLockDelay, clearPin, setupPinFlow, requirePin, LOCK_DELAYS, delayLabel as lockDelayLabel } from '../lock.js';
import { getTheme, applyTheme, THEMES } from '../theme.js';
import { segmented, bindSegmented } from '../ui.js';
import { t, getLang, setLang, LANGS, applyStaticText } from '../i18n.js';

export const APP_VERSION = '0.8.6';

export async function render(root) {
  setTopbar({ title: t('s.title') });
  const [c, st, pinOn, lockDelay, tplCount, trashN, auditN] = await Promise.all([counts(), storageInfo(), hasPin(), getLockDelay(), Templates.all().then((l) => l.length), trashCount(), Audit.count()]);
  const delayLabel = lockDelayLabel(lockDelay);
  const modeTitle = st.inApp ? t('s.mode.inApp') : st.standalone ? t('s.mode.standalone') : t('s.mode.tab');
  const modeSub = st.inApp ? t('s.mode.inAppSub') : st.ios && !st.standalone ? t('s.mode.iosSub') : '';
  const persistTitle = st.persisted === true ? t('s.persist.on') : st.persisted === false ? t('s.persist.off') : t('s.persist');

  const rowBtn = (act, title, sub, { value = '', danger = false, disabled = false } = {}) => `
    <button class="setting-row ${danger ? 'danger' : ''}" type="button" data-act="${act}" ${disabled ? 'disabled' : ''}>
      <div class="setting-main"><div class="setting-title">${title}</div>${sub ? `<div class="setting-sub">${sub}</div>` : ''}</div>
      ${value ? `<div class="setting-value">${value}</div>` : ''}${disabled ? '' : icon('chevron')}
    </button>`;
  const rowInfo = (title, sub, value = '') => `
    <div class="setting-row">
      <div class="setting-main"><div class="setting-title">${title}</div>${sub ? `<div class="setting-sub">${sub}</div>` : ''}</div>
      ${value ? `<div class="setting-value">${value}</div>` : ''}
    </div>`;

  root.innerHTML = `
    <div class="screen">
    <div class="page-head">
      <div>
        <h1 class="page-title">${esc(t('s.title'))}</h1>
        <div class="page-sub">${esc(t('s.sub'))}</div>
      </div>
    </div>

    <section class="section">
      <div class="section-label">${esc(t('s.appearance'))}</div>
      ${segmented({ name: 'theme', value: getTheme(), options: THEMES.map((k) => [k, t(`s.theme.${k}`)]) })}
    </section>

    <section class="section">
      <div class="section-label">${esc(t('s.language'))}</div>
      ${segmented({ name: 'lang', value: getLang(), options: LANGS })}
    </section>

    <section class="section">
      <div class="section-label">${esc(t('s.security'))}</div>
      ${rowBtn('pin', esc(t('s.pin')), pinOn ? esc(lockDelay ? t('s.pin.locksAfter', { d: delayLabel }) : t('s.pin.locksImmediately')) : '', { value: esc(pinOn ? t('s.pin.on') : t('s.pin.off')) })}
    </section>

    <section class="section">
      <div class="section-label">${esc(t('s.templates'))}</div>
      ${rowBtn('templates', esc(t('s.templates')), esc(t('s.templates.sub', { n: tplCount })))}
    </section>

    <section class="section">
      <div class="section-label">${esc(t('s.backup'))}</div>
      ${rowBtn('backup', esc(t('s.backup.take')), '')}
      ${rowBtn('restore', esc(t('s.backup.restore')), '')}
    </section>

    <section class="section">
      <div class="section-label">${esc(t('s.storage'))}</div>
      ${rowInfo(esc(modeTitle), esc(modeSub))}
      ${st.persisted === false ? rowBtn('persist', esc(persistTitle), esc(t('s.persist.tap'))) : rowInfo(esc(persistTitle), '')}
      ${rowInfo(esc(t('s.usage')), '', `${esc(fmtBytes(st.usage))}${st.quota ? ` / ${esc(fmtBytes(st.quota))}` : ''}`)}
      ${rowInfo(esc(t('s.records')), '', esc(t('s.records.line', c)))}
    </section>

    <section class="section">
      <div class="section-label">${esc(t('s.data'))}</div>
      ${rowBtn('trash', esc(t('s.trash')), esc(t('s.trash.sub', { n: trashN, days: TRASH_DAYS })), { value: trashN ? String(trashN) : '' })}
      ${rowBtn('audit', esc(t('s.audit')), '', { value: String(auditN) })}
      ${rowBtn('clear', esc(t('s.clear')), '', { danger: true })}
    </section>

    <p class="t-caption section app-mark" style="color:var(--text-tertiary)"><img src="icons/icon.svg" alt="" width="20" height="20">${esc(t('s.version', { v: APP_VERSION }))}</p>
    </div>`;

  bindSegmented(root.querySelector('.seg[data-name=theme]'), (v) => applyTheme(v));
  // Dil değişince sabit metinler ve bu ekran yeniden çizilir; diğer ekranlar açıldıklarında yeni dili kullanır
  bindSegmented(root.querySelector('.seg[data-name=lang]'), (v) => { setLang(v); applyStaticText(); render(root); });
  root.querySelector('[data-act=pin]').onclick = async () => {
    if (!pinOn) {
      if (await setupPinFlow()) { toast(t('s.pin.enabled')); render(root); }
      return;
    }
    const v = await actionMenu(t('s.pin'), [
      { label: t('s.pin.change'), value: 'change' },
      { label: t('s.pin.delay', { d: delayLabel }), value: 'delay' },
      { label: t('s.pin.remove'), danger: true, value: 'remove' },
    ]);
    if (v === 'change') {
      if (!(await requirePin())) return;
      if (await setupPinFlow()) { toast(t('s.pin.changed')); render(root); }
    } else if (v === 'delay') {
      const d = await actionMenu(t('s.pin.delayTitle'), LOCK_DELAYS.map((sec) => ({ label: lockDelayLabel(sec), value: String(sec), checked: sec === lockDelay })));
      if (d == null) return;
      await setLockDelay(Number(d));
      render(root);
    } else if (v === 'remove') {
      if (!(await requirePin())) return;
      await clearPin();
      toast(t('s.pin.removed'));
      render(root);
    }
  };
  root.querySelector('[data-act=templates]').onclick = async () => { await templatesSheet(); render(root); };
  root.querySelector('[data-act=trash]').onclick = async () => { await trashSheet(); render(root); };
  root.querySelector('[data-act=audit]').onclick = () => auditSheet();
  root.querySelector('[data-act=backup]').onclick = async () => {
    const b = root.querySelector('[data-act=backup]');
    b.disabled = true;
    try {
      const r = await downloadBackup();
      if (r) toast(r.shared ? t('s.backup.shared') : t('s.backup.downloaded', { size: fmtBytes(r.size) }));
    } catch (e) { toast(t('s.backup.fail', { e: e.message || e }), { kind: 'danger', duration: 5000 }); }
    b.disabled = false;
  };
  root.querySelector('[data-act=restore]').onclick = async () => {
    const f = await pickBackupFile();
    if (!f) return;
    try {
      const r = await restoreBackup(f);
      if (r) render(root);
    } catch (e) { toast(e.message || t('s.restore.fail'), { kind: 'danger', duration: 5000 }); }
  };
  const persist = root.querySelector('[data-act=persist]');
  if (persist) persist.onclick = async () => {
    const ok = await requestPersist();
    toast(ok ? t('s.persist.granted') : t('s.persist.denied'));
    render(root);
  };
  root.querySelector('[data-act=clear]').onclick = async () => {
    const ok = await confirmDialog({ title: t('s.clearQ'), message: t('s.clearMsg', c), okText: t('s.clearOk'), danger: true });
    if (!ok) return;
    await clearAllData();
    toast(t('s.cleared'));
    render(root);
  };
}
