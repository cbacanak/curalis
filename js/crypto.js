/* Şifreli yedek (.htbackup) — MOBIL.md §6
 * Parola tabanlı anahtar: PBKDF2-SHA256 (rastgele tuz, 200k tur) → AES-GCM 256.
 * Dosya: "HTBK" + sürüm baytı + başlık uzunluğu (u32 BE) + başlık JSON + şifreli veri.
 * Başlık şifresiz ama içerik taşımaz: yalnızca kdf/cipher parametreleri, şema ve tarih.
 * Native (CryptoKit) aynı düzeni okur: PBKDF2 + AES.GCM.open(combined) — nonce | ciphertext | tag.
 */
const MAGIC = new Uint8Array([0x48, 0x54, 0x42, 0x4b]); // "HTBK"
const FORMAT_VERSION = 1;
const ITERATIONS = 200000;
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const cryptoAvailable = () => !!(globalThis.crypto && crypto.subtle && crypto.getRandomValues);

async function deriveKey(password, salt, iterations, usage) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, { name: 'AES-GCM', length: 256 }, false, [usage]);
}

/** Yedek nesnesini parola ile şifreler; dosya baytlarını (Uint8Array) döner. */
export async function encryptBackup(data, password, { schema = null } = {}) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS, 'encrypt');
  const plain = enc.encode(JSON.stringify(data));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const header = enc.encode(JSON.stringify({
    app: data.app || 'curalis', format: 'htbackup', version: FORMAT_VERSION, schema: schema ?? data.schema ?? null, exportedAt: data.exportedAt || null,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: b64(salt) },
    cipher: { name: 'AES-GCM', iv: b64(iv), tagLength: 128 },
  }));
  const out = new Uint8Array(MAGIC.length + 1 + 4 + header.length + cipher.length);
  let o = 0;
  out.set(MAGIC, o); o += MAGIC.length;
  out[o++] = FORMAT_VERSION;
  new DataView(out.buffer).setUint32(o, header.length); o += 4;
  out.set(header, o); o += header.length;
  out.set(cipher, o);
  return out;
}

/** Dosya baytları şifreli yedek mi? */
export function isEncryptedBackup(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return u.length > 9 && MAGIC.every((b, i) => u[i] === b);
}

/** Yalnızca başlığı okur (parola gerekmez): şema, tarih, kdf parametreleri. */
export function readBackupHeader(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (!isEncryptedBackup(u)) return null;
  const version = u[4];
  const len = new DataView(u.buffer, u.byteOffset).getUint32(5);
  const header = JSON.parse(dec.decode(u.subarray(9, 9 + len)));
  return { ...header, version, bodyOffset: 9 + len };
}

/** Parola ile çözer; yanlış parola ya da bozuk dosyada hata fırlatır (AES-GCM etiketi tutmaz). */
export async function decryptBackup(bytes, password) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const h = readBackupHeader(u);
  if (!h) throw new Error('not-encrypted');
  const key = await deriveKey(password, unb64(h.kdf.salt), h.kdf.iterations || ITERATIONS, 'decrypt');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(h.cipher.iv) }, key, u.subarray(h.bodyOffset));
  return JSON.parse(dec.decode(plain));
}
