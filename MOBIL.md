# Curalis — Native iOS Planı (MOBIL.md)

Bu dosya web prototipinden native uygulamaya geçişin teknik planıdır. TASARIM.md (görsel dil) ve IKON.md (ikon) ile birlikte okunur. Uygulama adı Curalis. Tek cerrahın kişisel aracıdır; hasta fotoğrafı ve klinik kayıt tutar. Konu sağlık verisi: güvenlik ve veri bütünlüğü, hız ve özellikten önce gelir.

---

## 0. Kararlar (değişmez)

| Konu | Karar |
|---|---|
| Platform | Native SwiftUI. iPhone önce; iPad ve Mac aynı kod. Android ve web yok. |
| Veri | SwiftData + SQLite, uygulama sandbox'ında. Tarayıcı depolaması yok. |
| Senkron | CloudKit (SwiftData entegrasyonu). v1'de kapalı; ücretli Developer hesabına geçince açılır. |
| Mimari | Ekranlar veriye yalnızca `Repository` katmanı üzerinden erişir. CloudKit, dosya sistemi, şifreleme bu katmanın altında. Amaç: arka uç ileride değişse (Supabase, kendi API) ekranlar dokunulmasın. |
| Kimlik | Bundle ID: `com.<soyad>.curalis` — bir kez belirlenir ve **bir daha değişmez**. Değişirse iOS farklı uygulama sayar, veriye erişilemez. |
| Web prototipi | Referans. Kod taşınmaz; tasarım kararları, ekran akışı ve veri alanları taşınır. |
| Kapsam dışı | Hasta tarafı uygulama, uzaktan fotoğraf toplama, online randevu, ödeme, fatura, CRM, e‑Nabız. |

