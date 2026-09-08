/* Formlar: hasta, işlem, randevu, fotoğraf — MOBIL.md §2 alanları */
import { Patients, Procedures, Appointments, Photos, Templates, hydrateBlob } from './db.js';
import { buildControls, buildOperation, skipSunday, todayISO, toLocalISO, CONTROL_SCHEDULE, OP_KEY, DEFAULT_OP_TIME } from './schedule.js';
import { processImage, readExifDate, blobURL } from './photos.js';
import { sheet, field, selectField, textareaField, segmentField, chipField, bindChoiceFields, segmented, bindSegmented, formData, esc, icon, toast, fmtDate, parseDate, daysBetween } from './ui.js';
import { t, cmp, procLabel } from './i18n.js';
import {
  PERIODS, FOLLOWUP_PERIODS, DEFAULT_FOLLOWUPS, ANGLES, sortAngles, APPT_TYPES, APPT_STATUSES, CONSENT_STATUSES, ANESTHESIA, DEFAULT_ANESTHESIA,
  periodLabel, angleLabel, apptTypeLabel, statusLabel, consentLabel, anesthesiaLabel, fieldLabel, optionLabel, periodFromDays,
} from './model.js';

export const procOption = (pr) => [pr.id, `${procLabel(pr.typeName)} · ${fmtDate(pr.date)}`];
const byLabel = (list, label) => list.map((v) => [v, label(v)]).sort((a, b) => cmp(a[1], b[1]));
export const anesthesiaOptions = () => byLabel(ANESTHESIA, anesthesiaLabel);

/* Tek dolu buton, tam genişlik; Vazgeç sheet başlığında */
function footer(okText = t('common.save')) {
  return `<button class="btn btn-primary" type="submit" form="sheet-form">${okText}</button>`;
}

function wireForm(s, onSubmit) {
  const form = s.body.querySelector('form');
  bindChoiceFields(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = form.querySelector('.form-error');
    if (err) err.remove();
    const submit = s.el.querySelector('[type=submit]');
    submit.disabled = true;
    try {
      const result = await onSubmit(formData(form), form);
      s.close(result);
    } catch (ex) {
      form.insertAdjacentHTML('afterbegin', `<div class="form-error">${esc(ex.message || t('common.saveFail'))}</div>`);
      submit.disabled = false;
    }
  });
  return form;
}

const sectionLabel = (k) => `<div class="form-section">${esc(t(k))}</div>`;
const yesNo = (name, value, label) => segmentField({ label, name, value: value ? '1' : '', options: [['', t('form.no')], ['1', t('form.yes')]], optional: false });

