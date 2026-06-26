// Локально (npm start) — ответы в data/rsvp.json
//
// На GitHub Pages — Google Таблицы (рекомендуется для России, без VPN)
// Настройка: google-apps-script/Code.gs
//
// Supabase — альтернатива, но может не работать с мобильного интернета в РФ

window.RSVP_CONFIG = (function () {
  var isLocal =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  if (isLocal) {
    return { storage: "local" };
  }

  return {
    storage: "google",
    google: {
      webAppUrl: "https://script.google.com/macros/s/ВАШ_ID/exec",
    },
  };

  // storage: "supabase" — если нужен Supabase вместо Google
  // supabase: {
  //   url: "https://xxxxx.supabase.co",
  //   anonKey: "eyJ...",
  // },
})();
