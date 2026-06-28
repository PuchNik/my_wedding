"use strict";

/* ===== Wedding data ===== */
var wedding = {
  dateISO: "2026-09-25T00:00:00+03:00",
};

var schedule = [
  { time: "15:00", title: "Сбор гостей", desc: "Welcome-зона, лёгкие закуски и игристое в саду." },
  { time: "16:00", title: "Церемония", desc: "Выездная регистрация под открытым небом." },
  { time: "17:00", title: "Фуршет", desc: "Поздравления, фотографии и тёплые объятия." },
  { time: "18:30", title: "Банкет", desc: "Ужин, первый танец и тосты от близких." },
  { time: "22:00", title: "Вечеринка", desc: "Танцы до последнего гостя и праздничный салют." },
];

/* ===== Helpers ===== */
function el(tag, className, html) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

/* ===== Countdown ===== */
function initCountdown() {
  var root = document.getElementById("countdown");
  if (!root) return;
  var target = new Date(wedding.dateISO).getTime();
  var fields = {
    days: root.querySelector('[data-unit="days"]'),
    hours: root.querySelector('[data-unit="hours"]'),
    minutes: root.querySelector('[data-unit="minutes"]'),
    seconds: root.querySelector('[data-unit="seconds"]'),
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function tick() {
    var diff = Math.max(0, target - Date.now());
    var total = Math.floor(diff / 1000);
    fields.days.textContent = pad(Math.floor(total / 86400));
    fields.hours.textContent = pad(Math.floor((total % 86400) / 3600));
    fields.minutes.textContent = pad(Math.floor((total % 3600) / 60));
    fields.seconds.textContent = pad(total % 60);
  }

  tick();
  setInterval(tick, 1000);
}

/* ===== Schedule timeline ===== */
function initSchedule() {
  var list = document.getElementById("timeline");
  if (!list) return;

  schedule.forEach(function (event, i) {
    var item = el("li", "timeline-item");

    var marker = el("div", "timeline-marker");
    marker.appendChild(el("span", "timeline-dot"));
    if (i < schedule.length - 1) marker.appendChild(el("span", "timeline-line"));

    var content = el("div", "timeline-content");
    content.appendChild(el("span", "timeline-time", event.time));
    content.appendChild(el("h3", "timeline-title", event.title));
    content.appendChild(el("p", "timeline-desc", event.desc));

    item.appendChild(marker);
    item.appendChild(content);
    list.appendChild(item);
  });

  initTimelineReveal();
}

/* ===== RSVP form ===== */
function getSupabaseRsvpUrl(baseUrl) {
  var base = String(baseUrl).replace(/\/+$/, "").replace(/\/rest\/v1\/?$/, "");
  return base + "/rest/v1/rsvp";
}

function getRsvpErrorMessage(err) {
  var message = err && err.message ? err.message : "";

  if (
    message === "Load failed" ||
    message === "Failed to fetch" ||
    message.indexOf("NetworkError") !== -1 ||
    (err && err.name === "TypeError")
  ) {
    return "Не удалось отправить анкету. Проверьте интернет-соединение и попробуйте ещё раз.";
  }

  return message || "Не удалось отправить анкету. Попробуйте ещё раз.";
}

function saveRsvp(payload) {
  var config = window.RSVP_CONFIG || { storage: "local" };

  if (config.storage === "google") {
    if (!config.google || !config.google.webAppUrl) {
      return Promise.reject(new Error("Форма не настроена для приёма ответов"));
    }

    var body = new URLSearchParams({
      name: payload.name,
      attending: payload.attending,
      guests: String(payload.guests),
      comment: payload.comment,
    });

    return fetch(config.google.webAppUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
    });
  }

  if (config.storage === "supabase") {
    if (!config.supabase || !config.supabase.url || !config.supabase.anonKey) {
      return Promise.reject(new Error("Форма не настроена для приёма ответов"));
    }

    return fetch(getSupabaseRsvpUrl(config.supabase.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.supabase.anonKey,
        Authorization: "Bearer " + config.supabase.anonKey,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: payload.name,
        attending: payload.attending,
        guests: payload.guests,
        comment: payload.comment,
      }),
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function () {
          throw new Error("Не удалось отправить анкету");
        });
      }
    });
  }

  return fetch("/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(function (res) {
    return res.json().then(function (data) {
      if (!res.ok) throw new Error(data.error || "Не удалось отправить анкету");
      return data;
    });
  });
}

