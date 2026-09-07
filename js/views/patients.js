/* Hasta listesi — TASARIM.md §5 (Display başlık + dolu (+), arama, yaklaşan kontrol kartı, hairline liste) */
import { Patients, Procedures, Appointments, fullName } from '../db.js';
import { esc, icon, initials, fmtDate, fmtDayMonth, fmtTime, parseDate, daysBetween, emptyState, toast, age, actionMenu, statusText } from '../ui.js';
import { patientForm, appointmentForm } from '../forms.js';
import { setTopbar, go } from '../nav.js';
import { t, cmp, lower, procLabel, apptLabel, isOp } from '../i18n.js';

const MISSED_DAYS = 60;   // 'gelmedi' kayıtları bu kadar gün geciken listesinde kalır

let lastQuery = '';
const UPCOMING_DAYS = 30;

export async function render(root) {
  setTopbar({ title: t('patients.title') });

  async function addPatient() {
    const p = await patientForm();
    if (p) { toast(t('patients.added')); go(`/patient/${p.id}`); }
  }

  const [patients, procedures, appointments] = await Promise.all([Patients.all(), Procedures.all(), Appointments.all()]);
  patients.sort((a, b) => cmp(`${a.lastName} ${a.firstName}`, `${b.lastName} ${b.firstName}`));
  const pById = Object.fromEntries(patients.map((p) => [p.id, p]));
  const prById = Object.fromEntries(procedures.map((p) => [p.id, p]));
  const lastProc = {};
  procedures.forEach((pr) => { if (!lastProc[pr.patientId] || pr.date > lastProc[pr.patientId].date) lastProc[pr.patientId] = pr; });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + UPCOMING_DAYS);
  const upcoming = appointments
    .filter((a) => a.status === 'planned' && pById[a.patientId])
    .filter((a) => { const d = parseDate(a.date); return d >= today && d <= horizon; })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Geciken kontroller (MOBIL.md §3): tarihi geçmiş planlı + son MISSED_DAYS günde gelmedi; en eskisi üstte
  const missedCutoff = new Date(today); missedCutoff.setDate(missedCutoff.getDate() - MISSED_DAYS);
  const overdue = appointments
    .filter((a) => pById[a.patientId])
    .filter((a) => { const d = parseDate(a.date); return (a.status === 'planned' && d < today) || (a.status === 'missed' && d >= missedCutoff && d < today); })
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysLabel = (a) => { const n = daysBetween(today, parseDate(a.date)); return n === 0 ? lower(t('common.today')) : n === 1 ? lower(t('common.tomorrow')) : t('days.n', { n }); };

  root.innerHTML = `
    <div class="screen">
    <div class="page-head">
      <div>
        <h1 class="page-title">${esc(t('patients.title'))}</h1>
        <div class="page-sub">${esc(t('patients.count', { n: patients.length }))}${overdue.length ? ` · <span class="t-danger">${esc(t('patients.overdue', { n: overdue.length }))}</span>` : ''}${upcoming.length ? ` · ${esc(t('patients.upcoming', { n: upcoming.length }))}` : ''}</div>
      </div>
      <button class="btn-fill-icon" type="button" data-act="add" aria-label="${esc(t('patients.new'))}">${icon('plus')}</button>
    </div>
    <div class="search">${icon('search')}<input type="search" placeholder="${esc(t('patients.search.ph'))}" value="${esc(lastQuery)}" autocomplete="off" aria-label="${esc(t('patients.search'))}"></div>
    <div id="list"></div>
    </div>`;

  root.querySelector('[data-act=add]').onclick = addPatient;
  const input = root.querySelector('input');
  const list = root.querySelector('#list');

  function upcomingCard(a) {
    const p = pById[a.patientId];
    const pr = a.procedureId ? prById[a.procedureId] : null;
    return `
      <button class="upcoming-card" type="button" data-open="${p.id}">
        <div>
          <div class="name">${esc(fullName(p))}</div>
          <div class="sub">${(isOp(a) ? [apptLabel(a), lower(t('op.row'))] : [pr ? procLabel(pr.typeName) : null, lower(apptLabel(a))]).filter(Boolean).map(esc).join(' · ')}</div>
        </div>
        <div>
          <div class="date">${esc(fmtDayMonth(a.date))}</div>
          <div class="rel">${esc(daysLabel(a))}</div>
        </div>
      </button>`;
  }

  /** Geciken kontrol satırı: hasta, kontrol adı, tarih; sağda 'N gün gecikti' ya da 'Gelmedi' */
  function overdueRow(a) {
    const p = pById[a.patientId];
    const pr = a.procedureId ? prById[a.procedureId] : null;
    const d = parseDate(a.date);
    const sub = [isOp(a) ? t('op.row') : apptLabel(a), pr && !isOp(a) ? procLabel(pr.typeName) : null, `${fmtDayMonth(a.date)} ${fmtTime(a.date)}`].filter(Boolean).join(' · ');
    return `
      <button class="row" type="button" data-overdue="${a.id}">
        <div class="avatar sm">${esc(initials(fullName(p)))}</div>
        <div class="row-main">
          <div class="row-title">${esc(fullName(p))}</div>
          <div class="row-sub">${esc(sub)}</div>
        </div>
        <div class="row-end">${a.status === 'missed' ? statusText('missed') : `<span class="status danger">${esc(t('days.late', { n: daysBetween(d, today) }))}</span>`}</div>
      </button>`;
  }
  /** Geciken satır menüsü: yeniden planla / geldi / gelmedi / hasta kartı */
  async function overdueMenu(a) {
    const p = pById[a.patientId];
    const items = [
      { label: t('overdue.reschedule'), icon: 'calendar', value: 'reschedule' },
      { label: t('appt.markDone'), icon: 'check', value: 'attended' },
    ];
    if (a.status !== 'missed') items.push({ label: t('appt.markMissed'), icon: 'alert', value: 'missed' });
    items.push({ label: t('cal.openPatient'), icon: 'user', value: 'open' });
    const v = await actionMenu(`${fullName(p)} · ${apptLabel(a)}`, items);
    if (v === 'reschedule') { const r = await appointmentForm({ patientId: a.patientId, procedures: procedures.filter((x) => x.patientId === a.patientId), existing: { ...a, status: 'planned' } }); if (r) { toast(t('overdue.rescheduled')); render(root); } }
    else if (v === 'attended' || v === 'missed') { await Appointments.save({ ...a, status: v }); toast(t(v === 'attended' ? 'appt.doneToast' : 'appt.missedToast')); render(root); }
    else if (v === 'open') go(`/patient/${a.patientId}/randevular`);
  }

  function patientRow(p) {
    const lp = lastProc[p.id];
    const a = age(p.birthDate);
    const planned = lp && parseDate(lp.date) > today;
    const sub = [a !== null ? String(a) : null, lp ? `${planned ? `${t('op.planned')} · ` : ''}${procLabel(lp.typeName)} · ${fmtDayMonth(lp.date)}` : t('patients.noProc')].filter(Boolean).join(' · ');
    return `
      <a class="row" href="#/patient/${p.id}">
        <div class="avatar">${esc(initials(fullName(p)))}</div>
        <div class="row-main">
          <div class="row-title">${esc(fullName(p))}</div>
          <div class="row-sub">${esc(sub)}</div>
        </div>
        <div class="row-end">${icon('chevron')}</div>
      </a>`;
  }

  function paint() {
    const q = lower(lastQuery).trim();
    const rows = q ? patients.filter((p) => lower(`${fullName(p)} ${p.phone || ''}`).includes(q)) : patients;
    if (!patients.length) {
      list.innerHTML = emptyState({ title: t('patients.empty'), text: t('patients.emptyText'), action: `<button class="btn btn-primary" type="button" data-act="add">${esc(t('patients.new'))}</button>` });
      list.querySelector('[data-act=add]').onclick = addPatient;
      return;
    }
    if (!rows.length) { list.innerHTML = emptyState({ title: t('patients.noResult'), text: t('patients.noMatch', { q: lastQuery }) }); return; }
    list.innerHTML = `
      ${!q && overdue.length ? `
      <section class="section">
        <div class="section-label t-danger">${esc(t('patients.overdueLabel', { n: overdue.length }))}</div>
        <div class="list">${overdue.slice(0, 5).map(overdueRow).join('')}</div>
        ${overdue.length > 5 ? `<p class="t-caption" style="margin-top:8px">${esc(t('patients.overdueMore', { n: overdue.length - 5 }))}</p>` : ''}
      </section>` : ''}
      ${!q && upcoming.length ? `
      <section class="section">
        <div class="section-label">${esc(t('patients.upcomingLabel'))}</div>
        ${upcoming.slice(0, 2).map(upcomingCard).join('')}
      </section>` : ''}
      <section class="section">
        <div class="section-label">${esc(q ? t('patients.results', { n: rows.length }) : t('patients.all'))}</div>
        <div class="list">${rows.map(patientRow).join('')}</div>
      </section>`;
    list.querySelectorAll('[data-open]').forEach((b) => { b.onclick = () => go(`/patient/${b.dataset.open}`); });
    list.querySelectorAll('[data-overdue]').forEach((b) => { b.onclick = () => overdueMenu(appointments.find((a) => a.id === b.dataset.overdue)); });
  }

  input.addEventListener('input', () => { lastQuery = input.value; paint(); });
  paint();
}
