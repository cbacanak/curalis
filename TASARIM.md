# Curalis Clinical — Nihai Tasarım ve Uygulama Spesifikasyonu (TASARIM.md)

Bu doküman, Curalis Plastik Cerrahi Hasta Takip PWA ve iOS uygulamasının baştan sona geliştirilen tasarım sistemini, arayüz mimarisini, bileşen standartlarını ve ekran envanterini belgeler.

---

## 1. Temel Tasarım Felsefesi ve İlkeler

1. **Tek Vurgu Rengi: Gece Laciverti (`#0B1326`)**
   - Mavi, mor, pembe, altın veya yeşil gibi süsleme renkleri arayüzde yer almaz.
   - Durum renkleri (hata/uyarı) sadece kritik işlevsel noktalarda, sakin tonlarda ve kısıtlı kullanılır.
   - Ten tonu (`#D9BFB0`) yalnızca uygulama simgesinde ve çok hassas cerrahi aks vurgularında yer alır; buton zemini veya metin dolgusu olarak kullanılmaz.

2. **Kutu İçinde Kutu Yok (No Box-in-Box)**
   - Kalın çerçeveli kartlar, gölgeli kutular ve iç içe geçmiş konteynerler tamamen kaldırılmıştır.
   - Bölümler yalnızca cömert boşluklar (`gap: 20-24px`) veya 1px ultra-ince ayırıcı çizgiler (`--hairline: #E8E6DF`) ile ayrılır.

3. **Tipografik Hiyerarşi**
   - Hiyerarşi renkle veya rozetle değil, tipografi kontrastı ve satır ritmiyle kurulur.
   - Başlıklar büyük ve sıkı (-0.02em harf aralığı), içerik sessiz ve okunaklıdır.
   - Font ağırlığı olarak yalnızca 400 (Regular) ve 500 (Medium) kullanılır. 600/700 kalınlıklar yasaktır.

4. **Tek Dolu Aksiyon Butonu**
   - Her görünümde veya ekranda en fazla 1 adet dolu (primary) aksiyon butonu bulunur. Diğer tüm eylemler cam, nötr zemin (`--bg-subtle`) veya metin buton olarak kurgulanır.

5. **Dekoratif İkon Kirliliği Yok**
   - Telefon, takvim, damla, bilgi gibi dekoratif metin önü ikonları kaldırılmıştır. İkonlar yalnızca aksiyon butonlarında ve tab barda işlevsel olarak yer alır.

6. **Kutusuz Sayılar (Frameless Stat Metrics)**
   - İstatistikler ve sayaçlar kutu içine alınmaz: Büyük rakam (Stat 24px) + altında küçük ikincil etiket (Caption/Label 12-13px).

7. **Okunabilirlik Estetiğin Önündedir** *(yeni)*
   - Bu klinik bir araçtır: değişken ışıkta, acele ederken okunur.
   - Gövde metni için asgari kontrast oranı **4.5:1**, büyük metin için **3:1**.
   - Hiçbir bilgi yalnızca renkle verilmez; metin veya biçim de taşır.
   - Dokunma hedefi asgari **44×44px**.

---

## 2. Renk Sistemi ve Değişkenler (Token Architecture)

Tüm renkler `:root` ve `@media (prefers-color-scheme: dark)` bloklarında tanımlı CSS değişkenleri üzerinden yönetilir.

> **Kontrast düzeltmesi:** `--text-secondary` ve `--text-tertiary` önceki değerlerinde WCAG eşiğinin altındaydı (~4.3:1 ve ~2:1). Klinik kullanımda bu estetik değil işlevsel bir sorun. İkisi de koyulaştırıldı. Değişiklik yapıldığında her token çifti bir kontrast aracıyla yeniden ölçülmelidir.

