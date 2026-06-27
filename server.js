import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";

const host = "127.0.0.1";
const port = 4173;
const root = resolve(".");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
};

const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent((request.url ?? "/").split("?")[0]);

    if (pathname === "/") {
      pathname = "/index.html";
    }

    const servedPath = pathname.startsWith("/assets/")
      ? `/public${pathname}`
      : pathname;
    const filePath = resolve(root, `.${servedPath}`);
    const relativePath = relative(root, filePath);

    if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Warm House app running at http://${host}:${port}`);
});
