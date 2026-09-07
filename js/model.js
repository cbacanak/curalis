/* Veri modeli sözlüğü — MOBIL.md §2 ile birebir alan adları ve sabit anahtarlar.
 * Kayıtta yalnızca bu anahtarlar saklanır; ekran metinleri i18n'den gelir (native'de Localizable.strings).
 */
import { t } from './i18n.js';

/* Fotoğraf dönemi (period). 'pre' = ameliyat öncesi. Kontrol takvimi anahtarlarıyla aynı kümeyi paylaşır. */
export const PERIODS = ['pre', 'd1', 'w1', 'd10', 'w2', 'm1', 'm3', 'm6', 'y1', 'other'];
/* Kontrol planı dönemleri (şablon varsayılanı MOBIL.md: 1 hafta, 1 ay, 3 ay, 6 ay, 1 yıl; 1. gün seçenek olarak durur) */
export const FOLLOWUP_PERIODS = ['d1', 'w1', 'd10', 'w2', 'm1', 'm3', 'm6', 'y1'];
export const DEFAULT_FOLLOWUPS = ['w1', 'm1', 'm3', 'm6', 'y1'];

/* Fotoğraf açısı (angle) */
export const ANGLES = ['front', 'right45', 'rightProfile', 'left45', 'leftProfile', 'top', 'bottom', 'bodyFront', 'bodySide', 'custom'];
export const FACE_ANGLES = ['front', 'right45', 'rightProfile', 'left45', 'leftProfile'];
export const NOSE_ANGLES = ['front', 'right45', 'rightProfile', 'left45', 'leftProfile', 'bottom'];
export const BODY_ANGLES = ['bodyFront', 'bodySide'];

/* Randevu türü ve durumu. 'operation' MOBIL.md'ye ek: işlem günü Ajanda'da ayrı görünmeli. */
export const APPT_TYPES = ['control', 'consultation', 'operation', 'other'];
export const APPT_STATUSES = ['planned', 'attended', 'missed', 'cancelled'];
export const OP_PERIOD = 'op';   // işlem günü kaydının periodLabel değeri

/* Fotoğraf onamı */
export const CONSENT_STATUSES = ['none', 'treatment', 'treatment_education', 'treatment_education_marketing'];

/* Anestezi */
export const ANESTHESIA = ['general', 'local', 'sedation', 'local_sedation', 'none'];
export const DEFAULT_ANESTHESIA = 'local';

/* Silinenler: kalıcı silmeye kadar gün */
export const TRASH_DAYS = 30;

export const periodLabel = (k) => t(`period.${k}`);
export const angleLabel = (k) => t(`angle.${k}`);
export const apptTypeLabel = (k) => t(`appt.type.${k}`);
export const statusLabel = (k) => t(`status.${k}`);
export const consentLabel = (k) => t(`consent.${k || 'none'}`);
export const anesthesiaLabel = (k) => (k ? t(`anest.${k}`) : '');
export const fieldTypeLabel = (k) => t(`field.type.${k}`);

/* Şablon alan tipleri */
export const FIELD_TYPES = ['text', 'number', 'select', 'toggle'];

