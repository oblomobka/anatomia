// Exporta una lámina estática (HTML) a PNG y PDF con el Chromium de Playwright.
//   node scripts/export.mjs <pagina.html> [--out nombre] [--scale 2] [--letter] [--no-pdf] [--no-png]
// Escribe <nombre>.png (solo la figura con su leyenda) y <nombre>.pdf (A4) junto al HTML.
// Usa Playwright en vez de lanzar Chrome a mano: en algunos equipos Chrome se queda colgado al imprimir.
// Si Playwright no encuentra su navegador, define CHROME_PATH con la ruta a un Chromium.
import { createRequire } from "node:module";
import { dirname, basename, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const input = args.find((a, i) => !a.startsWith("--") && !["--out", "--scale"].includes(args[i - 1]));
if (!input || flag("--help")) {
  console.log("uso: node scripts/export.mjs <pagina.html> [--out nombre] [--scale 2] [--letter] [--no-pdf] [--no-png]");
  process.exit(input ? 0 : 1);
}

let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)("playwright"));
} catch {
  console.error("No encuentro Playwright. Instálalo con `npm i -g playwright && npx playwright install chromium`.");
  process.exit(1);
}

const page = resolve(input);
const base = join(dirname(page), value("--out", basename(page, extname(page))));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
try {
  const tab = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: Number(value("--scale", 2)) });
  await tab.goto(pathToFileURL(page).href);
  await tab.evaluate(() => document.fonts.ready);
  if (!flag("--no-png")) {
    await tab.locator("figure").first().screenshot({ path: `${base}.png` });
    console.log("escrito", `${base}.png`);
  }
  if (!flag("--no-pdf")) {
    await tab.pdf({ path: `${base}.pdf`, format: flag("--letter") ? "Letter" : "A4", printBackground: true, margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" } });
    console.log("escrito", `${base}.pdf`);
  }
} finally {
  await browser.close();
}
