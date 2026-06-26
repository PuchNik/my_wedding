window.RSVP_CONFIG = (function () {
  var isLocal =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  if (isLocal) {
    return { storage: "local" };
  }

  return {
    storage: "supabase",
    supabase: {
      url: "https://pqqnkgivppdiyndryuxh.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcW5rZ2l2cHBkaXluZHJ5dXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTQ3MjYsImV4cCI6MjA5ODA3MDcyNn0.WVa_ZaTR6AkwhnVWZKQSGvnC0X93GyMkEavQLTERAvI",
    },
  };
})();
