/* Hasta seçici sheet — deneme bulgusu 4. Üstte arama; bölümler: Bugün randevusu olanlar · Son 5 · Tümü.
 * Kamera sekmesi ve Ajanda "Randevu ekle" aynı seçiciyi kullanır. Sonuç: hasta id ya da null. */
import { Patients, Appointments, fullName } from './db.js';
import { sheet, esc, icon, initials, age, emptyState } from './ui.js';
import { t, lower, cmp } from './i18n.js';

export async function pickPatientSheet({ title = t('cam.pickPatient') } = {}) {
  const [patients, appointments] = await Promise.all([Patients.all(), Appointments.all()]);
  patients.sort((a, b) => cmp(`${a.lastName} ${a.firstName}`, `${b.lastName} ${b.firstName}`));
  const todayKey = new Date().toLocaleDateString('sv-SE');   // YYYY-MM-DD yerel
  const todayIds = new Set(appointments.filter((a) => a.status === 'planned' && a.date.slice(0, 10) === todayKey).map((a) => a.patientId));
  const today = patients.filter((p) => todayIds.has(p.id));
  const recent = [...patients].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 5);
  const s = sheet({ title, size: 'md', closeText: t('common.cancel'), content: `
    <div class="pick-search">${icon('search')}<input type="search" placeholder="${esc(t('patients.search.ph'))}" autocomplete="off" autocapitalize="off" enterkeyhint="search" aria-label="${esc(t('patients.search'))}"></div>
    <div id="pick-list"></div>` });
  const list = s.body.querySelector('#pick-list');
  const input = s.body.querySelector('input');
  const row = (p) => {
    const a = age(p.birthDate);
    return `<button class="row" type="button" data-id="${p.id}"><div class="avatar sm">${esc(initials(fullName(p)))}</div><div class="row-main"><div class="row-title">${esc(fullName(p))}</div>${a !== null || p.phone ? `<div class="row-sub">${esc([a !== null ? t('age', { n: a }) : null, p.phone || null].filter(Boolean).join(' · '))}</div>` : ''}</div>${icon('chevron')}</button>`;
  };
  const section = (label, items) => (items.length ? `<section class="section"><div class="section-label">${esc(label)}</div><div class="list">${items.map(row).join('')}</div></section>` : '');
  function paint() {
    const q = lower(input.value).trim();
    if (q) {
      const hits = patients.filter((p) => lower(`${fullName(p)} ${p.phone || ''}`).includes(q));
      list.innerHTML = hits.length ? `<div class="list" style="margin-top:12px">${hits.map(row).join('')}</div>` : emptyState({ title: t('patients.noResult') });
    } else {
      list.innerHTML = section(t('pick.today'), today) + section(t('pick.recent'), recent) + section(t('pick.all'), patients);
    }
    list.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => s.close(b.dataset.id); });
  }
  input.addEventListener('input', paint);
  paint();
  return s.result;
}