```css
:root {
  /* Zeminler */
  --bg:            #F5F4F0;  /* Sayfa ana zemini (Kırık fildişi) */
  --bg-elevated:   #FFFFFF;  /* Alt modal sheet, açılır kartlar */
  --bg-subtle:     #EAE8E1;  /* Arama kutusu, ikincil aksiyonlar, avatar zemini */
  --bg-inverse:    #0B1326;  /* Gece laciverti hero, primary buton, seçili ikon */

  /* Tipografi (Açık Zemin) */
  --text:          #0B1326;  /* Ana gövde ve başlık metni */
  --text-secondary:#565C6E;  /* Açıklamalar, etiketler, pasif tablar — ≥4.5:1 */
  --text-tertiary: #7C8091;  /* Boş değerler "—", placeholderlar — ≥4.5:1 */

  /* Tipografi (Lacivert Zemin Üzerinde) */
  --text-on-inverse:           #F5F4F0; /* Fildişi kontrast metin */
  --text-on-inverse-secondary: #B8BFD0; /* İkincil hasta künyesi */
  --text-on-inverse-tertiary:  #9AA2B8; /* Operasyon & protokol etiketi */
  --border-on-inverse:         #2A344D;

  /* Çizgiler */
  --hairline:      #E8E6DF;  /* Liste satır ayırıcı (1px) */
  --divider:       #E1DFD8;  /* Bölüm ve tab alt çizgisi */

  /* Medikal Durum */
  --danger:        #B3261E;
  --danger-bg:     #F9E7E5;
  --warning:       #8A5A00;
  --warning-bg:    #F7EBD3;

  /* iOS 26 Liquid Glass Katmanı */
  --glass-bg:      rgba(255, 255, 255, 0.68);
  --glass-bg-dark: rgba(11, 19, 38, 0.65);
  --glass-border:  rgba(255, 255, 255, 0.85);
  --glass-shadow:  0 8px 32px rgba(11, 19, 38, 0.12);
  --glass-blur:    blur(20px) saturate(1.4);
}

/* Karanlık Mod (Dark Mode) */
@media (prefers-color-scheme: dark) {
  :root, [data-theme="dark"] {
    --bg:            #111827;
    --bg-elevated:   #1A2234;
    --bg-subtle:     #1E2738;
    --bg-inverse:    #0B1326;

    --text:          #F5F4F0;
    --text-secondary:#B8BFD0;  /* koyulaştırılmış karşılığı: açıklaştırıldı */
    --text-tertiary: #8E95A8;

    --hairline:      #232B3D;
    --divider:       #2A344D;

    --danger:        #F28B82;
    --danger-bg:     #3A1F1E;
    --warning:       #E6B96A;
    --warning-bg:    #3A2E14;

    --glass-bg:      rgba(26, 34, 52, 0.72);
    --glass-border:  rgba(255, 255, 255, 0.12);
    --glass-shadow:  0 8px 32px rgba(0, 0, 0, 0.35);
  }
}

/* Hareket azaltma tercihi */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### 2.1 Cam katmanı kuralı *(yeni)*

`blur(20px) saturate(1.4)` mobilde pahalı ve altındaki içerik hareket ederken okunabilirliği düşürür. Kural:

- Cam yalnızca **yüzen navigasyon** için kullanılır (tab bar, arama adası, aksiyon rafı, toast).
- İçerik yüzeylerinde cam kullanılmaz.
- Cam üzerindeki metin kontrastı, camın arkasındaki en açık ve en koyu zemin için ayrı ayrı ölçülür; ikisinde de eşiği geçmeli.
- Düşük güçlü cihazda veya `prefers-reduced-transparency` açıkken cam düz `--bg-elevated` zemine düşer.

---

## 3. Tipografi Tablosu

| Rol | Boyut | Ağırlık | Harf Aralığı | Kullanım Alanı |
|---|---|---|---|---|
| **Display** | 32px | 500 | -0.02em | Ana sayfa başlığı ("Hastalar"), Hasta adı |
| **Stat** | 24px | 500 | -0.02em | Sayaçlar, kalan gün ("3 gün", "12") |
| **Title** | 16px | 500 | 0 | Hasta satır başlığı, form başlığı, modal başlık |
| **Body** | 15px | 400 | 0 | Hasta bilgi satırları, klinik notlar |
| **Body Small** | 14px | 400 | 0 | Tab metinleri, buton etiketleri, meta veri |
| **Caption** | 13px | 400 | 0 | Liste alt bilgisi ("35 · Rinoplasti · 12 Ağu") |
| **Label** | 12px | 400 | +0.06em | Bölüm başlıkları ("YAKLAŞAN KONTROL", "AKTİF PROTOKOLLER") |

*Not: Tüm metinlerde Sentence case kullanılır. TÜMÜ BÜYÜK HARF kullanımı sadece mikro bölüm etiketlerinde (+0.06em aralıkla) geçerlidir.*

*Ölçeklenme: Kullanıcının sistem yazı boyutu tercihi uygulanır (`rem` tabanlı). AX kademelerinde düzen bozulmamalı; satırlar taşarsa sarılır, kesilmez.*

---

## 4. Navigasyon Mimarisi: iOS 26 Liquid Glass

İçerik (listeler, ameliyat notları, fotoğraflar) mat zemin üzerinde sergilenirken, navigasyon katmanı yüzen sıvı cam (Liquid Glass) malzemeyle çalışır:

1. **Yüzen Cam Tab Bar:**
   - 56px yükseklik, 28px yarıçap (kapsül), alttan 16px + safe-area mesafeli.
   - 4 adet 46×46px dairesel ikon yuvası: **Hastalar**, **Kamera**, **Ajanda**, **Ayarlar**.
   - Seçili ikon: Gece Laciverti dolgu (`--bg-inverse`) + fildişi ikon. Pasif ikonlar nötr gri.
   - *Seçili durum yalnızca renkle değil, ikonun dolgu/çizgi varyantıyla da ayrılır.*

2. **Bağımsız Arama Adası:**
   - Tab bar'ın sağında 10px boşlukla konumlanan 56×56px cam yuvarlak büyüteç butonu.
   - Yalnızca arama ihtiyacı olan listelerde (Hastalar, Randevular) belirir.
   - Dokunulduğunda tab bar gizlenir, klavyenin hemen üzerine 52px yüksekliğinde cam arama barı ve "Vazgeç" butonu yerleşir.

3. **Hasta İçi Yüzen Aksiyon Rafı:**
   - Hasta detay sayfasında genel tab bar gizlenir.
   - Alt kısımda geniş Gece Laciverti kapsül **"İşlem Ekle"** ve yanında 56×56px cam **Kamera** ile **Randevu Planla** daireleri yer alır.

4. **Fotoğraf Accessory Rafı:**
   - Fotoğraf seçim modunda tab bar üzerinde belirir: Sol tarafta *"2 seçili · Cephe"*, sağ tarafta dolu fildişi/lacivert *"Karşılaştır"* butonu.

---

## 5. Tasarlanan Ekran Envanteri ve Özellikleri

### 1. Hasta Portföyü (Hastalar Ana Ekranı)
- **Üst Başlık:** "Hastalar" (Display 32px), hemen altında "4 kayıtlı protokol · 1 yaklaşan kontrol" alt satırı.
- **Sağ Üst Aksiyon:** 44×44px cam yuvarlak (+) Yeni Hasta butonu.
- **Yaklaşan Kontrol Kartı (Tek İstisna Kart):** Gece Laciverti dolgulu, sol tarafta hasta adı ve ameliyatı, sağ tarafta "3 gün kaldı" stat göstergesi.
- **Hasta Listesi:** 42px zarif baş harf avatarları (`--bg-subtle`), hasta adı, ameliyat türü, son kontrol tarihi ve ince chevron göstergesi. Hairline ile ayrılmış temiz liste.

### 2. Hasta Detayı (Selin Yılmaz)
- **Hero Bölümü:** Üstten safe-area dahil devam eden Gece Laciverti zemin. "Rinoplasti · 12 Ağu 2026" künyesi, Selin Yılmaz (Display), "35 yaş · Kadın · +90 532 000 0000".
- **Kritik Uyarı Şeridi (yeni):** Hero'nun hemen altında, sekmelerin üstünde. Tıbbi uyarı veya alerji varsa `--danger-bg` zeminde, metin olarak görünür ve **sekme değiştirince kaybolmaz**. Uyarı yoksa şerit hiç çizilmez — boş kutu bırakılmaz. Bu bilgi kaçırılamayacak tek yerde durmalıdır; forma girilip detayda görünmemesi kabul edilemez.
- **İstatistik Satırı:** 3 sütunlu kutusuz metrikler: Operasyon tarihi, 1. Ay Kontrolü, İyileşme Periyodu.
- **Sekmeler:** Genel / İşlemler / Fotoğraflar / Randevular.

### 3. Fotoğraf Karşılaştırma & İnteraktif Slider (Touch & Drag)
- Tam ekran Gece Laciverti klinik arka plan (`#0B1326`).
- Üstte Kapat (X), "Karşılaştır", **"Dışa Aktar"** butonları.
- Ortada Pre-op ve 1. Ay Post-op fotoğrafları.
- **İnteraktif Slider:** Dokunma veya fareyle sürüklenebilen dikey çizgi ve tutamaç (◀▶), 60 FPS `clip-path` maskelemesi.
- **Zaman Çizelgesi Şeridi:** Öncesi · 1. Hf · 1. Ay · 3. Ay · 6. Ay · 1. Yıl nokta göstergeleri.

