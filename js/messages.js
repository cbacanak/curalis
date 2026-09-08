/* Hazır mesaj şablonları — web planı adım 8. Ayarlar deposunda saklanır (şema değişikliği yok).
 * Yer tutucular: {ad} {tarih} {saat} {kontrol} {islem}. Randevu menüsünden WhatsApp'a atlar. */
import { Settings } from './db.js';
import { t, procLabel, apptLabel } from './i18n.js';
import { fmtDate, fmtTime, waHref } from './ui.js';

const KEY = 'messageTemplates';
export const MESSAGE_KEYS = ['reminder', 'missed'];
export const defaultTemplate = (k) => t(`msg.${k}.default`);

export async function getTemplates() {
  const saved = (await Settings.get(KEY, null)) || {};
  return Object.fromEntries(MESSAGE_KEYS.map((k) => [k, saved[k] || defaultTemplate(k)]));
}
export const saveTemplates = (obj) => Settings.set(KEY, obj);

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

/** WhatsApp bağlantısı: numara + hazır metin */
export async function reminderHref(kind, { patient, a, pr }) {
  const tpls = await getTemplates();
  const text = fillTemplate(tpls[kind] || defaultTemplate(kind), { patient, a, pr });
  return `${waHref(patient.phone)}?text=${encodeURIComponent(text)}`;
}
