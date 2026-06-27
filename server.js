"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const RSVP_PATH = path.join(ROOT, "data", "rsvp.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
};

function readRsvp() {
  try {
    const raw = fs.readFileSync(RSVP_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

function writeRsvp(entries) {
  fs.mkdirSync(path.dirname(RSVP_PATH), { recursive: true });
  fs.writeFileSync(RSVP_PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function handleRsvpPost(req, res) {
  let body = "";
  req.on("data", function (chunk) {
    body += chunk;
    if (body.length > 1e6) req.destroy();
  });

  req.on("end", function () {
    try {
      const payload = JSON.parse(body);
      const name = String(payload.name || "").trim();
      const attending = payload.attending;
      const guests = Number(payload.guests);
      const comment = String(payload.comment || "").trim();

      if (!name) {
        sendJson(res, 400, { error: "Укажите имя и фамилию" });
        return;
      }

      if (attending !== "будет" && attending !== "не будет") {
        sendJson(res, 400, { error: "Укажите, сможете ли вы прийти" });
        return;
      }

      if (attending === "будет" && (!Number.isInteger(guests) || guests < 1 || guests > 4)) {
        sendJson(res, 400, { error: "Укажите количество гостей от 1 до 4" });
        return;
      }

      const entry = {
        name: name,
        attending: attending,
        guests: attending === "будет" ? guests : 0,
        comment: comment,
        submittedAt: new Date().toISOString(),
      };

      const entries = readRsvp();
      entries.push(entry);
      writeRsvp(entries);
      sendJson(res, 201, { ok: true });
    } catch (err) {
      sendJson(res, 500, { error: "Не удалось сохранить ответ" });
    }
  });
}

const server = http.createServer(function (req, res) {
  if (req.method === "POST" && req.url === "/api/rsvp") {
    handleRsvpPost(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(PORT, function () {
  console.log("Server running at http://localhost:" + PORT);
});
