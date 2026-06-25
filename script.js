"use strict";

/* ===== Wedding data ===== */
var wedding = {
  dateISO: "2026-09-25T15:00:00+03:00",
};

var schedule = [
  { time: "15:00", title: "Сбор гостей", desc: "Welcome-зона, лёгкие закуски и игристое в саду." },
  { time: "16:00", title: "Церемония", desc: "Выездная регистрация под открытым небом." },
  { time: "17:00", title: "Фуршет", desc: "Поздравления, фотографии и тёплые объятия." },
  { time: "18:30", title: "Банкет", desc: "Ужин, первый танец и тосты от близких." },
  { time: "22:00", title: "Вечеринка", desc: "Танцы до последнего гостя и праздничный салют." },
];

var faq = [
  {
    q: "Можно ли прийти с детьми?",
    a: "Мы очень любим детей, но хотим, чтобы этот вечер вы провели расслабленно. Если планируете прийти с малышом — напишите нам, мы всё организуем.",
  },
  {
    q: "Какой дресс-код?",
    a: "Пастельная и природная палитра: бежевый, терракотовый, оливковый, пыльно-розовый. Просим воздержаться от ярко-белого.",
  },
  {
    q: "Будет ли трансфер?",
    a: "Да, в 14:00 от станции метро будет организован автобус до усадьбы и обратно после праздника.",
  },
  {
    q: "Что дарить?",
    a: "Самый главный подарок — это вы рядом. Если хочется большего, мы будем благодарны за вклад в наше свадебное путешествие.",
  },
];

/* ===== Helpers ===== */
function el(tag, className, html) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

/* ===== Mobile menu ===== */
function initMenu() {
  var toggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("nav-mobile");
  if (!toggle || !nav) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    nav.hidden = !open;
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
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
}

/* ===== FAQ accordion ===== */
function initFaq() {
  var root = document.getElementById("accordion");
  if (!root) return;

  var plusIcon =
    '<svg class="accordion-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

  faq.forEach(function (item, i) {
    var wrap = el("div", "accordion-item" + (i === 0 ? " is-open" : ""));

    var trigger = el("button", "accordion-trigger");
    trigger.type = "button";
    trigger.setAttribute("aria-expanded", String(i === 0));
    trigger.innerHTML = '<span class="q">' + item.q + "</span>" + plusIcon;

    var panel = el("div", "accordion-panel");
    panel.appendChild(el("p", null, item.a));

    trigger.addEventListener("click", function () {
      var open = wrap.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(open));
    });

    wrap.appendChild(trigger);
    wrap.appendChild(panel);
    root.appendChild(wrap);
  });
}

/* ===== RSVP form ===== */
function initRsvp() {
  var form = document.getElementById("rsvp-form");
  if (!form) return;

  var choices = form.querySelectorAll(".choice");
  var extra = document.getElementById("attending-extra");
  var attending = "yes";

  choices.forEach(function (btn) {
    btn.addEventListener("click", function () {
      attending = btn.getAttribute("data-attending");
      choices.forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      extra.hidden = attending !== "yes";
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    document.getElementById("rsvp-form-wrap").hidden = true;
    var success = document.getElementById("rsvp-success");
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", function () {
  initMenu();
  initCountdown();
  initSchedule();
  initFaq();
  initRsvp();
});
