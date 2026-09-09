# Curalis — Tasarım Sistemi v2 ("Gece Laciverti")

Bu dosya uygulamanın görsel dilini tanımlar; her arayüz değişikliğinde referans alınır. Amaç: mevcut "şablon" görünümünden kurtulup sade, premium, klinik‑lüks bir his vermek. Uygulama şu an GitHub Pages'te PWA; ileride iOS uygulamasına dönüşecek, bu yüzden tüm değerler tek bir token dosyasından okunmalı.

## 1. İlkeler

1. Tek vurgu rengi: gece laciverti. Mavi, pembe, mor, yeşil, altın yok. Durum renkleri (hata/uyarı) sadece gerektiğinde ve az.
2. Kutu içinde kutu yok. Kenarlıklı kart yerine: ince ayırıcı çizgili listeler veya sadece boşlukla ayrılan bölümler.
3. Hiyerarşi tipografiyle kurulur, renkle değil. Başlık büyük ve sıkı, geri kalan sessiz.
4. Her ekranda tek dolu (primary) buton. Diğer aksiyonlar ikon veya metin buton.
5. Metnin başında dekoratif ikon yok (telefon, takvim, damla ikonları kaldırılır). İkon sadece aksiyon butonlarında ve tab bar'da.
6. Sayılar kutusuz gösterilir: büyük rakam + altında küçük gri etiket.
7. Boşluk cömert. Şüphede kalınca boşluğu artır, öğeyi küçültme.
8. Tutarlılık > her şey. Aynı yarıçap, aynı boşluk ritmi, aynı yazı boyutları her ekranda.

## 2. Renk token'ları

Tüm renkler `:root` içinde CSS değişkeni olarak tanımlanır; bileşenlerde hex kullanılmaz.

```css
:root {
  /* Zemin */
  --bg:            #F5F4F0;  /* sayfa zemini, kırık fildişi */
  --bg-elevated:   #FFFFFF;  /* sheet, modal */
  --bg-subtle:     #EAE8E1;  /* arama kutusu, ikincil buton zemini */
  --bg-inverse:    #0B1326;  /* hero alanı, primary buton, seçili öğeler */

  /* Metin (açık zemin üzerinde) */
  --text:          #0B1326;
  --text-secondary:#6B7185;
  --text-tertiary: #B0B3BC;  /* boş değer "—", placeholder */

  /* Metin (lacivert zemin üzerinde) */
  --text-on-inverse:           #F5F4F0;
  --text-on-inverse-secondary: #A9B0C2;
  --text-on-inverse-tertiary:  #8B93A8;
  --border-on-inverse:         #2A344D;

  /* Çizgiler */
  --hairline:      #E8E6DF;  /* liste ayırıcı */
  --divider:       #E1DFD8;  /* bölüm ayırıcı, tab alt çizgisi */

  /* Durum — az kullan */
  --danger:        #B3261E;
  --danger-bg:     #F9E7E5;
  --warning:       #8A5A00;
  --warning-bg:    #F7EBD3;

  /* Fotoğraf placeholder */
  --photo-placeholder: #C9C1B6;
}
```

Not: Öncesi/Sonrası etiketleri renkli badge olmayacak; fotoğrafın altında `--text-secondary` renginde düz metin ("Öncesi · 11 Ağu").

### 2.1 Karanlık mod

Tema sistem ayarını izler (`prefers-color-scheme`), Ayarlar > Görünüm'den Açık / Koyu / Sistem olarak ezilebilir. Aynı token adları, farklı değerler; bileşen kodu hiç değişmez.