/* Varsayılan işlem şablonları. name kullanıcı verisidir; ilk tohumlamada geçerli dilde yazılır (nameKey ile). */
const F = (key, type = 'text', options = []) => ({ key, type, options });
export const DEFAULT_TEMPLATES = [
  { nameKey: 'Rinoplasti', followUpPeriods: ['d1', 'w1', 'm1', 'm3', 'm6', 'y1'], angleSet: NOSE_ANGLES, fields: [F('approach', 'select', ['open', 'closed']), F('graftSource', 'select', ['septum', 'ear', 'rib', 'none'])] },
  { nameKey: 'Revizyon Rinoplasti', followUpPeriods: ['d1', 'w1', 'm1', 'm3', 'm6', 'y1'], angleSet: NOSE_ANGLES, fields: [F('approach', 'select', ['open', 'closed']), F('graftSource', 'select', ['septum', 'ear', 'rib', 'none'])] },
  { nameKey: 'Septorinoplasti', followUpPeriods: ['d1', 'w1', 'm1', 'm3', 'm6', 'y1'], angleSet: NOSE_ANGLES, fields: [F('approach', 'select', ['open', 'closed']), F('graftSource', 'select', ['septum', 'ear', 'rib', 'none'])] },
  { nameKey: 'Blefaroplasti', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: FACE_ANGLES, fields: [F('eyelid', 'select', ['upper', 'lower', 'both'])] },
  { nameKey: 'Yüz Germe', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: FACE_ANGLES, fields: [] },
  { nameKey: 'Boyun Germe', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: FACE_ANGLES, fields: [] },
  { nameKey: 'Kaş Kaldırma', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: FACE_ANGLES, fields: [] },
  { nameKey: 'Otoplasti', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: ['front', 'rightProfile', 'leftProfile'], fields: [] },
  { nameKey: 'Meme Büyütme', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [F('implantBrand'), F('implantModel'), F('implantVolume', 'number'), F('implantProfile', 'select', ['low', 'moderate', 'high', 'extraHigh']), F('plane', 'select', ['subglandular', 'subfascial', 'dualPlane', 'submuscular'])] },
  { nameKey: 'Meme Küçültme', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [F('resectedWeight', 'number')] },
  { nameKey: 'Meme Dikleştirme', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [] },
  { nameKey: 'Jinekomasti', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [] },
  { nameKey: 'Liposuction', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [F('areas'), F('aspiratedVolume', 'number')] },
  { nameKey: 'Abdominoplasti', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [] },
  { nameKey: 'Brazilian Butt Lift', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [F('graftedVolume', 'number')] },
  { nameKey: 'Kol Germe', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [] },
  { nameKey: 'Uyluk Germe', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: BODY_ANGLES, fields: [] },
  { nameKey: 'Yağ Enjeksiyonu', followUpPeriods: ['w1', 'm1', 'm3', 'm6'], angleSet: FACE_ANGLES, fields: [F('areas'), F('graftedVolume', 'number')] },
  { nameKey: 'Dolgu', followUpPeriods: ['w1', 'm1'], angleSet: FACE_ANGLES, fields: [F('product'), F('volume', 'number')] },
  { nameKey: 'Botoks', followUpPeriods: ['w1', 'm3'], angleSet: FACE_ANGLES, fields: [F('units', 'number')] },
  { nameKey: 'Saç Ekimi', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: ['front', 'top', 'rightProfile', 'leftProfile'], fields: [F('grafts', 'number'), F('technique', 'select', ['fue', 'dhi', 'fut'])] },
  { nameKey: 'Skar Revizyonu', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: ['front', 'custom'], fields: [] },
  { nameKey: 'Diğer', followUpPeriods: DEFAULT_FOLLOWUPS, angleSet: ANGLES.filter((a) => a !== 'custom'), fields: [] },
];

/* Alan ve seçenek anahtarları için etiket; bilinmeyen anahtar (kullanıcı tanımlı) olduğu gibi döner */
export function fieldLabel(key) { const k = `tfield.${key}`; const v = t(k); return v === k ? key : v; }
export function optionLabel(key) { const k = `topt.${key}`; const v = t(k); return v === k ? key : v; }

/** İşlem tarihine göre bir fotoğraf/kontrol için en yakın dönem anahtarı */
export function periodFromDays(n) {
  if (n < 0) return 'pre';
  if (n < 4) return 'd1';
  if (n < 9) return 'w1';
  if (n < 12) return 'd10';
  if (n < 21) return 'w2';
  if (n < 60) return 'm1';
  if (n < 135) return 'm3';
  if (n < 270) return 'm6';
  return 'y1';
}
