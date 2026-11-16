import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const siteRoot = path.resolve("_site");
const outputPdf = path.join(siteRoot, "files", "Massimo_Capuano_CV.pdf");
const artifactRoot = path.resolve("artifacts");
let baseUrl = "";

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
  const relativePath = decoded.replace(/^[/]+/, "");
  const resolvedPath = path.resolve(siteRoot, relativePath);
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
    let body = await fs.readFile(filePath);
    if (path.extname(filePath).toLowerCase() === ".html") {
      const html = body.toString("utf8")
        .replaceAll("https://capuanomassimo.github.io", baseUrl)
        .replaceAll("http://capuanomassimo.github.io", baseUrl);
      body = Buffer.from(html, "utf8");
    }
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

async function checkNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  if (Math.max(metrics.bodyWidth, metrics.documentWidth) > metrics.viewportWidth + 2) {
    throw new Error(label + " has horizontal overflow: " + JSON.stringify(metrics));
  }
  return metrics;
}

async function checkInternalLinks(page, label) {
  const hrefs = await page.locator("a[href]").evaluateAll(links =>
    [...new Set(links.map(link => link.getAttribute("href"))
      .filter(href => href && href.startsWith("/") && !href.startsWith("//")))]
  );
  const failures = [];
  for (const href of hrefs) {
    const url = new URL(href, baseUrl).toString();
    const response = await page.request.get(url);
    if (!response.ok()) failures.push(href + " -> HTTP " + response.status());
  }
  if (failures.length) throw new Error(label + " has broken internal links: " + failures.join("; "));
  return hrefs.length;
}