```css
@media (prefers-color-scheme: dark) { :root, [data-theme="dark"] {
  --bg:            #111827;
  --bg-elevated:   #1A2234;
  --bg-subtle:     #1E2738;
  --bg-inverse:    #0B1326;  /* hero aynı kalır, gövdeden bir ton koyu */

  --text:          #F5F4F0;
  --text-secondary:#A9B0C2;
  --text-tertiary: #6B7185;

  --hairline:      #232B3D;
  --divider:       #2A344D;

  --danger:        #F28B82;
  --danger-bg:     #3A1F1E;
  --warning:       #E6B96A;
  --warning-bg:    #3A2E14;

  --photo-placeholder: #4A5063;
}}
```

Karanlıkta ters dönen şeyler:
- Primary buton: zemin `--text` (fildişi), metin `--bg-inverse`. Yani açıkta lacivert/fildişi, koyuda fildişi/lacivert. Bunu `--primary-bg` / `--primary-text` token çifti ile çöz, doğrudan `--bg-inverse` kullanma.
- "Yaklaşan kontrol" kartı: lacivert dolgu yerine `--bg-elevated` zemin + 1px `--divider` kenarlık.
- Fotoğraf karşılaştırma ekranı her iki modda da lacivert; tema değişmez.
- Hero ile gövde arasındaki fark koyuda azdır (#0B1326 / #111827); bu bilinçli, keskin geçiş istenmiyor.

## 3. Tipografi

Font: iOS'ta `-apple-system` (SF Pro), diğerlerinde `Inter` (Google Fonts'tan yükle, 400 ve 500 ağırlıkları yeter). Sadece iki ağırlık kullanılır: 400 ve 500. 600/700 yok.

| Rol | Boyut | Ağırlık | Harf aralığı | Kullanım |
|---|---|---|---|---|
| Display | 32px | 500 | -0.02em | Ekran başlığı (Hastalar), hasta adı |
| Stat | 24px | 500 | -0.02em | İstatistik sayıları |
| Title | 16px | 500 | 0 | Liste öğesi adı, bölüm başlığı |
| Body | 15px | 400 | 0 | Bilgi satırları |
| Body small | 14px | 400 | 0 | Meta bilgi, tab etiketi, buton |
| Caption | 13px | 400 | 0 | Liste alt satırı |
| Label | 12px | 400 | +0.06em | Bölüm etiketi ("Yaklaşan kontrol"), istatistik etiketi |

Kurallar: Cümle düzeni (sentence case), BÜYÜK HARF yok. Satır yüksekliği başlıklarda 1.1, gövdede 1.4. Meta bilgiler tek satırda " · " ile birleştirilir.

## 4. Boşluk ve yarıçap

- Grid: 4px tabanlı. Kullanılan adımlar: 4, 8, 12, 16, 20, 24.
- Ekran yatay kenar boşluğu: 24px (her ekranda aynı).
- Bölümler arası dikey boşluk: 24px. Bölüm başlığı ile içeriği arası: 10–12px.
- Liste satırı dikey padding: 14px, alt çizgi `--hairline` 1px.
- Yarıçap: buton ve input 14px, kart/fotoğraf 14–16px, avatar 50%, telefon çerçevesi ilgisiz.
- Gölge yok. Elevation sadece `--bg-elevated` rengiyle verilir.
- Dokunma hedefi minimum 44×44px.

## 5. Bileşenler

### Hero (hasta detay üst alanı)
- Zemin `--bg-inverse`, padding 20px 24px 24px. Ekranın üstünden safe-area dahil devam eder (status bar da lacivert).
- İçerik sırası: Label satırı ("Rinoplasti · 12 Ağu 2026", `--text-on-inverse-tertiary`) → Display hasta adı → meta satırı ("35 yaş · Kadın · telefon", `--text-on-inverse-secondary`). Hero yalnızca kimlik taşır.
- Navigasyon ve aksiyonlar için bkz. 5A.

### İstatistik satırı
- Hero'nun hemen altında, 22px üst boşluk. Üç öğe `justify-content: space-between`. Kutu, zemin, kenarlık yok.
- Sayı Stat stilinde, altında Caption etiket. Üçüncü öğe sağa hizalı ("12 Eyl" / "1. ay kontrolü · 7 gün").

