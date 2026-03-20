import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import process from "node:process";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.RENDER ? "0.0.0.0" : process.env.HOST || "127.0.0.1";
const ROOT = process.cwd();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = safePath(requestedPath);

  if (!filePath) {
    sendText(res, 400, "Bad request");
    return;
  }

  const fallbackPath = join(ROOT, "index.html");
  const targetPath = existsSync(filePath) && statSync(filePath).isFile() ? filePath : fallbackPath;
  const extension = extname(targetPath);

  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });

  createReadStream(targetPath).pipe(res);
}).listen(PORT, HOST, () => {
  console.log(`SMART Sprint Studio is running on http://${HOST}:${PORT}`);
});

function safePath(requestedPath) {
  const normalizedPath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = join(ROOT, normalizedPath);
  return absolutePath.startsWith(ROOT) ? absolutePath : null;
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}