await fs.access(path.join(siteRoot, "cv", "index.html"));
await fs.mkdir(path.dirname(outputPdf), { recursive: true });
await fs.mkdir(artifactRoot, { recursive: true });

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
if (!address || typeof address === "string") throw new Error("Could not start local preview server");
baseUrl = "http://127.0.0.1:" + address.port;

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1
  });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  const homeResponse = await page.goto(baseUrl + "/", { waitUntil: "networkidle" });
  if (!homeResponse || !homeResponse.ok()) throw new Error("About page failed to load");
  const homeText = await page.locator("body").innerText();
  for (const expected of ["PhD Student in Economics and Finance", "Università Cattolica del Sacro Cuore", "Research", "Publications"]) {
    if (!homeText.includes(expected)) throw new Error("About page is missing: " + expected);
  }
  const homeLinks = await checkInternalLinks(page, "About");
  await page.screenshot({ path: path.join(artifactRoot, "about-preview-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  const homeMobile = await checkNoHorizontalOverflow(page, "About mobile");
  await page.screenshot({ path: path.join(artifactRoot, "about-preview-mobile.png"), fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1100 });
  const cvResponse = await page.goto(baseUrl + "/cv/", { waitUntil: "networkidle" });
  if (!cvResponse || !cvResponse.ok()) throw new Error("CV page failed to load");
  await page.evaluate(() => document.fonts.ready);

  const cvStyle = await page.evaluate(() => ({
    css: [...document.styleSheets].map(sheet => sheet.href).filter(Boolean),
    headerDisplay: getComputedStyle(document.querySelector(".cv-header")).display
  }));
  if (cvStyle.headerDisplay !== "grid" || !cvStyle.css.some(url => url.includes("/assets/css/main.css"))) {
    throw new Error("CV preview did not load the branch stylesheet: " + JSON.stringify(cvStyle));
  }

  const cvDownloadLink = page.locator(".cv-download");
  if (await cvDownloadLink.count() !== 1) throw new Error("CV download link is missing.");
  const cvDownloadHref = await cvDownloadLink.getAttribute("href");
  if (!cvDownloadHref || !cvDownloadHref.endsWith("/files/Massimo_Capuano_CV.pdf")) {
    throw new Error("CV download link does not point to the generated PDF.");
  }
  if (await cvDownloadLink.getAttribute("download") !== "Massimo_Capuano_CV.pdf") {
    throw new Error("CV download link must use the browser download attribute.");
  }

  const cvText = await page.locator("body").innerText();
  const expectedCvContent = [
    "Massimo Capuano",
    "Education and Training",
    "FinecoBank",
    "Kozminski University",
    "Research",
    "Bloomberg Market Concepts",
    "English",
    "Spanish",
    "Administrative and Academic Support Assistant",
    "High School Diploma",
    "Driving licences",
    "Hogstalle",
    "Student Representative"
  ];
  for (const expected of expectedCvContent) {
    if (!cvText.includes(expected)) throw new Error("CV is missing expected content: " + expected);
  }

  const desktopMetrics = await checkNoHorizontalOverflow(page, "CV desktop");
  const cvLinks = await checkInternalLinks(page, "CV");
  await page.screenshot({ path: path.join(artifactRoot, "cv-preview-desktop.png"), fullPage: true });

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
  const mobileMetrics = await checkNoHorizontalOverflow(page, "CV mobile");
  await page.screenshot({ path: path.join(artifactRoot, "cv-preview-mobile.png"), fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1100 });
  const researchResponse = await page.goto(baseUrl + "/research/", { waitUntil: "networkidle" });
  if (!researchResponse || !researchResponse.ok()) throw new Error("Research page failed to load");
  const researchText = await page.locator("body").innerText();
  const expectedCurrentResearch = [
    "My research interests include asset pricing, derivatives, sustainable finance, and systemic risk.",
    "Research projects and working papers will be added here."
  ];
  for (const expected of expectedCurrentResearch) {
    if (!researchText.includes(expected)) {
      throw new Error("Research page no longer matches the approved current version: " + expected);
    }
  }
  const areaCount = await page.locator(".research-area").count();
  if (areaCount !== 0) {
    throw new Error("The deferred Research redesign should not be present yet.");
  }
  const researchLinks = await checkInternalLinks(page, "Research");
  await page.screenshot({ path: path.join(artifactRoot, "research-preview-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  const researchMobile = await checkNoHorizontalOverflow(page, "Research mobile");
  await page.screenshot({ path: path.join(artifactRoot, "research-preview-mobile.png"), fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1100 });
  const publicationResponse = await page.goto(baseUrl + "/publications/", { waitUntil: "networkidle" });
  if (!publicationResponse || !publicationResponse.ok()) throw new Error("Publications page failed to load");
  const publicationText = await page.locator("body").innerText();
  const expectedPublications = [
    "Journal Articles",
    "Working Papers and Preprints",
    "Conference Papers and Book Chapters",
    "Theses",
    "ESG²: Integrating Geopolitical Risk into the Sustainability Framework",
    "Credit default swap e gestione del rischio",
    "Pricing asian option on crude oil"
  ];
  for (const expected of expectedPublications) {
    if (!publicationText.toLowerCase().includes(expected.toLowerCase())) {
      throw new Error("Publications page is missing: " + expected);
    }
  }
  for (const excluded of ["Too Shared to Fail", "Modelling Volatility"]) {
    if (publicationText.includes(excluded)) throw new Error("Excluded item unexpectedly appears: " + excluded);
  }
  const publicationLinks = await checkInternalLinks(page, "Publications");
  await page.screenshot({ path: path.join(artifactRoot, "publications-preview-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  const publicationsMobile = await checkNoHorizontalOverflow(page, "Publications mobile");
  await page.screenshot({ path: path.join(artifactRoot, "publications-preview-mobile.png"), fullPage: true });

  if (pageErrors.length) throw new Error("Browser errors: " + pageErrors.join("; "));

  const pdfStat = await fs.stat(outputPdf);
  if (pdfStat.size < 15000) throw new Error("Generated CV PDF is unexpectedly small");
  const summary = {
    pdfPath: outputPdf,
    pdfBytes: pdfStat.size,
    researchRedesignDeferred: areaCount === 0,
    publicationSections: 4,
    internalLinksChecked: {
      about: homeLinks,
      cv: cvLinks,
      research: researchLinks,
      publications: publicationLinks
    },
    desktop: desktopMetrics,
    mobile: {
      about: homeMobile,
      cv: mobileMetrics,
      research: researchMobile,
      publications: publicationsMobile
    },
    stylesheetLoaded: cvStyle.headerDisplay === "grid",
    browserErrors: pageErrors.length
  };
  console.log(JSON.stringify(summary, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