### Tablar (Genel / İşlemler / Fotoğraflar / Randevular)
- Metin tab, 14px, seçili olan `--text` + 500 + 2px alt çizgi `--text`; diğerleri `--text-secondary`. Tüm satırın altında 1px `--divider`. Sayaç rozetleri kaldırılır (sayılar istatistik satırında zaten var).

### Bilgi listesi (Genel sekmesi)
- İki sütunlu satırlar: sol etiket `--text-secondary`, sağ değer `--text`. Boş değer "—" `--text-tertiary`. Satırlar `--hairline` ile ayrılır, son satırda çizgi yok. "Kişisel bilgiler" başlığı ve Düzenle butonu kaldırılır; düzenleme hero'daki kalem ikonundan yapılır.

### Fotoğraf ızgarası
- 2 sütun, 10px gap, kare‑yakın oran, 14px yarıçap. Etiket fotoğrafın altında Caption ("Öncesi · 11 Ağu"). Üstte badge yok.
- Fotoğraf karşılaştırma ekranı: tam ekran, zemin `--bg-inverse`, yan yana veya kaydırmalı; bu ekran uygulamanın vitrini, en çok özen buraya.

### Hasta listesi
- Üstte Display "Hastalar" + Caption alt satır ("3 kayıt · 1 yaklaşan kontrol"). Sağda 44×44 dolu (+) buton — "Yeni hasta" metin butonu kaldırılır.
- Arama: `--bg-subtle` zemin, kenarlık yok, 14px yarıçap, sol ikon.
- "Yaklaşan kontrol" bölümü: lacivert dolgu kart (tek istisna kart), 16px yarıçap, sol ad + işlem, sağ tarih + kalan gün. Yaklaşan kontrol yoksa bölüm gizlenir.
- Liste: alfabetik harf başlıkları kaldırılır (3–50 hasta için gereksiz). Satır: 42px gri avatar (`--bg-subtle`, baş harfler 500) + Title ad + Caption alt satır ("35 · Rinoplasti · 12 Ağu") + chevron `--text-tertiary`. Satırlar hairline ile ayrılır, kart kutusu yok.

### Tab bar
- Navigasyon ve aksiyonlar için bkz. 5A.

### PIN ekranı
- Zemin `--bg-inverse`, tüm metin `--text-on-inverse`. Rakam tuşları kenarlıksız, 72px daire, zemin `#16213A`, basılıyken `#22304F`. Kilit ikonu kaldırılır; sadece "Curalis" Display + Caption açıklama + 4 nokta + tuş takımı.

### Butonlar
- Primary: `--bg-inverse` zemin, `--text-on-inverse` metin, 14px yarıçap, 44–48px yükseklik, 14px/500 metin. Ekranda en fazla 1.
- Secondary: `--bg-subtle` zemin, `--text` metin.
- Ghost/ikon: zemin yok, 44×44.
- Destructive: sadece metin `--danger`, onay sheet'i içinde.

### Form ve sheet'ler
- Yeni hasta / işlem / randevu formları alt sheet olarak açılır (üstten kaydırılabilir), zemin `--bg-elevated`, 24px üst yarıçap.
- Input: `--bg-subtle` zemin, kenarlık yok, 14px yarıçap, 48px yükseklik, label input'un üstünde Caption. Focus: 1px `--text` kenarlık.

### Fotoğraf karşılaştırma
- Tam ekran, zemin `#0B1326`, her iki temada aynı. Üstte kapat (X) · "Karşılaştır" · paylaş.
- Fotoğraflar 3px aralıkla yan yana, ekran yüksekliğinin ~%60'ı. Sol altta Caption etiket ("Öncesi · 11 Ağu"), sağ üstte açı/dönem ("Profil", "2. hafta").
- Altta mod chip'leri: Yan yana / Kaydır (slider) / Üst üste (opaklık). Seçili chip fildişi dolgu.
- En altta seçili "Sonrası" fotoğrafı ve "Değiştir" metin butonu; dokununca aynı işlemin fotoğraf listesi sheet olarak açılır.
- Paylaş: iki fotoğrafı tek görsele birleştirip etiketleriyle dışa verir (hasta adı yazmaz).

