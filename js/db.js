/* Veri katmanı — IndexedDB (MOBIL.md §2 veri modeli)
 * Tüm kalıcı veri erişimi bu dosya üzerinden yapılır.
 * Depolar: patients, templates, procedures, photos, appointments, audit, settings
 * Ortak alanlar: id (UUID), createdAt, updatedAt, deletedAt (soft delete), deviceID.
 * Silme yumuşaktır: deletedAt yazılır, kayıt listelerden düşer, TRASH_DAYS sonra kalıcı silinir.
 */

import { t as tr, procLabel } from './i18n.js';
import { DEFAULT_TEMPLATES, TRASH_DAYS } from './model.js';

const DB_NAME = 'curalis';
const DB_VERSION = 1;
export const SCHEMA = 2;          // yedek dosyası şema sürümü (MOBIL.md §2 modeli)
const BACKUP_APP = 'curalis';

let _db = null;
let _deviceID = null;

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); });
}

export function nowISO() {
  return new Date().toISOString();
}

export function deviceID() { return _deviceID || 'unknown'; }

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const mk = (name, indexes) => {
        if (db.objectStoreNames.contains(name)) return;
        const s = db.createObjectStore(name, { keyPath: 'id' });
        indexes.forEach((i) => s.createIndex(i, i));
      };
      mk('patients', ['lastName', 'updatedAt', 'deletedAt']);
      mk('templates', ['name', 'deletedAt']);
      mk('procedures', ['patientId', 'templateId', 'date', 'deletedAt']);
      mk('photos', ['patientId', 'procedureId', 'date', 'period', 'angle', 'deletedAt']);
      mk('appointments', ['patientId', 'procedureId', 'date', 'status', 'deletedAt']);
      mk('audit', ['at', 'entity']);
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = async () => {
      _db = req.result;
      _db.onversionchange = () => { _db.close(); _db = null; };
      try { await init(); } catch (e) { reject(e); return; }
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error(tr('db.blocked')));
  });
}

/* Açılış: cihaz kimliği ve şablon tohumu */
async function init() {
  let id = await Settings.get('deviceID');
  if (!id) { id = uid(); await Settings.set('deviceID', id); }
  _deviceID = id;
  await seedTemplates();
}

function promisify(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

/** Bir transaction içinde çalıştırır. fn içinde yalnızca IDB isteklerini await edin. */
async function run(storeNames, mode, fn) {
  const db = await openDB();
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  const t = db.transaction(names, mode);
  const stores = {};
  names.forEach((n) => { stores[n] = t.objectStore(n); });
  const done = new Promise((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error(tr('db.aborted')));
  });
  const result = await fn(Array.isArray(storeNames) ? stores : stores[storeNames], t);
  await done;
  return result;
}

const live = (list) => list.filter((x) => !x.deletedAt);

function baseStore(name) {
  return {
    all: () => run(name, 'readonly', (s) => promisify(s.getAll())).then(live),
    allWithDeleted: () => run(name, 'readonly', (s) => promisify(s.getAll())),
    trashed: () => run(name, 'readonly', (s) => promisify(s.getAll())).then((l) => l.filter((x) => x.deletedAt)),
    get: (id) => run(name, 'readonly', (s) => promisify(s.get(id))),
    put: (obj) => run(name, 'readwrite', (s) => promisify(s.put(obj))).then(() => obj),
    hardDelete: (id) => run(name, 'readwrite', (s) => promisify(s.delete(id))),
    byIndex: (idx, val) => run(name, 'readonly', (s) => promisify(s.index(idx).getAll(val))).then(live),
    count: () => run(name, 'readonly', (s) => promisify(s.getAll())).then((l) => live(l).length),
    clear: () => run(name, 'readwrite', (s) => promisify(s.clear())),
  };
}

/** Ortak alanlar (MOBIL.md §2): id, createdAt, updatedAt, deletedAt, deviceID */
function stamp(obj) {
  const now = nowISO();
  return { ...obj, id: obj.id || uid(), createdAt: obj.createdAt || now, updatedAt: now, deletedAt: obj.deletedAt ?? null, deviceID: deviceID() };
}