function initRsvp() {
  var form = document.getElementById("rsvp-form");
  if (!form) return;

  var choices = form.querySelectorAll(".choice");
  var extra = document.getElementById("attending-extra");
  var errorEl = document.getElementById("rsvp-error");
  var submitBtn = form.querySelector('button[type="submit"]');
  var attending = "yes";

  function setError(message) {
    if (!errorEl) return;
    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
  }

  choices.forEach(function (btn) {
    btn.addEventListener("click", function () {
      attending = btn.getAttribute("data-attending");
      choices.forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      extra.hidden = attending !== "yes";
      setError("");
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    var payload = {
      name: form.querySelector("#name").value.trim(),
      attending: attending === "yes" ? "будет" : "не будет",
      guests: attending === "yes" ? Number(form.querySelector("#guests").value) : 0,
      comment: form.querySelector("#note").value.trim(),
    };

    setError("");
    submitBtn.disabled = true;

    saveRsvp(payload)
      .then(function () {
        document.getElementById("rsvp-form-wrap").hidden = true;
        var success = document.getElementById("rsvp-success");
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function (err) {
        setError(getRsvpErrorMessage(err));
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
}

/* ===== Intro ===== */
function finishIntro(intro, site) {
  intro.classList.add("is-done");
  document.body.classList.remove("intro-active");
  document.body.classList.add("intro-complete");

  if (site) {
    site.removeAttribute("inert");
    site.removeAttribute("aria-hidden");
  }

  window.setTimeout(function () {
    intro.remove();
    initReveal();
  }, 800);
}

function skipIntro(intro, site) {
  if (intro) intro.remove();
  document.body.classList.remove("intro-active");
  document.body.classList.add("intro-complete");

  if (site) {
    site.removeAttribute("inert");
    site.removeAttribute("aria-hidden");
  }

  initReveal();
}

function initIntro() {
  var intro = document.getElementById("intro");
  var trigger = document.getElementById("intro-trigger");
  var site = document.getElementById("site-content");
  if (!intro || !trigger) {
    skipIntro(intro, site);
    return;
  }

  if (sessionStorage.getItem("weddingIntroSeen") === "1") {
    skipIntro(intro, site);
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    skipIntro(intro, site);
    return;
  }

  var carrier = intro.querySelector(".dove-carrier");
  var flyInDone = false;

  function markArrived() {
    if (flyInDone) return;
    flyInDone = true;
    intro.classList.remove("is-entering");
    intro.classList.add("is-arrived");
    trigger.disabled = false;
  }

  if (carrier) {
    carrier.addEventListener("animationend", function (event) {
      if (event.animationName === "dove-fly-in") {
        markArrived();
      }
    });
  }

  window.setTimeout(markArrived, 2600);

  trigger.addEventListener("click", function () {
    if (!intro.classList.contains("is-arrived") || intro.classList.contains("is-opening")) return;

    intro.classList.add("is-opening");
    trigger.disabled = true;

    var invitation = intro.querySelector(".intro-invitation");
    if (invitation) {
      invitation.removeAttribute("aria-hidden");
    }

    window.setTimeout(function () {
      intro.classList.add("is-revealing");
    }, 650);

    window.setTimeout(function () {
      sessionStorage.setItem("weddingIntroSeen", "1");
      finishIntro(intro, site);
    }, 2600);
  });
}

function runWhenIntroDone(fn) {
  if (
    document.body.classList.contains("intro-complete") ||
    !document.body.classList.contains("intro-active")
  ) {
    fn();
    return;
  }

  var bodyObserver = new MutationObserver(function () {
    if (!document.body.classList.contains("intro-complete")) return;
    bodyObserver.disconnect();
    fn();
  });

  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
}

function initTimelineReveal() {
  var timeline = document.getElementById("timeline");
  if (!timeline) return;

  var items = timeline.querySelectorAll(".timeline-item");
  if (!items.length) return;

  runWhenIntroDone(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -15% 0px" }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  });
}

function initDressCodePaletteReveal() {
  var palette = document.querySelector(".dress-code-palette");
  if (!palette) return;

  var colors = palette.querySelectorAll(".dress-code-color");
  if (!colors.length) return;

  runWhenIntroDone(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      colors.forEach(function (color) {
        color.classList.add("is-visible");
      });
      return;
    }

    function update() {
      var rect = palette.getBoundingClientRect();
      var vh = window.innerHeight;
      var revealStart = vh * 0.92;
      var revealEnd = vh * 0.35;
      var span = revealStart - revealEnd;
      if (span <= 0) return;

      var progress = (revealStart - rect.top) / span;
      progress = Math.max(0, Math.min(1, progress));
      var visibleCount = Math.ceil(progress * colors.length);

      colors.forEach(function (color, i) {
        if (i < visibleCount) color.classList.add("is-visible");
      });
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  });
}

function initCalendarReveal() {
  var section = document.querySelector(".calendar-section");
  if (!section) return;

  var card = section.querySelector(".calendar-card");
  var days = section.querySelectorAll(".calendar-day:not(.is-empty)");

  runWhenIntroDone(function () {
    function showAll() {
      section.classList.add("is-visible");
      if (card) card.classList.add("is-visible");
      days.forEach(function (day) {
        day.classList.add("is-visible");
      });
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      return;
    }

    if (!("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          section.classList.add("is-visible");
          sectionObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );
    sectionObserver.observe(section);

    if (card) {
      var cardObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            card.classList.add("is-visible");
            cardObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -15% 0px" }
      );
      cardObserver.observe(card);
    }

    var dayObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          dayObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -15% 0px" }
    );

    days.forEach(function (day) {
      dayObserver.observe(day);
    });
  });
}

function initScrollBlur() {
  var blur = document.querySelector(".site-scroll-blur");
  if (!blur) return;

  function update() {
    document.body.classList.toggle("is-scrolled", window.scrollY > 28);
  }

  runWhenIntroDone(function () {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  });
}

function initReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach(function (el) {
    observer.observe(el);
  });
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", function () {
  initIntro();
  initScrollBlur();
  initCountdown();
  initCalendarReveal();
  initSchedule();
  initDressCodePaletteReveal();
  initRsvp();
});
