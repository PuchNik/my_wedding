/**
 * RSVP для свадебного сайта + уведомления в Telegram
 *
 * Настройка Google Таблицы:
 * 1. Создайте Google Таблицу
 * 2. Расширения → Apps Script → вставьте этот код
 * 3. Развернуть → Новое развертывание → Веб-приложение
 *    - Запуск от имени: «Я»
 *    - Доступ: «Все»
 * 4. Скопируйте URL (…/exec) в config.js → google.webAppUrl
 *
 * Настройка Telegram (опционально):
 * 1. В Telegram откройте @BotFather → /newbot → скопируйте токен бота
 * 2. Напишите боту любое сообщение
 * 3. В Apps Script запустите функцию getTelegramChatId() → Разрешения → смотрите chat_id в логах
 * 4. Запустите saveTelegramSettings() один раз (подставьте токен и chat_id), затем удалите их из кода
 *    Или: Проект → Настройки → Свойства скрипта → добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID
 */

function setupSheet_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Дата", "Имя и фамилия", "Присутствие", "Гостей", "Комментарий"]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
  }
}

function parsePayload_(e) {
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return e.parameter || {};
    }
  }
  return e.parameter || {};
}

function validatePayload_(payload) {
  var name = String(payload.name || "").trim();
  var attending = String(payload.attending || "").trim();
  var guests = Number(payload.guests);
  var comment = String(payload.comment || "").trim();

  if (!name) {
    return { error: "Укажите имя и фамилию" };
  }

  if (attending !== "будет" && attending !== "не будет") {
    return { error: "Укажите, сможете ли вы прийти" };
  }

  if (attending === "будет" && (!Number.isInteger(guests) || guests < 1 || guests > 4)) {
    return { error: "Укажите количество гостей от 1 до 4" };
  }

  return {
    entry: {
      name: name,
      attending: attending,
      guests: attending === "будет" ? guests : 0,
      comment: comment,
    },
  };
}

function saveEntry_(entry) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  setupSheet_(sheet);
  sheet.appendRow([
    new Date().toISOString(),
    entry.name,
    entry.attending,
    entry.guests,
    entry.comment,
  ]);
}

function guestLabel_(count) {
  var mod10 = count % 10;
  var mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "гостей";
  if (mod10 === 1) return "гость";
  if (mod10 >= 2 && mod10 <= 4) return "гостя";
  return "гостей";
}

function formatTelegramMessage_(entry) {
  var lines = ["💌 Новая анкета RSVP", "", "👤 " + entry.name];

  if (entry.attending === "будет") {
    lines.push("✅ Будет · " + entry.guests + " " + guestLabel_(entry.guests));
  } else {
    lines.push("❌ Не будет");
  }

  if (entry.comment) {
    lines.push("💬 " + entry.comment);
  }

  return lines.join("\n");
}

function sendTelegram_(entry) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("TELEGRAM_BOT_TOKEN");
  var chatId = props.getProperty("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    return;
  }

  var url = "https://api.telegram.org/bot" + token + "/sendMessage";
  var response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: chatId,
      text: formatTelegramMessage_(entry),
      disable_web_page_preview: true,
    }),
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    console.error("Telegram error: " + response.getContentText());
  }
}

/**
 * Один раз: подставьте токен и chat_id, запустите, затем удалите значения из этой функции.
 */
function saveTelegramSettings() {
  PropertiesService.getScriptProperties().setProperties({
    TELEGRAM_BOT_TOKEN: "ВСТАВЬТЕ_ТОКЕН_БОТА",
    TELEGRAM_CHAT_ID: "ВСТАВЬТЕ_CHAT_ID",
  });
}

/**
 * После сообщения боту: запустите и посмотрите chat_id в Журнале выполнения.
 */
function getTelegramChatId() {
  var token = PropertiesService.getScriptProperties().getProperty("TELEGRAM_BOT_TOKEN");
  if (!token) {
    throw new Error("Сначала сохраните TELEGRAM_BOT_TOKEN через saveTelegramSettings()");
  }

  var response = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/getUpdates");
  Logger.log(response.getContentText());
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function handleRequest_(e) {
  var result = validatePayload_(parsePayload_(e));
  if (result.error) {
    return jsonResponse_({ error: result.error });
  }

  saveEntry_(result.entry);
  sendTelegram_(result.entry);
  return jsonResponse_({ ok: true });
}

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  return handleRequest_(e);
}