### Alt sheet formları (Yeni hasta, İşlem ekle, Randevu)
- Arka plan `rgba(11,19,38,.45)` ile kararır. Sheet `--bg-elevated`, 24px üst yarıçap, 36×4 tutamaç.
- Başlık satırı: 20px/500 başlık solda, "Vazgeç" metin butonu sağda `--text-secondary`.
- Alan etiketi 12px `--text-secondary`, input'un üstünde. İsteğe bağlı alanlar etikette "· isteğe bağlı" (`--text-tertiary`).
- Input: `--bg-subtle`, 44px, 12px yarıçap, kenarlıksız. Odakta zemin `--bg-elevated` + 1px `--text` kenarlık. Placeholder `--text-tertiary`.
- Kısa seçimler (cinsiyet, tema) segment kontrol; çok seçenekli kısa listeler (işlem türü, kontrol dönemleri) chip grubu; uzun listeler (kan grubu) native seçici.
- Tarih alanı sağda takvim ikonu, seçince native date picker.
- Tek primary buton en altta, 46px, tam genişlik. Buton metni eylemi söyler: "Hastayı kaydet", "İşlemi kaydet".
- Klavye açılınca sheet yukarı kayar, buton görünür kalır.

### Boş durumlar
- Dikey ortalanmış: 16px/500 başlık (eylem cümlesi: "İlk hastanı ekle", "Henüz fotoğraf yok") + 13px `--text-secondary` bir cümle açıklama + tam genişlik primary buton.
- İllüstrasyon, ikon, emoji yok. Alt başlık listede "Henüz kayıt yok" olur.

### Silme onayı
- Alttan çıkan iOS action sheet: `--bg-elevated` kart, 18px yarıçap. Başlık "Elif Kaya silinsin mi?", açıklama neyin silineceğini sayar ve "Bu işlem geri alınamaz." ile biter.
- Yıkıcı aksiyon `--danger` renkli, 500 ağırlık, kartın içinde. "Vazgeç" ayrı kart olarak altta.
- `--danger` başka hiçbir yerde buton dolgusu olarak kullanılmaz.

### Ayarlar
- Bölüm etiketi Label stilinde, satırlar hairline ile ayrılır. Sağ tarafta değer + chevron (`--text-secondary`). Açıklama satırı sadece davranışı netleştirdiği yerlerde (PIN kilidi gibi).
- Görünüm bölümü en üstte: Tema segment kontrolü (Açık / Koyu / Sistem).

## 5A. Navigasyon katmanı — iOS 26 kalıbı (Liquid Glass)

Eylül 2026'dan itibaren geçerli; bölüm 5'teki "Tab bar" ve "Hasta listesi arama" tanımlarını **geçersiz kılar**. Referans görsel: `curalis-ios26-kalibi.png`.

İlke: İçerik (listeler, fotoğraflar, formlar) düz ve mat kalır; yalnızca **navigasyon katmanı** (tab bar, nav butonları, yüzen aksiyonlar, arama, accessory rafı) cam malzeme kullanır. Cam üstüne cam yok. İçerik bu katmanın altına kadar kayar; altta yumuşak bir solma (blur değil) ile biter.

### Cam malzeme (token)
```css
--glass-bg:      rgba(255,255,255,.62);   /* açık zemin üstünde */
--glass-bg-dark: rgba(20,28,48,.55);      /* lacivert/koyu zemin üstünde */
--glass-border:  rgba(255,255,255,.8);    /* koyuda .14 */
--glass-blur:    18px;                    /* backdrop-filter: blur(18px) saturate(1.4) */
--glass-shadow:  0 8px 24px rgba(11,19,38,.12);
```
Web'de `backdrop-filter` desteklenmeyen tarayıcıda `--glass-bg` opaklığı .92'ye çıkar. Native'de sistem `glassEffect` kullanılır, bu değerler yalnızca web içindir.

