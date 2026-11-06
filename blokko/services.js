/* Blokko services: ads (AdMob), sign-in (Apple/Google via Supabase), cloud save and leaderboards.
   Every feature degrades gracefully: on the web, offline, or before IDs are configured, the game still works. */
(() => {
'use strict';
const C = window.BLOKKO_CONFIG || {};
const Cap = window.Capacitor;
const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
const platform = Cap && Cap.getPlatform ? Cap.getPlatform() : 'web';
const P = (Cap && Cap.Plugins) || {};
const now = () => Date.now();

function loadState(k, d) { try { return Object.assign(d, JSON.parse(localStorage.getItem(k)) || {}); } catch (e) { return d; } }
function saveState(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

// =====================================================================
// ADS
// =====================================================================
const ads = (() => {
  const A = P.AdMob;
  const ids = (C.admob && C.admob[platform]) || {};
  const pace = Object.assign({ graceGames: 3, everyNthGameOver: 3, minGapSec: 180, afterRewardedSec: 120, maxPerSession: 5, minGameSec: 45 }, C.admob && C.admob.pacing);
  const st = loadState('blokko.ads', { gameOvers: 0, sinceInt: 0, lastInt: 0, lastRew: 0 });
  let ready = false, canRequest = false, npa = false, sessionInts = 0;
  let intLoaded = false, rewLoaded = false, privacyRequired = false;
  const enabled = isNative && !!A;

  async function init() {
    if (!enabled) return;
    try {
      // 1) Google UMP consent (GDPR/EEA, UK, Switzerland, US states)
      let info = await A.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await A.showConsentForm();
      canRequest = info.canRequestAds !== false;
      privacyRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';
      // 2) Apple App Tracking Transparency (iOS 14.5+), asked once, after UMP
      if (platform === 'ios') {
        let s = (await A.trackingAuthorizationStatus()).status;
        if (s === 'notDetermined') { await A.requestTrackingAuthorization(); s = (await A.trackingAuthorizationStatus()).status; }
        npa = s !== 'authorized';
      }
      await A.initialize({ initializeForTesting: !!C.admob.testing, maxAdContentRating: 'General', tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false });
      ready = canRequest;
      A.addListener('interstitialAdDismissed', () => { intLoaded = false; preloadInterstitial(); });
      A.addListener('interstitialAdFailedToShow', () => { intLoaded = false; preloadInterstitial(); });
      preloadInterstitial(); preloadRewarded();
    } catch (e) { console.warn('[ads] init failed', e); }
  }
  function opts(adId) { return { adId, isTesting: !!C.admob.testing, npa }; }
  async function preloadInterstitial() {
    if (!ready || intLoaded || !ids.interstitial) return;
    try { await A.prepareInterstitial(opts(ids.interstitial)); intLoaded = true; } catch (e) { intLoaded = false; }
  }
  async function preloadRewarded() {
    if (!ready || rewLoaded || !ids.rewarded) return;
    try { await A.prepareRewardVideoAd(opts(ids.rewarded)); rewLoaded = true; } catch (e) { rewLoaded = false; }
  }

  /** Rewarded ad, always opt-in. Resolves 'rewarded' | 'skipped' | 'unavailable'. */
  function showRewarded() {
    if (!ready) return Promise.resolve('unavailable');
    return new Promise(async resolve => {
      if (!rewLoaded) { await preloadRewarded(); if (!rewLoaded) return resolve('unavailable'); }
      let got = false; const hs = [];
      const done = async res => { for (const h of hs) (await h).remove(); rewLoaded = false; st.lastRew = now(); saveState('blokko.ads', st); preloadRewarded(); resolve(res); };
      hs.push(A.addListener('onRewardedVideoAdReward', () => { got = true; }));
      hs.push(A.addListener('onRewardedVideoAdDismissed', () => done(got ? 'rewarded' : 'skipped')));
      hs.push(A.addListener('onRewardedVideoAdFailedToShow', () => done('unavailable')));
      A.showRewardVideoAd().catch(() => done('unavailable'));
    });
  }

  /** Called on every game over; decides whether an interstitial is polite right now. */
  function noteGameOver(gameSec) {
    st.gameOvers++; st.sinceInt++; saveState('blokko.ads', st);
    st.lastGameSec = gameSec;
  }
  async function maybeInterstitial() {
    if (!ready || !intLoaded) return false;
    const t = now();
    const ok = st.gameOvers > pace.graceGames
      && st.sinceInt >= pace.everyNthGameOver
      && t - st.lastInt >= pace.minGapSec * 1000
      && t - st.lastRew >= pace.afterRewardedSec * 1000
      && sessionInts < pace.maxPerSession
      && (st.lastGameSec || 0) >= pace.minGameSec;
    if (!ok) return false;
    try {
      await new Promise(async (res) => {
        const h = await A.addListener('interstitialAdDismissed', () => { h.remove(); res(); });
        A.showInterstitial().catch(() => { h.remove(); res(); });
      });
      st.lastInt = now(); st.sinceInt = 0; sessionInts++; saveState('blokko.ads', st);
      return true;
    } catch (e) { return false; }
  }
  async function showPrivacyOptions() { if (enabled) { try { await A.showPrivacyOptionsForm(); } catch (e) {} } }

  return { init, showRewarded, noteGameOver, maybeInterstitial, showPrivacyOptions,
    get enabled() { return enabled; }, get privacyOptionsRequired() { return privacyRequired; } };
})();

// =====================================================================
// ACCOUNT + CLOUD (Supabase)
// =====================================================================
const account = (() => {
  const SB = window.supabase && C.supabaseUrl && C.supabaseKey
    ? window.supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !isNative, flowType: 'pkce' } })
    : null;
  const SL = P.SocialLogin;
  let user = null, profile = null;
  const listeners = new Set();
  const emit = () => listeners.forEach(f => { try { f(user, profile); } catch (e) {} });

  const providers = () => {
    const g = !!(C.google && C.google.webClientId && (platform !== 'ios' || C.google.iOSClientId));
    const a = platform === 'ios' || !!(C.apple && C.apple.serviceId) || !isNative;
    return { apple: !!SB && a, google: !!SB && (g || !isNative) };
  };

  async function init() {
    if (!SB) return;
    if (isNative && SL) {
      const opt = {};
      if (C.google && C.google.webClientId) opt.google = { webClientId: C.google.webClientId, iOSClientId: C.google.iOSClientId || undefined, iOSServerClientId: C.google.webClientId, mode: 'online' };
      if (platform === 'ios') opt.apple = { clientId: '', redirectUrl: '' };
      else if (C.apple && C.apple.serviceId) opt.apple = { clientId: C.apple.serviceId, useBroadcastChannel: true };
      try { await SL.initialize(opt); } catch (e) { console.warn('[auth] SocialLogin.initialize', e); }
    }
    SB.auth.onAuthStateChange((_e, session) => { const u = session ? session.user : null; if ((u && u.id) !== (user && user.id)) { user = u; loadProfile(); } });
    const { data } = await SB.auth.getSession();
    user = data.session ? data.session.user : null;
    await loadProfile();
  }
  async function loadProfile() {
    profile = null;
    if (user) { const { data } = await SB.from('profiles').select('nickname').eq('id', user.id).maybeSingle(); profile = data; }
    emit();
  }

  async function sha256hex(s) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  function randomNonce() { const a = new Uint8Array(24); crypto.getRandomValues(a); return [...a].map(x => x.toString(16).padStart(2, '0')).join(''); }

  /** provider: 'apple' | 'google' */
  async function signIn(provider) {
    if (!SB) throw new Error('offline');
    if (isNative && SL) {
      const raw = randomNonce(), hashed = await sha256hex(raw);
      const options = provider === 'apple' ? { scopes: ['email'], nonce: hashed } : { nonce: hashed };
      const res = await SL.login({ provider, options });
      const token = res && res.result && res.result.idToken;
      if (!token) throw new Error('no token');
      const { error } = await SB.auth.signInWithIdToken({ provider, token, nonce: raw });
      if (error) throw error;
    } else {
      const { error } = await SB.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } });
      if (error) throw error;
    }
  }
  async function signOut() {
    if (!SB) return;
    if (isNative && SL) { for (const p of ['apple', 'google']) { try { await SL.logout({ provider: p }); } catch (e) {} } }
    await SB.auth.signOut();
  }
  /** Permanently deletes the account and all its cloud data (App Store 5.1.1(v)). */
  async function deleteAccount() {
    if (!SB || !user) return;
    const { error } = await SB.rpc('delete_my_account');
    if (error) throw error;
    await signOut();
  }
  async function setNickname(n) {
    n = String(n || '').trim().slice(0, 20);
    if (!user || n.length < 3) throw new Error('short');
    const { error } = await SB.from('profiles').update({ nickname: n }).eq('id', user.id);
    if (error) throw error;
    profile = { nickname: n }; emit();
  }

  // ----- cloud save -----
  async function pull() {
    if (!user) return null;
    const { data } = await SB.from('saves').select('data,updated_at').eq('user_id', user.id).maybeSingle();
    return data ? data.data : null;
  }
  let pushTimer = null, pending = null;
  function push(data) {
    if (!user) return;
    pending = data; clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      const d = pending; pending = null;
      try { await SB.from('saves').upsert({ user_id: user.id, data: d, updated_at: new Date().toISOString() }); } catch (e) {}
    }, 2500);
  }
  async function submitScore(mode, day, score) {
    if (!user || !score) return;
    try { await SB.from('scores').insert({ user_id: user.id, mode, day: mode === 'daily' ? day : null, score }); } catch (e) {}
  }
  async function leaderboard(mode, day, period) {
    if (!SB) return null;
    const { data, error } = await SB.rpc('leaderboard', { p_mode: mode, p_day: day || null, p_period: period || 'all', p_limit: 50 });
    if (error) throw error;
    return data;
  }

  return { init, signIn, signOut, deleteAccount, setNickname, pull, push, submitScore, leaderboard, providers,
    onChange: f => { listeners.add(f); f(user, profile); },
    get user() { return user; }, get profile() { return profile; }, get available() { return !!SB; } };
})();

window.BKS = { ads, account, isNative, platform,
  openUrl(url) { if (isNative && P.Browser) P.Browser.open({ url }); else window.open(url, '_blank', 'noopener'); } };

document.addEventListener('DOMContentLoaded', () => {
  account.init().catch(e => console.warn('[auth] init', e));
  // Ads start a moment after launch so the first frame and the menu are never delayed.
  setTimeout(() => ads.init(), 1500);
});
})();
