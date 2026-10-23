import { build } from "esbuild";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist/src", { recursive: true });
await build({ entryPoints: ["src/main.js"], bundle: true, format: "esm", platform: "browser", target: "es2022", outfile: "dist/app.js", minify: true });
await cp("assets", "dist/assets", { recursive: true });
await cp("src/styles.css", "dist/src/styles.css");
const html = (await readFile("index.html", "utf8")).replace("./dist/app.js", "./app.js");
await writeFile("dist/index.html", html);