### Yüzen tab bar
- Tam genişlik değil: ortalanmış kapsül, yükseklik 56, yarıçap 28, kenarlardan 16px içeride, alttan 16px + safe‑area.
- 4 ikon (Hastalar, Kamera, Ajanda, Ayarlar), her biri 46×46 daire; seçili olan `--bg-inverse` dolgu + fildişi ikon, diğerleri `#8A8F9B`. Etiket yok.
- Sağında 10px boşlukla **arama adası**: 56×56 cam daire, büyüteç. Yalnızca arama olan ekranlarda (Hastalar, Ajanda, Fotoğraflar). Diğer ekranlarda ada yoktur; tab bar tek başına ortalanır.
- Aşağı kaydırırken tab bar küçülür (yalnızca seçili ikon kalır), yukarı kaydırınca açılır. Web'de isteğe bağlı; native'de sistem davranışı.
- İçeriğin alt 120px'i `linear-gradient(transparent → zemin .9)` ile solar; blur yok.

### Arama
- Üst başlık alanında arama **yok**. Ada'ya dokununca: klavye açılır, cam arama kapsülü (52px, yarıçap 26) klavyenin hemen üstüne yerleşir, sağında "Vazgeç". Tab bar bu sırada gizlenir.
- Liste yerinde filtrelenir; başlık alt satırı `"ka" için 2 sonuç` olur. Eşleşen harfler altı çizili.
- Kapatınca tab bar geri gelir, liste eski haline döner.

### Nav butonları (üst)
- Sol: geri, 40×40 cam daire. Sağ: aksiyonlar tek cam kapsülde gruplu (Ara · Düzenle · Menü), her buton 40×40, kapsül 40 yükseklik.
- Lacivert hero üstünde `--glass-bg-dark`, açık zeminde `--glass-bg`.
- Büyük başlık ("Hastalar", "Ajanda") sabit değil; içerikle kayar. Nav butonları sabit.

### Yüzen aksiyonlar (hasta kartı)
- Alt kenarda, tab bar yerine: dolu primary kapsül ("İşlem ekle", 56 yükseklik, `--bg-inverse`) + sağında 56×56 cam daireler (Kamera, Randevu). Hero'daki 4 buton kaldırıldı; hero yalnızca kimlik bilgisi taşır.
- Hasta kartı bir alt ekran olduğu için tab bar burada görünmez; geri ile listeye dönülür.

### Accessory rafı (fotoğraflar)
- Seçim modunda tab bar'ın üstünde, 52px cam kapsül: sol "2 seçili · Cephe", sağ dolu "Karşılaştır" (38px). Seçim yokken görünmez.
- Aynı raf ileride "yükleme sürüyor" gibi kalıcı durumlar için de kullanılır; aynı anda tek raf.

### Diğer etkiler
- Hastalar: üst sağda (+) cam daire; başlık altında arama çubuğu olmadığı için başlık alanı 60px kısalır.
- Ajanda: Liste/Takvim segment kontrolü kalır; **Geciken** bölümü en üstte `--warning-bg` kart.
- Fotoğraflar: dönem chip'leri (Tümü · Öncesi · 1. hafta · 1. ay…), ızgara **açıya göre** gruplu ("Cephe", "Sağ profil"), her grup dönem sırasıyla.
- Karanlık mod: cam değerleri `--glass-bg-dark` ailesinden; seçili tab dolgusu `--text` (fildişi), ikon `--bg-inverse`.
- Kilit ekranı, formlar, sheet'ler değişmez.

## 5B. Etkileşim kalıpları

Her madde için uygulanabilirlik: **W** = web'de tam, **W~** = web'de yaklaşık, **N** = native bekler.

