# Curalis Clinical — Yapılanlar ve İlerleme Raporu (YAPILACAKLAR.md)

Bu dosya, Curalis projesinde tamamlanan tasarım geliştirmelerini, hayata geçirilen özellikleri ve gelecekte native (Swift/iOS) aşamasına geçerken kullanılacak yol haritasını özetler.

---

## Tamamlanan Tasarım ve Arayüz İşleri (Done)

**Kodda ne var (özet).** Aşağıdaki liste tasarım işlerini anlatır; uygulamanın
kendisi on iki adımlık bir web planıyla yazıldı ve yayında. Sırasıyla: veri
modeli ve Curalis kimliği (0.6.x), şablonlar ve kontrol planı, dönem/açı düzeni,
karşılaştırma modları, onam ve klinik şerit (0.7.x), kamera çekimi — hayalet,
ızgara, seviye, seri çekim (0.8.x), iOS 26 cam navigasyonu ve dört ekrana
uygulanması (0.9.x), kaydırma aksiyonları ile uzun basma önizlemesi (0.10.0),
arka plan örtüsü ve haftalık yedek hatırlatması (0.10.2), kademeli sheet
(0.11.0), karşılaştırmada dönem şeridi (0.12.0), rem tabanlı yazı ölçeği ve
ana ekran kısayolları (0.13.0). Ardından gerçek kullanımda çıkan dokuz bulgu
düzeltildi (0.13.1–0.13.2): kaydırma aksiyonlarının tüm satır türlerine
yayılması, WhatsApp hatırlatması, kamera hasta seçici, kademeli randevu formu,
kamera seviye çizgisi, karşılaştırma kaydırıcısının takılması, alt barın sayfa
geçişlerinde sabitlenmesi ve uygulama adı/simgesinin arayüze girmesi. Sürüm
sürüm döküm CHANGELOG.md'de.

### 1. Temel Görsel Dil & Tasarım Sistemi v2
- [x] **Gece Laciverti Paleti:** `#0B1326` ana vurgu, `#F5F4F0` kırık fildişi zemin, `#D9BFB0` ten tonu vurgusu entegre edildi.
- [x] **Tipografi:** Başlıklar için Display 32px / Title 16px (-0.02em tracking), gövde için 14-15px (Inter / SF Pro), 400 ve 500 ağırlık standardı oturtuldu.
- [x] **Kutu Kirliliğinin Temizlenmesi:** Kenarlıklı iç içe kartlar kaldırıldı; ince ayırıcı çizgili (`--hairline`) ve cömert boşluklu minimalist yapı kuruldu.
- [x] **Dekoratif İkon Temizliği:** Metin önlerindeki gereksiz ikonlar kaldırıldı; sadece aksiyon ve navigasyon ikonları korundu.

### 2. Navigasyon & iOS 26 Liquid Glass Katmanı
- [x] **Yüzen Cam Tab Bar:** 56px yükseklik, 28px yarıçaplı ortalanmış kapsül; 4 ikon (Hastalar, Kamera, Ajanda, Ayarlar).
- [x] **Arama Adası:** Tab bar yanında 56×56px cam büyüteç butonu; dokununca klavye üstü yüzen arama barı ve vazgeç aksiyonu.
- [x] **Hasta İçi Yüzen Aksiyon Rafı:** Hasta kartında genel tab bar yerine "İşlem Ekle" primary butonu + "Kamera" + "Randevu" cam butonları.
- [x] **Fotoğraf Accessory Rafı:** Çoklu seçim yapıldığında altta beliren karşılaştırma hazırlık barı.

