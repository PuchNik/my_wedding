/**
 * RSVP для свадебного сайта
 *
 * Настройка (один раз):
 * 1. Создайте Google Таблицу
 * 2. Расширения → Apps Script → вставьте этот код
 * 3. Развернуть → Новое развертывание → Веб-приложение
 *    - Запуск от имени: «Я»
 *    - Доступ: «Все»
 * 4. Скопируйте URL (…/exec) в config.js → google.webAppUrl
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
  return jsonResponse_({ ok: true });
}

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  return handleRequest_(e);
}
