# Curalis — Geçiş Notu (Claude Code için)

Uygulamanın adı artık **Curalis**. Bu not, isim değişikliğini, repo yapısını ve sıradaki işleri tek yerde toplar. Detaylar ilgili dosyalarda: TASARIM.md (görsel dil), IKON.md (ikon), MOBIL.md (native plan).

---

## 1. Repo yapısı

İki ayrı repo. Web ile native kod paylaşmıyor; aynı repoda tutmak yalnızca karışıklık yaratır.

| Repo | İçerik | Yayın |
|---|---|---|
| `curalis` | Mevcut web/PWA (prototip + tasarım referansı) | GitHub Pages → `https://cbacanak.github.io/curalis/` |
| `curalis-ios` | SwiftUI native uygulama (iPhone → iPad/Mac → iCloud) | Xcode → cihaz; ileride TestFlight / App Store |

Ortak dosyalar (TASARIM.md, IKON.md, MOBIL.md, ikon SVG/PNG) **her iki repoda da** `docs/` altında durur; kaynak `curalis-ios/docs/`, web tarafı kopya. Bir değişiklik iki yere işlenir.

---

## 2. Web repo — yapılacaklar (`hasta-takip` → `curalis`)

1. GitHub'da repoyu **Rename** ile `curalis` yap. GitHub eski adı otomatik yönlendirir; Pages adresi `…/curalis/` olur.
2. Yerelde: `git remote set-url origin https://github.com/cbacanak/curalis.git`
3. Kod içinde eski yol/isim taraması: `hasta-takip`, `Hasta Takip`, `hastatakip` → `curalis` / `Curalis`. Özellikle:
   - `manifest.json`: `name`, `short_name`, `start_url`, `scope` (göreli `./` ise dokunma)
   - `index.html`: `<title>`, `apple-mobile-web-app-title`
   - Service worker cache adı (`curalis-v1`) — sürümü artır ki eski önbellek düşsün
   - PIN ekranı başlığı, Ayarlar > Hakkında satırı
4. IKON.md'yi uygula (ikon klasörü, `<head>`, manifest). Eski turkuaz "+" ikonu tamamen kaldır.
5. Yayın sonrası kontrol: yeni adres açılıyor, "Ana Ekrana Ekle"de isim **Curalis** ve yeni ikon görünüyor, eski adres yönlendiriyor.
6. `README.md`: tek paragraf — "Curalis web prototipi. Tasarım referansı; aktif geliştirme `curalis-ios` reposunda."
7. **Aktif geliştirme şimdilik bu repoda devam eder.** Native'e geçiş uygulama olgunlaşınca; tarih yok. Web'de olgunlaştırılacaklar MOBIL.md'den alınır, aşağıdaki kurala göre:
   - **Web'de yapılır** (native'e birebir taşınır): veri modeli (§2 — UUID, updatedAt, deletedAt, dönem/açı, onam, klinik uyarı, işlem şablonları, denetim kaydı), ekran akışları (§3), kontrol planı → otomatik randevu, geciken kontroller, karşılaştırma ekranı (3 mod), anonim paylaşım, şifreli yedek (§6), soft delete + 30 gün, arama/filtre, WhatsApp/arama kısayolları, boş durumlar.
   - **Web'de sınırlı yapılır** (native'de yeniden yazılır): kamera — `getUserMedia` ile ghost overlay ve açı seçici denenebilir, iOS Safari'de zoom/flaş kontrolü yok; Face ID — WebAuthn ile kaba bir sürüm; arka planda bulanıklaştırma — `visibilitychange` ile yaklaşık.
   - **Web'de yapılmaz** (native bekler): iOS Data Protection, gerçek Keychain, sistem takvimi yazma, iCloud senkron, haptic, geçiş animasyonları.
   - Kural: veri modeli MOBIL.md §2 ile birebir aynı alan adlarını kullansın; native'e geçişte yedek dosyası (`.htbackup` → JSON) doğrudan içe alınabilsin. Göç yolu = yedek al / geri yükle.

Telefonda: eski kısayolu sil, yeni adresi Safari'de aç, tekrar "Ana Ekrana Ekle".

---

## 3. Native repo — yapılacaklar (`curalis-ios`) — **henüz başlamaz**

Web olgunlaşıp kabul kriterleri (MOBIL.md §10, web'de uygulanabilir olanlar) sağlanınca başlar. O güne kadar bu bölüm bekler.

1. Boş repo aç: `curalis-ios`. İçine `docs/` (üç MD + ikon seti) ve `.gitignore` (Xcode şablonu).
2. Xcode'da yeni proje: **Curalis**, SwiftUI, SwiftData, iOS 17+.
   - Bundle ID: `com.<soyad>.curalis` — bir kez belirlenir, değişmez.
   - Team: şimdilik ücretsiz Apple ID (7 günde bir yeniden yükleme). Ücretli geçiş MOBIL.md §9.
   - Display name: Curalis.
3. `AppIcon` asset'ine `icon-1024.png` (IKON.md'deki set). iOS tek 1024 kaynak ister.
4. MOBIL.md sırasıyla:
   - §1 teknoloji, §2 veri modeli + Repository katmanı
   - §3 ekranlar: Kilit → Hastalar → Hasta kartı → Ajanda → Ayarlar
   - §4 kamera **ayrı adım**, onay sonrası
   - §5 güvenlik, §6 yedek
   - §10 kabul kriterleri karşılanınca v1.0
5. `CHANGELOG.md` ilk satır: `v0.1.0 — proje iskeleti, veri modeli, tema`.

---

## 4. Yapıldı (referans)

- Gece Laciverti teması: token'lar, açık/koyu mod, tüm ekranlar (TASARIM.md)
- Web sürümü v0.2.1 temayı uyguladı
- İkon: iki fildişi halka, ten tonu kesişim; SVG + PNG seti hazır (IKON.md)
- İsim: Curalis (Latince *cura* + *‑alis*, "bakıma ait")
- Native plan, veri modeli, sürüm yol haritası (MOBIL.md)
- Rakip analizi → v1'e giren özellikler: kendi kamera ekranı + ghost overlay, standart açı seti, dönem etiketi, fotoğraf onamı, işlem şablonları, klinik uyarı şeridi, anonim paylaşım

---

## 5. Sıra

1. Web repo rename + ikon + isim (yarım gün)
2. Web'de veri modelini MOBIL.md §2'ye getir (migrasyon: mevcut kayıtlar bozulmadan) — en önemli adım
3. Web'de v1 özellikleri, öncelik sırasıyla: işlem şablonları + kontrol planı → dönem/açı etiketi → karşılaştırma ekranı → fotoğraf onamı + klinik uyarı → şifreli yedek → soft delete → geciken kontroller → anonim paylaşım
4. Kamera denemesi (ghost overlay) — web'de ne kadar gidebildiğini gör
5. Birkaç hafta gerçek kullanım; akışta pürüz kalmayana kadar
6. Karar: `curalis-ios` başlar → §3
7. iPad/Mac düzeni (v1.1) → ücretli hesap → iCloud (v1.2)

Her adımda ekran görüntüsü alınır, tasarım dosyasıyla karşılaştırılır; sapma varsa önce dosya, sonra kod düzeltilir.