### 3. Ekran ve Akış Tasarımları
- [x] **Hasta Portföyü (Hastalar):** Yaklaşan kontrol lacivert kartı, arama adası, dinamik liste ve (+) cam butonu.
- [x] **Hasta Detay Sayfası:** Gece Laciverti hero künyesi, kutusuz istatistikler, 4 sekme (Genel, İşlemler, Fotoğraflar, Randevular).
- [x] **Fotoğraf Karşılaştırma:** Tam ekran `#0B1326` zemin, Yan Yana modu ve interaktif **Sürükle-Bırak Slider (Kaydırıcı)** modu.
- [x] **Zaman Çizelgesi:** Öncesi, 1. Hafta, 1. Ay, 3. Ay, 6. Ay, 1. Yıl periyot seçici şeridi.
- [x] **Ajanda & Kontrol Takvimi:** Geciken kontroller uyarı alanı, bugünün randevuları ve takvim görünümü.
- [x] **Kamera Çekim Rehberi:** Frankfort çizgisi, dikey aks ve çift eksenli dijital su terazisi ile standart medikal fotoğraf kılavuzu.
- [x] **Yeni Hasta Kayıt Sheet'i:** Kademeli açılan modal, T.C./Pasaport, demografi ve ameliyat bilgileri.
- [x] **Yeni Randevu Sheet'i:** Ameliyat/pansuman kontrol türleri ve tarih-saat planlama.
- [x] **Ameliyat & İşlem Ekle Sheet'i:** Cerrahi notlar, anestezi seçimi ve takip protokolü.
- [x] **PIN & Güvenlik Kilit Ekranı:** 72px dairesel tuş takımı, 4 nokta göstergesi, biyometrik giriş alternatifi.
- [x] **Ayarlar Ekranı:** Tema seçimi (Açık/Koyu/Sistem), yerel veri güvenliği ve JSON yedekleme.
- [x] **Hasta Context Menu:** Uzun basma ile açılan hızlı arama, fotoğraf ve randevu aksiyonları.
- [x] **Geri Al (Undo Toast):** Arşivleme sonrası 5 saniye geri alma imkanı sunan cam toast.
- [x] **Yeni Hasta Boş Durumu:** Henüz ameliyat/fotoğraf eklenmemiş hastalar için yönlendirici empty state.
- [x] **Karanlık Mod:** Tüm arayüz için `[data-theme="dark"]` uyarlaması.
- [x] **İnteraktif Prototip Akışı:** 14 ekran ve etkileşimi tek bir tıklanabilir akışta birleştiren prototip.
- [x] **Orijinal İkon Entegrasyonu:** Depodaki özgün iki fildişi halka ve ten tonu kesişimli Curalis simgesi ana marka varlığı olarak onaylandı.

### Geri alınan / düzeltilen
- [~] **"Anonim Paylaşım" butonu.** Adlandırma kaldırıldı, "Dışa Aktar" oldu. Gerekçe: yüz fotoğrafı anonimleştirilemez; EXIF temizliği anonimlik değildir. Detay: TASARIM §3.1.

---

## Sıradaki Geliştirmeler (Next / Roadmap)

> **Sıralama ilkesi:** Tek kullanıcılı, cihazda kalan, dışarı veri
> göndermeyen bir deneme uygulaması. Cihaz zaten kilitli, uygulama
> PIN'li. Bu aşamada öncelik **doğruluk ve akış**; şifreleme Aşama 3'e,
> native geçişe bırakıldı — orada Keychain zaten var, daha doğru yerde
> olur. Tek şart: şifreleme yokken "şifrelenmiş" denmez (§1.2).

### Aşama 1: Doğruluk ve Akış — önce bunlar

**1.1 Kayıt sürümleme (tek satır, şimdi).**
Her kayda bir `schemaVersion` alanı. Şifreleme Aşama 3'te geldiğinde
"bu kayıt v1, şifresiz" diyebilmek, hepsini tahmin etmeye çalışmaktan
kolay. Beş dakikalık iş, ileride migrasyonu kurtarır.
- [x] Kayıt formatına `schemaVersion: 1` eklenmesi — **yapıldı (v0.13.3)**

  *Ne yapıldı:* `js/db.js` içinde `RECORD_SCHEMA = 1` sabiti tanımlandı.
  Ortak damga fonksiyonu `stamp()` her yazmada bu alanı yazıyor, yani
  hastalar, şablonlar, işlemler, fotoğraflar ve randevular kapsandı;
  denetim kayıtlarına da eklendi. Okurken alanı olmayan kayıt 1 sayılıyor.
  Okuma sırasında depodaki satır **yeniden yazılmıyor**: eski kayıt olduğu
  gibi duruyor, ilk kaydetmede damgalanıyor (tembel migrasyon).
  Okuma varsayılanı kalıcı olarak `1`'dir ve `RECORD_SCHEMA` artsa bile
  değişmez — alanı olmayan kayıt eski kayıttır, yeni sürümün kaydı değil.

  *Kapsam dışı bırakılan:* `settings` deposu. Orası `{key, value}` biçiminde
  yapılandırma tutuyor (dil, tema, PIN özeti), ortak alanlı veri kaydı değil.
  Aşama 3'te şifreleme gelirken bu deponun ayrıca ele alınması gerekir.

  *Yedek dosyası:* `SCHEMA` sabiti 2'de bırakıldı. O sabit yedek dosyasının
  yapısını anlatır, tek kaydın biçimini değil; artırmak mevcut yedeklerin
  açılmasını engellerdi. Yeni yedekler alanı taşıyor, eski yedekler
  alansız kayıtlarıyla sorunsuz açılıyor (ikisi de test edildi).

