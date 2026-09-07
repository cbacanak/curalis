# Curalis — uygulama ikonu kurulum notu (Claude Code için)

Yeni ikon: lacivert zemin (#0B1326) üzerinde iki fildişi halka (#F5F4F0), kesişim ten tonunda (#D9BFB0). Mevcut turkuaz "+" ikonunun tüm izleri kaldırılacak.

## 1. Dosyalar

`icons/` klasörünü repo köküne kopyala (mevcut icons klasörü varsa içeriğini değiştir):

```
icons/
  icon.svg                 # kaynak, 100x100 viewBox
  icon-maskable.svg        # Android maskable için %80 güvenli alana küçültülmüş
  apple-touch-icon.png     # 180x180 — iOS ana ekran
  icon-192.png             # 192x192
  icon-512.png             # 512x512
  icon-maskable-192.png
  icon-maskable-512.png
  icon-1024.png            # ileride App Store / native için
  favicon-32.png
```

Boyutlar tek kaynaktan üretilir; ileride değişiklik gerekirse yalnızca `icon.svg` düzenlenip PNG'ler yeniden çıkarılır (Playwright, sharp, Inkscape vb.).

## 2. index.html `<head>`

Eski `apple-touch-icon`, `icon`, `theme-color` satırlarını sil, bunları ekle:

```html
<link rel="icon" type="image/svg+xml" href="icons/icon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="manifest" href="manifest.json">

<meta name="theme-color" content="#0B1326">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Curalis">
```

Yollar GitHub Pages alt dizinine göre (`/hasta-takip/`) göreli kalmalı; başına `/` koyma.

## 3. manifest.json

```json
{
  "name": "Curalis",
  "short_name": "Curalis",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#0B1326",
  "theme_color": "#0B1326",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

`background_color` açılış ekranında görünür; lacivert olması ana ekran ikonu → uygulama geçişini kesintisiz yapar.

## 4. Uygulama içi kullanım

- PIN ekranındaki kilit ikonu zaten kaldırılmıştı; istenirse aynı SVG (halkalar) "Curalis" başlığının üstünde 56px olarak kullanılabilir. Zorunlu değil.
- Ayarlar → en altta "Curalis · v0.x" satırının yanında 20px ikon. Başka yerde kullanılmaz; ikon logo değil, uygulama simgesidir.

## 5. Önbellek

iOS ana ekran ikonunu agresif önbellekler. Yayına aldıktan sonra:
1. Service worker varsa cache sürümünü artır.
2. Telefonda eski kısayolu sil, Safari'de sayfayı yenile, "Ana Ekrana Ekle"yi tekrar yap.

## 6. Kontrol listesi

- [ ] "Ana Ekrana Ekle" sayfasında yeni ikon görünüyor
- [ ] Ana ekranda ikon köşeleri iOS tarafından yuvarlanmış, kenarlarda beyaz çizgi yok
- [ ] Açılış ekranı lacivert (beyaz flaş yok)
- [ ] Safari sekme ikonu (favicon) lacivert halkalar
- [ ] Turkuaz "+" hiçbir yerde kalmadı
