/* Ayarlar alt ekranları: işlem şablonları, silinenler, denetim kaydı — sheet olarak açılır */
import { Templates, Patients, Procedures, Photos, Appointments, Audit, trashList, fullName } from '../db.js';
import { sheet, field, selectField, chipField, bindChoiceFields, segmentField, esc, icon, toast, confirmDialog, actionMenu, fmtDate, fmtDateTime, emptyState, formData } from '../ui.js';
import { t, procLabel, apptLabel } from '../i18n.js';
import { FOLLOWUP_PERIODS, ANGLES, FIELD_TYPES, TRASH_DAYS, angleLabel, fieldTypeLabel, fieldLabel, periodLabel } from '../model.js';
import { blobURL } from '../photos.js';
import { MESSAGE_KEYS, getTemplates, saveTemplates, defaultTemplate } from '../messages.js';

/* ---------------- Şablonlar ---------------- */
export async function templatesSheet() {
  const s = sheet({ title: t('tpl.title'), size: 'md', closeText: t('common.close'), footer: `<button class="btn btn-primary" type="button" data-act="new">${esc(t('tpl.new'))}</button>` });
  async function paint() {
    const list = await Templates.all();
    s.body.innerHTML = list.length ? `<div class="list">${list.map((x) => `
      <button class="row" type="button" data-tpl="${x.id}">
        <div class="row-main">
          <div class="row-title">${esc(x.name)}</div>
          <div class="row-sub">${esc(t('tpl.sub', { f: (x.followUpPeriods || []).length, a: (x.angleSet || []).length, x: (x.fields || []).length }))}</div>
        </div>
        <div class="row-end">${icon('chevron')}</div>
      </button>`).join('')}</div>` : emptyState({ title: t('form.proc.noTemplates') });
    s.body.querySelectorAll('[data-tpl]').forEach((b) => { b.onclick = async () => { const tpl = list.find((x) => x.id === b.dataset.tpl); if (await templateForm(tpl)) paint(); }; });
  }
  s.el.querySelector('[data-act=new]').onclick = async () => { if (await templateForm(null)) paint(); };
  await paint();
  return s.result;
}

