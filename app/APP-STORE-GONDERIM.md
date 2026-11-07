# Blokko 1.0: App Store gönderimi (Mac + Xcode)

Toplam süre yaklaşık 45 dakika. İnceleme genellikle 24-48 saat sürer.

## A. Mac'te derleme ve yükleme (yaklaşık 15 dk)

1. Gerekenler: Xcode 26 veya üzeri, Node.js 20 veya üzeri. Xcode'da **Settings → Accounts** bölümünde Apple ID'niz ekli olmalı.
2. Projeyi indirin ve hazırlayın:
   ```bash
   git clone https://github.com/dagcann34/dagcann34.github.io.git
   cd dagcann34.github.io/app
   npm install
   npm run sync
   npx cap open ios
   ```
   (Projeyi daha önce klonladıysanız: `git pull` ardından `cd app && npm install && npm run sync && npx cap open ios`)
3. Xcode'da sol panelde **App** → **TARGETS: App** → **Signing & Capabilities**:
   - **Automatically manage signing** açık olsun, **Team** olarak hesabınızı seçin.
   - Listede **Sign in with Apple** görünmüyorsa **+ Capability** ile ekleyin.
4. **General** sekmesi: *Version* `1.0`, *Build* `1`.
5. Üst çubukta cihaz olarak **Any iOS Device (arm64)** seçin.
6. **Product → Archive**. Bitince Organizer açılır.
7. **Distribute App → App Store Connect → Distribute**.
8. Yükleme bitince App Store Connect'e e-posta gelir. Derlemenin "Processing" aşamasından çıkması 10-30 dakika sürer.

> **İsteğe bağlı ama önerilir:** Önce **TestFlight** sekmesinden kendinize test daveti gönderin ve gerçek iPhone'da şunları deneyin:
> - Reklam onay ekranı ve izleme izni
> - Apple ile giriş ve Google ile giriş
> - Ayarlar → Hesap → Hesabımı Sil
>
> TestFlight sürümünde AdMob test reklamı gösterir; yine de kendi reklamlarınıza dokunmayın.

## B. App Store Connect'te uygulama kaydı (yaklaşık 5 dk)

https://appstoreconnect.apple.com → **Uygulamalar → + → Yeni Uygulama**

| Alan | Değer |
|---|---|
| Platform | iOS |
| Ad | `Blokko: Renkli Blok Bulmaca` (alınmışsa `Blokko - Block Puzzle`) |
| Birincil dil | Türkçe |
| Paket Kimliği | `io.github.dagcann34.blokko` (listede yoksa önce A adımındaki Archive'ı yapın; Xcode kaydeder) |
| SKU | `blokko-001` |
| Kullanıcı erişimi | Tam erişim |

## C. Mağaza sayfası (yaklaşık 15 dk)

Tüm metinler `store-assets/MAGAZA-METINLERI.md` dosyasında. Önce **Türkçe**yi doldurun, sonra sağ üstten **İngilizce (ABD)** dilini ekleyip İngilizce metinleri girin.

**1.0 Sürüm sayfası:**
- **Ekran görüntüleri:**
  - **iPhone 6.9"**: `store-assets/screenshots/appstore-6.7-tr-1-menu.png` … `-5-badges.png` (5 adet, 1290×2796; bu boyut 6.9" alanına kabul edilir)
  - **iPad 13"**: `store-assets/screenshots/appstore-ipad-13-tr-*.png` (5 adet, 2064×2752)
  - İngilizce için aynı dosyaların `-en-` olanları
- **Tanıtım metni** (170 karakter):
  - TR: `Şeker renkli blokları diz, satırları patlat, kombo yap! Günün bulmacası, 14 rozet ve dünya sıralamasıyla her gün yeni bir meydan okuma.`
  - EN: `Drop candy-colored blocks, pop lines and chain combos! A new Daily Puzzle, 14 badges and a world ranking give you a fresh challenge every day.`
- **Açıklama, Anahtar kelimeler, Alt başlık**: `MAGAZA-METINLERI.md`
- **Destek URL'si**: `https://dagcann34.github.io/blokko/`
- **Pazarlama URL'si**: `https://dagcann34.github.io/blokko/`
- **Telif hakkı**: `2026 Dağcan Nural`
- **Derleme**: Yüklediğiniz 1.0 (1) derlemesini seçin. Şifreleme sorusu çıkmaz, Info.plist'te yanıtlı.

**Uygulama Bilgileri (sol menü):**
- Kategori: **Oyunlar**; alt kategoriler: **Bulmaca**, **Gündelik**
- İçerik hakları: "Üçüncü taraf içeriği içermiyor"
- **Yaş Derecelendirmesi**: anketteki tüm sorulara "Hiç/Hayır" yanıtını verin. Sonuç **4+** olmalı. "Made for Kids" seçeneğini **işaretlemeyin** (reklam ve hesap var).
- **Gizlilik Politikası URL'si**: `https://dagcann34.github.io/blokko/privacy.html`

**Uygulama Gizliliği (sol menü):** `MAGAZA-METINLERI.md` → "Gizlilik formları" tablosunu birebir girin. Özet:
- Email Address, User ID, Gameplay Content: kimliğe bağlı, izleme yok, amaç App Functionality.
- Device ID, Advertising Data: kimliğe bağlı değil, **izleme var**, amaç Third-Party Advertising.
- Product Interaction, Coarse Location: kimliğe bağlı değil, izleme yok, amaç Third-Party Advertising.

**Fiyatlandırma ve Erişilebilirlik:** Ücretsiz, tüm ülkeler.

## D. İnceleme bilgileri

- **Oturum açma gerekli mi?** Hayır (işareti kaldırın). Giriş isteğe bağlı olduğu için demo hesap gerekmez.
- **İletişim bilgileri:** adınız, telefon, e-posta.
- **Notlar** (İngilizce yapıştırın):

```
Blokko is a casual block puzzle. No account is required to play.

Sign-in (optional): Settings (gear icon) → Account → "Sign in with Apple" or "Sign in with Google".
Signing in only enables cloud save and the world ranking (Trophies → Ranking).
Account deletion: Settings → Account → "Delete My Account" (permanently deletes the account and all cloud data).

Ads (Google AdMob): the consent form (UMP) and App Tracking Transparency prompt appear on first launch.
Rewarded ads are optional (game-over "Watch ad: New Pieces", and the 2nd/3rd undo).
Interstitial ads only appear between games, never during play, and not in a player's first 3 games.
Ad privacy choices can be reopened from Settings → Privacy & Legal.

Privacy policy: https://dagcann34.github.io/blokko/privacy.html
```

- **Sürüm yayını:** "Bu sürümü onaydan sonra otomatik yayınla" önerilir.

Sonra **İncelemeye Ekle → İncelemeye Gönder**.

## E. Ret gelirse

Sık görülen nedenler ve çözümleri:

| Kural | Durum |
|---|---|
| **4.8 Login Services** | Apple girişi zaten var. |
| **5.1.1(v) Account Deletion** | Uygulama içinde mevcut; notlarda yolu yazıyor. |
| **2.1 Performans** | İnceleyici reklam göremezse sorun değil; yeni reklam birimleri ilk saatlerde az reklam gösterir. |
| **4.3 Spam (benzer oyun)** | Oyun özgün adı, maskotu, günlük bulmaca, rozet ve sıralama özellikleriyle farklılaşıyor. Gerekirse yanıtta bunları belirtin. |
| **5.1.2 ATT** | İzleme izni metni ve gizlilik manifesti mevcut. |

Ret mesajını bana yapıştırın, birlikte çözelim.
