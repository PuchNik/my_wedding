// Скопируйте в config.js для локальной разработки или настройте секреты в GitHub.
//
// Локально (npm start + server.js):
window.RSVP_CONFIG = {
  storage: "local",
};

// На GitHub Pages (ответы в Supabase — см. supabase/schema.sql):
// window.RSVP_CONFIG = {
//   storage: "supabase",
//   supabase: {
//     url: "https://ВАШ_ПРОЕКТ.supabase.co",
//     anonKey: "ВАШ_ANON_KEY",
//   },
// };