/* ---------------- Denetim kaydı ---------------- */
const _audit = baseStore('audit');
/** Görüntüleme dışındaki her eylem yazılır; silinemez, Ayarlar'dan okunur. */
export async function audit(action, entity, entityId, summary = '') {
  const e = { id: uid(), at: nowISO(), deviceID: deviceID(), action, entity, entityId: entityId || null, summary: String(summary || '').slice(0, 200) };
  try { await _audit.put(e); } catch { /* denetim kaydı ana akışı durdurmaz */ }
  return e;
}
export const Audit = {
  async list(limit = 300) {
    const all = await _audit.allWithDeleted();
    return all.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  },
  count: () => _audit.allWithDeleted().then((l) => l.length),
};

/** Türkçe ad düzeltme (§5B): baştaki/sondaki boşluk temizlenir, her sözcüğün baş harfi İ/ı, Ş/ş kurallarıyla büyür;
 *  tamamen BÜYÜK yazılmışsa kalanı küçülür ("ELİF" → "Elif"), karışık yazım ("McDonald") korunur. */
export function tidyName(s) {
  return String(s || '').trim().replace(/\s+/g, ' ').split(' ').map((w) => w.split('-').map((p) => {
    if (!p) return p;
    const rest = p.length > 1 && p === p.toLocaleUpperCase('tr') ? p.slice(1).toLocaleLowerCase('tr') : p.slice(1);
    return p[0].toLocaleUpperCase('tr') + rest;
  }).join('-')).join(' ');
}

/* ---------------- Hastalar ---------------- */
const _patients = baseStore('patients');
export const Patients = {
  ..._patients,
  async save(p) {
    const isNew = !p.id;
    const obj = stamp(p);
    obj.firstName = tidyName(obj.firstName);
    obj.lastName = tidyName(obj.lastName);
    await _patients.put(obj);
    audit(isNew ? 'create' : 'update', 'patient', obj.id, fullName(obj));
    return obj;
  },
  /** Yumuşak silme: hasta ve bağlı tüm kayıtlar birlikte (deletedVia ile) işaretlenir; geri alınabilir. */
  async remove(id) {
    const now = nowISO();
    const via = `patient:${id}`;
    const p = await run(['patients', 'procedures', 'photos', 'appointments'], 'readwrite', async (s) => {
      const patient = await promisify(s.patients.get(id));
      if (!patient) return null;
      s.patients.put({ ...patient, deletedAt: now, updatedAt: now });
      for (const name of ['procedures', 'photos', 'appointments']) {
        const rows = await promisify(s[name].index('patientId').getAll(id));
        rows.filter((r) => !r.deletedAt).forEach((r) => s[name].put({ ...r, deletedAt: now, deletedVia: via }));
      }
      return patient;
    });
    if (p) audit('delete', 'patient', id, fullName(p));
    return p;
  },
  async restore(id) {
    const via = `patient:${id}`;
    const p = await run(['patients', 'procedures', 'photos', 'appointments'], 'readwrite', async (s) => {
      const patient = await promisify(s.patients.get(id));
      if (!patient) return null;
      s.patients.put({ ...patient, deletedAt: null, updatedAt: nowISO() });
      for (const name of ['procedures', 'photos', 'appointments']) {
        const rows = await promisify(s[name].index('patientId').getAll(id));
        rows.filter((r) => r.deletedVia === via).forEach((r) => s[name].put({ ...r, deletedAt: null, deletedVia: null }));
      }
      return patient;
    });
    if (p) audit('restore', 'patient', id, fullName(p));
    return p;
  },
  /** Kalıcı silme: hasta ve ona bağlı her şey. */
  async purge(id) {
    const p = await _patients.get(id);
    await run(['patients', 'procedures', 'photos', 'appointments'], 'readwrite', async (s) => {
      for (const name of ['procedures', 'photos', 'appointments']) {
        const keys = await promisify(s[name].index('patientId').getAllKeys(id));
        keys.forEach((k) => s[name].delete(k));
      }
      s.patients.delete(id);
    });
    if (p) audit('purge', 'patient', id, fullName(p));
  },
};