/** Şablon düzenleme: ad, kontrol dönemleri, açılar, türe özel alanlar (satır satır ekle/kaldır) */
function templateForm(existing) {
  const tpl = existing || { name: '', followUpPeriods: ['w1', 'm1', 'm3', 'm6', 'y1'], angleSet: ['front', 'right45', 'rightProfile', 'left45', 'leftProfile'], fields: [] };
  let fields = (tpl.fields || []).map((f) => ({ ...f, options: [...(f.options || [])] }));
  const s = sheet({
    title: existing ? t('tpl.edit') : t('tpl.new'),
    size: 'md',
    footer: `<button class="btn btn-primary" type="submit" form="sheet-form">${esc(t('tpl.save'))}</button>`,
    content: `
      <form id="sheet-form" class="form" novalidate>
        ${field({ label: t('tpl.name'), name: 'name', value: tpl.name, required: true, attrs: 'autocapitalize="words"' })}
        ${chipField({ label: t('tpl.followUps'), name: 'followUpPeriods', value: (tpl.followUpPeriods || []).join(','), options: FOLLOWUP_PERIODS.map((k) => [k, t(`sched.short.${k}`)]), multiple: true })}
        ${chipField({ label: t('tpl.angles'), name: 'angleSet', value: (tpl.angleSet || []).join(','), options: ANGLES.map((k) => [k, angleLabel(k)]), multiple: true })}
        <div class="field">
          <span class="field-label">${esc(t('tpl.fields'))} <span class="opt">${esc(t('common.optional'))}</span></span>
          <div id="tpl-fields"></div>
          <button type="button" class="btn btn-secondary btn-sm" data-act="add-field">${esc(t('tpl.addField'))}</button>
        </div>
        ${existing ? `<button type="button" class="btn btn-ghost t-danger" data-act="delete" style="margin-top:8px">${esc(t('tpl.delete'))}</button>` : ''}
      </form>`,
  });
  const form = s.body.querySelector('form');
  bindChoiceFields(form);
  const box = form.querySelector('#tpl-fields');
  function paintFields() {
    box.innerHTML = fields.map((f, i) => `
      <div class="tpl-field ${f.type === 'select' ? 'has-options' : ''}" data-i="${i}">
        <div style="display:grid;grid-template-columns:1fr auto 44px;gap:8px;align-items:end">
          <label class="field"><span class="field-label">${esc(t('tpl.field.label'))}</span><input class="input" data-k="label" value="${esc(f.label || fieldLabel(f.key))}"></label>
          <label class="field"><span class="field-label">${esc(t('tpl.field.type'))}</span><span class="select-wrap"><select class="input" data-k="type">${FIELD_TYPES.map((k) => `<option value="${k}" ${k === f.type ? 'selected' : ''}>${esc(fieldTypeLabel(k))}</option>`).join('')}</select>${icon('down', 'select-caret')}</span></label>
          <button type="button" class="rm" data-act="rm" aria-label="${esc(t('common.remove'))}">${icon('x')}</button>
        </div>
        ${f.type === 'select' ? `<label class="field"><span class="field-label">${esc(t('tpl.field.options'))}</span><input class="input" data-k="options" value="${esc((f.options || []).join(', '))}"></label>` : ''}
      </div>`).join('');
    box.querySelectorAll('.tpl-field').forEach((row) => {
      const i = +row.dataset.i;
      row.querySelector('[data-k=label]').oninput = (e) => { fields[i].label = e.target.value; };
      row.querySelector('[data-k=type]').onchange = (e) => { fields[i].type = e.target.value; paintFields(); };
      const opt = row.querySelector('[data-k=options]');
      if (opt) opt.oninput = (e) => { fields[i].options = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); };
      row.querySelector('[data-act=rm]').onclick = () => { fields.splice(i, 1); paintFields(); };
    });
  }
  form.querySelector('[data-act=add-field]').onclick = () => { fields.push({ key: '', label: '', type: 'text', options: [] }); paintFields(); box.querySelector('.tpl-field:last-child [data-k=label]')?.focus(); };
  paintFields();
  const del = form.querySelector('[data-act=delete]');
  if (del) del.onclick = async () => {
    const ok = await confirmDialog({ title: t('tpl.deleteQ'), message: t('tpl.deleteMsg'), okText: t('common.delete'), danger: true });
    if (!ok) return;
    await Templates.remove(existing.id); toast(t('tpl.deleted')); s.close(true);
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelector('.form-error')?.remove();
    const d = formData(form);
    if (!d.name) { form.insertAdjacentHTML('afterbegin', `<div class="form-error">${esc(t('tpl.nameRequired'))}</div>`); return; }
    // Alan anahtarı: mevcutsa korunur; yeni alanlarda etiketten üretilir (native'de aynı anahtar okunur)
    const clean = fields.filter((f) => (f.label || f.key).trim()).map((f) => ({ key: f.key || slug(f.label), label: f.label || '', type: f.type || 'text', options: f.type === 'select' ? (f.options || []) : [] }));
    await Templates.save({ ...tpl, name: d.name, followUpPeriods: String(d.followUpPeriods || '').split(',').filter(Boolean), angleSet: String(d.angleSet || '').split(',').filter(Boolean), fields: clean });
    toast(t('tpl.saved')); s.close(true);
  });
  return s.result;
}
const slug = (s) => String(s).toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field';

