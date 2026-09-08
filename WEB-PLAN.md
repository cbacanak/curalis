# Curalis — Web İş Sırası (WEB-PLAN.md)

Mobil geçiş öncesi web sürümünün olgunlaştırılma sırası. Her adım tek başına yayına alınabilir; bir adım bitip cihazda onaylanmadan sonrakine geçilmez. Referanslar: TASARIM.md (5A navigasyon, 5B etkileşim), MOBIL.md §2 (veri modeli), GECIS.md.

Kural: her adımda **sürüm numarası artar**, CHANGELOG'a bir satır düşer, ekran görüntüsü alınır. Gerçek sürüm numaraları CHANGELOG.md'de.

---

## Adım 0 — Rename ve ikon
GECIS.md §2. Repo `curalis`, Pages adresi güncel, manifest/başlık/ikon Curalis. Eski "Hasta Takip" ve turkuaz ikon izleri sıfır.

**Kabul:** "Ana Ekrana Ekle"de Curalis adı ve halka ikon; eski adres yönlendiriyor.

## Adım 1 — Veri modeli migrasyonu — en kritik adım
MOBIL.md §2'deki alan adları birebir. Mevcut kayıtlar bozulmadan taşınır.
- Her kayda `id` (UUID), `createdAt`, `updatedAt`, `deletedAt`.
- Photo: `period` (dönem) ve `angle` (açı) alanları; mevcut "öncesi/sonrası" → period'a eşlenir, angle boş kalır.
- Patient: `consentStatus`, `consentDate`, klinik özet alanları (alerji, ilaç, sigara) — boş olarak eklenir.
- ProcedureTemplate tablosu, varsayılan şablonlarla dolu.
- Migrasyon öncesi otomatik yedek; migrasyon geri alınabilir.
- Denetim kaydı (AuditEntry) yazmaya başlar.

**Kabul:** Eski veriyle yüklenen uygulama hiçbir kaydı kaybetmez; Ayarlar > Hakkında'da "şema v2" görünür; yedek al/geri yükle yeni alanlarla çalışır.

## Adım 2 — Navigasyon katmanı
TASARIM.md 5A. Yüzen tab bar (4 ikon: Hastalar, Kamera, Ajanda, Ayarlar), arama adası, klavye üstü arama kapsülü, cam nav butonları, hasta kartında yüzen aksiyonlar, içerik altı solma. Kamera sekmesi şimdilik "galeriden yükle"ye açılır.

**Kabul:** Referans görsel `curalis-ios26-kalibi.png` ile yan yana; arama açıkken tab bar gizli; iOS Safari'de klavye açılınca kapsül klavyenin üstünde.

## Adım 3 — İşlem şablonları ve kontrol planı
- Ayarlar > Şablonlar: işlem türleri, kontrol dönemleri, açı seti; düzenlenebilir.
- İşlem ekle: şablon seçilince türe özel alanlar ve kontrol planı gelir.
- Kaydedince kontrol randevuları otomatik oluşur; Ajanda'da görünür.
- Serbest metin işlem türü kaldırılır ("Diğer" şablonu var).

**Kabul:** Rinoplasti ekle → 5 kontrol randevusu Ajanda'da; şablon düzenlemesi eski işlemleri bozmaz.

