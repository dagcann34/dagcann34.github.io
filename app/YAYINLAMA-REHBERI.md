# Blokko: App Store ve Google Play Yayın Rehberi

Oyun saf HTML/JS ile yazıldı (`../blokko`). [Capacitor 8](https://capacitorjs.com) ile iOS ve Android uygulamasına sarılıyor. iOS ve Android projeleri bu klasörde (`ios/`, `android/`) hazır durumda. İkonlar, splash ekranları, dikey ekran kilidi ve Apple şifreleme beyanı ayarlandı.

- **Web'de dene:** https://dagcann34.github.io/blokko/
- **Paket kimliği (Bundle ID):** `io.github.dagcann34.blokko`
- **Mağaza metinleri ve görseller:** `../store-assets/`

---

## 0. Tek seferlik kurulum (Mac)
```bash
cd app
npm install
npm run sync        # oyunu www/ içine kopyalar ve native projelere aktarır
```
> Oyunda (`blokko/` klasöründe) her değişiklikten sonra `npm run sync` çalıştırın.

---

## 1. 🍎 App Store (iOS)

**Gerekenler:** Mac, Xcode 26+, [Apple Developer Program](https://developer.apple.com/programs/) üyeliği (yıllık 99 $).

1. `npm run ios`: Xcode açılır.
2. Sol üstte **App** hedefi → **Signing & Capabilities** → *Team* olarak kendi hesabınızı seçin ("Automatically manage signing" açık kalsın).
3. Gerçek iPhone'u bağlayıp ▶︎ ile deneyin.
4. [App Store Connect](https://appstoreconnect.apple.com) → **Uygulamalar → +** → Yeni uygulama:
   - Ad: `Blokko: Renkli Blok Bulmaca`, birincil dil: Türkçe, Bundle ID: `io.github.dagcann34.blokko`, SKU: `blokko-001`.
   - Ad başkası tarafından alınmışsa `Blokko - Block Puzzle` gibi bir varyasyon deneyin.
5. Xcode → üst menü **Product → Archive** → Organizer açılınca **Distribute App → App Store Connect → Upload**.
6. App Store Connect'te doldurun (metinlerin hepsi `store-assets/MAGAZA-METINLERI.md` içinde):
   - Ekran görüntüleri: `store-assets/screenshots/appstore-6.7-tr-*.png` (İngilizce yerelleştirme için `-en-`).
   - **App Privacy:** "Data Not Collected" (Veri toplanmıyor).
   - **Age Rating:** anketin tamamına "None", sonuç 4+.
   - Gizlilik URL: `https://dagcann34.github.io/blokko/privacy.html`
   - Şifreleme sorusu Info.plist'te `ITSAppUsesNonExemptEncryption = NO` olarak yanıtlandı, ayrıca sorulmaz.
7. Yüklenen derlemeyi seçip **İncelemeye Gönder**. Genellikle 24-48 saatte sonuçlanır.

**İnceleme ipucu:** Uygulama reklamsız ve veri toplamıyor, internet gerektirmiyor, giriş istemiyor. Ret almak için bilinen bir neden yok.

---

## 2. 🤖 Google Play (Android)

**Gerekenler:** [Play Console](https://play.google.com/console) hesabı (tek seferlik 25 $), Android Studio.

1. `npm run android`: Android Studio açılır.
2. **Build → Generate Signed App Bundle / APK → Android App Bundle** → yeni bir *keystore* oluşturun.
   ⚠️ Keystore dosyasını ve şifresini **mutlaka yedekleyin**. Kaybederseniz güncelleme yükleyemezsiniz.
   (Play App Signing açık olduğu için Google asıl imzayı saklar; sizinki "upload key" olur.)
3. Çıkan `app-release.aab` dosyasını Play Console → **Uygulama oluştur** → *Test ve yayın → Üretim* → **Yeni sürüm** ekranına yükleyin.
4. Mağaza girişi: `MAGAZA-METINLERI.md` metinleri, `playstore-icon-512.png`, `playstore-feature-1024x500.png`, `screenshots/playstore-*.png`.
5. **Uygulama içeriği:** Gizlilik politikası URL'si, *Veri güvenliği* = "Veri toplanmıyor/paylaşılmıyor", *Reklam* = Hayır, *Hedef kitle* = 13+ veya "Herkes" (çocuklar dahil seçerseniz *Families* politikası uygulanır; uygulama zaten buna uygun).
6. ⚠️ **Yeni kişisel hesaplar** için Google, üretime çıkmadan önce **12 test kullanıcısıyla 14 gün kapalı test** istiyor. Önce *Kapalı test* parkuruna yükleyip arkadaşlarınızı ekleyin.

**Kolay test:** GitHub'a her push'ta *Actions → Blokko Android build* bir debug APK üretir. *Artifacts* altından indirip telefona kurabilirsiniz.

---

## 3. Sürüm güncelleme
- iOS: Xcode → App → General → *Version* (1.0.1) ve *Build* (2) artırın.
- Android: `android/app/build.gradle` → `versionCode` (+1) ve `versionName`.
- Sonra `npm run sync` ve yeniden Archive / Bundle.

## 4. İkonları yeniden üretmek
`../blokko/resources/` içindeki `icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png` dosyalarını değiştirip:
```bash
npm run assets
```

## 5. İleride reklam eklemek isterseniz (AdMob)
Sitenizde `app-ads.txt` zaten var. Oyunda "Yeni Parçalar (1 kez)" butonu, ödüllü reklam (*rewarded ad*) için hazır bir yer. `@capacitor-community/admob` eklentisiyle bu butona bağlanabilir. Reklam eklerseniz gizlilik politikasını ve mağaza veri beyanlarını güncellemeyi unutmayın.
