# Yapılacaklar

Bu web sürümü, mobil uygulamadan önceki geliştirme ve deneme aşamasıdır. Aşağıdaki
maddeler mobil uygulamaya taşınacak ürün kararlarıdır; web'de yalnızca
gerekli olanlar yapılır.

## Tamamlananlar (web)

- [x] Hasta kartı, işlem geçmişi, otomatik kontrol takvimi
- [x] Öncesi / sonrası fotoğraf galerisi ve karşılaştırma
- [x] Fotoğraf çekim tarihi EXIF'ten otomatik dolar
- [x] Ajanda liste ve aylık takvim görünümü
- [x] Yedek al / geri yükle (fotoğraflarla tek dosya)
- [x] Kalıcı depolama isteği ve riskli tarayıcı uyarıları
- [x] PIN kilidi (PBKDF2 ile saklanır, açılışta ve arka plandan dönüşte sorulur, deneme frenleme)
- [x] Tasarım sistemi v2 "Gece Laciverti" (TASARIM.md): token dosyası, tüm ekranlar yeniden yazıldı
- [x] Karanlık mod (sistem / açık / koyu, Ayarlar > Görünüm) — aynı token adları, farklı değerler
- [x] Alt sheet formları: Vazgeç başlıkta, tek dolu buton, chip/segment seçimler, isteğe bağlı etiketi
- [x] Silme onayı iOS eylem sayfası
- [x] Karşılaştırma ekranı: yan yana / kaydır / üst üste, Değiştir, paylaş (tek görsel, hasta adı yok)
- [x] Kamera denemesi (GECIS.md §5 adım 4, MOBIL.md §4 web sınırlarıyla): Kamera sekmesi, hasta seçimi, işlem/dönem bağlamı, şablondan açı seçici, aynı açıdaki önceki fotoğraf %35 hayalet, ızgara, seviye çizgisi (iOS'ta izinle), seri çekim (çek → sonraki açı), yalnızca uygulamaya kayıt; zoom 1x kilidi ve flaş kapalı destekleyen tarayıcılarda; izin yoksa galeriden ekleme
- [x] Onam kontrollü paylaşım (MOBIL.md §5): amaç seçimi (eğitim / tanıtım), tanıtım onamı yoksa seçenek kapalı, kapsam dışında uyarı ile devam, denetim kaydına amaç + onam + override
- [x] Geciken kontroller (MOBIL.md §3): Hastalar ekranında tarihi geçmiş planlı + son 60 günde gelmedi; satırdan yeniden planla / geldi / gelmedi / hasta kartı; Ajanda Gecikmiş bölümü gelmedi kayıtlarını da içerir
- [x] Şifreli yedek (MOBIL.md §6): parola → PBKDF2-SHA256 (200k) + AES-GCM 256, tek .htbackup dosyası; geri yüklemede parola sorulur, yanlışta tekrar; düz JSON (şema 2) da açılır
- [x] Veri modeli MOBIL.md §2 (GECIS.md §5 adım 2): UUID / updatedAt / deletedAt / deviceID; klinik özet + onam; işlem şablonları (türe özel alanlar, kontrol dönemleri, açı seti); komplikasyon + revizyon; fotoğraf dönem/açı; randevu tür/durum İngilizce anahtar; denetim kaydı; Silinenler (30 gün); yedek v2
- [x] İsim Curalis (GECIS.md §2): repo, manifest, başlıklar, yedek dosyası; localStorage anahtarları taşındı; eski yedekler açılmaya devam eder
- [x] İşlem planlama: ileri tarihli ameliyat / işlem (tarih + saat) Ajanda'ya, hasta listesine ve hasta kartına düşer; tarih değişince planlı kontroller kayar; eski kayıtlar için işlem günü kaydı otomatik üretilir
- [x] Alt sayfalar aşağı kaydırarak kapanır (başlıktan her zaman, gövdeden en üstteyken; eşik altında yerine döner)
- [x] İngilizce dil desteği (`js/i18n.js`): Ayarlar > Dil; tarih biçimi dile göre; kayıtlı veri Türkçe kanonik kalır, görüntüde çevrilir

## WEB-PLAN.md durumu (8 Eyl 2026, sürüm 0.9.3)

Sürüm numaraları plandaki v0.x sayılarıyla değil, gerçek sürümle (0.8.x / 0.9.x) izlenir; eşleme CHANGELOG.md'de.

- [x] **Adım 0 — Rename ve ikon:** tamamen. Repo `curalis`, manifest/başlık/ikon Curalis, eski adres yönlendiriyor.
- [~] **Adım 1 — Veri modeli:** kısmen. Alanlar MOBIL.md §2 ile birebir (aşağıya bak); "eski veri bozulmadan taşınır", migrasyon öncesi otomatik yedek ve geri alma yapılmadı — eski veri istekle atıldı (IndexedDB adı değişti). Ayarlar'da "şema v2" yazısı yok.
- [x] **Adım 2 — Navigasyon katmanı (5A):** tamamen (0.9.0–0.9.3). Kaydırınca küçülen tab bar (isteğe bağlı) yok. Kamera sekmesi canlı kameraya açılır, kamera yoksa galeriye düşer (Adım 10 tamamlandığı için).
- [x] **Adım 3 — Şablonlar ve kontrol planı:** tamamen. Ayarlar > Şablonlar, türe özel alanlar, otomatik kontrol randevuları, serbest metin tür yok.
- [x] **Adım 4 — Fotoğraf dönem/açı/gruplama:** tamamen. Dönem+açı zorunlu, açıya göre grup, dönem çipleri, EXIF yeniden kodlamayla temizlenir.
- [~] **Adım 5 — Karşılaştırma:** kısmen. Üç mod, seçim modu + raf, anonim paylaşım (Web Share) var; dönem şeridi, senkron zoom, çift dokunuş tam ekran yok.
- [x] **Adım 6 — Klinik alanlar ve onam:** tamamen.
- [~] **Adım 7 — Liste etkileşimleri ve geri al:** kısmen. Soft delete + Silinenler (30 gün) + geciken kontroller var; kaydırma aksiyonları, uzun basma sheet'i, geri al kapsülü yok (silme hâlâ onay soruyor).
- [~] **Adım 8 — Formlar ve klavye:** çok az. inputmode/type/autocapitalize ve boşluk temizleme var; kademeli sheet, Türkçe baş harf düzeltme, Rehberden seç, pasif/aktif Kaydet, hazır mesaj şablonları yok.
- [~] **Adım 9 — Yedek ve güvenlik:** kısmen. Şifreli yedek (birleştir/değiştir), PIN frenleme, otomatik kilit süresi, denetim kaydında paylaşım/yedek var; günlük otomatik yedek ve arka planda bulanıklaştırma yok.
- [x] **Adım 10 — Kamera denemesi:** tamamen (web sınırlarıyla). 90 sn kabul ölçümü cihazda yapılmadı.
- [~] **Adım 11 — Cila ve erişilebilirlik:** kısmen. Tabular rakamlar, boş durumlar, skeleton, karanlık mod token'ları var; `rem` tabanlı Dynamic Type, manifest `shortcuts`, iPad iki sütun yok.

### Adım 1 alan karşılaştırması (MOBIL.md §2)
- Ortak: `id` (UUID v4), `createdAt`, `updatedAt`, `deletedAt`, `deviceID` — var (db.js `stamp`).
- Patient: ad, soyad, telefon, doğum tarihi, cinsiyet, yönlendiren, e-posta, alerjiler, ilaçlar (antikoagülan vurgusu), sigara, önceki ameliyatlar, kan grubu (hero'da yok), `consentStatus`, `consentDate`, onam belgesi görüntüsü, notlar — var.
- Procedure: hasta, şablon (`templateId` + `typeName`), tarih+saat, anestezi, not, türe özel alanlar (`details`), komplikasyon (var/yok+not+tarih), `revisionOf`, `followUpSchedule` — var.
- ProcedureTemplate: ad, kontrol dönemleri, açı seti, türe özel alan tanımları; düzenlenebilir, silinen şablon eski kayıtları bozmaz — var.
- Photo: hasta, işlem, dosya adı, çekim tarihi, `period`, `angle`, notlar; kaydedilen dosyada EXIF yok — var.
- Appointment: hasta, işlem, tarih-saat, tür (control/consultation/operation/other), dönem etiketi, durum (planned/attended/missed/cancelled) — var; `calendarEventID` web'de gereksiz.
- AuditEntry: zaman, cihaz, eylem, varlık; Ayarlar'dan görünür, silinemez — var.
- Eksik: Ayarlar'da "şema v2" göstergesi; migrasyon öncesi otomatik yedek ve geri alma (eski veri atıldığı için uygulanmadı).

## Mobil uygulama için öncelikli

1. **Kamera çekim rehberi.** Yüz ön / profil / oblik, burun bazal, gövde gibi standart
   pozlar için yarı saydam hayalet şablon; önceki fotoğrafın silüetiyle hizalama.
   Öncesi/sonrası karşılaştırmasının değerini belirleyen özellik.
2. **Biyometrik kilit.** Face ID / parmak izi ile açma; PIN yedek yöntem olarak kalır.
3. **Otomatik yedek.** iCloud / Google Drive'a zamanlanmış yedek; son yedek tarihinin
   Ayarlar'da görünmesi ve haftalık hatırlatma.
4. **Bulut eşitleme.** Hesap, sunucu, uçtan uca şifreleme; telefon, tablet ve
   bilgisayardan aynı veri. Cihaz kaybında veri kaybını bitirir. Ayrı proje ölçeği.
5. **Onam formları.** İşlem başına dijital onam, hasta imzası, PDF çıktı ve hastaya gönderim.
6. **Randevu hatırlatma.** SMS / WhatsApp ile hatırlatma; hekim müsaitlik takvimi;
   isteğe bağlı çevrimiçi randevu alma.
7. **Klinik kayıt derinliği.** İlaç ve alerji listesi, ameliyat notu şablonları,
   ölçüm ve implant kaydı, işlem başına fiyat/ödeme takibi.

## Tasarım (TASARIM.md kalanlar)

- [ ] Ekran geçişinde iOS tarzı geri kayma (şu an yalnızca giriş animasyonu var)
- [ ] Butonlarda haptik geri bildirim (native'de)
- [ ] Hero ikon butonlarında uzun basınca ipucu (native'de)

## Küçük iyileştirmeler

- [ ] HEIC dosyalarından EXIF okuma (web'de JPEG/WebP/PNG destekleniyor)
- [ ] Fotoğraf görüntüleyicide yakınlaştırma (pinch-zoom)
- [ ] Hasta listesinde son işleme göre sıralama ve filtre
- [x] Yedek dosyasını şifreleme (parola türevi anahtarla, .htbackup)