export function fullName(p) {
  return `${p.firstName || ''} ${p.lastName || ''}`.trim() || tr('common.unnamed');
}

export function byName(a, b) {
  return fullName(a).localeCompare(fullName(b), 'tr');
}

export function normalize(s) {
  return (s || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}

/* ---------------- Şablonlar ---------------- */
const _templates = baseStore('templates');
export const Templates = {
  ..._templates,
  async all() { return (await _templates.all()).sort((a, b) => a.name.localeCompare(b.name, 'tr')); },
  async save(tpl) {
    const isNew = !tpl.id;
    const obj = stamp({ followUpPeriods: [], angleSet: [], fields: [], ...tpl });
    obj.name = (obj.name || '').trim();
    await _templates.put(obj);
    audit(isNew ? 'create' : 'update', 'template', obj.id, obj.name);
    return obj;
  },
  /** Şablon silinince eski işlemler bozulmaz: işlem, şablon adını (typeName) kendinde tutar. */
  async remove(id) {
    const tpl = await _templates.get(id);
    await _templates.hardDelete(id);
    if (tpl) audit('delete', 'template', id, tpl.name);
  },
};
/** Depo boşsa varsayılan şablonlar geçerli dilde tohumlanır (bir kez). */
async function seedTemplates() {
  const existing = await _templates.allWithDeleted();
  if (existing.length) return 0;
  const rows = DEFAULT_TEMPLATES.map((d) => stamp({ name: procLabel(d.nameKey), nameKey: d.nameKey, followUpPeriods: d.followUpPeriods, angleSet: d.angleSet, fields: d.fields }));
  await run('templates', 'readwrite', (s) => { rows.forEach((r) => s.put(r)); });
  return rows.length;
}

/* ---------------- İşlemler ---------------- */
const _procedures = baseStore('procedures');
export const Procedures = {
  ..._procedures,
  async save(p) {
    const isNew = !p.id;
    const obj = stamp({ details: {}, complication: null, revisionOf: null, followUpSchedule: [], ...p });
    await _procedures.put(obj);
    audit(isNew ? 'create' : 'update', 'procedure', obj.id, `${obj.typeName} · ${obj.date}`);
    return obj;
  },
  async byPatient(patientId) {
    const list = await _procedures.byIndex('patientId', patientId);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },
  /** Yumuşak silme: işlem ve otomatik randevuları (kontroller + işlem günü). Fotoğraflar bağlı kalır, işlem geri alınınca yeniden görünür. */
  async remove(id) {
    const now = nowISO();
    const via = `procedure:${id}`;
    const pr = await run(['procedures', 'appointments'], 'readwrite', async (s) => {
      const proc = await promisify(s.procedures.get(id));
      if (!proc) return null;
      s.procedures.put({ ...proc, deletedAt: now, updatedAt: now });
      const apps = await promisify(s.appointments.index('procedureId').getAll(id));
      apps.filter((a) => a.auto && !a.deletedAt).forEach((a) => s.appointments.put({ ...a, deletedAt: now, deletedVia: via }));
      return proc;
    });
    if (pr) audit('delete', 'procedure', id, pr.typeName);
    return pr;
  },
  async restore(id) {
    const via = `procedure:${id}`;
    const pr = await run(['procedures', 'appointments'], 'readwrite', async (s) => {
      const proc = await promisify(s.procedures.get(id));
      if (!proc) return null;
      s.procedures.put({ ...proc, deletedAt: null, updatedAt: nowISO() });
      const apps = await promisify(s.appointments.index('procedureId').getAll(id));
      apps.filter((a) => a.deletedVia === via).forEach((a) => s.appointments.put({ ...a, deletedAt: null, deletedVia: null }));
      return proc;
    });
    if (pr) audit('restore', 'procedure', id, pr.typeName);
    return pr;
  },
  async purge(id) {
    const pr = await _procedures.get(id);
    await run(['procedures', 'appointments', 'photos'], 'readwrite', async (s) => {
      const apps = await promisify(s.appointments.index('procedureId').getAll(id));
      apps.filter((a) => a.auto).forEach((a) => s.appointments.delete(a.id));
      apps.filter((a) => !a.auto).forEach((a) => s.appointments.put({ ...a, procedureId: null }));
      const photos = await promisify(s.photos.index('procedureId').getAll(id));
      photos.forEach((ph) => s.photos.put({ ...ph, procedureId: null }));
      s.procedures.delete(id);
    });
    if (pr) audit('purge', 'procedure', id, pr.typeName);
  },
};

/* ---------------- Fotoğraflar ---------------- */
/*
 * Görsel verisi IndexedDB'ye Blob değil ArrayBuffer olarak yazılır (bazı Chromium sürümleri Blob yazarken hata verir).
 * Okurken görünümler için Blob'a çevrilir. Kayıtlı kopya canvas'tan yeniden kodlandığı için EXIF (konum dahil) taşımaz.
 */
const PHOTO_MIME = 'image/jpeg';
async function dehydrate(v) { return v instanceof Blob ? await v.arrayBuffer() : v; }
function hydrate(v, mime) { return v instanceof ArrayBuffer ? new Blob([v], { type: mime || PHOTO_MIME }) : v; }
function hydratePhoto(p) { return p ? { ...p, blob: hydrate(p.blob, p.mime), thumb: hydrate(p.thumb, p.mime) } : p; }
async function dehydratePhoto(p) {
  const mime = p.mime || (p.blob instanceof Blob && p.blob.type) || PHOTO_MIME;
  return { ...p, mime, blob: await dehydrate(p.blob), thumb: await dehydrate(p.thumb) };
}
export { hydrate as hydrateBlob, dehydrate as dehydrateBlob };

const _photos = baseStore('photos');
export const Photos = {
  ..._photos,
  all: async () => (await _photos.all()).map(hydratePhoto),
  trashed: async () => (await _photos.trashed()).map(hydratePhoto),
  get: async (id) => hydratePhoto(await _photos.get(id)),
  byIndex: async (idx, val) => (await _photos.byIndex(idx, val)).map(hydratePhoto),
  async save(p) {
    const isNew = !p.id;
    const obj = await dehydratePhoto(stamp({ period: 'other', angle: 'custom', notes: '', ...p }));
    await _photos.put(obj);
    audit(isNew ? 'create' : 'update', 'photo', obj.id, `${obj.period} · ${obj.angle} · ${obj.date}`);
    return hydratePhoto(obj);
  },
  async byPatient(patientId) {
    const list = await Photos.byIndex('patientId', patientId);
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt.localeCompare(a.createdAt));
  },
  async remove(id) {
    const ph = await _photos.get(id);
    if (!ph) return null;
    const now = nowISO();
    await _photos.put({ ...ph, deletedAt: now, updatedAt: now });
    audit('delete', 'photo', id, `${ph.period} · ${ph.angle} · ${ph.date}`);
    return ph;
  },
  async restore(id) {
    const ph = await _photos.get(id);
    if (!ph) return null;
    await _photos.put({ ...ph, deletedAt: null, deletedVia: null, updatedAt: nowISO() });
    audit('restore', 'photo', id, `${ph.period} · ${ph.angle} · ${ph.date}`);
    return ph;
  },
  async purge(id) {
    const ph = await _photos.get(id);
    await _photos.hardDelete(id);
    if (ph) audit('purge', 'photo', id, `${ph.period} · ${ph.angle} · ${ph.date}`);
  },
};