**1.2 PIN ekranındaki yanlış güvence (beş dakika).**
- [x] "Cihaz İçi Şifrelenmiş Medikal Veri" ibaresi kaldırılır, yerine
      **"Veriler bu cihazda saklanır"** yazılır. Şifreleme yokken o
      cümle yanlış bir güvence veriyor. — **yapıldı (v0.13.3)**

  *Ne yapıldı:* Aranan ibare web kodunda hiç yoktu; yalnızca tasarım
  prototipinde geçiyormuş. PIN ekranının başlık altı satırı "Devam etmek
  için PIN girin" yazıyordu. TASARIM §9'un istediği ibare o satıra
  yazıldı (`js/i18n.js`, `lock.enter`), Türkçe ve İngilizce.
  Kodun başka hiçbir yerinde şifreleme iddiası kalmadı — yedek dosyası
  için geçen "şifreli" ifadeleri doğru, yedekler parolayla gerçekten
  şifreleniyor (`js/crypto.js`).

**1.3 Rıza kaydı.**
- [ ] Hasta kaydında `görsel kullanım onayı` alanı (var / yok / tarih)
- [ ] Dışa aktarma ekranında onay durumunun görünmesi; onay yoksa ek
      onay adımı
- [ ] Dışa aktarma çıktısında ne temizlendiğinin açıkça yazılması

**1.4 Kritik uyarı görünürlüğü.**
- [ ] Tıbbi uyarı / alerji alanının hasta detayında hero altında, sekme
      değişiminden bağımsız görünmesi (TASARIM §5.2)

**1.5 Yıkıcı işlem koruması.**
- [ ] Hasta silme için ayrı onay adımı (toast yetmez)
- [ ] Fotoğraf silme için 30 günlük çöp kutusu

**1.6 Kontrast düzeltmesi.**
- [ ] `--text-secondary` ve `--text-tertiary` yeni değerlerinin
      uygulanması
- [ ] Tüm token çiftlerinin bir kontrast aracıyla ölçülmesi
- [ ] Renkle tek başına bilgi verilen yerlerin (geciken kontrol, su
      terazisi, seçili tab) metin veya biçimle desteklenmesi

### Aşama 2: Web / PWA İyileştirmeleri
- [ ] Sistem durumları: yükleniyor / boş / hata / kısmi (TASARIM §13)
- [ ] Dokunmatik cihazlar için `touch-action` ve swipe gesture entegrasyonu
- [ ] Standart açı kamera çekiminde HTML5 Canvas ile kılavuz çizgilerinin canlı akışa bindirilmesi
- [ ] Fotoğraf dışa aktarma için Web Share API (rıza kontrolünden sonra)
- [ ] `prefers-reduced-motion` ve `prefers-reduced-transparency` desteği
- [ ] Dynamic Type / sistem yazı boyutu ölçeklenmesi

### Aşama 3: iOS Native Geçişi (Swift / SwiftUI)
- [ ] `TASARIM.md` token'larının SwiftUI `Color` ve `Font` extension'larına dönüştürülmesi
- [ ] iOS 26 Liquid Glass hissi için SwiftUI `glassEffect` ve `UltraThinMaterial` arka planları
- [ ] LocalAuthentication framework ile Face ID / Touch ID biyometrik kilit
- [ ] **Şifreleme.** Native tarafta Keychain'de anahtar saklama, veri
      şifreleme, ve `schemaVersion: 1` kayıtlarının migrasyonu.
      Tamamlandığında PIN ekranındaki ibare "Cihaz içi şifrelenmiş
      medikal veri" olarak geri gelebilir.

---

## Sonraki tur (şimdi yapılmayacak)

Kapsam bayrağı taşıyan maddeler. Aşama 3 bitmeden açılmaz.

- **Apple Pencil ile fotoğraf üzerine operasyon planlama.** iPad demek — ayrı düzen, ayrı test yükü, ayrı mağaza hedefi. Telefon sürümü oturmadan başlanmaz.
- **`CNContactPickerViewController` ile rehberden hasta import.** Kişisel rehberle tıbbi kaydı karıştırıyor; rehber izni istemek bu uygulamanın gizlilik duruşuyla çelişiyor ve kazandırdığı zaman az. Gerekirse sonra.
- **Yüz maskeleme / bulanıklaştırma** (TASARIM §3.1 isteğe bağlı maddesi)
- **Çoklu kullanıcı / asistan erişimi**
