/* Formlar: hasta, işlem, randevu, fotoğraf */
import { Patients, Procedures, Appointments, Photos } from './db.js';
import { buildControls, buildOperation, skipSunday, todayISO, toLocalISO, CONTROL_SCHEDULE, OP_KEY, DEFAULT_OP_TIME } from './schedule.js';
import { processImage, parseTags, readExifDate } from './photos.js';
import { sheet, field, selectField, textareaField, segmentField, chipField, bindChoiceFields, segmented, bindSegmented, formData, esc, icon, toast, fmtDate } from './ui.js';
import { t, cmp, procLabel, anesthesiaLabel, kindLabel, PROC_KEYS } from './i18n.js';

/* Kayıtlı değerler Türkçe kanonik addır; seçeneklerin görünen adı dile göre sıralanarak üretilir ("Diğer" hep sonda) */
export const PROCEDURE_TYPES = PROC_KEYS;
export const ANESTHESIA_NONE = 'Yok';
export const ANESTHESIA = ['Genel', 'Lokal', 'Sedasyon', 'Lokal + Sedasyon', ANESTHESIA_NONE];
export const APPT_KINDS = ['kontrol', 'muayene', 'operasyon', 'pansuman', 'diger'];
export const APPT_KIND_LABEL = new Proxy({}, { get: (_, k) => kindLabel(k) });
const byLabel = (list, label) => list.map((v) => [v, label(v)]).sort((a, b) => cmp(a[1], b[1]));
export const procedureTypeOptions = () => [...byLabel(PROCEDURE_TYPES.filter((x) => x !== 'Diğer'), procLabel), ['Diğer', procLabel('Diğer')]];
export const anesthesiaOptions = () => byLabel(ANESTHESIA, anesthesiaLabel);
export const apptKindOptions = () => APPT_KINDS.map((k) => [k, kindLabel(k)]);
export const procOption = (pr) => [pr.id, `${procLabel(pr.type)} · ${fmtDate(pr.date)}`];

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