## Adım 4 — Fotoğraf: dönem, açı, gruplama
- Yükleme/çekimde dönem ve açı seçimi zorunlu.
- Fotoğraflar sekmesi açıya göre gruplu, dönem chip'leriyle filtre.
- EXIF konum temizleme; sistem galerisine yazma yok (zaten web'de yok).

**Kabul:** 6 açı × 2 dönem yüklenmiş hasta, gruplar doğru; chip filtreleri çalışıyor.

## Adım 5 — Karşılaştırma ekranı
- Üç mod: yan yana / kaydırıcı / üst üste.
- Dönem şeridi (5B), senkron zoom, çift dokunuş tam ekran.
- Seçim modu + accessory rafı (5A).
- Anonim paylaşım: birleşik görsel, ad yok, EXIF yok, dönem/açı etiketi var; Web Share API.

**Kabul:** Aynı açıdan iki dönem seç → karşılaştır → WhatsApp'a paylaş: 4 dokunuş.

## Adım 6 — Klinik alanlar ve onam
- Hasta kartında klinik uyarı şeridi (alerji / antikoagülan / sigara).
- Fotoğraf onamı alanı; onamsız hastada "tanıtım" paylaşımı kapalı, uyarı.
- Yönlendiren ve klinik özet Genel sekmesinde; kan grubu ve e‑posta hero'dan çıkar.

**Kabul:** Onam "yok" olan hastada paylaşım menüsünde tanıtım seçeneği pasif.

## Adım 7 — Liste etkileşimleri ve geri al
- Kaydırma aksiyonları (hasta: Ara/WhatsApp/Randevu; randevu: Geldi/Gelmedi).
- Uzun basma sheet'i.
- Geri al kapsülü; silme onay diyaloğu yalnızca kalıcı silmede.
- Soft delete → Ayarlar > Silinenler → 30 gün → kalıcı.
- Geciken kontroller Ajanda ve Hastalar'da.

**Kabul:** Hasta sil → 5 sn içinde geri al → hasta yerinde; 30 gün simülasyonu ile kalıcı silme dosyalarıyla.

## Adım 8 — Formlar ve klavye
- Kademeli sheet (yarı → tam).
- inputmode/type/autocapitalize; Türkçe baş harf düzeltme; Rehberden seç (Contact Picker).
- Kaydet butonu pasif/aktif; hata metinleri.
- Hazır mesaj şablonları (Ayarlar): "1. ay kontrolünüz …" → WhatsApp'a atlama.

**Kabul:** Yeni hasta yarı sheet'ten ad+telefon ile 10 sn'de kaydedilir.

## Adım 9 — Yedek ve güvenlik
- Şifreli yedek (`.htbackup`, AES‑GCM, parola) al / geri yükle (birleştir / değiştir).
- Otomatik yedek: günde bir, tarayıcı depolamasına + "iCloud Drive'a kaydet" hatırlatması.
- PIN'de 5 hatada bekleme; otomatik kilit süresi; `visibilitychange` ile arka planda bulanıklaştırma.
- Ekran görüntüsü tespiti web'de yok; denetim kaydına "paylaşım" ve "yedek" olayları düşer.

**Kabul:** Yanlış parolayla yedek açılmaz; doğru parolayla fotoğraflar dahil tam geri yükleme.

## Adım 10 — Kamera denemesi — web'de sınırlı
- `getUserMedia` ile kendi kamera ekranı; açı seçici; önceki fotoğraf %35 ghost overlay; ızgara.
- Seri çekim: açı → çek → sonraki açı.
- Zoom/flaş kontrolü iOS Safari'de yoksa gizlenir.

**Kabul:** Rinoplasti 6 açı seti 90 sn'de çekilir; overlay doğru açıyı gösterir. Yetersizse bu adım native'e bırakılır, karar notu CHANGELOG'a.

## Adım 11 — Cila ve erişilebilirlik
- Dynamic Type (`rem`), tabular rakamlar, boş durumlar, skeleton.
- Manifest `shortcuts` (Yeni hasta, Fotoğraf çek, Bugünün kontrolleri).
- Karanlık mod denetimi: hardcoded renk sıfır.
- iPad genişliğinde iki sütun (5B).

**Kabul:** Sistem yazı boyutu +2 kademede hiçbir ekran taşmıyor; iPad Safari'de iki sütun.

---

## Deneme süreci
Adım 11 sonrası **4 hafta gerçek kullanım**. Her hafta: neyi 3'ten fazla kez yapmak zor geldi? Liste tutulur. Liste boşalınca MOBIL.md §10 (web'de uygulanabilir olanlar) kontrol edilir ve native (`curalis-ios`) başlar.

## Claude Code'a verilecek açılış talimatı
> WEB-PLAN.md'yi oku. Adım 0'dan başla; her adımın sonunda değişen dosyaları, sürüm numarasını ve kabul kriterinin nasıl doğrulanacağını yaz, sonraki adıma benim onayım olmadan geçme. Adım 1 için önce migrasyon planını göster, kod yazma.