/* ---------------- Randevular ---------------- */
const _appointments = baseStore('appointments');
export const Appointments = {
  ..._appointments,
  async save(a) {
    const isNew = !a.id;
    const obj = stamp({ type: 'control', status: 'planned', periodLabel: null, calendarEventID: null, ...a });
    await _appointments.put(obj);
    audit(isNew ? 'create' : 'update', 'appointment', obj.id, `${obj.label} · ${obj.date}`);
    return obj;
  },
  async saveMany(list) {
    const stamped = list.map((a) => stamp({ type: 'control', status: 'planned', periodLabel: null, calendarEventID: null, ...a }));
    await run('appointments', 'readwrite', (s) => { stamped.forEach((a) => s.put(a)); });
    if (stamped.length) audit('create', 'appointment', null, tr('audit.bulk', { n: stamped.length }));
    return stamped;
  },
  async byPatient(patientId) {
    const list = await _appointments.byIndex('patientId', patientId);
    return list.sort((a, b) => a.date.localeCompare(b.date));
  },
  async allSorted() {
    const list = await _appointments.all();
    return list.sort((a, b) => a.date.localeCompare(b.date));
  },
  async remove(id) {
    const a = await _appointments.get(id);
    if (!a) return null;
    const now = nowISO();
    await _appointments.put({ ...a, deletedAt: now, updatedAt: now });
    audit('delete', 'appointment', id, `${a.label} · ${a.date}`);
    return a;
  },
  async restore(id) {
    const a = await _appointments.get(id);
    if (!a) return null;
    await _appointments.put({ ...a, deletedAt: null, deletedVia: null, updatedAt: nowISO() });
    audit('restore', 'appointment', id, `${a.label} · ${a.date}`);
    return a;
  },
  async purge(id) {
    const a = await _appointments.get(id);
    await _appointments.hardDelete(id);
    if (a) audit('purge', 'appointment', id, `${a.label} · ${a.date}`);
  },
};

