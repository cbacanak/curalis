# Yapılacaklar

Web sürümü mobil uygulamadan önceki geliştirme ve gerçek kullanım aşamasıdır. Belgeler: TASARIM.md (görsel dil, navigasyon, etkileşim, ikon), MOBIL.md (native plan, repo yapısı, veri modeli), CHANGELOG.md (sürümler).

## Tamamlananlar (web, özellikler)

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
- [x] Kamera denemesi (MOBIL.md §4 web sınırlarıyla): Kamera sekmesi, hasta seçimi, işlem/dönem bağlamı, şablondan açı seçici, aynı açıdaki önceki fotoğraf %35 hayalet, ızgara, seviye çizgisi (iOS'ta izinle), seri çekim (çek → sonraki açı), yalnızca uygulamaya kayıt; zoom 1x kilidi ve flaş kapalı destekleyen tarayıcılarda; izin yoksa galeriden ekleme
- [x] Onam kontrollü paylaşım (MOBIL.md §5): amaç seçimi (eğitim / tanıtım), tanıtım onamı yoksa seçenek kapalı, kapsam dışında uyarı ile devam, denetim kaydına amaç + onam + override
- [x] Geciken kontroller (MOBIL.md §3): Hastalar ekranında tarihi geçmiş planlı + son 60 günde gelmedi; satırdan yeniden planla / geldi / gelmedi / hasta kartı; Ajanda Gecikmiş bölümü gelmedi kayıtlarını da içerir
- [x] Şifreli yedek (MOBIL.md §6): parola → PBKDF2-SHA256 (200k) + AES-GCM 256, tek .htbackup dosyası; geri yüklemede parola sorulur, yanlışta tekrar; düz JSON (şema 2) da açılır
- [x] Veri modeli MOBIL.md §2: UUID / updatedAt / deletedAt / deviceID; klinik özet + onam; işlem şablonları (türe özel alanlar, kontrol dönemleri, açı seti); komplikasyon + revizyon; fotoğraf dönem/açı; randevu tür/durum İngilizce anahtar; denetim kaydı; Silinenler (30 gün); yedek v2
- [x] İsim Curalis: repo, manifest, başlıklar, yedek dosyası; localStorage anahtarları taşındı; eski yedekler açılmaya devam eder
- [x] İşlem planlama: ileri tarihli ameliyat / işlem (tarih + saat) Ajanda'ya, hasta listesine ve hasta kartına düşer; tarih değişince planlı kontroller kayar; eski kayıtlar için işlem günü kaydı otomatik üretilir
- [x] Alt sayfalar aşağı kaydırarak kapanır (başlıktan her zaman, gövdeden en üstteyken; eşik altında yerine döner)
- [x] İngilizce dil desteği (`js/i18n.js`): Ayarlar > Dil; tarih biçimi dile göre; kayıtlı veri Türkçe kanonik kalır, görüntüde çevrilir.

## Yapıldı — web planı, 12 adım (Eyl 2026)

Adımlar sırasıyla yapıldı; her adım tek başına yayına alındı, cihazda denendi ve onaylandı. Sürüm eşlemesi CHANGELOG.md'de.

0. **Rename ve ikon** — repo `curalis`, manifest/başlık/ikon Curalis, eski adres yönlendiriyor.
1. **Veri modeli** — MOBIL.md §2 ile birebir alanlar (UUID, createdAt/updatedAt/deletedAt, deviceID, dönem/açı, onam, klinik özet, şablon tablosu, denetim kaydı); Ayarlar'da "şema v2". Eski veri istekle atıldı (IndexedDB adı değişti); kural: bundan sonra şema değişikliği yalnızca migrasyonla, mevcut veri hiçbir sürümde atılmaz.
2. **Navigasyon katmanı (TASARIM 5A)** — yüzen cam tab bar, arama adası, klavye üstü arama, cam nav düğmeleri, yüzen aksiyonlar, içerik altı solma. Kaydırınca küçülen tab bar (isteğe bağlı) yapılmadı.
3. **Şablonlar ve kontrol planı** — Ayarlar > Şablonlar, türe özel alanlar, otomatik kontrol randevuları, serbest metin tür yok.
4. **Fotoğraf dönem/açı** — yükleme ve çekimde zorunlu, açıya göre grup, dönem çipleri, EXIF yeniden kodlamayla temizlenir.
5. **Karşılaştırma** — yan yana / kaydırıcı / üst üste, dönem şeridi, senkron zoom, çift dokunuş tam ekran, seçim modu + accessory rafı, anonim paylaşım (Web Share, ad yok, EXIF yok).
6. **Klinik alanlar ve onam** — klinik uyarı şeridi, onam alanı ve onamsız hastada tanıtım paylaşımı kapalı, yönlendiren; kan grubu ve e-posta hero'da değil.
7. **Liste etkileşimleri ve geri al** — kaydırma aksiyonları (Ara · WhatsApp / Randevu; Gelmedi / Geldi), uzun basma önizlemesi, geri al kapsülü (silme ve gelmedi onay sormaz), soft delete + Silinenler (30 gün), geciken kontroller.
8. **Formlar ve klavye** — kademeli sheet, Kaydet zorunlu alanlar dolana dek pasif, Türkçe ad düzeltme, Rehberden seç, hazır mesaj şablonları → WhatsApp.
9. **Yedek ve güvenlik** — şifreli yedek (birleştir / değiştir), PIN frenleme ve otomatik kilit, arka plan örtüsü, haftalık dosya yedeği hatırlatması, denetim kaydına paylaşım/yedek. Günlük otomatik yedek web'de bilinçli atlandı (tarayıcı depolaması veriyle aynı yer); mobilde iCloud ile.
10. **Kamera denemesi** — getUserMedia, şablondan açı seçici, %35 hayalet, ızgara, seviye, seri çekim; iOS'ta zoom/flaş yok. 90 sn ölçümü cihazda yapılmadı.
11. **Cila ve erişilebilirlik** — rem + iOS Dynamic Type, tabular rakamlar, boş durumlar, skeleton, manifest kısayolları, sabit renk denetimi, iPad ≥768px iki sütun, ⌘N / ⌘F / Esc.

Plan dışı yapılan: İngilizce dil desteği. Kural (8 Eyl 2026): plan dışı bir özellik gerekirse önce sorulur, dosyaya girer, sonra kod yazılır.

## Sırada

- **4 hafta gerçek kullanım.** Her hafta "neyi 3'ten fazla kez yapmak zor geldi?" listesi; pürüzler burada "Küçük iyileştirmeler"e yazılır ve web'de düzeltilir.
- Liste boşalınca MOBIL.md §10 (web'de uygulanabilir kabul kriterleri) kontrol edilir ve native başlar: MOBIL.md §0.2–0.3.

## Tasarım (TASARIM.md kalanlar)

- [ ] Ekran geçişinde iOS tarzı geri kayma (şu an yalnızca giriş animasyonu var)
- [ ] Butonlarda haptik geri bildirim (native'de)
- [ ] Hero ikon butonlarında uzun basınca ipucu (native'de)

## Deneme bulguları (gerçek kullanım, 1. hafta)

1. [x] Kaydırma aksiyonları tüm satır türlerinde: geciken randevu (sağa Geldi, sola Yeniden planla), planlı işlem (sağa Yapıldı, sola Tarihi değiştir), planlı kontrol (sağa Geldi, sola Gelmedi). Aynı satır türü her ekranda aynı aksiyon.
2. [x] WhatsApp hatırlatma çalışmıyor: numara E.164 (0 → 90), wa.me bağlantısına hazır mesaj, dokunma olayı içinde senkron `location.href`; `window.open` yok.
3. [x] Ara / WhatsApp'tan dönüşte kaydırma bozuluyor: visibilitychange, pagehide, touchcancel'da kaydırma durumu sıfırlanır, açık satırlar kapanır.
4. [x] Kamera hasta seçimi: üstte arama; bölümler "Bugün randevusu olanlar", "Son 5", "Tümü".
5. [x] Randevu formunda "Tüm alanları göster" yok; kademeli sheet: kısa form tarih-saat, tür, bağlı işlem (son işlem önseçili), dönem; yukarı çekince kalan alanlar.
6. [x] Kamera seviye çizgisi yanlış: dik tutuşta DeviceOrientation gamma kararsız; yerçekimi vektöründen (DeviceMotion) hesaplanır, çizgi ufka paralel kalır.
7. [x] Karşılaştırma kaydırıcısı tutamaçtan tutunca takılıyor: zoom denetleyicisinin tek parmakta işaretçi yakalaması tutamacın olaylarını yutuyordu; yakalama yalnızca pinch ve yakınlaştırılmış kaydırmada.
8. [x] Alt çubuk sayfa geçişlerinde pırpırlıyor: gizle-göster ile yeniden yerleştirme kaldırıldı, cam katmanlar kendi katmanına alındı.
9. [x] Uygulama adı ve ikonu uygulama içinde: Hastalar başlığının üstünde 20px ikon + Curalis; kilit ekranında 56px ikon.

## Küçük iyileştirmeler

- [ ] HEIC dosyalarından EXIF okuma (web'de JPEG/WebP/PNG destekleniyor)
- [ ] Fotoğraf görüntüleyicide yakınlaştırma (pinch-zoom)
- [ ] Hasta listesinde son işleme göre sıralama ve filtre
- [x] Yedek dosyasını şifreleme (parola türevi anahtarla, .htbackup)
