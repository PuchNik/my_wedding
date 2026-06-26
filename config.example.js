// Локально (npm start) — ответы в data/rsvp.json
// На GitHub Pages — ответы в Supabase (см. supabase/schema.sql)
//
// Замените url и anonKey на данные из Supabase → Project Settings → API
// url — только Project URL, без /rest/v1 (например https://xxxxx.supabase.co)

window.RSVP_CONFIG = (function () {
  var isLocal =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  if (isLocal) {
    return { storage: "local" };
  }

  return {
    storage: "supabase",
    supabase: {
      url: "https://ВАШ_ПРОЕКТ.supabase.co",
      anonKey: "ВАШ_ANON_KEY",
    },
  };
})();