/* ---------------- Ayarlar ---------------- */
const _settings = baseStore('settings');
export const Settings = {
  async get(key, fallback = null) {
    const r = await run('settings', 'readonly', (s) => promisify(s.get(key)));
    return r ? r.value : fallback;
  },
  set: (key, value) => run('settings', 'readwrite', (s) => promisify(s.put({ key, value }))),
  remove: (key) => run('settings', 'readwrite', (s) => promisify(s.delete(key))),
};

/* ---------------- Silinenler ---------------- */
/** Doğrudan silinen (bir üst kayıtla birlikte değil) kayıtlar; geri alma / kalıcı silme için. */
export async function trashList() {
  const [patients, procedures, photos, appointments] = await Promise.all([
    _patients.trashed(), _procedures.trashed(), Photos.trashed(), _appointments.trashed(),
  ]);
  const own = (l) => l.filter((x) => !x.deletedVia);
  return { patients: own(patients), procedures: own(procedures), photos: own(photos), appointments: own(appointments) };
}
export async function trashCount() {
  const tl = await trashList();
  return tl.patients.length + tl.procedures.length + tl.photos.length + tl.appointments.length;
}
/** TRASH_DAYS geçmiş silinmişleri kalıcı olarak kaldırır (açılışta). */
export async function purgeExpired(days = TRASH_DAYS) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const tl = await trashList();
  let n = 0;
  for (const p of tl.patients) if (p.deletedAt < cutoff) { await Patients.purge(p.id); n++; }
  for (const p of tl.procedures) if (p.deletedAt < cutoff) { await Procedures.purge(p.id); n++; }
  for (const p of tl.photos) if (p.deletedAt < cutoff) { await Photos.purge(p.id); n++; }
  for (const p of tl.appointments) if (p.deletedAt < cutoff) { await Appointments.purge(p.id); n++; }
  return n;
}

/* ---------------- Toplu işlemler ---------------- */
export async function clearAllData({ keepSettings = true } = {}) {
  const names = ['patients', 'procedures', 'photos', 'appointments', 'templates', 'audit'];
  if (!keepSettings) names.push('settings');
  await run(names, 'readwrite', (s) => { names.forEach((n) => s[n].clear()); });
  if (!keepSettings) _deviceID = null;
  await init();
  audit('wipe', 'data', null, '');
}

