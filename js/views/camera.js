/* Kamera — MOBIL.md §4'ün web denemesi (GECIS.md §5 adım 4)
 * getUserMedia ile canlı görüntü; üstte hasta / işlem / dönem, altta şablondan açı seçici.
 * Ghost overlay: aynı hastanın aynı açıdaki önceki fotoğrafı %35 saydam. Izgara ve seviye çizgisi.
 * Seri çekim: açı seçili → çek → sonraki açı. Fotoğraf yalnızca uygulamaya yazılır (sistem galerisine değil).
 * Web sınırları: iOS Safari'de zoom/flaş kontrolü yok; zoom destekleniyorsa 1x'e kilitlenir, flaş kapalı kalır.
 */
import { Patients, Procedures, Photos, Templates, fullName } from '../db.js';
import { esc, icon, toast, actionMenu, fmtDayMonth, emptyState } from '../ui.js';
import { processImage, blobURL, releaseURLs } from '../photos.js';
import { photoUploadForm, defaultPeriodFor } from '../forms.js';
import { go, replacePath, setTopbar } from '../nav.js';
import { t, procLabel } from '../i18n.js';
import { PERIODS, ANGLES, periodLabel, angleLabel } from '../model.js';


export async function render(root, { id = null } = {}) {
  setTopbar({ title: t('cam.title') });
  let patients = await Patients.all();
  patients.sort((a, b) => fullName(a).localeCompare(fullName(b), 'tr'));
  if (!patients.length) { toast(t('cal.addPatientFirst')); go('/'); return; }

  // Hasta seçili değilse önce seçtir (MOBIL.md §3.4)
  if (!id || !patients.some((p) => p.id === id)) {
    const pick = await actionMenu(t('cam.pickPatient'), patients.map((p) => ({ label: fullName(p), value: p.id })));
    if (!pick) { go('/'); return; }
    id = pick;
    replacePath(`/camera/${id}`);
  }

  const [patient, procedures, photos, templates] = await Promise.all([Patients.get(id), Procedures.byPatient(id), Photos.byPatient(id), Templates.all()]);
  const tplById = Object.fromEntries(templates.map((x) => [x.id, x]));
  const state = {
    procId: procedures[0]?.id || '',
    period: defaultPeriodFor(procedures[0] || null),
    angles: [], angleIdx: 0,
    ghost: true, grid: true,
    taken: {},       // angle → kaydedilen fotoğraf
    stream: null, busy: false,
  };
  const proc = () => procedures.find((p) => p.id === state.procId) || null;
  const anglesFor = () => { const set = tplById[proc()?.templateId]?.angleSet; return set?.length ? set : ANGLES.filter((a) => a !== 'custom'); };
  state.angles = anglesFor();
  const angle = () => state.angles[state.angleIdx];

  root.innerHTML = `
    <div class="cam" role="region" aria-label="${esc(t('cam.title'))}">
      <div class="cam-head">
        <button class="btn-icon" type="button" data-act="close" aria-label="${esc(t('common.close'))}">${icon('x')}</button>
        <div class="cam-ctx">
          <div class="cam-name">${esc(fullName(patient))}</div>
          <div class="cam-sub"><button type="button" class="cam-pill" data-act="proc"><span></span>${icon('down')}</button><button type="button" class="cam-pill" data-act="period"><span></span>${icon('down')}</button></div>
        </div>
        <button class="btn-icon ${state.ghost ? 'on' : ''}" type="button" data-act="ghost" aria-label="${esc(t('cam.ghost'))}" title="${esc(t('cam.ghost'))}">${icon('image')}</button>
        <button class="btn-icon ${state.grid ? 'on' : ''}" type="button" data-act="grid" aria-label="${esc(t('cam.grid'))}" title="${esc(t('cam.grid'))}">${icon('grid')}</button>
      </div>
      <div class="cam-stage">
        <video class="cam-video" playsinline autoplay muted></video>
        <img class="cam-ghost" alt="" hidden>
        <div class="cam-grid" ${state.grid ? '' : 'hidden'}></div>
        <div class="cam-level" hidden><i></i></div>
        <div class="cam-flash"></div>
        <div class="cam-fallback" hidden></div>
      </div>
      <div class="cam-foot">
        <div class="chips cam-angles" id="cam-angles"></div>
        <div class="cam-controls">
          <button class="cam-thumb" type="button" data-act="last" aria-label="${esc(t('cam.last'))}" hidden><img alt=""></button>
          <button class="cam-shutter" type="button" data-act="shoot" aria-label="${esc(t('cam.shoot'))}"><span></span></button>
          <div class="cam-done-wrap">
            <button class="cam-done" type="button" data-act="done" aria-label="${esc(t('cam.done'))}" title="${esc(t('cam.done'))}">${icon('check')}</button>
            <span class="cam-count" id="cam-count"></span>
          </div>
        </div>
        <button type="button" class="cam-level-btn" data-act="level" hidden>${esc(t('cam.level'))}</button>
      </div>
    </div>`;

  const el = (s) => root.querySelector(s);
  const video = el('.cam-video'), ghostImg = el('.cam-ghost'), fallback = el('.cam-fallback');

  /* ---------- Bağlam: işlem / dönem / açılar ---------- */
  function paintCtx() {
    const pr = proc();
    el('[data-act=proc] span').textContent = pr ? `${procLabel(pr.typeName)} · ${fmtDayMonth(pr.date)}` : t('form.appt.noProc');
    el('[data-act=period] span').textContent = periodLabel(state.period);
  }
  function paintAngles() {
    const box = el('#cam-angles');
    box.innerHTML = state.angles.map((a, i) => `<button class="chip ${i === state.angleIdx ? 'on' : ''} ${state.taken[a] ? 'done' : ''}" type="button" data-angle="${i}">${state.taken[a] ? icon('check') : ''}${esc(angleLabel(a))}</button>`).join('');
    box.querySelectorAll('[data-angle]').forEach((b) => { b.onclick = () => { state.angleIdx = +b.dataset.angle; paintAngles(); paintGhost(); }; });
    const on = box.querySelector('.chip.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    const done = state.angles.filter((a) => state.taken[a]).length;
    el('#cam-count').textContent = `${done}/${state.angles.length}`;
    el('[data-act=done]').classList.toggle('ready', done > 0);   // ilk çekimden sonra 'Bitti' belirgin
  }
  /** Aynı hastanın aynı açıdaki önceki fotoğrafı: önce aynı işlem, sonra 'öncesi', sonra en yeni */
  function ghostFor(a) {
    const cand = photos.filter((ph) => (ph.angle || 'custom') === a);
    if (!cand.length) return null;
    const score = (ph) => (ph.procedureId === state.procId ? 2 : 0) + (ph.period === 'pre' ? 1 : 0);
    return [...cand].sort((x, y) => score(y) - score(x) || (y.date || '').localeCompare(x.date || ''))[0];
  }
  function paintGhost() {
    const g = state.ghost ? ghostFor(angle()) : null;
    ghostImg.hidden = !g;
    if (g) ghostImg.src = blobURL(g.id, g.blob);
    el('[data-act=ghost]').classList.toggle('on', state.ghost);
  }

  el('[data-act=proc]').onclick = async () => {
    const v = await actionMenu(t('form.appt.proc'), [...procedures.map((p) => ({ label: `${procLabel(p.typeName)} · ${fmtDayMonth(p.date)}`, value: p.id, checked: p.id === state.procId })), { label: t('form.appt.noProc'), value: '-', checked: !state.procId }]);
    if (v == null) return;
    state.procId = v === '-' ? '' : v;
    state.period = defaultPeriodFor(proc());
    state.angles = anglesFor(); state.angleIdx = 0; state.taken = {};
    paintCtx(); paintAngles(); paintGhost();
  };
  el('[data-act=period]').onclick = async () => {
    const v = await actionMenu(t('form.photo.period'), PERIODS.map((k) => ({ label: periodLabel(k), value: k, checked: k === state.period })));
    if (v) { state.period = v; paintCtx(); }
  };
  el('[data-act=ghost]').onclick = () => { state.ghost = !state.ghost; paintGhost(); };
  el('[data-act=grid]').onclick = () => { state.grid = !state.grid; el('.cam-grid').hidden = !state.grid; el('[data-act=grid]').classList.toggle('on', state.grid); };
  el('[data-act=close]').onclick = () => { stop(); go(`/patient/${id}/fotograflar`); };

  /* ---------- Kamera ---------- */
  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) { showFallback(t('cam.unsupported')); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 2560 } } });
    } catch (e) {
      showFallback(e?.name === 'NotAllowedError' ? t('cam.denied') : t('cam.unavailable'));
      return;
    }
    // İzin beklenirken ekran değiştiyse akışı hemen bırak
    if (closed) { stream.getTracks().forEach((tr) => tr.stop()); return; }
    state.stream = stream;
    video.srcObject = stream;
    try { await video.play(); } catch { /* autoplay engeli: kullanıcı dokununca başlar */ }
    if (closed) return;
    // Tutarlılık: zoom 1x'e kilitle, flaş kapalı (destekleyen tarayıcılarda; iOS Safari'de yok)
    const track = stream.getVideoTracks()[0];
    try {
      const cap = track.getCapabilities?.() || {};
      const adv = {};
      if (cap.zoom) adv.zoom = cap.zoom.min ?? 1;
      if (cap.torch) adv.torch = false;
      if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] });
    } catch { /* yok say */ }
  }
  let closed = false;
  function stop() {
    closed = true;
    state.stream?.getTracks().forEach((tr) => tr.stop());
    state.stream = null;
    window.removeEventListener('deviceorientation', onOrient);
  }
  function showFallback(msg) {
    fallback.hidden = false;
    fallback.innerHTML = emptyState({ title: t('cam.noCamera'), text: msg, action: `<button class="btn btn-primary" type="button" data-act="gallery">${esc(t('form.photo.pick'))}</button>`, center: true });
    fallback.querySelector('[data-act=gallery]').onclick = async () => {
      const r = await photoUploadForm({ patientId: id, procedures, defaultProcedureId: state.procId, defaultPeriod: state.period, defaultAngle: angle() });
      if (r?.length) go(`/patient/${id}/fotograflar`);
    };
    el('[data-act=shoot]').disabled = true;
  }

  /* ---------- Çekim ---------- */
  async function shoot() {
    if (state.busy || !state.stream || video.readyState < 2) return;
    state.busy = true;
    const c = document.createElement('canvas');
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    el('.cam-flash').classList.add('go'); setTimeout(() => el('.cam-flash').classList.remove('go'), 220);
    try {
      const raw = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.95));
      const img = await processImage(raw);
      const a = angle();
      const saved = await Photos.save({
        patientId: id, procedureId: state.procId || null, period: state.period, angle: a, date: new Date().toISOString().slice(0, 10), notes: '',
        blob: img.blob, thumb: img.thumb, width: img.width, height: img.height, originalName: `camera-${a}.jpg`, size: img.blob.size, source: 'camera',
      });
      photos.unshift(saved);
      state.taken[a] = saved;
      const th = el('[data-act=last]'); th.hidden = false; th.querySelector('img').src = blobURL(saved.id + ':t', saved.thumb);
      // Sıradaki çekilmemiş açıya geç (MOBIL.md §4 seri çekim)
      const next = state.angles.findIndex((x, i) => i > state.angleIdx && !state.taken[x]);
      const any = state.angles.findIndex((x) => !state.taken[x]);
      if (next >= 0) state.angleIdx = next; else if (any >= 0) state.angleIdx = any;
      else toast(t('cam.setDone', { n: state.angles.length }), { kind: 'ok' });
      paintAngles(); paintGhost();
    } catch (e) {
      toast(t('common.saveFail'), { kind: 'danger' });
    } finally { state.busy = false; }
  }
  el('[data-act=shoot]').onclick = shoot;
  el('[data-act=last]').onclick = () => { stop(); go(`/patient/${id}/fotograflar`); };
  el('[data-act=done]').onclick = () => { stop(); go(`/patient/${id}/fotograflar`); };

  /* ---------- Seviye çizgisi (DeviceOrientation; iOS'ta izin ister) ---------- */
  const levelEl = el('.cam-level');
  function onOrient(e) {
    if (e.gamma == null || e.beta == null) return;
    const roll = e.gamma;                 // sağ/sol eğim (portre)
    const pitch = Math.abs(e.beta - 90);  // ileri/geri eğim; dik tutuşta 90
    levelEl.hidden = false;
    levelEl.querySelector('i').style.transform = `rotate(${Math.max(-30, Math.min(30, roll))}deg)`;
    levelEl.classList.toggle('warn', Math.abs(roll) > 4 || pitch > 8);
  }
  async function enableLevel() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return;
      }
      window.addEventListener('deviceorientation', onOrient);
      el('[data-act=level]').hidden = true;
    } catch { /* yok say */ }
  }
  if (typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') el('[data-act=level]').hidden = false;   // iOS: kullanıcı dokunuşu gerekir
    else window.addEventListener('deviceorientation', onOrient);
  }
  el('[data-act=level]').onclick = enableLevel;

  paintCtx(); paintAngles(); paintGhost();
  start();
  return () => { stop(); releaseURLs(); };
}