### Liste etkileşimleri
- **Kaydırma aksiyonları** (W~): Hasta satırı sola → Ara · WhatsApp; sağa → Randevu ekle. Randevu satırı sola → Gelmedi; sağa → Geldi. Aksiyon zemini `--bg-subtle`, yıkıcı olan `--danger-bg`. Web'de touch olayıyla; native'de sistem swipeActions.
- **Uzun basma önizlemesi** (W~): Hastaya 400ms basınca alt sheet: küçük kart + aksiyonlar (Ara, Fotoğraf çek, Karşılaştır, Sil). Native'de context menu.
- **Geri al** (W): Silme, "gelmedi", randevu iptali gibi işlemler onay sormaz; işlem yapılır, altta 5 sn cam kapsül "Hasta silindi · Geri al". Kalıcı silme (30 gün sonrası) ve yedek üzerine yazma hâlâ onay ister.
- **Rehberden ekle** (W~): Yeni hasta formunda "Rehberden seç"; web'de Contact Picker API (iOS Safari destekli), native'de CNContactPicker.

### Sheet ve formlar
- **Kademeli sheet** (W~): Yeni hasta / randevu formu önce yarı yükseklikte (zorunlu alanlar: ad, telefon), yukarı çekince tam form. Web'de iki sabit yükseklik; native'de detents.
- **Akıllı klavye** (W): `inputmode="tel"` telefon, `type="date"` tarih, `autocapitalize="words"` ad. Klavye üstünde "Önceki / Sonraki" gezinme.
- **Türkçe ad düzeltme** (W): Baş harf büyütmede İ/ı, Ş/ş doğru; kaydederken baştaki/sondaki boşluk temizlenir.
- **Kaydet butonu** (W): Zorunlu alanlar dolana kadar pasif (`--text-tertiary`), dolunca `--primary`. Hata mesajı alanın altında, kırmızı metin, ikon yok.

### Fotoğraf ve karşılaştırma
- **Dönem şeridi** (W): Karşılaştırma ekranının altında yatay zaman çizgisi: Öncesi · 1h · 1a · 3a · 6a · 1y. Sol fotoğraf sabit (Öncesi), şeritte kaydırınca sağ fotoğraf değişir. Aynı açı yoksa nokta soluk.
- **Senkron zoom** (W): İki fotoğrafta pinch aynı anda; kaydırma da senkron.
- **Çift dokunuş** (W): Tam ekran; aşağı kaydırarak kapat.
- **Otomatik deklanşör** (N): Seviye ve yüz çerçevesi yeşilken 1 sn sonra çek; kapatılabilir.

### Sistem entegrasyonu
- **Ana ekran hızlı aksiyonları** (W~/N): İkona basılı tutunca Yeni hasta · Fotoğraf çek · Bugünün kontrolleri. Web'de manifest `shortcuts`; native'de UIApplicationShortcutItem.
- **Widget** (N): Küçük boy, bugünün kontrolleri; hasta adı yerine baş harfler.
- **Spotlight** (N): Hasta adı sistem aramasında; açılış kilitli.
- **Paylaşım** (W): Karşılaştırma görseli Web Share API ile doğrudan WhatsApp/Mail'e; anonim, EXIF'siz.

### Görsel ve his
- **Dynamic Type** (W): Tüm yazı boyutları `rem`; sistem yazı boyutuna uyar. Başlık 2 kademe büyüdüğünde düzen bozulmamalı.
- **Tabular rakamlar** (W): İstatistik ve tarih sütunlarında `font-variant-numeric: tabular-nums`.
- **Haptic** (N): Fotoğraf çekiminde hafif, kaydetmede yumuşak, hatada sert.
- **Ten tonu kuralı** (W): `#D9BFB0` yalnızca ikon ve küçük vurgu; asla metin veya buton dolgusu.
- **İlk açılış turu yok** (W): Boş durum metinleri yeterli.

