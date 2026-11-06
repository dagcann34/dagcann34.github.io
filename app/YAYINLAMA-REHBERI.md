# Blokko: Yayın ve Kurulum Rehberi

Oyun saf HTML/JS ile yazıldı (`../blokko`). [Capacitor 8](https://capacitorjs.com) ile iOS ve Android uygulamasına sarılıyor.

| | |
|---|---|
| Web'de dene | https://dagcann34.github.io/blokko/ |
| Paket kimliği | `io.github.dagcann34.blokko` |
| Sunucu | Supabase projesi **blokko** (`kdxjikrykfppbiiycggc`, Frankfurt) |
| Tüm kimlikler tek yerde | `../blokko/config.js` |
| Mağaza metinleri, görseller, gizlilik formları | `../store-assets/` |

> **Durum:** Kod hazır. Reklamlar şu an **Google test reklamlarıyla** çalışıyor. Apple ve Google girişinin canlıya geçmesi için aşağıdaki 1–3. adımlarda sizin hesaplarınızda birkaç kimlik oluşturmanız gerekiyor. Her adım sonunda girdiğiniz değeri `config.js` dosyasına (ve belirtilen yerlere) yazmanız yeterli.

---

## 0. Kurulum (Mac)
```bash
cd app
npm install
npm run sync      # oyunu kopyalar, eklentileri iOS/Android'e bağlar
```
`blokko/` içinde her değişiklikten sonra `npm run sync` çalıştırın.

---

## 1. 💰 AdMob (reklamlar)

1. https://admob.google.com → **Uygulamalar → Uygulama ekle**: önce **iOS**, sonra **Android** için "Blokko" ekleyin. Uygulama mağazada henüz yoksa "Hayır, listelenmiyor" seçin; yayından sonra bağlarsınız.
2. Her iki uygulamada 2'şer reklam birimi oluşturun:
   - **Ödüllü (Rewarded)**: adı `blokko_rewarded`, ödül: `1 parca`.
   - **Geçiş (Interstitial)**: adı `blokko_interstitial`.
   - Banner **oluşturmayın**: oyun bilerek bannersız tasarlandı.
3. Kimlikleri yerleştirin:
   - `blokko/config.js` → `admob.ios` ve `admob.android` altındaki 4 reklam birimi kimliği. Ardından **`testing: false`** yapın.
   - iOS uygulama kimliği (`ca-app-pub-1885654505012842~…`) → `ios/App/App/Info.plist` içindeki `GADApplicationIdentifier`.
   - Android uygulama kimliği → `android/app/src/main/res/values/strings.xml` içindeki `admob_app_id`.
4. **Gizlilik ve mesajlaşma** → **GDPR mesajı** oluşturup yayımlayın (AEA/İngiltere onay ekranı). İsteğe bağlı olarak **ABD eyaletleri** mesajını da oluşturun. **IDFA açıklama mesajı** da oluşturun; ATT izninden önce gösterilir.
5. `app-ads.txt` sitenizde zaten var (`pub-1885654505012842`). Mağaza sayfalarındaki "Geliştirici web sitesi" alanına `https://dagcann34.github.io` yazın; AdMob bu dosyayı oradan doğrular.

### Reklam kurgusu (oyuncuyu sıkmayan)
| Reklam | Nerede | Kural |
|---|---|---|
| **Ödüllü** | Oyun bitince "Reklam izle: Yeni Parçalar" (oyuna devam) | Her oyunda 1 kez, tamamen isteğe bağlı |
| **Ödüllü** | 2. ve 3. geri alma (ilki her zaman ücretsiz) | Her oyunda en fazla 2 kez, önce onay sorulur |
| **Geçiş** | Yalnızca oyun bittikten sonra "Tekrar Oyna" veya "Ana Menü"ye basınca | İlk 3 oyunda hiç yok · en fazla 3 oyunda 1 · arada en az 3 dakika · ödüllü reklamdan sonra 2 dakika yok · 45 saniyeden kısa oyunlardan sonra yok · oturum başına en fazla 5 |

- Reklam yüklenemezse ödül yine verilir ("bu bizden hediye"). Oyuncu interneti yok diye cezalandırılmaz.
- Oyunun ortasında, menüde, günlük bulmacada veya banner olarak **asla** reklam yok.
- Tüm sayılar `config.js` → `admob.pacing` içinden değiştirilebilir. Gelir verisine göre ayar yapmak için önce 1-2 hafta bekleyin.

---

## 2. 🍎 Apple ile Giriş

**iOS'ta ek kimlik gerekmez.** Uygulamaya *Sign in with Apple* yetkisi (`App.entitlements`) eklendi.

1. https://developer.apple.com/account/resources/identifiers → `io.github.dagcann34.blokko` App ID'sinde **Sign In with Apple** kutusunu işaretleyin. Xcode'da "Automatically manage signing" açıksa bunu kendisi de yapar.
2. Supabase → **blokko** projesi → **Authentication → Sign In / Providers → Apple** → Enable.
   - **Client IDs** alanına `io.github.dagcann34.blokko` yazın.
   - Secret alanı yalnızca web/Android girişi için gerekir; iOS için boş bırakılabilir.
3. *(İsteğe bağlı: Apple ile Android'de giriş)*
   - Apple Developer'da bir **Services ID** oluşturun (ör. `io.github.dagcann34.blokko.signin`).
   - Return URL: `https://kdxjikrykfppbiiycggc.supabase.co/auth/v1/callback`.
   - Bir **Key** (Sign in with Apple) oluşturup Supabase'e girin.
   - Services ID'yi `config.js` → `apple.serviceId` alanına yazın. Bu adım yapılmazsa Android'de Apple butonu görünmez; bu sorun değil.

## 3. 🔵 Google ile Giriş

1. https://console.cloud.google.com → yeni proje "Blokko" → **Google Auth Platform → Branding**: uygulama adı, destek e-postası ve gizlilik politikası URL'sini girin. **Audience** sekmesinde *External* seçip yayımlayın.
2. **Clients → Create client** ile üç istemci oluşturun:
   - **Web application**: *Authorized redirect URIs* = `https://kdxjikrykfppbiiycggc.supabase.co/auth/v1/callback`. Bu istemcinin Client ID'si `config.js` → `google.webClientId` alanına girer.
   - **iOS**: Bundle ID `io.github.dagcann34.blokko`. Client ID'si `config.js` → `google.iOSClientId` alanına girer.
     - Ayrıca bu istemcinin **iOS URL scheme** değerini (`com.googleusercontent.apps.…`) `Info.plist` içindeki `com.googleusercontent.apps.REPLACE-WITH-IOS-CLIENT-ID` yerine yazın.
   - **Android**: Paket adı `io.github.dagcann34.blokko`, SHA-1 parmak izi gerekiyor.
     - Hata ayıklama SHA-1'i için: `cd android && ./gradlew signingReport`.
     - Play'e yükledikten sonra **Play Console → Uygulama bütünlüğü → Uygulama imzalama** sayfasındaki SHA-1 için **ikinci bir Android istemcisi** oluşturun.
3. Supabase → **Authentication → Sign In / Providers → Google** → Enable.
   - Client ID: Web istemcisi.
   - Secret: Web istemcisinin secret değeri.
   - **Authorized Client IDs**: web, iOS ve Android client ID'lerini virgülle ekleyin.
4. Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://dagcann34.github.io/blokko/`
   - Redirect URLs: `https://dagcann34.github.io/blokko/**` ekleyin. Bu, web sürümünde girişi sağlar.

`config.js`'te Google kimlikleri boş kaldıkça uygulamada Google butonu gizli kalır. Böylece eksik kurulum yüzünden Apple incelemesinden ret yemezsiniz.

---

## 4. 🍎 App Store'a gönderme

1. `npm run ios` → Xcode → **App** hedefi → **Signing & Capabilities**.
   - Team'i seçin.
   - **Sign in with Apple** yeteneği görünmüyorsa **+ Capability** ile ekleyin; dosya hazır.
2. Gerçek iPhone'da test edin: reklam onayı, izleme izni, Apple girişi, hesap silme.
3. **Product → Archive → Distribute App → App Store Connect**.
4. App Store Connect:
   - Metinler ve ekran görüntüleri: `store-assets/MAGAZA-METINLERI.md`, `store-assets/screenshots/`.
   - **App Privacy**: `MAGAZA-METINLERI.md` → "Gizlilik formları" tablosunu birebir girin.
   - **Privacy Policy URL**: `https://dagcann34.github.io/blokko/privacy.html`.
   - **License Agreement**: Standart Apple EULA (Kullanım koşullarımız buna atıf yapıyor).
   - **App Review notları**:
     > Sign-in is optional (Settings → Account). Account deletion: Settings → Account → Delete My Account. Ads: rewarded ads are opt-in; interstitials only between games after the 3rd game.
5. İncelemeye gönderin.

**Apple'ın kontrol ettiği kurallar ve karşılıkları:**
- 4.8: Google girişi varsa Apple girişi de var; Apple butonu üstte ve eşit büyüklükte.
- 5.1.1(v): Uygulama içi hesap silme var.
- 5.1.1: Giriş zorunlu değil.
- 5.1.2: ATT izni ve gizlilik manifesti (`PrivacyInfo.xcprivacy`) eklendi.

## 5. 🤖 Google Play'e gönderme

1. `npm run android` → **Build → Generate Signed App Bundle** → keystore oluşturun. ⚠️ Keystore'u ve şifresini **yedekleyin**.
2. Play Console → uygulama oluşturun → `.aab` dosyasını önce **Kapalı test** parkuruna yükleyin.
   - Yeni kişisel hesaplarda 12 test kullanıcısıyla 14 günlük test zorunlu.
3. **Uygulama içeriği**: gizlilik URL'si, *Reklam içeriyor: Evet*, *Veri güvenliği* ve *Hedef kitle: 13+* (`MAGAZA-METINLERI.md`'de hazır).
   - **Hesap silme URL'si**: `https://dagcann34.github.io/blokko/privacy.html#hesap-silme`. Google, hesap silme yolunu anlatan bir web sayfası istiyor; gizlilik politikasının 6. maddesi bunu karşılıyor.
4. Play imzalama SHA-1'ini Google Cloud'a ekleyin (3. adım). Yoksa Google girişi yalnızca debug sürümde çalışır.

---

## 6. Yayın öncesi kontrol listesi
- [ ] `config.js` → `admob.testing: false` ve gerçek reklam birimi kimlikleri
- [ ] `Info.plist` → gerçek `GADApplicationIdentifier` ve Google URL scheme
- [ ] `strings.xml` → gerçek `admob_app_id`
- [ ] Supabase'de Apple ve Google sağlayıcıları açık
- [ ] Gerçek cihazda: giriş → bulut eşitleme → sıralama → çıkış → yeniden giriş → hesap silme
- [ ] AB VPN'i ile reklam onay ekranı görünüyor mu?
- [ ] Sürüm numaraları: iOS *Version/Build*, Android `versionCode/versionName`

## 7. Teknik notlar
- **Veritabanı şeması:** `../supabase/migrations/`.
  - Tablolar: `profiles` (takma ad), `saves` (bulut kaydı), `scores`.
  - Her tabloda satır düzeyinde güvenlik var.
  - Sıralama `leaderboard()` fonksiyonuyla okunur; yalnızca takma ad ve puan döner.
- **Hesap silme:** `delete_my_account()` kullanıcıyı ve tüm verisini (cascade) siler.
- **Hile koruması:** Skorlar istemciden gönderiliyor. Sıralama büyürse sunucu tarafında doğrulama (Edge Function) eklenmesi önerilir.
- **İkonları yeniden üretmek:** `../blokko/resources/` içindeki dosyaları değiştirip `npm run assets`.