Geliştirici hesabı: **başta ücretsiz Apple ID** (7 günde bir Xcode'dan yeniden yükleme). Ücretli hesaba geçiş bölüm 9'da.

---

## 1. Teknoloji

- Swift 5.10+, SwiftUI, SwiftData, iOS 17+ hedef.
- Fotoğraf: AVFoundation ile kendi kamera ekranı (sistem kamerası değil; overlay gerekiyor). HEIC saklanır, paylaşımda JPEG'e çevrilir.
- Güvenlik: iOS Data Protection `.complete` (dosyalar kilitliyken şifreli), Keychain (PIN hash + biyometri), LocalAuthentication (Face ID / Touch ID).
- Şifreli yedek: CryptoKit (AES‑GCM), parola tabanlı anahtar (PBKDF2/Argon2 türevi), tek `.htbackup` dosyası.
- Bağımlılık politikası: mümkün olduğunca sıfır üçüncü parti paket. Gerekiyorsa gerekçesi bu dosyaya yazılır.
- Tasarım token'ları: TASARIM.md'deki renk/tipografi/boşluk değerleri `Theme.swift` içinde tek yerde; açık/koyu `ColorScheme` ile.

---

## 2. Veri modeli

Tüm varlıklar ortak alanlar taşır — senkron ve migrasyon için baştan:

```
id: UUID            // istemci üretir
createdAt, updatedAt: Date
deletedAt: Date?    // soft delete; 30 gün sonra kalıcı silme
deviceID: String    // hangi cihaz yazdı
```

### Patient
- ad, soyad, telefon, doğum tarihi, cinsiyet
- yönlendiren (opsiyonel), e‑posta (opsiyonel, ikincil)
- **klinik özet**: alerjiler, düzenli ilaçlar (antikoagülan vurgulu), sigara, önceki ameliyatlar — kısa metin alanları
- kan grubu: saklanır, üst bilgide gösterilmez
- **fotoğraf onamı**: `consentStatus` (yok / tedavi / tedavi+eğitim / tedavi+eğitim+tanıtım), `consentDate`, imzalı belge görüntüsü (opsiyonel)
- notlar

### Procedure (işlem)
- patient (ilişki), `procedureType` (şablon), tarih, anestezi, cerrahi not
- türe özel alanlar (`Codable` JSON): örn. meme → implant marka/model/hacim/profil/plan; rinoplasti → açık/kapalı, greft kaynağı; lipo → bölgeler, alınan hacim
- komplikasyon: var/yok + açıklama + tarih
- revizyon mu: `revisionOf: Procedure?`
- kontrol planı: `followUpSchedule` → şablondan üretilen Appointment listesi

### ProcedureTemplate (şablon, düzenlenebilir)
- ad (Rinoplasti, Blefaroplasti, Meme büyütme, Meme küçültme, Liposuction, Abdominoplasti, Yüz germe, Otoplasti, Diğer)
- kontrol dönemleri (varsayılan: 1 hafta, 1 ay, 3 ay, 6 ay, 1 yıl)
- standart açı seti (bkz. Photo)
- türe özel alan tanımları
- Kullanıcı şablon ekleyip düzenleyebilir; silinen şablon eski kayıtları bozmaz.

### Photo
- patient, procedure (opsiyonel), dosya adı, çekim tarihi
- **period** (dönem): öncesi / 1. hafta / 1. ay / 3. ay / 6. ay / 1. yıl / diğer — ikili "öncesi/sonrası" değil
- **angle** (açı): cephe / sağ 45° / sağ profil / sol 45° / sol profil / tepe / alt / gövde ön / gövde yan / özel
- notlar
- EXIF: saklanan dosyadan konum silinir; paylaşımda tüm EXIF temizlenir.

### Appointment (randevu/kontrol)
- patient, procedure (opsiyonel), tarih‑saat, tür (kontrol / muayene / diğer), dönem etiketi
- durum: planlı / geldi / gelmedi / iptal
- iOS Takvim'e yazıldıysa `calendarEventID`

### AuditEntry (denetim kaydı)
- ne zaman, hangi cihaz, ne yapıldı (görüntüleme hariç: ekleme/düzenleme/silme/paylaşma/yedek/geri yükleme)
- Ayarlar'dan görüntülenir, silinemez.

Migrasyon kuralı: her model değişikliği `VersionedSchema` ile; eski kayıt hiçbir sürümde okunamaz hale gelmez. Yeni alanlar opsiyonel ya da varsayılan değerli.

---

## 3. Ekranlar

Sekme sırası değişti: **Hastalar · Kamera · Ajanda · Ayarlar**. Fotoğraf uygulamanın merkezi, kamera her ekrandan bir dokunuş.

1. **Kilit** — PIN (4–6 hane) + Face ID. 5 hatalı denemede 1 dk bekleme, katlanarak artar. Arka plana geçince ekran bulanıklaştırılır (uygulama değiştiricide hasta görünmez). Otomatik kilit: 1 / 5 / 15 dk, Ayarlar'dan.
2. **Hastalar** — TASARIM.md'deki gibi. Ek: filtre (işlem türü, yıl, yönlendiren, onam durumu), **geciken kontroller** bölümü (tarihi geçmiş + gelmedi).
3. **Hasta kartı** — hero: ad, yaş, cinsiyet, telefon, son işlem. **Klinik uyarı şeridi**: alerji / antikoagülan / sigara varsa hero altında tek satır, `--warning`. Sekmeler: Genel · İşlemler · Fotoğraflar · Randevular. Genel'de onam durumu görünür alan.
4. **Kamera** — bkz. bölüm 4. Hasta seçili değilse önce hasta seçtirir.
5. **Fotoğraflar** — dönem ve açıya göre ızgara; işlem bazında gruplama; Karşılaştır butonu.
6. **Karşılaştırma** — TASARIM.md'deki gibi; yan yana / kaydırıcı / üst üste. Aynı açıdan iki dönem otomatik eşleşir. Paylaş: birleşik görsel, ad yok, EXIF yok, dönem etiketi var.
7. **İşlem ekle / düzenle** — şablon seçince türe özel alanlar ve kontrol planı gelir; kontrol randevuları otomatik oluşur.
8. **Ajanda** — liste + takvim; geciken kontroller üstte; randevudan hasta kartına geçiş; "geldi / gelmedi" tek dokunuş.
9. **Ayarlar** — Görünüm, Güvenlik (PIN, Face ID, otomatik kilit), Şablonlar (işlem + açı), Yedek (al / geri yükle / otomatik iCloud Drive), Denetim kaydı, Depolama, Hakkında (sürüm, değişiklik notu).

iPad/Mac: `NavigationSplitView` — sol hasta listesi, sağ kart. Kamera ve karşılaştırma tam ekran.

---

## 4. Kamera ve fotoğraf standardı (v1'in kalbi)

- Kendi kamera ekranı. Üstte hasta adı ve seçili **dönem**, altta **açı** seçici (şablondan).
- **Ghost overlay**: aynı hastanın aynı açıdaki önceki fotoğrafı %35 opaklıkla canlı görüntünün üstünde. Açı değişince overlay değişir. Kapatılabilir.
- Izgara ve yatay seviye çizgisi; telefon eğikse uyarı.
- Seri çekim: açı seçili → çek → otomatik sonraki açıya geç. Bir işlem seti (örn. rinoplasti: 6 açı) 1 dakikada biter.
- Kaydedilen fotoğraf **yalnızca uygulamada**; sistem Fotoğraflar'a yazılmaz. Galeriden içe aktarma da mümkün (eski arşiv için), içe alınan dosyanın konum EXIF'i silinir.
- Zoom ve flaş kilitlenebilir (tutarlılık için varsayılan 1x, flaş kapalı).

---

## 5. Güvenlik ve KVKK

- Veritabanı ve fotoğraf dizini `.complete` koruma sınıfı. Cihaz kilitliyken dosya okunamaz.
- PIN Keychain'de hash'li; biyometri Keychain erişim kontrolüyle.
- Ekran görüntüsü alındığında denetim kaydına yazılır (engellenemez, loglanır).
- Paylaşım: hiçbir dışa aktarımda ad/soyad/telefon gitmez; yalnızca dönem ve açı etiketi.
- Silme: soft delete → "Silinenler" (Ayarlar) → 30 gün → kalıcı silme + dosya silme. Kalıcı silme onay ister.
- Fotoğraf onamı olmayan hastanın fotoğrafı paylaşılmak istenince uyarı; "tanıtım" onamı yoksa paylaşım menüsünde bu seçenek kapalı.
- Saklama hatırlatması: Ayarlar'da "X yıl sonra hatırlat" (varsayılan kapalı).
- Uygulama içinde aydınlatma metni şablonu (cerrah kendi kliniğine göre düzenler).
- Analitik, çökme raporu, üçüncü parti SDK **yok**. Hata kaydı yalnızca cihazda.

---

## 6. Yedekleme

- **Manuel**: Ayarlar → Yedek al → parola → `.htbackup` (AES‑GCM). Paylaşım sayfasıyla dosyalara/iCloud Drive'a.
- **Otomatik**: her başarılı kilit açılışından sonra arka planda, günde en fazla bir, iCloud Drive'daki uygulama klasörüne şifreli kopya. Son 7 kopya tutulur. Senkron gelene kadar tek sigorta.
- **Geri yükle**: mevcut veriyle **birleştir** (UUID'ye göre) veya **değiştir**; ikisi de onay ister.
- Yedek dosyası sürüm numarası taşır; eski yedek yeni sürümde açılır.

---

## 7. Sürüm planı

### v1.0 — iPhone, çevrimdışı
- Bölüm 2 modeli, bölüm 3 ekranları, bölüm 4 kamera, bölüm 5 güvenlik, bölüm 6 yedek.
- İşlem şablonları ve türe özel alanlar.
- Kontrol planı → otomatik randevular; geciken kontroller.
- Karşılaştırma (yan yana / kaydırıcı / üst üste), anonim paylaşım.
- Klinik uyarı şeridi, fotoğraf onamı.
- iOS Takvim'e randevu yazma (ad yerine baş harfler).
- Arama / WhatsApp'a atlama, hazır mesaj şablonları.

### v1.1 — iPad + Mac
- SplitView düzeni, "Designed for iPad" ile Mac.
- Fotoğraf üstü çizim (insizyon çizgisi, alan işaretleme); çizim ayrı katman, orijinal bozulmaz.
- Kendi arşivinde benzer vaka arama: işlem + açı + dönem filtresiyle "bu hastaya göstermek için" seçim.
- Basit istatistik: yıl bazında işlem sayısı, tür dağılımı, komplikasyon/revizyon oranı.

### v1.2 — iCloud senkron (ücretli hesap sonrası)
- SwiftData + CloudKit açılır; özel veritabanı; Gelişmiş Veri Koruması önerisi Ayarlar'da.
- Çakışma: son yazan kazanır; silme her zaman kazanır.
- Otomatik yedek devam eder (senkron yedek değildir).

### Sonra (karar noktası)
- Kısa video (mimik/hareket).
- CloudKit paylaşımı ile asistan erişimi (salt okunur / randevu).
- App Store: onboarding, gizlilik politikası, ekran görüntüleri, abonelik.

---

## 8. Mühendislik disiplini

- Her build: `CFBundleShortVersionString` + `CFBundleVersion` artar; `CHANGELOG.md` güncellenir.
- `Repository` protokolü + `LocalRepository` (v1) + ileride `CloudRepository`. Ekranlar protokolü görür.
- Unit test: model migrasyonu, yedek al/geri yükle döngüsü (şifre doğru/yanlış), soft delete → kalıcı silme, EXIF temizleme, anonim paylaşım.
- UI test: kabul akışı (bölüm 10).
- Kod dili İngilizce, kullanıcı metinleri Türkçe (`Localizable.strings`, ileride İngilizce eklenebilir).
- Uygulama hiçbir zaman ağ isteği yapmaz (v1.2'ye kadar). Ağ izni Info.plist'te yok.

---

## 9. Ücretsizden ücretli hesaba geçiş

1. Ücretli programa **aynı Apple ID** ile kaydol.
2. Geçişten önce: Ayarlar → Yedek al (manuel) + otomatik yedeğin güncel olduğunu doğrula.
3. Xcode → Signing: yeni Team seç. Bundle ID **aynı** kalır.
4. Yükleme reddedilirse (farklı imza): uygulamayı sil, Run, yedeği geri yükle.
5. Sertifika artık 1 yıl. TestFlight'a taşınabilir.
6. CloudKit kabiliyeti eklenir → v1.2 başlar.

Ücretsiz dönemde: 7 günde bir Mac'e bağlayıp Run. Uygulama açılmıyorsa veri silinmemiştir; Run sonrası yerindedir.

---

## 10. Kabul kriterleri (v1.0)

- [ ] Yeni hasta → işlem (şablon) → 6 açı fotoğraf (ghost overlay ile) → kontrol randevuları otomatik → karşılaştır → anonim paylaş: **2 dakikanın altında**.
- [ ] Uygulama arka plana alındığında uygulama değiştiricide hasta görünmüyor.
- [ ] Cihaz kilitliyken veritabanı ve fotoğraf dosyaları okunamıyor (Data Protection doğrulaması).
- [ ] Paylaşılan görselde ad yok, EXIF yok.
- [ ] Yanlış parolayla yedek açılmıyor; doğru parolayla tam geri yükleme, fotoğraflar dahil.
- [ ] Silinen hasta 30 gün "Silinenler"de, sonra dosyalarıyla birlikte yok.
- [ ] Onamsız hastada "tanıtım" paylaşımı kapalı.
- [ ] Model sürümü artırıldığında eski veri açılıyor (migrasyon testi).
- [ ] Karanlık modda tüm ekranlar TASARIM.md token'larıyla; hardcoded renk yok.
- [ ] Ağ isteği yok (proxy ile doğrulanır).

---

## 11. Yapılmayacaklar

- Sistem kamerası veya Fotoğraflar uygulamasına kaydetme
- "Öncesi/Sonrası" ikili etiketi (dönem kullanılır)
- Serbest metin işlem türü (şablon zorunlu, "Diğer" şablonu var)
- Üçüncü parti analitik / çökme SDK'sı
- Bundle ID veya Team değişikliği (bölüm 9 dışında)
- Kan grubu / e‑posta gibi ikincil bilgilerin hero'da gösterilmesi
