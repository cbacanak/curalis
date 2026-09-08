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
- [x] İngilizce dil desteği (`js/i18n.js`): Ayarlar > Dil; tarih biçimi dile göre; kayıtlı veri Türkçe kanonik kalır, görüntüde çevrilir. Not: WEB-PLAN dışı yapıldı. Kural (8 Eyl 2026): plan dışı bir özellik gerekirse önce sorulur, dosyaya girer, sonra kod yazılır.

## WEB-PLAN.md durumu (8 Eyl 2026, sürüm 0.9.3)

Sürüm numaraları plandaki v0.x sayılarıyla değil, gerçek sürümle (0.8.x / 0.9.x) izlenir; eşleme CHANGELOG.md'de.

- [x] **Adım 0 — Rename ve ikon:** tamamen. Repo `curalis`, manifest/başlık/ikon Curalis, eski adres yönlendiriyor.
- [x] **Adım 1 — Veri modeli:** alanlar MOBIL.md §2 ile birebir (aşağıya bak); Ayarlar'da "şema v2" yazısı (0.10.0). Eski veri istekle atıldığı için (IndexedDB adı değişti) migrasyon öncesi yedek/geri alma uygulanmadı. Kural (Eylül 2026): bundan sonra şema değişikliği yalnızca migrasyonla, mevcut veri hiçbir sürümde atılmaz.
- [x] **Adım 2 — Navigasyon katmanı (5A):** tamamen (0.9.0–0.9.3). Kaydırınca küçülen tab bar (isteğe bağlı) yok. Kamera sekmesi canlı kameraya açılır, kamera yoksa galeriye düşer (Adım 10 tamamlandığı için).
- [x] **Adım 3 — Şablonlar ve kontrol planı:** tamamen. Ayarlar > Şablonlar, türe özel alanlar, otomatik kontrol randevuları, serbest metin tür yok.
- [x] **Adım 4 — Fotoğraf dönem/açı/gruplama:** tamamen. Dönem+açı zorunlu, açıya göre grup, dönem çipleri, EXIF yeniden kodlamayla temizlenir.
- [x] **Adım 5 — Karşılaştırma ekranı (0.12.0):** üç mod (yan yana / kaydırıcı / üst üste), dönem şeridi, senkron zoom, çift dokunuş tam ekran, seçim modu + accessory rafı, anonim paylaşım (Web Share, ad yok, EXIF yok, dönem/açı etiketi).
- [x] **Adım 6 — Klinik alanlar ve onam:** tamamen.
- [x] **Adım 7 — Liste etkileşimleri ve geri al (0.10.0):** kaydırma aksiyonları (hasta: sola Ara · WhatsApp, sağa Randevu; randevu: sola Gelmedi, sağa Geldi), 400 ms uzun basma önizlemesi (Ara · Fotoğraf çek · Karşılaştır · Sil), geri al kapsülü (silme ve 'gelmedi' onay sormaz, 5 sn geri al; kalıcı silme ve yedek üzerine yazma onay sorar), soft delete + Silinenler (30 gün), geciken kontroller.
- [x] **Adım 8 — Formlar ve klavye (0.11.0):** kademeli sheet (yeni hasta / randevu yarı → tam), inputmode/type/autocapitalize/enterkeyhint, Türkçe ad düzeltme, Rehberden seç (Contact Picker), Kaydet zorunlu alanlar dolana dek pasif, hazır mesaj şablonları (Ayarlar) → randevu menüsünden WhatsApp'a atlama.
- [x] **Adım 9 — Yedek ve güvenlik (0.10.2):** şifreli yedek al / geri yükle (birleştir / değiştir), PIN'de 5 hatada bekleme, otomatik kilit süresi, arka plan örtüsü (uygulama değiştiricide içerik gizli), denetim kaydına paylaşım/yedek, haftalık dosya yedeği hatırlatması. Günlük otomatik yedek web'de bilinçli atlandı (tarayıcı depolaması veriyle aynı yer); mobilde iCloud ile.
- [x] **Adım 10 — Kamera denemesi:** tamamen (web sınırlarıyla). 90 sn kabul ölçümü cihazda yapılmadı.
- [x] **Adım 11 — Cila ve erişilebilirlik (0.13.0):** rem tabanlı yazı boyutları + iOS Dynamic Type, tabular rakamlar, boş durumlar, skeleton, manifest shortcuts, karanlık mod denetimi (sabit hex yok), iPad ≥768px iki sütun + ⌘N / ⌘F / Esc.

### Adım 1 alan karşılaştırması (MOBIL.md §2)
- Ortak: `id` (UUID v4), `createdAt`, `updatedAt`, `deletedAt`, `deviceID` — var (db.js `stamp`).
- Patient: ad, soyad, telefon, doğum tarihi, cinsiyet, yönlendiren, e-posta, alerjiler, ilaçlar (antikoagülan vurgusu), sigara, önceki ameliyatlar, kan grubu (hero'da yok), `consentStatus`, `consentDate`, onam belgesi görüntüsü, notlar — var.
- Procedure: hasta, şablon (`templateId` + `typeName`), tarih+saat, anestezi, not, türe özel alanlar (`details`), komplikasyon (var/yok+not+tarih), `revisionOf`, `followUpSchedule` — var.
- ProcedureTemplate: ad, kontrol dönemleri, açı seti, türe özel alan tanımları; düzenlenebilir, silinen şablon eski kayıtları bozmaz — var.
- Photo: hasta, işlem, dosya adı, çekim tarihi, `period`, `angle`, notlar; kaydedilen dosyada EXIF yok — var.
- Appointment: hasta, işlem, tarih-saat, tür (control/consultation/operation/other), dönem etiketi, durum (planned/attended/missed/cancelled) — var; `calendarEventID` web'de gereksiz.
- AuditEntry: zaman, cihaz, eylem, varlık; Ayarlar'dan görünür, silinemez — var.
- "şema v2" göstergesi Ayarlar'da (0.10.0). Migrasyon öncesi otomatik yedek ve geri alma eski veri atıldığı için uygulanmadı; sonraki şema değişikliklerinde zorunlu.

Native kapsam ve sürüm planı: MOBIL.md §7

## Tasarım (TASARIM.md kalanlar)

- [ ] Ekran geçişinde iOS tarzı geri kayma (şu an yalnızca giriş animasyonu var)
- [ ] Butonlarda haptik geri bildirim (native'de)
- [ ] Hero ikon butonlarında uzun basınca ipucu (native'de)

## Küçük iyileştirmeler

- [ ] HEIC dosyalarından EXIF okuma (web'de JPEG/WebP/PNG destekleniyor)
- [ ] Fotoğraf görüntüleyicide yakınlaştırma (pinch-zoom)
- [ ] Hasta listesinde son işleme göre sıralama ve filtre
- [x] Yedek dosyasını şifreleme (parola türevi anahtarla, .htbackup)