### iPad'e hazırlık (şimdiden kural)
- Genişlik ≥ 768px: hasta listesi sol sütun (320px), kart sağda; kamera ve karşılaştırma tam ekran. Klavye: ⌘N yeni hasta, ⌘F ara, Esc kapat.

## 6. Hareket ve his

- Tüm geçişler 200–250ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`. `prefers-reduced-motion` saygı gösterilir.
- Ekran geçişi: iOS tarzı sağdan kayma (PWA'da CSS ile, native'de sistem). 
- Butona basınca `transform: scale(0.98)`, 100ms.
- Liste yüklenirken skeleton (`--bg-subtle` bloklar), spinner yok.
- Boş durumlar: Display yerine Title başlık + bir cümle + tek primary buton. Örn. "Henüz fotoğraf yok" / "İlk öncesi fotoğrafını ekle" / [Fotoğraf ekle].
- Native'e geçişte: haptic feedback (primary aksiyon ve PIN tuşları), safe-area insets, status bar hero rengiyle aynı.

## 7. Yapılmayacaklar

- Gri kenarlıklı kartlar, kart içinde kart
- Pastel renkli avatarlar, renkli badge'ler
- Her metnin önünde ikon
- Birden fazla dolu buton
- Karanlıkta hero'yu gövdeyle aynı renge çekmek veya saf siyah zemin
- Boş durumlarda illüstrasyon/emoji
- Cam üstüne cam (accessory rafı tab bar'a değmez, nav kapsülü içinde ikinci kapsül yok)
- İçerik katmanında cam (liste, kart, fotoğraf asla saydam değil)
- Tam genişlik tab bar
- 600+ font ağırlığı, BÜYÜK HARF etiket
- Gölge, gradient
- Alfabetik bölüm başlıkları (küçük listelerde)
- "Belirtilmedi" gibi uzun boş değer metinleri — sadece "—"

## 8. İkon

Uygulama simgesi: lacivert zemin (`#0B1326`) üzerinde iki fildişi halka (`#F5F4F0`), kesişim ten tonunda (`#D9BFB0`). Logo değil, uygulama simgesidir; arayüzde yalnızca şu yerlerde görünür: Hastalar başlığının üstünde 20px simge + "Curalis" (Label stili, ikincil renk), Ayarlar'ın en altındaki sürüm satırında 20px, kilit ekranında başlığın üstünde 56px, arka plan örtüsünde 72px.

- Tek kaynak `icons/icon.svg` (100×100 viewBox). PNG'ler ondan üretilir; değişiklik yalnızca SVG'de yapılır ve set yeniden çıkarılır.
- Set: `apple-touch-icon.png` 180, `icon-192.png`, `icon-512.png`, `icon-maskable-192.png` / `-512.png` (Android maskable, içerik %80 güvenli alana küçültülmüş, kaynak `icon-maskable.svg`), `icon-1024.png` (App Store / native), `favicon-32.png`.
- `index.html`: `icon` (svg + 32 png), `apple-touch-icon`, `manifest`, `theme-color #0B1326`, `apple-mobile-web-app-status-bar-style black-translucent`, `apple-mobile-web-app-title Curalis`. Yollar göreli (`icons/...`), başında `/` yok.
- `manifest.json`: `background_color` ve `theme_color` `#0B1326` (açılış ekranı lacivert, ikon → uygulama geçişi kesintisiz); `display: standalone`; normal + maskable ikonlar.
- iOS ana ekran ikonunu agresif önbellekler: ikon değişince service worker sürümü artırılır, telefonda eski kısayol silinip "Ana Ekrana Ekle" yeniden yapılır.
- Kontrol: "Ana Ekrana Ekle"de yeni ikon ve Curalis adı; köşeler iOS tarafından yuvarlanmış, kenarda beyaz çizgi yok; açılış ekranı lacivert; Safari sekme ikonu halkalar.

