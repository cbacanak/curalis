/* Hasta kartı — TASARIM.md §5 (hero, istatistik satırı, metin sekmeleri, bilgi listesi, fotoğraf ızgarası) */
import { Patients, Procedures, Photos, Appointments, fullName } from '../db.js';
import {
  esc, el, icon, fmtDate, fmtDateLong, fmtTime, fmtDayMonth, age, relDay, sinceProcedure,
  parseDate, daysBetween, phoneHref, sheet, confirmDialog, actionMenu, toast, statusText, emptyState,
} from '../ui.js';
import { blobURL, releaseURLs } from '../photos.js';
import {
  patientForm, procedureForm, appointmentForm, photoUploadForm, photoEditForm, regenerateControls,
} from '../forms.js';
import { setTopbar, go, replacePath } from '../nav.js';
import { t, lower, cmp as cmpText, procLabel, anesthesiaLabel, apptLabel, kindLabel, isOp } from '../i18n.js';

const TABS = [['genel', 'p.tab.general'], ['islemler', 'p.tab.procs'], ['fotograflar', 'p.tab.photos'], ['randevular', 'p.tab.appts']];

const DEFAULT_TAB = 'islemler';

export async function render(root, { id, tab = DEFAULT_TAB }) {
  const state = { id, tab: TABS.some(([k]) => k === tab) ? tab : DEFAULT_TAB, photoFilter: 'all', compare: false, selected: { before: null, after: null } };
  let data;

  async function load() {
    const [patient, procedures, photos, appointments] = await Promise.all([
      Patients.get(id), Procedures.byPatient(id), Photos.byPatient(id), Appointments.byPatient(id),
    ]);
    data = { patient, procedures, photos, appointments };
    data.procById = Object.fromEntries(procedures.map((p) => [p.id, p]));
  }
  async function refresh() { await load(); paint(); }

  await load();
  if (!data.patient) {
    setTopbar({ title: t('p.title'), back: '/' });
    root.classList.remove('has-hero');
    root.innerHTML = `<div class="screen">${emptyState({ title: t('p.notFound'), text: t('p.notFoundText'), action: `<a class="btn btn-primary" href="#/">${esc(t('p.backToList'))}</a>` })}</div>`;
    return;
  }

  /* ---------- Eylemler ---------- */
  async function editPatient() {
    const r = await patientForm(data.patient);
    if (r) { toast(t('p.updated')); refresh(); }
  }
  async function patientMenu() {
    const v = await actionMenu(fullName(data.patient), [
      { label: t('p.editInfo'), icon: 'edit', value: 'edit' },
      { label: t('p.addPhoto'), icon: 'camera', value: 'photo' },
      { label: t('p.addAppt'), icon: 'calendar', value: 'appt' },
      { label: t('p.delete'), icon: 'trash', value: 'delete', danger: true },
    ]);
    if (v === 'edit') editPatient();
    if (v === 'photo') addPhoto();
    if (v === 'appt') addAppointment();
    if (v === 'delete') deletePatient();
  }
  async function deletePatient() {
    const ok = await confirmDialog({
      title: t('p.deleteQ'),
      message: t('p.deleteMsg', { name: fullName(data.patient), procs: data.procedures.length, photos: data.photos.length, appts: data.appointments.length }),
      okText: t('common.delete'), danger: true,
    });
    if (!ok) return;
    await Patients.removeCascade(id);
    toast(t('p.deleted'));
    go('/');
  }
  async function addProcedure() {
    const r = await procedureForm({ patientId: id });
    if (!r) return;
    toast(r.createdControls.length ? t('p.procAddedControls', { n: r.createdControls.length }) : t('p.procAdded'));
    setTab('islemler');
    refresh();
  }
  async function addAppointment(defaults = {}) {
    const r = await appointmentForm({ patientId: id, procedures: data.procedures, ...defaults });
    if (r) { toast(t('p.apptAdded')); refresh(); }
  }
  async function addPhoto(defaults = {}) {
    const r = await photoUploadForm({ patientId: id, procedures: data.procedures, defaultProcedureId: data.procedures[0]?.id || '', ...defaults });
    if (r && r.length) { setTab('fotograflar'); refresh(); }
  }
  function setTab(tab) {
    state.tab = tab;
    state.compare = false;
    replacePath(`/patient/${id}/${tab}`);
  }

  /* ---------- Türetilmiş ---------- */
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const isOverdue = (a) => a.status === 'planned' && parseDate(a.date) < startOfToday();
  const controlsOf = (procId) => data.appointments.filter((a) => a.procedureId === procId && a.auto && !isOp(a));
  const opOf = (procId) => data.appointments.find((a) => a.procedureId === procId && isOp(a)) || null;
  const isPlannedProc = (pr) => parseDate(pr.date) > startOfToday();
  function nextControl() {
    const planned = data.appointments.filter((a) => a.status === 'planned');
    const upcoming = planned.filter((a) => parseDate(a.date) >= startOfToday());
    if (upcoming.length) return upcoming[0];
    const overdue = planned.filter(isOverdue);
    return overdue.length ? overdue[overdue.length - 1] : null;
  }
  /** "7 gün", "bugün", "3 gün gecikti" */
  function daysLabel(a) {
    const n = daysBetween(new Date(), parseDate(a.date));
    if (n === 0) return lower(t('common.today'));
    if (n === 1) return lower(t('common.tomorrow'));
    if (n > 1) return t('days.n', { n });
    return t('days.late', { n: -n });
  }
  const phaseLabel = (ph) => t(ph.phase === 'before' ? 'phase.before' : 'phase.after');
  const photoCaption = (ph, pr) => {
    const extra = pr && ph.phase === 'after' ? sinceProcedure(pr.date, parseDate(ph.date)) : (ph.tags || [])[0] || '';
    return [phaseLabel(ph), fmtDayMonth(ph.date), extra].filter(Boolean).join(' · ');
  };

  /* ---------- Çizim ---------- */
  function paint() {
    releaseURLs();
    const p = data.patient;
    const name = fullName(p);
    const a = age(p.birthDate);
    const genderLabel = p.gender === 'F' ? t('gender.F') : p.gender === 'M' ? t('gender.M') : '';
    const nc = nextControl();
    const lastProc = data.procedures[0];

    setTopbar({
      title: name, back: '/', center: true, anchor: '.hero-name', tone: 'inverse',
      actions: [{ icon: 'edit', label: t('common.edit'), onClick: editPatient }, { icon: 'more', label: t('common.more'), onClick: patientMenu }],
    });
    root.classList.add('has-hero');

    root.innerHTML = `
      <div class="screen">
      <section class="hero">
        <div class="hero-nav">
          <button class="btn-icon" type="button" data-act="back" aria-label="${esc(t('common.back'))}">${icon('back')}</button>
          <span class="spacer"></span>
          <button class="btn-icon" type="button" data-act="edit" aria-label="${esc(t('common.edit'))}">${icon('edit')}</button>
          <button class="btn-icon" type="button" data-act="more" aria-label="${esc(t('common.more'))}">${icon('more')}</button>
        </div>
        <div class="hero-label">${lastProc ? `${isPlannedProc(lastProc) ? `${esc(t('op.planned'))} · ` : ''}${esc(procLabel(lastProc.type))} · ${esc(fmtDate(lastProc.date))}` : esc(t('p.noProc'))}</div>
        <h1 class="hero-name">${esc(name)}</h1>
        <div class="hero-meta">${[a !== null ? esc(t('age', { n: a })) : null, genderLabel ? esc(genderLabel) : null, p.bloodType ? esc(p.bloodType) : null, p.phone ? `<a href="${phoneHref(p.phone)}" class="num">${esc(p.phone)}</a>` : null].filter(Boolean).join(' · ') || `<span class="t-tertiary">${esc(t('p.noInfo'))}</span>`}</div>
        <div class="hero-actions">
          <button class="btn btn-primary" type="button" data-act="add-proc">${esc(t('p.addProc'))}</button>
          ${p.phone ? `<a class="btn-outline-icon" href="${phoneHref(p.phone)}" aria-label="${esc(t('p.call'))}" title="${esc(t('p.call'))}">${icon('phone')}</a>` : ''}
          <button class="btn-outline-icon" type="button" data-act="add-photo" aria-label="${esc(t('p.addPhoto'))}" title="${esc(t('p.addPhoto'))}">${icon('camera')}</button>
          <button class="btn-outline-icon" type="button" data-act="add-appt" aria-label="${esc(t('p.addAppt'))}" title="${esc(t('p.addAppt'))}">${icon('calendar')}</button>
        </div>
      </section>

      <div class="stats">
        <button class="stat" type="button" data-tab="islemler">
          <div class="stat-value num">${data.procedures.length}</div>
          <div class="stat-label">${esc(t('p.stat.procs'))}</div>
        </button>
        <button class="stat" type="button" data-tab="fotograflar">
          <div class="stat-value num">${data.photos.length}</div>
          <div class="stat-label">${esc(t('p.stat.photos'))}</div>
        </button>
        <button class="stat end ${nc && isOverdue(nc) ? 'warn' : ''}" type="button" data-tab="randevular">
          <div class="stat-value">${nc ? esc(fmtDayMonth(nc.date)) : '—'}</div>
          <div class="stat-label">${nc ? `${esc(isOp(nc) ? apptLabel(nc) : lower(apptLabel(nc)))} · ${esc(daysLabel(nc))}` : esc(t('p.stat.noControl'))}</div>
        </button>
      </div>

      <div class="tabs sticky" role="tablist">
        ${TABS.map(([k, l]) => `<button class="tab-btn ${state.tab === k ? 'on' : ''}" type="button" role="tab" data-tab="${k}" aria-selected="${state.tab === k}">${esc(t(l))}</button>`).join('')}
      </div>
      <div id="tab-body"></div>
      </div>`;

    root.querySelector('[data-act=back]').onclick = () => go('/');
    root.querySelector('[data-act=edit]').onclick = editPatient;
    root.querySelector('[data-act=more]').onclick = patientMenu;
    root.querySelector('[data-act=add-proc]').onclick = addProcedure;
    root.querySelector('[data-act=add-photo]').onclick = () => addPhoto();
    root.querySelector('[data-act=add-appt]').onclick = () => addAppointment();
    root.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { setTab(b.dataset.tab); syncTabs(); paintTab(); }; });
    paintTab();
  }

  function syncTabs() {
    root.querySelectorAll('.tab-btn').forEach((b) => { const on = b.dataset.tab === state.tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  }

  function paintTab() {
    const body = root.querySelector('#tab-body');
    body.innerHTML = '';
    ({ genel: paintGeneral, islemler: paintProcedures, fotograflar: paintPhotos, randevular: paintAppointments })[state.tab](body);
  }

  /* ---------- Genel ---------- */
  function paintGeneral(body) {
    const p = data.patient;
    const a = age(p.birthDate);
    const row = (label, value, { empty = '—', block = false } = {}) => `
      <div class="info-row ${block ? 'block' : ''}"><div class="info-label">${esc(label)}</div><div class="info-value ${value ? '' : 'is-empty'}">${value || empty}</div></div>`;
    const overdue = data.appointments.filter(isOverdue);
    const upcoming = data.appointments.filter((x) => x.status === 'planned' && !isOverdue(x)).slice(0, 3);
    const recent = [...data.photos].sort((x, y) => (y.date || '').localeCompare(x.date || '')).slice(0, 2);

    body.innerHTML = `
      ${p.allergies ? `<div class="alert">${esc(t('p.allergy'))} · ${esc(p.allergies)}</div>` : ''}
      ${overdue.length ? `<div class="alert danger">${esc(t('p.overdueAlert', { n: overdue.length, list: overdue.map((x) => `${lower(apptLabel(x))} (${fmtDayMonth(x.date)})`).join(', ') }))}</div>` : ''}
      <div class="info" style="margin-top:6px">
        ${row(t('form.birthDate'), p.birthDate ? `${esc(fmtDate(p.birthDate))}${a !== null ? ` <span class="t-secondary">· ${a}</span>` : ''}` : '')}
        ${row(t('form.bloodType'), esc(p.bloodType))}
        ${row(t('form.email'), p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : '')}
        ${row(t('form.referral'), esc(p.referral))}
        ${row(t('form.allergies'), esc(p.allergies))}
        ${row(t('p.registered'), esc(fmtDate(p.createdAt)))}
        ${p.notes ? row(t('form.notes'), esc(p.notes), { block: true }) : ''}
      </div>

      <section class="section">
        <div class="section-head">
          <div class="section-title">${esc(t('p.recentPhotos'))}</div>
          ${data.photos.length ? `<button class="section-link" type="button" data-tab-link="fotograflar">${esc(t('common.all'))}</button>` : ''}
        </div>
        ${recent.length
          ? `<div class="photo-grid">${recent.map((ph) => photoTile(ph, ph.procedureId ? data.procById[ph.procedureId] : null)).join('')}</div>`
          : emptyState({ title: t('p.noPhotos'), text: t('p.noPhotosText'), action: `<button class="btn btn-secondary btn-sm" type="button" data-act="add-photo">${esc(t('p.addPhoto'))}</button>` })}
      </section>

      ${upcoming.length ? `
      <section class="section">
        <div class="section-head">
          <div class="section-title">${esc(t('p.upcomingControls'))}</div>
          <button class="section-link" type="button" data-tab-link="randevular">${esc(t('common.all'))}</button>
        </div>
        <div class="list">${upcoming.map(apptRow).join('')}</div>
      </section>` : ''}`;

    body.querySelectorAll('[data-tab-link]').forEach((b) => { b.onclick = () => { setTab(b.dataset.tabLink); syncTabs(); paintTab(); }; });
    body.querySelectorAll('[data-act=add-photo]').forEach((b) => { b.onclick = () => addPhoto(); });
    body.querySelectorAll('[data-photo]').forEach((t) => { t.onclick = () => openViewer(data.photos.find((x) => x.id === t.dataset.photo), recent); });
    bindApptRows(body);
  }

  /* ---------- İşlemler ---------- */
  function procedureRow(pr) {
    const controls = controlsOf(pr.id);
    const done = controls.filter((c) => c.status === 'done').length;
    const photos = data.photos.filter((x) => x.procedureId === pr.id).length;
    const planned = isPlannedProc(pr);
    const line1 = [planned ? t('op.planned') : null, fmtDate(pr.date), planned ? t('op.inDays', { n: daysBetween(new Date(), parseDate(pr.date)) }) : null, pr.anesthesia && pr.anesthesia !== 'Yok' ? t('anest.line', { a: anesthesiaLabel(pr.anesthesia) }) : null].filter(Boolean).join(' · ');
    const line2 = [controls.length ? t('p.controls', { done, n: controls.length }) : null, photos ? t('p.photosN', { n: photos }) : null].filter(Boolean).join(' · ');
    return `
      <button class="row ${planned ? 'op' : ''}" type="button" data-proc="${pr.id}">
        <div class="row-main">
          <div class="row-title">${esc(procLabel(pr.type))}${pr.title ? ` <span class="t-secondary">· ${esc(pr.title)}</span>` : ''}</div>
          <div class="row-sub">${esc(line1)}</div>
          ${line2 ? `<div class="row-sub">${esc(line2)}</div>` : ''}
        </div>
        <div class="row-end">${icon('chevron')}</div>
      </button>`;
  }

  function paintProcedures(body) {
    body.innerHTML = data.procedures.length
      ? `<div class="list" style="margin-top:4px">${data.procedures.map(procedureRow).join('')}</div>`
      : emptyState({ title: t('p.noProc'), text: t('p.noProcText'), action: `<button class="btn btn-primary" type="button" data-act="add">${esc(t('p.addProc'))}</button>` });
    body.querySelectorAll('[data-act=add]').forEach((b) => { b.onclick = addProcedure; });
    body.querySelectorAll('[data-proc]').forEach((b) => { b.onclick = () => openProcedure(b.dataset.proc); });
  }

  function openProcedure(procId) {
    const pr = data.procById[procId];
    if (!pr) return;
    const controls = controlsOf(pr.id);
    const op = opOf(pr.id);
    const others = data.appointments.filter((a) => a.procedureId === pr.id && !a.auto);
    const photos = data.photos.filter((x) => x.procedureId === pr.id);
    const done = controls.filter((c) => c.status === 'done').length;
    const info = (label, value) => `<div class="info-row"><div class="info-label">${esc(label)}</div><div class="info-value ${value ? '' : 'is-empty'}">${value || '—'}</div></div>`;
    const s = sheet({
      title: procLabel(pr.type),
      size: 'md',
      closeText: t('common.close'),
      footer: `<button class="btn btn-ghost" type="button" data-act="more">${esc(t('common.more'))}</button><span class="spacer"></span>
               <button class="btn btn-secondary" type="button" data-act="edit">${esc(t('common.edit'))}</button>
               <button class="btn btn-primary" type="button" data-act="photo">${esc(t('p.addPhoto'))}</button>`,
      content: `
        <div class="info">
          ${info(t('p.proc.date'), `${esc(fmtDateLong(pr.date))}${pr.time ? ` · ${esc(pr.time)}` : ''}${op ? ` <span class="t-secondary">· ${statusText(op.status, { overdue: isOverdue(op), today: daysBetween(new Date(), parseDate(op.date)) === 0 })}</span>` : ''}`)}
          ${info(t('p.proc.since'), esc(isPlannedProc(pr) ? relDay(pr.date) : sinceProcedure(pr.date)))}
          ${info(t('p.proc.anesthesia'), esc(anesthesiaLabel(pr.anesthesia)))}
          ${info(t('p.proc.technique'), esc(pr.title))}
          ${info(t('p.proc.photo'), photos.length ? esc(t('p.proc.photoLine', { n: photos.length, before: photos.filter((x) => x.phase === 'before').length, after: photos.filter((x) => x.phase === 'after').length })) : '')}
          ${pr.notes ? `<div class="info-row block"><div class="info-label">${esc(t('p.proc.note'))}</div><div class="info-value">${esc(pr.notes)}</div></div>` : ''}
        </div>
        <section class="section">
          <div class="section-head">
            <div class="section-title">${esc(t('p.proc.controls'))}</div>
            ${controls.length ? `<span class="t-caption">${esc(t('p.proc.doneOf', { done, n: controls.length }))}</span>` : ''}
          </div>
          ${controls.length ? `<div class="list">${controls.map(apptRow).join('')}</div>`
            : `<div class="empty" style="padding:8px 0 4px"><div class="empty-text">${esc(t('p.proc.noControls'))}</div><button class="btn btn-secondary btn-sm" type="button" data-act="regen">${esc(t('p.proc.makeControls'))}</button></div>`}
        </section>
        ${others.length ? `<section class="section"><div class="section-head"><div class="section-title">${esc(t('p.proc.otherAppts'))}</div></div><div class="list">${others.map(apptRow).join('')}</div></section>` : ''}`,
    });
    bindApptRows(s.body, () => s.close());
    s.el.querySelector('[data-act=edit]').onclick = async () => {
      s.close();
      const r = await procedureForm({ patientId: id, existing: pr });
      if (r) { toast(r.shiftedControls ? t('form.proc.shifted', { n: r.shiftedControls }) : t('p.proc.updated')); refresh(); }
    };
    s.el.querySelector('[data-act=photo]').onclick = () => { s.close(); addPhoto({ defaultProcedureId: pr.id, defaultPhase: daysBetween(parseDate(pr.date), new Date()) > 0 ? 'after' : 'before' }); };
    const regen = s.body.querySelector('[data-act=regen]');
    if (regen) regen.onclick = async () => { s.close(); await regenerateControls(pr); toast(t('p.proc.controlsMade')); refresh(); };
    s.el.querySelector('[data-act=more]').onclick = async () => {
      s.close();
      const v = await actionMenu(procLabel(pr.type), [
        { label: t('p.proc.regen'), icon: 'calendar', value: 'regen' },
        { label: t('p.proc.delete'), icon: 'trash', value: 'delete', danger: true },
      ]);
      if (v === 'regen') {
        const ok = await confirmDialog({ title: t('p.proc.regenQ'), message: t('p.proc.regenMsg'), okText: t('p.proc.regenOk') });
        if (ok) { await regenerateControls(pr); toast(t('p.proc.regenerated')); refresh(); }
      }
      if (v === 'delete') {
        const ok = await confirmDialog({ title: t('p.proc.deleteQ'), message: t('p.proc.deleteMsg', { type: procLabel(pr.type), n: controls.length }), okText: t('common.delete'), danger: true });
        if (ok) { await Procedures.removeCascade(pr.id); toast(t('p.proc.deleted')); refresh(); }
      }
    };
  }

  /* ---------- Randevular ---------- */
  function apptRow(a) {
    const d = parseDate(a.date);
    const today = daysBetween(new Date(), d) === 0;
    const overdue = isOverdue(a);
    const pr = a.procedureId ? data.procById[a.procedureId] : null;
    const sub = isOp(a)
      ? [fmtDayMonth(a.date), fmtTime(a.date), t('op.row'), a.notes || null].filter(Boolean).join(' · ')
      : [fmtDayMonth(a.date), fmtTime(a.date), kindLabel(a.kind), pr ? procLabel(pr.type) : null, pr && a.auto ? sinceProcedure(pr.date, d) : null, a.notes || null].filter(Boolean).join(' · ');
    return `
      <button class="row ${a.status === 'done' || a.status === 'cancelled' ? 'muted' : ''} ${isOp(a) ? 'op' : ''}" type="button" data-appt="${a.id}">
        <div class="row-main">
          <div class="row-title">${esc(apptLabel(a))}</div>
          <div class="row-sub">${esc(sub)}</div>
        </div>
        <div class="row-end">${statusText(a.status, { overdue, today })}</div>
      </button>`;
  }
  function bindApptRows(scope, before) {
    scope.querySelectorAll('[data-appt]').forEach((b) => { b.onclick = () => { before?.(); openAppointment(b.dataset.appt); }; });
  }
  async function openAppointment(apptId) {
    const a = data.appointments.find((x) => x.id === apptId);
    if (!a) return;
    const pr = a.procedureId ? data.procById[a.procedureId] : null;
    const title = `${apptLabel(a)} · ${fmtDate(a.date)} ${fmtTime(a.date)}`;
    const items = [];
    if (a.status !== 'done') items.push({ label: t('appt.markDone'), icon: 'check', value: 'done' });
    if (a.status !== 'missed') items.push({ label: t('appt.markMissed'), icon: 'alert', value: 'missed' });
    if (a.status !== 'planned') items.push({ label: t('appt.markPlanned'), icon: 'clock', value: 'planned' });
    if (isOp(a)) items.push({ label: t('op.editProc'), icon: 'edit', value: 'editProc' });
    else items.push({ label: t('appt.editDate'), icon: 'edit', value: 'edit' });
    if (pr) items.push({ label: t('appt.openProc', { p: procLabel(pr.type) }), icon: 'activity', value: 'proc' });
    if (!isOp(a)) items.push({ label: t('appt.delete'), icon: 'trash', value: 'delete', danger: true });
    const v = await actionMenu(title, items);
    if (!v) return;
    if (['done', 'missed', 'planned'].includes(v)) {
      await Appointments.save({ ...a, status: v });
      toast(t({ done: 'appt.doneToast', missed: 'appt.missedToast', planned: 'appt.plannedToast' }[v]));
      refresh();
    } else if (v === 'edit') {
      const r = await appointmentForm({ patientId: id, procedures: data.procedures, existing: a });
      if (r) { toast(t('appt.updated')); refresh(); }
    } else if (v === 'editProc') {
      const r = await procedureForm({ patientId: id, existing: pr });
      if (r) { toast(r.shiftedControls ? t('form.proc.shifted', { n: r.shiftedControls }) : t('p.proc.updated')); refresh(); }
    } else if (v === 'proc') {
      openProcedure(pr.id);
    } else if (v === 'delete') {
      const ok = await confirmDialog({ title: t('appt.deleteQ'), message: title, okText: t('common.delete'), danger: true });
      if (ok) { await Appointments.remove(a.id); toast(t('appt.deleted')); refresh(); }
    }
  }
  function paintAppointments(body) {
    const overdue = data.appointments.filter(isOverdue);
    const upcoming = data.appointments.filter((a) => a.status === 'planned' && !isOverdue(a));
    const past = data.appointments.filter((a) => a.status !== 'planned').sort((x, y) => y.date.localeCompare(x.date));
    const group = (label, list) => list.length ? `<section class="section"><div class="section-label">${label}</div><div class="list">${list.map(apptRow).join('')}</div></section>` : '';
    body.innerHTML = data.appointments.length
      ? `${group(esc(t('p.appt.overdue')), overdue)}${group(esc(t('p.appt.upcoming')), upcoming)}${group(esc(t('p.appt.past')), past)}
         <div class="action-bar"><button class="btn btn-secondary btn-block" type="button" data-act="add">${esc(t('p.addAppt'))}</button></div>`
      : emptyState({ title: t('p.appt.empty'), text: t('p.appt.emptyText'), action: `<button class="btn btn-primary" type="button" data-act="add">${esc(t('p.addAppt'))}</button>` });
    body.querySelectorAll('[data-act=add]').forEach((b) => { b.onclick = () => addAppointment(); });
    bindApptRows(body);
  }

  /* ---------- Fotoğraflar ---------- */
  function filteredPhotos() {
    const f = state.photoFilter;
    if (f === 'all') return data.photos;
    if (f === 'before' || f === 'after') return data.photos.filter((x) => x.phase === f);
    return data.photos.filter((x) => (x.tags || []).includes(f));
  }
  const sortGroup = (list) => [...list].sort((a, b) => (a.phase === b.phase ? (a.date || '').localeCompare(b.date || '') : a.phase === 'before' ? -1 : 1));

  function photoTile(ph, pr) {
    const sel = state.selected.before?.id === ph.id || state.selected.after?.id === ph.id;
    return `
      <button class="photo ${state.compare ? 'selectable' : ''} ${sel ? 'selected' : ''}" type="button" data-photo="${ph.id}" aria-label="${esc(photoCaption(ph, pr))}">
        <div class="photo-frame">
          <img src="${blobURL(ph.id + ':t', ph.thumb || ph.blob)}" alt="" loading="lazy" decoding="async">
          ${state.compare ? `<span class="photo-check">${sel ? icon('check') : ''}</span>` : ''}
        </div>
        <div class="photo-caption">${esc(photoCaption(ph, pr))}</div>
      </button>`;
  }

  function paintPhotos(body) {
    const photos = filteredPhotos();
    const tags = [...new Set(data.photos.flatMap((x) => x.tags || []))].sort(cmpText);
    const byProc = new Map();
    photos.forEach((ph) => {
      const key = ph.procedureId && data.procById[ph.procedureId] ? ph.procedureId : '_';
      if (!byProc.has(key)) byProc.set(key, []);
      byProc.get(key).push(ph);
    });
    const groups = [];
    data.procedures.forEach((pr) => { if (byProc.has(pr.id)) groups.push({ pr, list: byProc.get(pr.id) }); });
    if (byProc.has('_')) groups.push({ pr: null, list: byProc.get('_') });
    const hasPair = data.photos.some((x) => x.phase === 'before') && data.photos.some((x) => x.phase === 'after');

    if (!data.photos.length) {
      body.innerHTML = emptyState({ title: t('p.noPhotos'), text: t('p.noPhotosText'), action: `<button class="btn btn-primary" type="button" data-act="add">${esc(t('p.addPhoto'))}</button>` });
      body.querySelector('[data-act=add]').onclick = () => addPhoto({ defaultPhase: 'before' });
      return;
    }

    body.innerHTML = `
      <div class="chips" style="margin-top:16px">
        ${[['all', t('common.all')], ['before', t('phase.before')], ['after', t('phase.after')], ...tags.map((x) => [x, x])].map(([v, l]) =>
          `<button class="chip ${state.photoFilter === v ? 'on' : ''}" type="button" data-filter="${esc(v)}">${esc(l)}</button>`).join('')}
      </div>
      ${state.compare ? `<div class="compare-hint" id="compare-hint"></div>` : ''}
      ${photos.length ? groups.map(({ pr, list }) => `
        <div class="photo-group">
          <div class="photo-group-head">
            <div class="photo-group-title">${pr ? esc(procLabel(pr.type)) : esc(t('p.photo.unlinked'))}</div>
            <div class="photo-group-sub">${pr ? `${esc(fmtDate(pr.date))} · ` : ''}${esc(t('p.photosN', { n: list.length }))}</div>
          </div>
          <div class="photo-grid">${sortGroup(list).map((ph) => photoTile(ph, pr)).join('')}</div>
        </div>`).join('')
        : emptyState({ title: t('p.photo.noMatch') })}
      <div class="action-bar sticky">
        ${state.compare
          ? `<button class="btn btn-ghost" type="button" data-act="compare-cancel">${esc(t('common.cancel'))}</button>
             <button class="btn btn-primary" type="button" data-act="compare-go" disabled>${esc(t('p.photo.show'))}</button>`
          : `<button class="btn btn-primary" type="button" data-act="compare" ${hasPair ? '' : 'disabled'}>${esc(t('p.photo.compare'))}</button>
             <button class="btn-outline-icon" type="button" data-act="add" aria-label="${esc(t('p.addPhoto'))}">${icon('plus')}</button>`}
      </div>`;

    body.querySelectorAll('[data-act=add]').forEach((b) => { b.onclick = () => addPhoto({ defaultPhase: data.photos.some((x) => x.phase === 'before') ? 'after' : 'before' }); });
    body.querySelectorAll('[data-filter]').forEach((b) => { b.onclick = () => { state.photoFilter = b.dataset.filter; paintTab(); }; });
    const cmp = body.querySelector('[data-act=compare]');
    if (cmp) cmp.onclick = () => { state.compare = true; presetCompare(); paintTab(); };
    body.querySelectorAll('[data-photo]').forEach((t) => {
      t.onclick = () => {
        const ph = data.photos.find((x) => x.id === t.dataset.photo);
        if (state.compare) { toggleSelect(ph); updateCompareBar(body); }
        else openViewer(ph, groups.flatMap((g) => sortGroup(g.list)));
      };
    });
    if (state.compare) {
      updateCompareBar(body);
      body.querySelector('[data-act=compare-cancel]').onclick = () => { state.compare = false; paintTab(); };
      body.querySelector('[data-act=compare-go]').onclick = () => openCompare();
    }
  }

  function presetCompare() {
    const pr = data.procedures.find((p) => data.photos.some((x) => x.procedureId === p.id && x.phase === 'before') && data.photos.some((x) => x.procedureId === p.id && x.phase === 'after'));
    const pool = pr ? data.photos.filter((x) => x.procedureId === pr.id) : data.photos;
    const befores = pool.filter((x) => x.phase === 'before').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const afters = pool.filter((x) => x.phase === 'after').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    let b = befores[0], a = afters[0];
    for (const x of befores) {
      const match = afters.find((y) => (y.tags || []).some((tg) => (x.tags || []).includes(tg)));
      if (match) { b = x; a = match; break; }
    }
    state.selected = { before: b || null, after: a || null };
  }
  function toggleSelect(ph) {
    state.selected[ph.phase] = state.selected[ph.phase]?.id === ph.id ? null : ph;
    root.querySelectorAll('[data-photo]').forEach((t) => {
      const on = state.selected.before?.id === t.dataset.photo || state.selected.after?.id === t.dataset.photo;
      t.classList.toggle('selected', on);
      const chk = t.querySelector('.photo-check');
      if (chk) chk.innerHTML = on ? icon('check') : '';
    });
  }
  function updateCompareBar(body) {
    const { before, after } = state.selected;
    const hint = body.querySelector('#compare-hint');
    if (hint) hint.textContent = `${before ? `${t('phase.before')} · ${fmtDayMonth(before.date)}` : t('p.photo.pickBefore')} · ${after ? `${t('phase.after')} · ${fmtDayMonth(after.date)}` : t('p.photo.pickAfter')}`;
    const go = body.querySelector('[data-act=compare-go]');
    if (go) go.disabled = !(before && after);
  }

  /* ---------- Görüntüleyici ---------- */
  function openViewer(photo, list) {
    let idx = Math.max(0, list.findIndex((x) => x.id === photo.id));
    const v = el(`
      <div class="viewer" role="dialog" aria-modal="true" aria-label="${esc(t('p.photo.viewer'))}">
        <div class="viewer-head">
          <button class="btn-icon" type="button" data-act="close" aria-label="${esc(t('common.close'))}">${icon('x')}</button>
          <div class="viewer-title"></div>
          <button class="btn-icon" type="button" data-act="edit" aria-label="${esc(t('common.edit'))}">${icon('edit')}</button>
          <button class="btn-icon" type="button" data-act="delete" aria-label="${esc(t('common.delete'))}">${icon('trash')}</button>
        </div>
        <div class="viewer-stage">
          <img alt="">
          ${list.length > 1 ? `<button class="viewer-nav prev" type="button" data-act="prev" aria-label="${esc(t('p.photo.prev'))}">${icon('left')}</button><button class="viewer-nav next" type="button" data-act="next" aria-label="${esc(t('p.photo.next'))}">${icon('right')}</button>` : ''}
        </div>
        <div class="viewer-foot">
          <div class="viewer-meta"></div>
          <div class="viewer-sub"></div>
        </div>
      </div>`);
    const img = v.querySelector('img');
    const show = () => {
      const ph = list[idx];
      const pr = ph.procedureId ? data.procById[ph.procedureId] : null;
      img.src = blobURL(ph.id, ph.blob);
      v.querySelector('.viewer-title').textContent = `${idx + 1} / ${list.length}`;
      v.querySelector('.viewer-meta').textContent = `${phaseLabel(ph)} · ${fmtDateLong(ph.date)}`;
      v.querySelector('.viewer-sub').textContent = [pr ? procLabel(pr.type) : null, pr ? sinceProcedure(pr.date, parseDate(ph.date)) : null, ...(ph.tags || [])].filter(Boolean).join(' · ') || t('p.photo.noTags');
    };
    const close = () => { document.removeEventListener('keydown', onKey); v.remove(); };
    const prev = () => { idx = (idx - 1 + list.length) % list.length; show(); };
    const next = () => { idx = (idx + 1) % list.length; show(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
    v.querySelector('[data-act=close]').onclick = close;
    v.querySelector('[data-act=prev]')?.addEventListener('click', prev);
    v.querySelector('[data-act=next]')?.addEventListener('click', next);
    v.querySelector('[data-act=edit]').onclick = async () => {
      const ph = list[idx];
      const r = await photoEditForm(ph, data.procedures);
      if (r) { list[idx] = r; await load(); paint(); show(); toast(t('p.photo.updated')); }
    };
    v.querySelector('[data-act=delete]').onclick = async () => {
      const ph = list[idx];
      const ok = await confirmDialog({ title: t('p.photo.deleteQ'), message: t('p.photo.irreversible'), okText: t('common.delete'), danger: true });
      if (!ok) return;
      await Photos.remove(ph.id);
      // Silme sonrası görüntüleyici kapanır ve galeriye dönülür; sonraki fotoğrafa geçmek "silinmedi" izlenimi veriyordu
      close();
      await refresh();
      toast(t('p.photo.deleted'));
    };
    let sx = null;
    v.querySelector('.viewer-stage').addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    v.querySelector('.viewer-stage').addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50 && list.length > 1) (dx < 0 ? next : prev)();
    });
    document.addEventListener('keydown', onKey);
    document.getElementById('layer').appendChild(v);
    show();
  }

  /* ---------- Karşılaştırma (TASARIM.md §5 "Fotoğraf karşılaştırma") ---------- */
  function openCompare() {
    const sel = state.selected;
    if (!sel.before || !sel.after) return;
    let before = sel.before, after = sel.after;
    let mode = 'side'; // side | slide | overlay
    const prOf = (ph) => (ph.procedureId && data.procById[ph.procedureId]) || null;
    const cap = (ph) => `${phaseLabel(ph)} · ${fmtDayMonth(ph.date)}`;
    const corner = (ph) => { const pr = prOf(ph); return ph.phase === 'after' && pr ? sinceProcedure(pr.date, parseDate(ph.date)) : (ph.tags || [])[0] || ''; };

    const v = el(`
      <div class="viewer cmp" role="dialog" aria-modal="true" aria-label="${esc(t('p.photo.compare'))}">
        <div class="viewer-head">
          <button class="btn-icon" type="button" data-act="close" aria-label="${esc(t('common.close'))}">${icon('x')}</button>
          <div class="viewer-title">${esc(t('p.photo.compare'))}</div>
          <button class="btn-icon" type="button" data-act="share" aria-label="${esc(t('p.cmp.share'))}">${icon('share')}</button>
        </div>
        <div class="cmp-stage" id="cmp-stage"></div>
        <div class="cmp-modes">
          ${[['side', t('p.cmp.side')], ['slide', t('p.cmp.slide')], ['overlay', t('p.cmp.overlay')]].map(([k, l]) => `<button class="cmp-chip ${k === mode ? 'on' : ''}" type="button" data-mode="${k}">${esc(l)}</button>`).join('')}
        </div>
        <div class="cmp-foot">
          <div class="cmp-pick">
            <img class="cmp-thumb" alt="">
            <div class="cmp-pick-main">
              <div class="cmp-pick-title">${esc(t('phase.after'))}</div>
              <div class="cmp-pick-sub"></div>
            </div>
            <button class="cmp-change" type="button" data-act="change">${esc(t('p.cmp.change'))}</button>
          </div>
        </div>
      </div>`);
    const stage = v.querySelector('#cmp-stage');

    const pane = (ph, alt) => `
      <div class="cmp-pane">
        <img src="${blobURL(ph.id, ph.blob)}" alt="${alt}" draggable="false">
        <span class="cmp-cap">${esc(cap(ph))}</span>
        ${corner(ph) ? `<span class="cmp-corner">${esc(corner(ph))}</span>` : ''}
      </div>`;

    function paintStage() {
      if (mode === 'side') {
        stage.innerHTML = `<div class="cmp-side">${pane(before, t('phase.before'))}${pane(after, t('phase.after'))}</div>`;
      } else if (mode === 'slide') {
        stage.innerHTML = `
          <div class="cmp-stack" id="cmp-stack">
            <img class="base" src="${blobURL(before.id, before.blob)}" alt="${esc(t('phase.before'))}" draggable="false">
            <img class="top" src="${blobURL(after.id, after.blob)}" alt="${esc(t('phase.after'))}" draggable="false" style="clip-path: inset(0 50% 0 0)">
            <div class="cmp-handle" style="left:50%"></div>
            <span class="cmp-cap">${esc(cap(before))}</span>
            <span class="cmp-cap right">${esc(cap(after))}</span>
          </div>
          <input class="cmp-range" type="range" min="0" max="100" value="50" aria-label="${esc(t('p.cmp.slide'))}">`;
        const top = stage.querySelector('.top'), handle = stage.querySelector('.cmp-handle'), range = stage.querySelector('.cmp-range');
        const setPos = (pct) => { top.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; handle.style.left = `${pct}%`; range.value = pct; };
        range.oninput = () => setPos(+range.value);
        const stack = stage.querySelector('#cmp-stack');
        const fromEvent = (e) => { const r = stack.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; setPos(Math.max(0, Math.min(100, (x / r.width) * 100))); };
        let drag = false;
        stack.addEventListener('pointerdown', (e) => { drag = true; fromEvent(e); });
        stack.addEventListener('pointermove', (e) => { if (drag) fromEvent(e); });
        window.addEventListener('pointerup', () => { drag = false; });
      } else {
        stage.innerHTML = `
          <div class="cmp-stack">
            <img class="base" src="${blobURL(before.id, before.blob)}" alt="${esc(t('phase.before'))}" draggable="false">
            <img class="top" src="${blobURL(after.id, after.blob)}" alt="${esc(t('phase.after'))}" draggable="false" style="opacity:.5">
            <span class="cmp-cap">${esc(cap(before))}</span>
            <span class="cmp-cap right">${esc(cap(after))}</span>
          </div>
          <input class="cmp-range" type="range" min="0" max="100" value="50" aria-label="${esc(t('p.cmp.opacity'))}">`;
        const top = stage.querySelector('.top'), range = stage.querySelector('.cmp-range');
        range.oninput = () => { top.style.opacity = String(+range.value / 100); };
      }
      v.querySelector('.cmp-thumb').src = blobURL(after.id + ':t', after.thumb || after.blob);
      v.querySelector('.cmp-pick-sub').textContent = [fmtDate(after.date), corner(after)].filter(Boolean).join(' · ');
    }

    const close = () => { document.removeEventListener('keydown', onKey); v.remove(); state.compare = false; paintTab(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    v.querySelector('[data-act=close]').onclick = close;
    v.querySelectorAll('[data-mode]').forEach((b) => {
      b.onclick = () => { mode = b.dataset.mode; v.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x === b)); paintStage(); };
    });
    v.querySelector('[data-act=change]').onclick = async () => {
      const pr = prOf(after) || prOf(before);
      const pool = data.photos.filter((x) => x.phase === 'after' && (!pr || x.procedureId === pr.id));
      const picked = await pickPhotoSheet(t('p.cmp.pickAfter'), pool, after.id);
      if (picked) { after = picked; state.selected.after = picked; paintStage(); }
    };
    v.querySelector('[data-act=share]').onclick = () => shareCompare(before, after, { cap, corner });
    document.addEventListener('keydown', onKey);
    document.getElementById('layer').appendChild(v);
    paintStage();
  }

  /** Aynı işlemin fotoğraflarından seçim: sheet içinde 3 sütun küçük resim */
  function pickPhotoSheet(title, pool, currentId) {
    const s = sheet({
      title, size: 'md',
      content: pool.length ? `<div class="pick-grid">${pool.map((ph) => `
        <button class="pick ${ph.id === currentId ? 'on' : ''}" type="button" data-pick="${ph.id}">
          <img src="${blobURL(ph.id + ':t', ph.thumb || ph.blob)}" alt="">
          <span>${esc(fmtDayMonth(ph.date))}${(ph.tags || [])[0] ? ` · ${esc(ph.tags[0])}` : ''}</span>
        </button>`).join('')}</div>` : emptyState({ title: t('p.cmp.noAfter') }),
    });
    s.body.querySelectorAll('[data-pick]').forEach((b) => { b.onclick = () => s.close(pool.find((x) => x.id === b.dataset.pick)); });
    return s.result;
  }

  /** İki fotoğrafı etiketleriyle tek görsele birleştirip paylaşır (hasta adı yazmaz) */
  async function shareCompare(before, after, { cap, corner }) {
    const load = (ph) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = blobURL(ph.id, ph.blob); });
    try {
      const [a, b] = await Promise.all([load(before), load(after)]);
      const H = 1200, gap = 12, pad = 24, label = 64;
      const wa = Math.round(a.width * (H / a.height)), wb = Math.round(b.width * (H / b.height));
      const c = document.createElement('canvas');
      c.width = pad * 2 + wa + gap + wb; c.height = pad * 2 + H + label;
      const x = c.getContext('2d');
      x.fillStyle = '#0B1326'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(a, pad, pad, wa, H); x.drawImage(b, pad + wa + gap, pad, wb, H);
      x.fillStyle = '#F5F4F0'; x.font = '500 30px -apple-system, Inter, sans-serif'; x.textBaseline = 'middle';
      x.fillText(cap(before), pad, pad + H + label / 2);
      x.fillText(cap(after), pad + wa + gap, pad + H + label / 2);
      x.fillStyle = '#A9B0C2'; x.font = '400 26px -apple-system, Inter, sans-serif'; x.textAlign = 'right';
      if (corner(before)) x.fillText(corner(before), pad + wa, pad + H + label / 2);
      if (corner(after)) x.fillText(corner(after), pad + wa + gap + wb, pad + H + label / 2);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
      const file = new File([blob], t('p.cmp.file'), { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: t('p.cmp.title') }); return; } catch (e) { if (e?.name === 'AbortError') return; }
      }
      const url = URL.createObjectURL(file);
      const link = document.createElement('a'); link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast(t('p.cmp.downloaded'));
    } catch (e) { toast(t('p.cmp.shareFail'), { kind: 'danger' }); }
  }

  paint();
  return () => { releaseURLs(); root.classList.remove('has-hero'); };
}