export async function counts() {
  const [patients, procedures, photos, appointments] = await Promise.all([
    _patients.count(), _procedures.count(), _photos.count(), _appointments.count(),
  ]);
  return { patients, procedures, photos, appointments };
}

function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function dataURLToBuffer(url) {
  const r = await fetch(url);
  return r.arrayBuffer();
}

/** Tüm veriyi JSON'a dönüştürülebilir düz nesne olarak verir (fotoğraflar base64). Silinenler de dahildir (deletedAt ile). */
export async function exportAll() {
  const [patients, templates, procedures, photos, appointments, auditRows, settings] = await Promise.all([
    _patients.allWithDeleted(), _templates.allWithDeleted(), _procedures.allWithDeleted(), _photos.allWithDeleted(), _appointments.allWithDeleted(), _audit.allWithDeleted(),
    run('settings', 'readonly', (s) => promisify(s.getAll())),
  ]);
  const photosOut = [];
  for (const p of photos) {
    photosOut.push({ ...p, blob: p.blob ? await blobToDataURL(hydrate(p.blob, p.mime)) : null, thumb: p.thumb ? await blobToDataURL(hydrate(p.thumb, p.mime)) : null });
  }
  const patientsOut = [];
  for (const p of patients) {
    patientsOut.push(p.consentDocument?.blob ? { ...p, consentDocument: { ...p.consentDocument, blob: await blobToDataURL(hydrate(p.consentDocument.blob, p.consentDocument.mime)) } } : p);
  }
  return {
    app: BACKUP_APP, schema: SCHEMA, deviceID: deviceID(), exportedAt: nowISO(),
    patients: patientsOut, templates, procedures, appointments, photos: photosOut, audit: auditRows,
    settings: settings.filter((s) => s.key !== 'pin' && s.key !== 'deviceID'),
  };
}

/** Yedek dosyasından veriyi geri yükler. replace=true ise mevcut veriyi siler; aksi hâlde id'ye göre birleştirir. */
export async function importAll(data, { replace = true } = {}) {
  if (!data || data.app !== BACKUP_APP) throw new Error(tr('db.badBackup'));
  if (data.schema !== SCHEMA) throw new Error(tr('db.badSchema'));
  const photos = [];
  for (const p of data.photos || []) {
    photos.push({ ...p, mime: p.mime || PHOTO_MIME, blob: p.blob ? await dataURLToBuffer(p.blob) : null, thumb: p.thumb ? await dataURLToBuffer(p.thumb) : null });
  }
  const patients = [];
  for (const p of data.patients || []) {
    patients.push(p.consentDocument?.blob && typeof p.consentDocument.blob === 'string' ? { ...p, consentDocument: { ...p.consentDocument, blob: await dataURLToBuffer(p.consentDocument.blob) } } : p);
  }
  const names = ['patients', 'templates', 'procedures', 'photos', 'appointments', 'audit', 'settings'];
  await run(names, 'readwrite', (s) => {
    if (replace) ['patients', 'templates', 'procedures', 'photos', 'appointments'].forEach((n) => s[n].clear());
    patients.forEach((x) => s.patients.put(x));
    (data.templates || []).forEach((x) => s.templates.put(x));
    (data.procedures || []).forEach((x) => s.procedures.put(x));
    (data.appointments || []).forEach((x) => s.appointments.put(x));
    photos.forEach((x) => s.photos.put(x));
    (data.audit || []).forEach((x) => s.audit.put(x));
    (data.settings || []).filter((x) => x.key !== 'pin' && x.key !== 'deviceID').forEach((x) => s.settings.put(x));
  });
  await seedTemplates();
  audit('restore_backup', 'data', null, `${replace ? 'replace' : 'merge'} · ${data.exportedAt || ''}`);
}
