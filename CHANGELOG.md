# Değişiklik günlüğü

Web planı adımları (YAPILACAKLAR.md "Yapıldı") ile gerçek sürüm numaralarının eşlemesi. Her satır bir yayın.

| Sürüm | Tarih | Adım | Özet |
|---|---|---|---|
| 0.13.1 | 2026-09-08 | Deneme bulguları 1–5 | Kaydırma aksiyonları tüm randevu satırlarında aynı küme (geciken: Geldi / Yeniden planla; planlı işlem: Yapıldı / Tarihi değiştir); WhatsApp hatırlatma senkron location.href + E.164; Ara/WhatsApp dönüşünde kaydırma sıfırlanır; kamera ve Ajanda hasta seçici (arama, Bugün / Son 5 / Tümü); randevu formu kademeli (bağlı işlem önseçili, dönem çipleri). |
| 0.13.0 | 2026-09-08 | Adım 11 | yazı boyutları rem (iOS Dynamic Type --dt çarpanıyla ölçeklenir), manifest kısayolları (Yeni hasta / Fotoğraf çek / Bugünün kontrolleri), iPad ve geniş ekranda (≥768px) iki sütun (liste solda 320px, kart sağda), ⌘N yeni hasta ve ⌘F ara, sabit hex renkler token'a alındı. |
| 0.12.0 | 2026-09-08 | Adım 5 | karşılaştırmada dönem şeridi (Öncesi sabit, şeritte seçilen dönem sağ fotoğrafı değiştirir; aynı açı yoksa nokta soluk), senkron pinch zoom ve kaydırma (her iki fotoğraf ve kaydırıcı/üst üste modları), çift dokunuş tam ekran + aşağı çekerek çıkış. |
| 0.11.0 | 2026-09-08 | Adım 8 | kademeli sheet (yeni hasta / randevu önce yarı yükseklikte, yukarı çekince ya da 'Tüm alanları göster' ile tam), Kaydet zorunlu alanlar dolana dek pasif, Türkçe ad düzeltme (İ/ı, Ş/ş; boşluk temizliği), Rehberden seç (Contact Picker, destekleyen tarayıcıda), hazır mesaj şablonları (Ayarlar; randevu menüsünden 'WhatsApp ile hatırlat'). |
| 0.10.2 | 2026-09-08 | Adım 9 | arka plan örtüsü (uygulama değiştiricide içerik gizli; PIN varsa süre dolunca kilit), haftalık dosya yedeği hatırlatması (Hastalar'da bildirim, Ayarlar'da son yedek tarihi). Günlük otomatik yedek web'de bilinçli atlandı: tarayıcı depolamasına yazılan yedek veriyle aynı yerde, gerçek riske karşı koruma sağlamaz; mobilde (iCloud) yapılacak. |
| 0.10.0 | 2026-09-08 | Adım 7 | kaydırma aksiyonları (hasta: Ara · WhatsApp / Randevu; randevu: Gelmedi / Geldi), 400 ms uzun basma önizlemesi, geri al kapsülü (silme ve 'gelmedi' onay sormaz; kalıcı silme ve yedek üzerine yazma sorar), Ayarlar'da 'şema v2'. |
| 0.9.3 | 2026-09-08 | Adım 2 | Fotoğraflar: dönem çipleri, açıya göre grup, accessory rafı. Ajanda: segment, geciken kartları, arama adası, cam (+). |
| 0.9.2 | 2026-09-08 | Adım 2 | Hasta kartı: cam geri + Ara·Düzenle·Menü kapsülü, yüzen İşlem ekle / Kamera / Randevu, hero yalnızca kimlik. |
| 0.9.1 | 2026-09-08 | Adım 2 | iOS: odakta yakınlaştırma yok; alt katmanlar ölçülen alt kenardan konumlanır (viewport.js). |
| 0.9.0 | 2026-09-08 | Adım 2 | Hastalar: yüzen cam tab bar, arama adası, klavye üstü arama kapsülü, sabit cam (+), içerik altı solma. |
| 0.8.6–0.8.9 | 2026-09-08 | — | iOS ilk açılış / sheet yerleşim düzeltmeleri, tanı paneli. |
| 0.8.3–0.8.5 | 2026-09-07 | Adım 4, 10 | Fotoğraf ekleme akışı (Kamera / Galeri), kamerada dönem düğmeleri, açılar şablondan ve sıralı. |
| 0.8.0–0.8.2 | 2026-09-07 | Adım 10 | Kamera denemesi: getUserMedia, hayalet, ızgara, seviye, seri çekim. |
| 0.7.x | 2026-09-06 | Adım 3, 4, 5, 6, 7, 9 | Şablonlar ve kontrol planı, dönem/açı, karşılaştırma modları, onam + klinik şerit, şifreli yedek, soft delete, geciken kontroller, onam kontrollü paylaşım. |
| 0.6.x | 2026-09-05 | Adım 0, 1 | Curalis adı ve ikon; veri modeli MOBIL.md §2 (UUID, updatedAt, deletedAt, deviceID, şablon tablosu, denetim kaydı); yedek şema 2. |
