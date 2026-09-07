/* Hasta listesi — TASARIM.md §5 (Display başlık + dolu (+), arama, yaklaşan kontrol kartı, hairline liste) */
import { Patients, Procedures, Appointments, fullName } from '../db.js';
import { esc, icon, initials, fmtDate, fmtDayMonth, parseDate, daysBetween, emptyState, toast, age } from '../ui.js';
import { patientForm } from '../forms.js';
import { setTopbar, go } from '../nav.js';
import { t, cmp, lower, procLabel, apptLabel } from '../i18n.js';

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

  const daysLabel = (a) => { const n = daysBetween(today, parseDate(a.date)); return n === 0 ? lower(t('common.today')) : n === 1 ? lower(t('common.tomorrow')) : t('days.n', { n }); };

  root.innerHTML = `
    <div class="screen">
    <div class="page-head">
      <div>
        <h1 class="page-title">${esc(t('patients.title'))}</h1>
        <div class="page-sub">${esc(t('patients.count', { n: patients.length }))}${upcoming.length ? ` · ${esc(t('patients.upcoming', { n: upcoming.length }))}` : ''}</div>
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
          <div class="sub">${[pr ? procLabel(pr.type) : null, lower(apptLabel(a))].filter(Boolean).map(esc).join(' · ')}</div>
        </div>
        <div>
          <div class="date">${esc(fmtDayMonth(a.date))}</div>
          <div class="rel">${esc(daysLabel(a))}</div>
        </div>
      </button>`;
  }

  function patientRow(p) {
    const lp = lastProc[p.id];
    const a = age(p.birthDate);
    const sub = [a !== null ? String(a) : null, lp ? `${procLabel(lp.type)} · ${fmtDayMonth(lp.date)}` : t('patients.noProc')].filter(Boolean).join(' · ');
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
  }

  input.addEventListener('input', () => { lastQuery = input.value; paint(); });
  paint();
}