/* ---------------- Hasta ---------------- */
export function patientForm(existing = null) {
  const p = existing || {};
  const s = sheet({
    title: existing ? t('form.patient.edit') : t('form.patient.new'),
    footer: footer(t('form.patient.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        <div class="form-row">
          ${field({ label: t('form.firstName'), name: 'firstName', value: p.firstName, required: true, attrs: 'autocomplete="off" autocapitalize="words"' })}
          ${field({ label: t('form.lastName'), name: 'lastName', value: p.lastName, required: true, attrs: 'autocomplete="off" autocapitalize="words"' })}
        </div>
        <div class="form-row">
          ${field({ label: t('form.phone'), name: 'phone', type: 'tel', value: p.phone, placeholder: t('form.phone.ph'), attrs: 'inputmode="tel"' })}
          ${field({ label: t('form.birthDate'), name: 'birthDate', type: 'date', value: p.birthDate })}
        </div>
        ${segmentField({ label: t('form.gender'), name: 'gender', value: existing ? (p.gender || '') : 'F', options: [['F', t('gender.F')], ['M', t('gender.M')], ['', t('gender.none')]] })}
        ${selectField({ label: t('form.bloodType'), name: 'bloodType', value: p.bloodType || '', options: [['', t('form.bloodType.unknown')], '0 Rh+', '0 Rh-', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-'] })}
        ${field({ label: t('form.email'), name: 'email', type: 'email', value: p.email, attrs: 'autocomplete="off"' })}
        ${field({ label: t('form.allergies'), name: 'allergies', value: p.allergies, placeholder: t('form.allergies.ph') })}
        ${field({ label: t('form.referral'), name: 'referral', value: p.referral, placeholder: t('form.referral.ph') })}
        ${textareaField({ label: t('form.notes'), name: 'notes', value: p.notes, placeholder: t('form.notes.ph') })}
      </form>`,
  });
  wireForm(s, async (d) => {
    if (!d.firstName || !d.lastName) throw new Error(t('form.nameRequired'));
    return Patients.save({ ...p, ...d });
  });
  return s.result;
}

/* ---------------- İşlem ---------------- */
export function procedureForm({ patientId, existing = null }) {
  const p = existing || {};
  const isNew = !existing;
  const s = sheet({
    title: isNew ? t('form.proc.new') : t('form.proc.edit'),
    footer: footer(t('form.proc.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        ${chipField({ label: t('form.proc.type'), name: 'type', value: p.type || 'Rinoplasti', options: procedureTypeOptions(), required: true })}
        ${field({ label: t('form.proc.title'), name: 'title', value: p.title, placeholder: t('form.proc.title.ph') })}
        <div class="form-row">
          ${field({ label: t('form.proc.date'), name: 'date', type: 'date', value: p.date || todayISO(), required: true })}
          ${field({ label: t('form.proc.time'), name: 'time', type: 'time', value: p.time || DEFAULT_OP_TIME, optional: false })}
        </div>
        <p class="field-hint" style="margin-top:-6px">${esc(t('form.proc.dateHint'))}</p>
        ${selectField({ label: t('form.proc.anesthesia'), name: 'anesthesia', value: p.anesthesia || 'Lokal', options: anesthesiaOptions(), optional: false })}
        ${textareaField({ label: t('form.proc.notes'), name: 'notes', value: p.notes, placeholder: t('form.proc.notes.ph'), rows: 4 })}
        ${isNew ? `
        ${chipField({ label: t('form.proc.controls'), name: 'controls', value: CONTROL_SCHEDULE.map((c) => c.key).join(','), options: CONTROL_SCHEDULE.map((c) => [c.key, t(`sched.short.${c.key}`)]), multiple: true })}
        <div class="form-row">
          ${field({ label: t('form.proc.controlTime'), name: 'controlTime', type: 'time', value: '10:00', optional: false })}
        </div>
        <p class="field-hint" style="margin-top:-6px">${esc(t('form.proc.controlsHint'))}</p>` : ''}
      </form>`,
  });
  wireForm(s, async (d) => {
    if (!d.type) throw new Error(t('form.proc.typeRequired'));
    if (!d.date) throw new Error(t('form.proc.dateRequired'));
    const proc = await Procedures.save({
      ...p, patientId, type: d.type, title: d.title, date: d.date, time: d.time || DEFAULT_OP_TIME, anesthesia: d.anesthesia, notes: d.notes,
    });
    let created = [];
    const keys = isNew ? String(d.controls || '').split(',').filter(Boolean) : [];
    if (keys.length) {
      const [hh, mm] = (d.controlTime || '10:00').split(':').map(Number);
      created = await Appointments.saveMany(buildControls(proc, { hour: hh, minute: mm, keys }));
    }
    const shifted = await syncProcedureEvents(proc, { oldDate: isNew ? null : p.date });
    return { procedure: proc, createdControls: created, shiftedControls: shifted };
  });
  return s.result;
}

/** Var olan bir işlem için kontrolleri (yeniden) üretir. Eski otomatik kontrolleri siler; işlem günü kaydına dokunmaz. */
export async function regenerateControls(procedure, { hour = 10, minute = 0 } = {}) {
  const existing = await Appointments.byIndex('procedureId', procedure.id);
  for (const a of existing.filter((x) => x.auto && x.scheduleKey !== OP_KEY)) await Appointments.remove(a.id);
  return Appointments.saveMany(buildControls(procedure, { hour, minute }));
}

/**
 * İşlemin Ajanda kaydını (ameliyat / işlem günü) oluşturur ya da tarih/saatle eşitler.
 * Tarih değiştiyse hâlâ planlı olan otomatik kontroller yeni tarihe göre kaydırılır (saatleri korunur);
 * yapıldı / gelmedi / iptal olanlara dokunulmaz. Döner: kaydırılan kontrol sayısı.
 */
export async function syncProcedureEvents(procedure, { oldDate = null } = {}) {
  const linked = await Appointments.byIndex('procedureId', procedure.id);
  const op = linked.find((a) => a.scheduleKey === OP_KEY) || null;
  await Appointments.save(buildOperation(procedure, op));
  if (!oldDate || oldDate === procedure.date) return 0;
  const base = new Date(procedure.date + 'T00:00:00');
  const moved = [];
  for (const a of linked) {
    if (!a.auto || a.scheduleKey === OP_KEY || a.status !== 'planned') continue;
    const c = CONTROL_SCHEDULE.find((x) => x.key === a.scheduleKey);
    if (!c) continue;
    const d = skipSunday(c.add(base));
    const [hh, mm] = a.date.slice(11, 16).split(':').map(Number);
    d.setHours(hh || 10, mm || 0, 0, 0);
    moved.push({ ...a, date: toLocalISO(d) });
  }
  if (moved.length) await Appointments.saveMany(moved);
  return moved.length;
}

/** Eski kayıtlar: Ajanda kaydı olmayan işlemlere bir kez kayıt üretir (geçmiş tarih → yapıldı). */
export async function ensureProcedureEvents() {
  const [procs, appts] = await Promise.all([Procedures.all(), Appointments.all()]);
  const has = new Set(appts.filter((a) => a.scheduleKey === OP_KEY).map((a) => a.procedureId));
  const missing = procs.filter((p) => !has.has(p.id)).map((p) => buildOperation(p));
  if (missing.length) await Appointments.saveMany(missing);
  return missing.length;
}

/* ---------------- Randevu ---------------- */
export function appointmentForm({ patientId, procedures = [], existing = null, defaultDate = null }) {
  const a = existing || {};
  const isNew = !existing;
  const dt = a.date ? a.date : (defaultDate || toLocalISO(nextSlot()));
  const [dPart, tPart] = [dt.slice(0, 10), dt.slice(11, 16) || '10:00'];
  const procOpts = [['', t('form.appt.noProc')], ...procedures.map(procOption)];
  const s = sheet({
    title: isNew ? t('form.appt.new') : t('form.appt.edit'),
    footer: footer(t('form.appt.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        <div class="form-row">
          ${field({ label: t('form.appt.date'), name: 'd', type: 'date', value: dPart, required: true })}
          ${field({ label: t('form.appt.time'), name: 't', type: 'time', value: tPart, required: true })}
        </div>
        ${chipField({ label: t('form.appt.kind'), name: 'kind', value: a.kind || 'kontrol', options: apptKindOptions(), required: true })}
        ${isNew ? '<input type="hidden" name="status" value="planned">' : segmentField({ label: t('form.appt.status'), name: 'status', value: a.status || 'planned', options: [['planned', t('status.planned')], ['done', t('status.done')], ['missed', t('status.missed')], ['cancelled', t('status.cancelled')]], optional: false })}
        ${field({ label: t('form.appt.label'), name: 'label', value: a.label, placeholder: t('form.appt.label.ph') })}
        ${selectField({ label: t('form.appt.proc'), name: 'procedureId', value: a.procedureId || '', options: procOpts })}
        ${textareaField({ label: t('form.appt.note'), name: 'notes', value: a.notes, rows: 2 })}
      </form>`,
  });
  wireForm(s, async (d) => {
    if (!d.d || !d.t) throw new Error(t('form.appt.required'));
    const label = d.label || kindLabel(d.kind) || t('kind.default');
    return Appointments.save({
      ...a, patientId, date: `${d.d}T${d.t}`, kind: d.kind, status: d.status, label,
      procedureId: d.procedureId || null, notes: d.notes, auto: a.auto && d.procedureId === a.procedureId ? a.auto : false,
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
export async function photoUploadForm({ patientId, procedures = [], defaultPhase = 'before', defaultProcedureId = '' }) {
  const allTags = await Photos.allTags();
  const procOpts = [['', t('form.appt.noProc')], ...procedures.map(procOption)];
  let phase = defaultPhase;
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
        <div class="field">
          <span class="field-label">${esc(t('form.photo.phase'))}</span>
          ${segmented({ name: 'phase', value: phase, options: [['before', t('phase.before')], ['after', t('phase.after')]] })}
        </div>
        <div class="form-row">
          ${field({ label: t('form.photo.date'), name: 'date', type: 'date', value: todayISO(), required: true })}
          ${selectField({ label: t('form.appt.proc'), name: 'procedureId', value: defaultProcedureId, options: procOpts })}
        </div>
        ${field({ label: t('form.photo.tags'), name: 'tags', placeholder: t('form.photo.tags.ph') })}
        ${allTags.length ? `<div class="tag-suggest">${allTags.slice(0, 12).map((t) => `<button type="button" class="chip sm" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
      </form>`,
  });

  const form = s.body.querySelector('form');
  const input = form.querySelector('#photo-input');
  const zone = form.querySelector('#zone');
  const previews = form.querySelector('#previews');
  const tagsInput = form.querySelector('[name=tags]');
  const dateInput = form.querySelector('[name=date]');
  const dateHint = document.createElement('span');
  dateHint.className = 'field-hint';
  dateHint.hidden = true;
  dateInput.closest('.field').appendChild(dateHint);
  let dateTouched = false; // kullanıcı tarihi elle değiştirdiyse EXIF ile üzerine yazma
  dateInput.addEventListener('input', () => { dateTouched = true; syncDate(); });
  bindSegmented(form.querySelector('.seg'), (v) => { phase = v; });
  zone.onclick = () => input.click();
  zone.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
  form.querySelectorAll('[data-tag]').forEach((b) => {
    b.onclick = () => {
      const cur = parseTags(tagsInput.value);
      const t = b.dataset.tag;
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      tagsInput.value = next.join(', ');
      b.classList.toggle('on', next.includes(t));
    };
  });

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
    const tags = parseTags(d.tags);
    const saved = [];
    for (let i = 0; i < files.length; i++) {
      submit.textContent = t('form.photo.processing', { i: i + 1, n: files.length });
      const img = await processImage(files[i].file);
      // Kullanıcı tarihi elle seçmediyse her fotoğraf kendi EXIF tarihiyle kaydedilir
      const date = (!dateTouched && files[i].exifDate) || d.date;
      try {
        saved.push(await Photos.save({
          patientId, procedureId: d.procedureId || null, phase, date, tags,
          blob: img.blob, thumb: img.thumb, width: img.width, height: img.height,
          originalName: files[i].file.name, size: img.blob.size,
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
  const allTags = await Photos.allTags();
  const procOpts = [['', t('form.appt.noProc')], ...procedures.map(procOption)];
  let phase = photo.phase;
  const s = sheet({
    title: t('form.photo.info'),
    footer: footer(t('common.save')),
    content: `
      <form id="sheet-form" class="form" novalidate>
        <div class="field">
          <span class="field-label">${esc(t('form.photo.phase'))}</span>
          ${segmented({ name: 'phase', value: phase, options: [['before', t('phase.before')], ['after', t('phase.after')]] })}
        </div>
        <div class="form-row">
          ${field({ label: t('form.photo.date'), name: 'date', type: 'date', value: photo.date, required: true })}
          ${selectField({ label: t('form.appt.proc'), name: 'procedureId', value: photo.procedureId || '', options: procOpts })}
        </div>
        ${field({ label: t('form.photo.tags'), name: 'tags', value: (photo.tags || []).join(', '), placeholder: t('form.photo.tags.ph2') })}
        ${allTags.length ? `<div class="tag-suggest">${allTags.slice(0, 12).map((t) => `<button type="button" class="chip sm ${(photo.tags || []).includes(t) ? 'on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
      </form>`,
  });
  const form = s.body.querySelector('form');
  const tagsInput = form.querySelector('[name=tags]');
  bindSegmented(form.querySelector('.seg'), (v) => { phase = v; });
  form.querySelectorAll('[data-tag]').forEach((b) => {
    b.onclick = () => {
      const cur = parseTags(tagsInput.value);
      const t = b.dataset.tag;
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      tagsInput.value = next.join(', ');
      b.classList.toggle('on', next.includes(t));
    };
  });
  wireForm(s, async (d) => Photos.save({ ...photo, phase, date: d.date, procedureId: d.procedureId || null, tags: parseTags(d.tags) }));
  return s.result;
}
