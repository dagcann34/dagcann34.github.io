/* Blokko configuration. Everything here is public-safe (no secrets). */
window.BLOKKO_CONFIG = {
  // Supabase (Apple/Google sign-in, cloud save, leaderboards). Publishable key is meant to ship in apps.
  supabaseUrl: 'https://kdxjikrykfppbiiycggc.supabase.co',
  supabaseKey: 'sb_publishable_fOyHNVMySpP07nkPDpN30Q_E57qb5xn',

  // Google Sign-In: create OAuth clients in Google Cloud Console (see app/YAYINLAMA-REHBERI.md).
  // Leave empty to hide the Google button.
  google: {
    webClientId: '623801010736-2g774hiv90o674raioncaoo3u38tlbqe.apps.googleusercontent.com',   // "Web application" client ID (also used by Android)
    iOSClientId: '623801010736-ru7k8835on84n6aunpj2jlttgevki68d.apps.googleusercontent.com',   // "iOS" client ID
  },
  // Sign in with Apple works on iOS with no extra IDs. On Android/web it needs a Services ID.
  apple: {
    serviceId: '',     // e.g. io.github.dagcann34.blokko.signin (only for Android/web)
  },

  // AdMob. testing:true uses Google's official test ads — switch to false only with your real IDs.
  admob: {
    testing: false,
    // Your own phones: they always get test ads, so you never click your own real ads (AdMob policy).
    // The ID is printed in Xcode / Logcat the first time an ad loads ("To get test ads on this device...").
    testDevices: [],
    ios: {
      interstitial: 'ca-app-pub-1885654505012842/3382707112',
      rewarded: 'ca-app-pub-1885654505012842/4695788782',
    },
    android: {
      interstitial: 'ca-app-pub-1885654505012842/7939018894',
      rewarded: 'ca-app-pub-1885654505012842/4701472307',
    },
    // Player-friendly pacing for interstitials.
    pacing: {
      graceGames: 3,          // no interstitials during a player's first 3 games ever
      everyNthGameOver: 3,    // at most one interstitial every 3 finished games
      minGapSec: 180,         // at least 3 minutes between interstitials
      afterRewardedSec: 120,  // never right after the player chose to watch a rewarded ad
      maxPerSession: 5,
      minGameSec: 45,         // skip if the game that just ended was very short
    },
  },

  privacyUrl: 'https://dagcann34.github.io/blokko/privacy.html',
  termsUrl: 'https://dagcann34.github.io/blokko/terms.html',
};