#### 3.1 Dışa aktarma — "Anonim Paylaş" adlandırması kaldırıldı *(değişiklik)*

**Gerekçe:** EXIF ve konum verisi temizlenebilir, ancak **yüz fotoğrafı anonimleştirilemez** — kimliği tanımlayan veri yüzün kendisidir. "Anonim Paylaş" etiketi kullanıcıya çıktının anonim olduğunu söyler; değildir. Vaat gerçekle eşitlenmelidir.

- Buton adı: **"Dışa Aktar"**.
- Dışa aktarma sayfasında ne yapıldığı açıkça yazılır: *"EXIF, konum ve cihaz bilgisi kaldırıldı. Yüz görünür kalır."*
- **Rıza kontrolü (yeni, zorunlu):** Hasta kaydında `görsel kullanım onayı` alanı bulunur (var / yok / tarihli). Onay yoksa dışa aktarma ekranı uyarı gösterir ve işlem ek bir onay adımı ister.
- İsteğe bağlı maskeleme seçeneği (göz bandı / yüz bulanıklaştırma) sunulabilir; sunulursa etiketi "Maskele" olur, "anonimleştir" değil.

### 4. Ajanda & Kontrol Takvimi
- Liste ve Takvim segment kontrolü.
- **Geciken Kontroller:** En üstte uyarı tonunda (`--warning-bg`) dikkat çeken gecikmiş pansuman/splint kontrolü. *Renk tek başına yeterli değildir; "Gecikti" metni de bulunur.*
- **Bugün & Yaklaşan:** Saat, hasta adı, kontrol türü (1. Hafta Splint Alımı, 1. Ay Fotoğraf Kontrolü).

