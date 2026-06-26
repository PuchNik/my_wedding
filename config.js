window.RSVP_CONFIG = (function () {
  var isLocal =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  if (isLocal) {
    return { storage: "local" };
  }

  // Google Таблицы — стабильно работает в России без VPN
  return {
    storage: "google",
    google: {
      webAppUrl: "https://script.google.com/macros/s/AKfycbz2d03UmvOVdoplRWhopO6WVv7nJByM_NpgAKoWnklBoUkRNZCndpw_K818MP-OA29g/exec",
    },
  };
})();
