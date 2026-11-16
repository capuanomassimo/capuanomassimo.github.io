import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const siteRoot = path.resolve("_site");
const outputPdf = path.join(siteRoot, "files", "Massimo_Capuano_CV.pdf");
const artifactRoot = path.resolve("artifacts");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf"
};

function resolveSitePath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const relativePath = decoded.replace(/^\/+/, "");
  let resolvedPath = path.resolve(siteRoot, relativePath);
  if (resolvedPath !== siteRoot && !resolvedPath.startsWith(siteRoot + path.sep)) {
    throw new Error("Blocked path traversal");
  }
  return resolvedPath;
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    let filePath = resolveSitePath(requestUrl.pathname);
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
    } catch {
      if (!path.extname(filePath)) filePath = path.join(filePath, "index.html");
    }
    const body = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await fs.access(path.join(siteRoot, "cv", "index.html"));
await fs.mkdir(path.dirname(outputPdf), { recursive: true });
await fs.mkdir(artifactRoot, { recursive: true });

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
if (!address || typeof address === "string") throw new Error("Could not start local preview server");
const baseUrl = "http://127.0.0.1:" + address.port;

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1
  });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  const cvResponse = await page.goto(baseUrl + "/cv/", { waitUntil: "networkidle" });
  if (!cvResponse || !cvResponse.ok()) throw new Error("CV page failed to load");

  await page.evaluate(() => document.fonts.ready);
  const cvText = await page.locator("body").innerText();
  const expectedCvContent = [
    "Massimo Capuano",
    "Education and Training",
    "FinecoBank",
    "Kozminski University",
    "Research Output",
    "Bloomberg Market Concepts",
    "English",
    "Spanish",
    "Administrative and Academic Support Assistant"
  ];
  for (const expected of expectedCvContent) {
    if (!cvText.includes(expected)) throw new Error("CV is missing expected content: " + expected);
  }

  const desktopMetrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  if (desktopMetrics.bodyWidth > desktopMetrics.viewportWidth + 2) {
    throw new Error("CV has desktop horizontal overflow: " + JSON.stringify(desktopMetrics));
  }

  await page.screenshot({
    path: path.join(artifactRoot, "cv-preview-desktop.png"),
    fullPage: true
  });

  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outputPdf,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false
  });

  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileMetrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  if (mobileMetrics.bodyWidth > mobileMetrics.viewportWidth + 2) {
    throw new Error("CV has mobile horizontal overflow: " + JSON.stringify(mobileMetrics));
  }
  await page.screenshot({
    path: path.join(artifactRoot, "cv-preview-mobile.png"),
    fullPage: true
  });

  const researchResponse = await page.goto(baseUrl + "/research/", { waitUntil: "networkidle" });
  if (!researchResponse || !researchResponse.ok()) throw new Error("Research page failed to load");
  const areaCount = await page.locator(".research-area").count();
  if (areaCount !== 5) throw new Error("Expected 5 research areas, found " + areaCount);
  const researchText = await page.locator("body").innerText();
  for (const expected of ["Asset Pricing and Derivatives", "Digital Assets and Stablecoins", "Related work"]) {
    if (!researchText.includes(expected)) throw new Error("Research page is missing: " + expected);
  }
  await page.screenshot({
    path: path.join(artifactRoot, "research-preview.png"),
    fullPage: true
  });

  const publicationResponse = await page.goto(baseUrl + "/publications/", { waitUntil: "networkidle" });
  if (!publicationResponse || !publicationResponse.ok()) throw new Error("Publications page failed to load");
  const publicationText = await page.locator("body").innerText();
  const expectedPublications = [
    "Journal Articles",
    "Working Papers and Preprints",
    "Conference Papers and Book Chapters",
    "Theses",
    "ESG²: Integrating Geopolitical Risk into the Sustainability Framework",
    "Credit default swap e gestione del rischio"
  ];
  for (const expected of expectedPublications) {
    if (!publicationText.includes(expected)) throw new Error("Publications page is missing: " + expected);
  }
  for (const excluded of ["Too Shared to Fail", "Modelling Volatility"]) {
    if (publicationText.includes(excluded)) throw new Error("Excluded item unexpectedly appears: " + excluded);
  }
  await page.screenshot({
    path: path.join(artifactRoot, "publications-preview.png"),
    fullPage: true
  });

  if (pageErrors.length) throw new Error("Browser errors: " + pageErrors.join("; "));

  const pdfStat = await fs.stat(outputPdf);
  if (pdfStat.size < 15000) throw new Error("Generated CV PDF is unexpectedly small");
  const summary = {
    pdfPath: outputPdf,
    pdfBytes: pdfStat.size,
    researchAreas: areaCount,
    publicationSections: 4,
    desktop: desktopMetrics,
    mobile: mobileMetrics,
    browserErrors: pageErrors.length
  };
  console.log(JSON.stringify(summary, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
