/* Hazır mesaj şablonları — web planı adım 8. Ayarlar deposunda saklanır (şema değişikliği yok).
 * Yer tutucular: {ad} {tarih} {saat} {kontrol} {islem}. Randevu menüsünden WhatsApp'a atlar. */
import { Settings } from './db.js';
import { t, procLabel, apptLabel } from './i18n.js';
import { fmtDate, fmtTime, waHref } from './ui.js';

const KEY = 'messageTemplates';
export const MESSAGE_KEYS = ['reminder', 'missed'];
export const defaultTemplate = (k) => t(`msg.${k}.default`);

let cache = null;   // dokunma olayı içinde senkron bağlantı üretebilmek için
export async function getTemplates() {
  const saved = (await Settings.get(KEY, null)) || {};
  cache = Object.fromEntries(MESSAGE_KEYS.map((k) => [k, saved[k] || defaultTemplate(k)]));
  return cache;
}
export const saveTemplates = async (obj) => { await Settings.set(KEY, obj); cache = null; };
/** Şablonlar bellekteyse senkron, değilse varsayılan (ilk çağrıda yükleme başlatılır) */
export function templatesSync() {
  if (!cache) { getTemplates().catch(() => {}); return Object.fromEntries(MESSAGE_KEYS.map((k) => [k, defaultTemplate(k)])); }
  return cache;
}

/** Şablonu doldurur. patient: hasta; a: randevu; pr: bağlı işlem (opsiyonel) */
export function fillTemplate(tpl, { patient, a, pr }) {
  const map = {
    ad: patient ? `${patient.firstName || ''}`.trim() : '',
    tarih: a ? fmtDate(a.date) : '',
    saat: a ? fmtTime(a.date) : '',
    kontrol: a ? apptLabel(a) : '',
    islem: pr ? procLabel(pr.typeName) : '',
  };
  return tpl.replace(/\{(ad|tarih|saat|kontrol|islem)\}/g, (_, k) => map[k]).replace(/\s{2,}/g, ' ').trim();
}

/** WhatsApp bağlantısı: E.164 numara + hazır metin. Senkron: dokunma olayı içinde location.href ile açılır. */
export function reminderHref(kind, { patient, a, pr }) {
  const tpls = templatesSync();
  return waHref(patient.phone, fillTemplate(tpls[kind] || defaultTemplate(kind), { patient, a, pr }));
}
/** Hatırlatmayı aç: aynı sekmede (window.open iOS'ta engelleniyor); wa.me evrensel bağlantı WhatsApp'ı açar */
export function openReminder(kind, ctx) { location.href = reminderHref(kind, ctx); }