/* ---------------- Hasta ---------------- */
export function patientForm(existing = null) {
  const p = existing || {};
  let consentDoc = p.consentDocument || null;   // { blob: ArrayBuffer, mime, width, height }
  const s = sheet({
    title: existing ? t('form.patient.edit') : t('form.patient.new'),
    footer: footer(t('form.patient.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        ${sectionLabel('form.sec.identity')}
        <div class="form-row">
          ${field({ label: t('form.firstName'), name: 'firstName', value: p.firstName, required: true, attrs: 'autocomplete="off" autocapitalize="words"' })}
          ${field({ label: t('form.lastName'), name: 'lastName', value: p.lastName, required: true, attrs: 'autocomplete="off" autocapitalize="words"' })}
        </div>
        <div class="form-row">
          ${field({ label: t('form.phone'), name: 'phone', type: 'tel', value: p.phone, placeholder: t('form.phone.ph'), attrs: 'inputmode="tel"' })}
          ${field({ label: t('form.birthDate'), name: 'birthDate', type: 'date', value: p.birthDate })}
        </div>
        ${segmentField({ label: t('form.gender'), name: 'gender', value: existing ? (p.gender || '') : 'F', options: [['F', t('gender.F')], ['M', t('gender.M')], ['', t('gender.none')]] })}

        ${sectionLabel('form.sec.clinical')}
        ${field({ label: t('form.allergies'), name: 'allergies', value: p.allergies, placeholder: t('form.allergies.ph') })}
        ${field({ label: t('form.medications'), name: 'medications', value: p.medications, placeholder: t('form.medications.ph') })}
        <div class="form-row">
          ${yesNo('anticoagulant', p.anticoagulant, t('form.anticoagulant'))}
          ${yesNo('smoking', p.smoking, t('form.smoking'))}
        </div>
        ${field({ label: t('form.priorSurgeries'), name: 'priorSurgeries', value: p.priorSurgeries, placeholder: t('form.priorSurgeries.ph') })}

        ${sectionLabel('form.sec.consent')}
        ${selectField({ label: t('form.consentStatus'), name: 'consentStatus', value: p.consentStatus || 'none', options: CONSENT_STATUSES.map((k) => [k, consentLabel(k)]), optional: false })}
        <div class="form-row">
          ${field({ label: t('form.consentDate'), name: 'consentDate', type: 'date', value: p.consentDate })}
          <div class="field">
            <span class="field-label">${esc(t('form.consentDoc'))} <span class="opt">${esc(t('common.optional'))}</span></span>
            <input type="file" accept="image/*" class="hidden" id="consent-input">
            <div class="doc-pick" id="consent-pick"></div>
          </div>
        </div>

        ${sectionLabel('form.sec.other')}
        <div class="form-row">
          ${selectField({ label: t('form.bloodType'), name: 'bloodType', value: p.bloodType || '', options: [['', t('form.bloodType.unknown')], '0 Rh+', '0 Rh-', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-'] })}
          ${field({ label: t('form.email'), name: 'email', type: 'email', value: p.email, attrs: 'autocomplete="off"' })}
        </div>
        ${field({ label: t('form.referral'), name: 'referral', value: p.referral, placeholder: t('form.referral.ph') })}
        ${textareaField({ label: t('form.notes'), name: 'notes', value: p.notes, placeholder: t('form.notes.ph') })}
      </form>`,
  });
  const form = s.body.querySelector('form');
  const input = form.querySelector('#consent-input');
  const pick = form.querySelector('#consent-pick');
  const paintDoc = () => {
    pick.innerHTML = consentDoc
      ? `<img src="${blobURL(`consent:${consentDoc.blob.byteLength}:${Date.now()}`, hydrateBlob(consentDoc.blob, consentDoc.mime))}" alt="">
         <button type="button" class="btn btn-secondary btn-sm" data-act="replace">${esc(t('form.consentDoc.replace'))}</button>
         <button type="button" class="section-link t-danger" data-act="remove">${esc(t('form.consentDoc.remove'))}</button>`
      : `<button type="button" class="btn btn-secondary btn-sm" data-act="pick">${esc(t('form.consentDoc.pick'))}</button>`;
    pick.querySelectorAll('[data-act=pick],[data-act=replace]').forEach((b) => { b.onclick = () => input.click(); });
    const rm = pick.querySelector('[data-act=remove]');
    if (rm) rm.onclick = () => { consentDoc = null; paintDoc(); };
  };
  input.onchange = async () => {
    const f = input.files[0]; input.value = '';
    if (!f) return;
    const img = await processImage(f);
    consentDoc = { blob: await img.blob.arrayBuffer(), mime: 'image/jpeg', width: img.width, height: img.height };
    paintDoc();
  };
  paintDoc();
  wireForm(s, async (d) => {
    if (!d.firstName || !d.lastName) throw new Error(t('form.nameRequired'));
    return Patients.save({
      ...p, firstName: d.firstName, lastName: d.lastName, phone: d.phone, birthDate: d.birthDate, gender: d.gender,
      allergies: d.allergies, medications: d.medications, anticoagulant: !!d.anticoagulant, smoking: !!d.smoking, priorSurgeries: d.priorSurgeries,
      consentStatus: d.consentStatus || 'none', consentDate: d.consentDate || null, consentDocument: consentDoc,
      bloodType: d.bloodType, email: d.email, referral: d.referral, notes: d.notes,
    });
  });
  return s.result;
}

/* ---------------- İşlem ---------------- */
/** Şablonun türe özel alanlarını çizer; değerler details[key] altında saklanır */
function detailFields(tpl, details = {}) {
  if (!tpl || !tpl.fields?.length) return '';
  return `<div class="form-section">${esc(t('form.proc.details'))}</div>${tpl.fields.map((f) => {
    const name = `detail__${f.key}`;
    const v = details[f.key];
    if (f.type === 'select') return selectField({ label: fieldLabel(f.key), name, value: v || '', options: [['', '—'], ...(f.options || []).map((o) => [o, optionLabel(o)])] });
    if (f.type === 'toggle') return yesNo(name, !!v, fieldLabel(f.key));
    if (f.type === 'number') return field({ label: fieldLabel(f.key), name, type: 'number', value: v ?? '', attrs: 'inputmode="decimal" step="any"' });
    return field({ label: fieldLabel(f.key), name, value: v || '' });
  }).join('')}`;
}

export async function procedureForm({ patientId, existing = null, procedures = [] }) {
  const p = existing || {};
  const isNew = !existing;
  const templates = await Templates.all();
  const byId = Object.fromEntries(templates.map((x) => [x.id, x]));
  let tplId = p.templateId && byId[p.templateId] ? p.templateId : (templates[0]?.id || '');
  const others = procedures.filter((x) => x.id !== p.id);
  const comp = p.complication || null;
  const s = sheet({
    title: isNew ? t('form.proc.new') : t('form.proc.edit'),
    footer: footer(t('form.proc.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        ${templates.length
          ? chipField({ label: t('form.proc.type'), name: 'templateId', value: tplId, options: templates.map((x) => [x.id, x.name]), required: true })
          : `<p class="field-hint">${esc(t('form.proc.noTemplates'))}</p>`}
        ${field({ label: t('form.proc.title'), name: 'title', value: p.title, placeholder: t('form.proc.title.ph') })}
        <div class="form-row">
          ${field({ label: t('form.proc.date'), name: 'date', type: 'date', value: p.date || todayISO(), required: true })}
          ${field({ label: t('form.proc.time'), name: 'time', type: 'time', value: p.time || DEFAULT_OP_TIME, optional: false })}
        </div>
        <p class="field-hint" style="margin-top:-6px">${esc(t('form.proc.dateHint'))}</p>
        ${selectField({ label: t('form.proc.anesthesia'), name: 'anesthesia', value: p.anesthesia || DEFAULT_ANESTHESIA, options: anesthesiaOptions(), optional: false })}
        <div id="tpl-details">${detailFields(byId[tplId], p.details)}</div>
        ${textareaField({ label: t('form.proc.notes'), name: 'notes', value: p.notes, placeholder: t('form.proc.notes.ph'), rows: 4 })}
        ${yesNo('complication', !!comp?.present, t('form.proc.complication'))}
        <div id="comp-fields" ${comp?.present ? '' : 'hidden'}>
          ${field({ label: t('form.proc.complicationNote'), name: 'complicationNote', value: comp?.note || '' })}
          ${field({ label: t('form.proc.complicationDate'), name: 'complicationDate', type: 'date', value: comp?.date || '' })}
        </div>
        ${others.length ? selectField({ label: t('form.proc.revisionOf'), name: 'revisionOf', value: p.revisionOf || '', options: [['', t('form.proc.notRevision')], ...others.map(procOption)] }) : ''}
        ${isNew ? `
        <div id="followups">${chipField({ label: t('form.proc.controls'), name: 'followUpSchedule', value: (byId[tplId]?.followUpPeriods || DEFAULT_FOLLOWUPS).join(','), options: FOLLOWUP_PERIODS.map((k) => [k, t(`sched.short.${k}`)]), multiple: true })}</div>
        <div class="form-row">
          ${field({ label: t('form.proc.controlTime'), name: 'controlTime', type: 'time', value: '10:00', optional: false })}
        </div>
        <p class="field-hint" style="margin-top:-6px">${esc(t('form.proc.controlsHint'))}</p>` : ''}
      </form>`,
  });
  const form = s.body.querySelector('form');
  // Şablon değişince türe özel alanlar ve (yeni işlemde) kontrol dönemleri şablona göre yenilenir
  form.querySelectorAll('[data-chips=templateId] .chip').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.value === tplId) return;
    tplId = b.dataset.value;
    form.querySelector('#tpl-details').innerHTML = detailFields(byId[tplId], p.details);
    bindChoiceFields(form.querySelector('#tpl-details'));
    const fu = form.querySelector('#followups');
    if (fu) { fu.innerHTML = chipField({ label: t('form.proc.controls'), name: 'followUpSchedule', value: (byId[tplId]?.followUpPeriods || DEFAULT_FOLLOWUPS).join(','), options: FOLLOWUP_PERIODS.map((k) => [k, t(`sched.short.${k}`)]), multiple: true }); bindChoiceFields(fu); }
  }));
  form.querySelectorAll('.seg[data-name=complication] .seg-btn').forEach((b) => b.addEventListener('click', () => { form.querySelector('#comp-fields').hidden = !b.dataset.value; }));

  wireForm(s, async (d) => {
    const tpl = byId[d.templateId];
    if (!tpl) throw new Error(t('form.proc.typeRequired'));
    if (!d.date) throw new Error(t('form.proc.dateRequired'));
    const details = {};
    (tpl.fields || []).forEach((f) => { const v = d[`detail__${f.key}`]; if (f.type === 'toggle') details[f.key] = !!v; else if (v !== undefined && v !== '') details[f.key] = f.type === 'number' ? Number(v) : v; });
    const keys = isNew ? String(d.followUpSchedule || '').split(',').filter(Boolean) : (p.followUpSchedule || []);
    const proc = await Procedures.save({
      ...p, patientId, templateId: tpl.id, typeName: tpl.name, title: d.title, date: d.date, time: d.time || DEFAULT_OP_TIME, anesthesia: d.anesthesia, notes: d.notes,
      details, complication: d.complication ? { present: true, note: d.complicationNote || '', date: d.complicationDate || null } : null,
      revisionOf: d.revisionOf || null, followUpSchedule: keys,
    });
    let created = [];
    if (isNew && keys.length) {
      const [hh, mm] = (d.controlTime || '10:00').split(':').map(Number);
      created = await Appointments.saveMany(buildControls(proc, { hour: hh, minute: mm, keys }));
    }
    const shifted = await syncProcedureEvents(proc, { oldDate: isNew ? null : p.date });
    return { procedure: proc, createdControls: created, shiftedControls: shifted };
  });
  return s.result;
}

/** Var olan bir işlem için kontrolleri (yeniden) üretir. Eski otomatik kontrolleri kalıcı siler; işlem günü kaydına dokunmaz. */
export async function regenerateControls(procedure, { hour = 10, minute = 0 } = {}) {
  const existing = await Appointments.byIndex('procedureId', procedure.id);
  for (const a of existing.filter((x) => x.auto && x.periodLabel !== OP_KEY)) await Appointments.purge(a.id);
  const keys = procedure.followUpSchedule?.length ? procedure.followUpSchedule : DEFAULT_FOLLOWUPS;
  return Appointments.saveMany(buildControls(procedure, { hour, minute, keys }));
}

/**
 * İşlemin Ajanda kaydını (ameliyat / işlem günü) oluşturur ya da tarih/saatle eşitler.
 * Tarih değiştiyse hâlâ planlı olan otomatik kontroller yeni tarihe göre kaydırılır (saatleri korunur).
 */
export async function syncProcedureEvents(procedure, { oldDate = null } = {}) {
  const linked = await Appointments.byIndex('procedureId', procedure.id);
  const op = linked.find((a) => a.periodLabel === OP_KEY) || null;
  await Appointments.save(buildOperation(procedure, op));
  if (!oldDate || oldDate === procedure.date) return 0;
  const base = new Date(procedure.date + 'T00:00:00');
  const moved = [];
  for (const a of linked) {
    if (!a.auto || a.periodLabel === OP_KEY || a.status !== 'planned') continue;
    const c = CONTROL_SCHEDULE.find((x) => x.key === a.periodLabel);
    if (!c) continue;
    const d = skipSunday(c.add(base));
    const [hh, mm] = a.date.slice(11, 16).split(':').map(Number);
    d.setHours(hh || 10, mm || 0, 0, 0);
    moved.push({ ...a, date: toLocalISO(d) });
  }
  if (moved.length) await Appointments.saveMany(moved);
  return moved.length;
}

/* ---------------- Randevu ---------------- */
export function appointmentForm({ patientId, procedures = [], existing = null, defaultDate = null }) {
  const a = existing || {};
  const isNew = !existing;
  const dt = a.date ? a.date : (defaultDate || toLocalISO(nextSlot()));
  const [dPart, tPart] = [dt.slice(0, 10), dt.slice(11, 16) || '10:00'];
  const procOpts = [['', t('form.appt.noProc')], ...procedures.map(procOption)];
  const types = APPT_TYPES.filter((k) => k !== 'operation' || a.type === 'operation');
  const s = sheet({
    title: isNew ? t('form.appt.new') : t('form.appt.edit'),
    footer: footer(t('form.appt.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        <div class="form-row">
          ${field({ label: t('form.appt.date'), name: 'd', type: 'date', value: dPart, required: true })}
          ${field({ label: t('form.appt.time'), name: 't', type: 'time', value: tPart, required: true })}
        </div>
        ${chipField({ label: t('form.appt.kind'), name: 'type', value: a.type || 'control', options: types.map((k) => [k, apptTypeLabel(k)]), required: true })}
        ${isNew ? '<input type="hidden" name="status" value="planned">' : segmentField({ label: t('form.appt.status'), name: 'status', value: a.status || 'planned', options: APPT_STATUSES.map((k) => [k, statusLabel(k)]), optional: false })}
        ${field({ label: t('form.appt.label'), name: 'label', value: a.label, placeholder: t('form.appt.label.ph') })}
        ${selectField({ label: t('form.appt.proc'), name: 'procedureId', value: a.procedureId || '', options: procOpts })}
        ${textareaField({ label: t('form.appt.note'), name: 'notes', value: a.notes, rows: 2 })}
      </form>`,
  });
  wireForm(s, async (d) => {
    if (!d.d || !d.t) throw new Error(t('form.appt.required'));
    const label = d.label || apptTypeLabel(d.type) || t('appt.type.default');
    return Appointments.save({
      ...a, patientId, date: `${d.d}T${d.t}`, type: d.type, status: d.status, label,
      procedureId: d.procedureId || null, notes: d.notes, auto: a.auto && d.procedureId === a.procedureId ? a.auto : false,
      periodLabel: a.periodLabel ?? null,
    });
  });
  return s.result;
}

function nextSlot() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

/* ---------------- Fotoğraf yükleme ---------------- */
/** İşlem tarihine göre varsayılan dönem; işlem yoksa 'other' */
export function defaultPeriodFor(procedure, at = new Date()) {
  if (!procedure) return 'other';
  return periodFromDays(daysBetween(parseDate(procedure.date), at));
}
/** Açı seçenekleri: kamerayla aynı kural — bağlı işlemin şablon açıları, sabit sırada. İşlem yoksa tüm açılar.
 *  keep: mevcut fotoğrafın açısı şablonda yoksa da listede kalır (düzenlemede kayıt bozulmasın). */
function angleOptions(templateAngles = [], keep = null) {
  const set = templateAngles.filter((a) => ANGLES.includes(a));
  const list = set.length ? set : ANGLES;
  return sortAngles(new Set(keep ? [...list, keep] : list)).map((a) => [a, angleLabel(a)]);
}
const periodOptions = () => PERIODS.map((k) => [k, periodLabel(k)]);
/* Seçili açı listede yoksa ilk seçeneğe düşer */
const pickAngle = (opts, cur) => (opts.some(([v]) => v === cur) ? cur : opts[0][0]);

export async function photoUploadForm({ patientId, procedures = [], defaultProcedureId = '', defaultPeriod = null, defaultAngle = 'front' }) {
  const procOpts = [['', t('form.appt.noProc')], ...procedures.map(procOption)];
  const templates = Object.fromEntries((await Templates.all()).map((x) => [x.id, x]));
  const procById = Object.fromEntries(procedures.map((x) => [x.id, x]));
  const tplAngles = (pid) => templates[procById[pid]?.templateId]?.angleSet || [];
  let files = [];

  const s = sheet({
    title: t('form.photo.title'),
    size: 'md',
    footer: footer(t('form.photo.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        <input type="file" name="files" accept="image/*" multiple class="hidden" id="photo-input">
        <div class="upload-zone" id="zone" role="button" tabindex="0">
          <b>${esc(t('form.photo.pick'))}</b>
          <span>${esc(t('form.photo.pickHint'))}</span>
        </div>
        <div class="preview-grid hidden" id="previews"></div>
        <div class="form-row">
          ${field({ label: t('form.photo.date'), name: 'date', type: 'date', value: todayISO(), required: true })}
          ${selectField({ label: t('form.appt.proc'), name: 'procedureId', value: defaultProcedureId, options: procOpts })}
        </div>
        ${chipField({ label: t('form.photo.period'), name: 'period', value: defaultPeriod || defaultPeriodFor(procById[defaultProcedureId]), options: periodOptions(), required: true })}
        <div id="angles">${chipField({ label: t('form.photo.angle'), name: 'angle', value: pickAngle(angleOptions(tplAngles(defaultProcedureId)), defaultAngle), options: angleOptions(tplAngles(defaultProcedureId)), required: true })}</div>
        ${field({ label: t('form.photo.notes'), name: 'notes', placeholder: t('form.photo.notes.ph') })}
      </form>`,
  });

  const form = s.body.querySelector('form');
  const input = form.querySelector('#photo-input');
  const zone = form.querySelector('#zone');
  const previews = form.querySelector('#previews');
  const dateInput = form.querySelector('[name=date]');
  const procSelect = form.querySelector('[name=procedureId]');
  const dateHint = document.createElement('span');
  dateHint.className = 'field-hint';
  dateHint.hidden = true;
  dateInput.closest('.field').appendChild(dateHint);
  let dateTouched = false; // kullanıcı tarihi elle değiştirdiyse EXIF ile üzerine yazma
  dateInput.addEventListener('input', () => { dateTouched = true; syncDate(); });
  // Bağlı işlem değişince açı sırası şablona göre, dönem işlem tarihine göre yenilenir
  procSelect.addEventListener('change', () => {
    const opts = angleOptions(tplAngles(procSelect.value));
    form.querySelector('#angles').innerHTML = chipField({ label: t('form.photo.angle'), name: 'angle', value: pickAngle(opts, form.querySelector('input[name=angle]').value), options: opts, required: true });
    bindChoiceFields(form.querySelector('#angles'));
    const per = defaultPeriodFor(procById[procSelect.value], parseDate(dateInput.value) || new Date());
    form.querySelector('input[name=period]').value = per;
    form.querySelectorAll('[data-chips=period] .chip').forEach((c) => { c.classList.toggle('on', c.dataset.value === per); c.setAttribute('aria-pressed', c.dataset.value === per); });
  });
  zone.onclick = () => input.click();
  zone.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };

  function renderPreviews() {
    previews.classList.toggle('hidden', files.length === 0);
    previews.innerHTML = files.map((f, i) => `
      <div class="preview"><img src="${f.url}" alt=""><button type="button" class="rm" data-i="${i}" aria-label="${esc(t('common.remove'))}">${icon('x')}</button></div>`).join('');
    previews.querySelectorAll('.rm').forEach((b) => {
      b.onclick = () => { URL.revokeObjectURL(files[+b.dataset.i].url); files.splice(+b.dataset.i, 1); renderPreviews(); syncDate(); };
    });
    zone.querySelector('b').textContent = files.length ? t('form.photo.picked', { n: files.length }) : t('form.photo.pick');
  }
  /* EXIF çekim tarihini forma yansıtır */
  function syncDate() {
    const dates = files.map((f) => f.exifDate).filter(Boolean);
    const distinct = [...new Set(dates)];
    if (!dateTouched && distinct.length) dateInput.value = distinct[0];
    let msg = '';
    if (dates.length && !dateTouched) {
      msg = distinct.length > 1 ? t('form.photo.exifMany') : dates.length === files.length ? t('form.photo.exifAll') : t('form.photo.exifSome');
    } else if (dates.length && dateTouched && distinct.length > 1) {
      msg = t('form.photo.exifManual');
    }
    dateHint.textContent = msg;
    dateHint.hidden = !msg;
  }

  input.onchange = async () => {
    const added = [...input.files].map((f) => ({ file: f, url: URL.createObjectURL(f), exifDate: null }));
    files.push(...added);
    input.value = '';
    renderPreviews();
    await Promise.all(added.map(async (f) => { f.exifDate = await readExifDate(f.file); }));
    syncDate();
  };

  wireForm(s, async (d) => {
    if (!files.length) throw new Error(t('form.photo.none'));
    const submit = s.el.querySelector('[type=submit]');
    const saved = [];
    for (let i = 0; i < files.length; i++) {
      submit.textContent = t('form.photo.processing', { i: i + 1, n: files.length });
      const img = await processImage(files[i].file);
      // Kullanıcı tarihi elle seçmediyse her fotoğraf kendi EXIF tarihiyle kaydedilir
      const date = (!dateTouched && files[i].exifDate) || d.date;
      try {
        saved.push(await Photos.save({
          patientId, procedureId: d.procedureId || null, period: d.period || 'other', angle: d.angle || 'custom', date, notes: d.notes || '',
          blob: img.blob, thumb: img.thumb, width: img.width, height: img.height, originalName: files[i].file.name, size: img.blob.size,
        }));
      } catch (ex) {
        throw new Error(t('form.photo.saveFail', { name: files[i].file.name, err: ex?.message || ex, done: saved.length }));
      }
      URL.revokeObjectURL(files[i].url);
    }
    toast(t('form.photo.added', { n: saved.length }), { kind: 'ok' });
    return saved;
  });
  return s.result;
}

/* ---------------- Fotoğraf düzenleme ---------------- */
export async function photoEditForm(photo, procedures = []) {
  const procOpts = [['', t('form.appt.noProc')], ...procedures.map(procOption)];
  const templates = Object.fromEntries((await Templates.all()).map((x) => [x.id, x]));
  const pr = procedures.find((x) => x.id === photo.procedureId);
  const s = sheet({
    title: t('form.photo.info'),
    footer: footer(t('common.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        <div class="form-row">
          ${field({ label: t('form.photo.date'), name: 'date', type: 'date', value: photo.date, required: true })}
          ${selectField({ label: t('form.appt.proc'), name: 'procedureId', value: photo.procedureId || '', options: procOpts })}
        </div>
        ${chipField({ label: t('form.photo.period'), name: 'period', value: photo.period || 'other', options: periodOptions(), required: true })}
        <div id="angles">${chipField({ label: t('form.photo.angle'), name: 'angle', value: photo.angle || 'custom', options: angleOptions(templates[pr?.templateId]?.angleSet || [], photo.angle), required: true })}</div>
        ${field({ label: t('form.photo.notes'), name: 'notes', value: photo.notes || '', placeholder: t('form.photo.notes.ph') })}
      </form>`,
  });
  const eform = s.body.querySelector('form');
  eform.querySelector('[name=procedureId]').addEventListener('change', (e) => {
    const p2 = procedures.find((x) => x.id === e.target.value);
    const opts = angleOptions(templates[p2?.templateId]?.angleSet || [], photo.angle);
    eform.querySelector('#angles').innerHTML = chipField({ label: t('form.photo.angle'), name: 'angle', value: pickAngle(opts, eform.querySelector('input[name=angle]').value), options: opts, required: true });
    bindChoiceFields(eform.querySelector('#angles'));
  });
  wireForm(s, async (d) => Photos.save({ ...photo, date: d.date, procedureId: d.procedureId || null, period: d.period, angle: d.angle, notes: d.notes || '' }));
  return s.result;
}