/* ---------------- Silinenler ---------------- */
export async function trashSheet() {
  const s = sheet({ title: t('trash.title'), size: 'md', closeText: t('common.close') });
  async function paint() {
    const tl = await trashList();
    const total = tl.patients.length + tl.procedures.length + tl.photos.length + tl.appointments.length;
    const row = (kind, id, title, sub, deletedAt) => `
      <button class="row" type="button" data-kind="${kind}" data-id="${id}">
        <div class="row-main">
          <div class="row-title">${esc(title)}</div>
          <div class="row-sub">${esc([t(`trash.${kind}`), sub, t('trash.deletedAt', { d: fmtDate(deletedAt) })].filter(Boolean).join(' · '))}</div>
        </div>
        <div class="row-end">${icon('chevron')}</div>
      </button>`;
    s.body.innerHTML = total ? `<div class="list">
      ${tl.patients.map((p) => row('patient', p.id, fullName(p), '', p.deletedAt)).join('')}
      ${tl.procedures.map((p) => row('procedure', p.id, procLabel(p.typeName), fmtDate(p.date), p.deletedAt)).join('')}
      ${tl.appointments.map((a) => row('appointment', a.id, apptLabel(a), fmtDateTime(a.date), a.deletedAt)).join('')}
      ${tl.photos.map((ph) => row('photo', ph.id, `${periodLabel(ph.period || 'other')} · ${angleLabel(ph.angle || 'custom')}`, fmtDate(ph.date), ph.deletedAt)).join('')}
    </div>` : emptyState({ title: t('trash.empty'), text: t('trash.emptyText', { days: TRASH_DAYS }) });
    s.body.querySelectorAll('[data-kind]').forEach((b) => {
      b.onclick = async () => {
        const store = { patient: Patients, procedure: Procedures, photo: Photos, appointment: Appointments }[b.dataset.kind];
        const v = await actionMenu(b.querySelector('.row-title').textContent, [
          { label: t('trash.restore'), icon: 'clock', value: 'restore' },
          { label: t('trash.purge'), icon: 'trash', value: 'purge', danger: true },
        ]);
        if (v === 'restore') { await store.restore(b.dataset.id); toast(t('trash.restored')); paint(); }
        if (v === 'purge') {
          const ok = await confirmDialog({ title: t('trash.purgeQ'), message: t('trash.purgeMsg'), okText: t('trash.purge'), danger: true });
          if (ok) { await store.purge(b.dataset.id); toast(t('trash.purged')); paint(); }
        }
      };
    });
  }
  await paint();
  return s.result;
}

/* ---------------- Denetim kaydı ---------------- */
export async function auditSheet() {
  const s = sheet({ title: t('audit.title'), size: 'md', closeText: t('common.close') });
  const rows = await Audit.list(300);
  s.body.innerHTML = rows.length ? rows.map((r) => `
    <div class="audit-row">
      <div class="t-body">${esc(t(`audit.${r.action}`))} · ${esc(t(`audit.entity.${r.entity}`))}${r.summary ? ` · ${esc(r.summary)}` : ''}</div>
      <span class="t-caption">${esc(fmtDateTime(r.at))}</span>
    </div>`).join('') : emptyState({ title: t('audit.empty') });
  return s.result;
}

/* ---------------- Mesaj şablonları (Adım 8) ---------------- */
export async function messagesSheet() {
  const tpls = await getTemplates();
  const s = sheet({
    title: t('msg.title'), size: 'md',
    footer: `<button class="btn btn-primary" type="submit" form="sheet-form">${esc(t('common.save'))}</button>`,
    content: `
      <form id="sheet-form" class="form" novalidate>
        <p class="t-caption">${esc(t('msg.placeholders'))}</p>
        ${MESSAGE_KEYS.map((k) => `
          <label class="field">
            <span class="field-label">${esc(t(`msg.${k}`))}</span>
            <textarea class="input" name="${k}" rows="4">${esc(tpls[k])}</textarea>
            <button type="button" class="section-link" data-reset="${k}">${esc(t('msg.reset'))}</button>
          </label>`).join('')}
      </form>`,
  });
  const form = s.body.querySelector('form');
  form.querySelectorAll('[data-reset]').forEach((b) => { b.onclick = () => { form[b.dataset.reset].value = defaultTemplate(b.dataset.reset); }; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = formData(form);
    await saveTemplates(Object.fromEntries(MESSAGE_KEYS.map((k) => [k, String(d[k] || '').trim() || defaultTemplate(k)])));
    toast(t('msg.saved')); s.close(true);
  });
  return s.result;
}
