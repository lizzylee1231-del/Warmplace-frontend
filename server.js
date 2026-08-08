import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";

const host = "127.0.0.1";
const port = 4173;
const root = resolve(".");
const backendOrigin = process.env.WARMNEST_BACKEND_ORIGIN ?? "https://warmplace-one.vercel.app";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
};

function readRequestBody(request) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolveBody(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function proxyApiRequest(request, response, pathname) {
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const targetUrl = new URL(pathname, backendOrigin);
  const requestBody = ["GET", "HEAD"].includes(request.method ?? "GET")
    ? undefined
    : await readRequestBody(request);
  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: {
      accept: request.headers.accept ?? "application/json",
      "content-type": request.headers["content-type"] ?? "application/json",
    },
    body: requestBody,
  });
  const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
  response.writeHead(upstreamResponse.status, {
    "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8",
  });
  response.end(responseBody);
}

const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent((request.url ?? "/").split("?")[0]);

    if (pathname.startsWith("/api/")) {
      await proxyApiRequest(request, response, request.url ?? pathname);
      return;
    }

    if (pathname === "/") {
      pathname = "/index.html";
    }

    const servedPath = pathname;
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
