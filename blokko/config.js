/* Blokko configuration. Everything here is public-safe (no secrets). */
window.BLOKKO_CONFIG = {
  // Supabase (Apple/Google sign-in, cloud save, leaderboards). Publishable key is meant to ship in apps.
  supabaseUrl: 'https://kdxjikrykfppbiiycggc.supabase.co',
  supabaseKey: 'sb_publishable_fOyHNVMySpP07nkPDpN30Q_E57qb5xn',

  // Google Sign-In: create OAuth clients in Google Cloud Console (see app/YAYINLAMA-REHBERI.md).
  // Leave empty to hide the Google button.
  google: {
    webClientId: '',   // "Web application" client ID (also used by Android)
    iOSClientId: '',   // "iOS" client ID
  },
  // Sign in with Apple works on iOS with no extra IDs. On Android/web it needs a Services ID.
  apple: {
    serviceId: '',     // e.g. io.github.dagcann34.blokko.signin (only for Android/web)
  },

  // AdMob. testing:true uses Google's official test ads — switch to false only with your real IDs.
  admob: {
    testing: true,
    ios: {
      interstitial: 'ca-app-pub-3940256099942544/4411468910',
      rewarded: 'ca-app-pub-3940256099942544/1712485313',
    },
    android: {
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
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