### 5. Yeni Hasta & Protokol Kayıt Formu (Modal Sheet)
- Alttan açılan 24px üst yarıçaplı sheet.
- T.C. Kimlik / Pasaport, Ad Soyad, Doğum Tarihi, Telefon, Cinsiyet segment kontrolü, Planlanan Operasyon ve Tıbbi Uyarılar.
- **Görsel kullanım onayı** alanı (§3.1).
- Tek tam genişlikte primary buton: "Hastayı Kaydet".

### 6. Yeni Randevu & Kontrol Ekleme Sheet'i
- Hasta seçimi / otomatik bağlama.
- Randevu Tipi: Konsültasyon, Ameliyat, 1. Hafta Splint, 1. Ay Kontrolü, 3. Ay Kontrolü.
- Tarih & Saat seçici ve klinik hatırlatıcı seçeneği.

### 7. İşlem / Ameliyat Ekleme Formu
- Operasyon tipi (Primer Rinoplasti, Blefaroplasti vb.), Anestezi Türü (Genel / Lokal / Sedasyon).
- Cerrahi notlar alanı ve dikiş alma periyodu planlaması.

### 8. Kamera & Standart Açı Çekim Rehberi
- Amaç: aynı hastanın aynı açıdan tekrarlanabilir fotoğrafı. Araçlar: önceki fotoğrafın hayalet bindirmesi, üçe üç ızgara, dijital su terazisi.
- Sabit medikal çizgiler (Frankfort hattı, orta yüz dikey aksı, burun simetri çaprazı) bilerek yok: Frankfort düzlemi anatomik noktalara dayanır, ekrana sabit çizilen bir çizgi onu bulamaz. Yüz nirengi tespiti gelirse yeniden değerlendirilir.
- Çekim Açıları: Cephe (0°), Sağ Eğik (45°), Sol Eğik (45°), Sağ Profil (90°), Sol Profil (90°), Bazal (Alttan).
- İki eksenli dijital su terazisi (yeşil denge göstergesi). *Denge durumu renkle birlikte metin veya sembolle de verilir.*

### 9. PIN Giriş & Kilit Açma Ekranı
- Gece Laciverti tam ekran güvenlik arayüzü.
- Minimal Curalis başlığı, **"Veriler bu cihazda saklanır"** ibaresi, 4 adet dolan PIN noktası.
- 72px dairesel dokunmatik rakam tuş takımı ve Face ID / Biyometrik alternatif seçeneği.

> **Uygulama durumu (v0.13.3):** Bu ibare kodda yerine kondu; PIN ekranı artık "Veriler bu cihazda saklanır" yazıyor.

> **Not:** Eski "Cihaz İçi Şifrelenmiş Medikal Veri" ibaresi kaldırıldı. Şifreleme Aşama 3'e (native geçiş) bırakıldı; o gelene kadar "şifrelenmiş" demek yanlış bir güvence verir. PIN arayüzü korur, veriyi değil. Şifreleme tamamlandığında ibare geri gelebilir.

### 10. Ayarlar & Güvenlik
- Görünüm tercihi: Açık / Koyu / Sistem Tema segmenti.
- Veri Güvenliği: Yerel depolama durumu, PIN Değiştir, Biyometrik Kilit.
- Dışa Aktar & Yedekle: Şifreli JSON Yedek, Görselleri Arşivle.
- Sürüm künyesi: Orijinal Curalis halka simgesi ve sürüm numarası. Numaranın tek kaynağı koddur; bu belgede sürüm yazılmaz.

### 11. Mikro Etkileşimler & Yardımcı Durumlar
- **Uzun Basma Önizlemesi (Context Menu):** Hastaya basılı tutulduğunda açılan hızlı arama, fotoğraf çekme, randevu oluşturma ve arşivleme aksiyon menüsü.
- **Geri Al (Undo Toast) Kapsülü:** Arşivleme sonrası altta 5 saniye beliren cam bildirim: *"Caner Yıldız arşivlendi · Geri Al"*.
- **Yeni Hasta Boş Durumu (Empty State):** Henüz işlem veya fotoğraf eklenmemiş hastalar için sakin yönlendirici kartlar.
- **Karanlık Mod Uyarlaması:** Gece polikliniği ve düşük ışıklı ameliyathane kullanımı için tam uyumlu koyu palet.

### 12. Yıkıcı İşlemler *(yeni)*

Geri al toast'ı tek başına yeterli koruma değildir; beş saniye kaçırılabilir ve hasta kaydı geri getirilemez veridir.

- **Arşivle** (tersine çevrilebilir): geri al toast'ı yeterli.
- **Hasta sil** (kalıcı): ayrı onay adımı. Hasta adının yazılarak doğrulanması veya iki adımlı onay. Toast yok.
- **Fotoğraf sil:** çöp kutusuna taşınır, 30 gün sonra kalıcı silinir.
- Silme aksiyonu hiçbir zaman ana aksiyon konumunda durmaz.

### 13. Sistem Durumları *(yeni)*

Her veri gösteren ekranın dört durumu tanımlıdır:

- **Yükleniyor:** iskelet satırlar; dönen spinner değil, boş ekran hiç değil.
- **Boş:** sakin yönlendirici metin ve tek aksiyon (§11).
- **Hata:** ne olduğu ve ne yapılacağı tek cümlede. "Fotoğraf yüklenemedi · Tekrar dene". Teknik hata kodu kullanıcıya gösterilmez.
- **Kısmi:** bazı alanlar eksikse `--text-tertiary` ile "—", boş kutu değil.

Kaydetme işlemlerinde: buton basıldıktan sonra devre dışı kalır, işlem bitene kadar durum gösterir, başarısızlıkta veri formda kalır — kullanıcının yazdığı hiçbir şey kaybolmaz.
