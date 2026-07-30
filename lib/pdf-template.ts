import fs from "fs";
import path from "path";
import { marked } from "marked";

const ASSETS_DIR = path.join(process.cwd(), "lib", "pdf-assets");

function b64(filename: string): string {
  return fs.readFileSync(path.join(ASSETS_DIR, filename)).toString("base64");
}

// Cache the base64-encoded assets across requests within the same server
// instance -- these are small, static files, no reason to re-read/re-encode
// every single sign request.
let cachedAssets: Record<string, string> | null = null;
function getAssets() {
  if (!cachedAssets) {
    cachedAssets = {
      archivo700: b64("archivo-700.woff2"),
      archivo900: b64("archivo-900.woff2"),
      inter400: b64("inter-400.woff2"),
      inter400i: b64("inter-400i.woff2"),
      inter500: b64("inter-500.woff2"),
      inter600: b64("inter-600.woff2"),
      logo: b64("fonder-logo-black.png"),
    };
  }
  return cachedAssets;
}

// Same design system as the redesigned Coros SOW: Archivo/Inter, warm
// near-black/gray palette, two-column flowing text, hairline column rule.
// Section numbering is now automatic via CSS counters (counter-reset on the
// container, counter-increment + content on h2) -- markdown authors just
// write "## Section Title" and get the same numbered-heading look, no
// per-section markup required the way the original hand-built HTML needed.
function buildCss(assets: Record<string, string>): string {
  return `
@font-face { font-family: 'Archivo'; src: url(data:font/woff2;base64,${assets.archivo700}) format('woff2'); font-weight: 700; font-style: normal; }
@font-face { font-family: 'Archivo'; src: url(data:font/woff2;base64,${assets.archivo900}) format('woff2'); font-weight: 900; font-style: normal; }
@font-face { font-family: 'Inter'; src: url(data:font/woff2;base64,${assets.inter400}) format('woff2'); font-weight: 400; font-style: normal; }
@font-face { font-family: 'Inter'; src: url(data:font/woff2;base64,${assets.inter400i}) format('woff2'); font-weight: 400; font-style: italic; }
@font-face { font-family: 'Inter'; src: url(data:font/woff2;base64,${assets.inter500}) format('woff2'); font-weight: 500; font-style: normal; }
@font-face { font-family: 'Inter'; src: url(data:font/woff2;base64,${assets.inter600}) format('woff2'); font-weight: 600; font-style: normal; }

:root {
  --near-black: #181a1e;
  --warm-700: #4a4d52;
  --warm-600: #6c6f76;
  --warm-500: #8a8d93;
  --warm-border: #ded9cf;
  --white: #ffffff;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--white); }
body { font-family: 'Inter', sans-serif; font-size: 10.3pt; line-height: 1.55; color: var(--near-black); -webkit-font-smoothing: antialiased; }

.doc-title { font-family: 'Archivo', sans-serif; font-weight: 900; font-size: 22pt; line-height: 1.05; letter-spacing: -0.01em; margin: 0 0 4pt 0; color: var(--near-black); }
.doc-subtitle { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 9.5pt; color: var(--warm-600); letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 20pt 0; }

.body-columns { column-count: 2; column-gap: 0.42in; column-rule: 0.75pt solid var(--warm-border); counter-reset: section; }

h2 { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 12.5pt; letter-spacing: -0.005em; color: var(--near-black); margin: 14pt 0 8pt 0; break-after: avoid-column; counter-increment: section; }
h2::before { content: counter(section, decimal-leading-zero) "  "; color: var(--warm-border); font-weight: 900; font-size: 15pt; }
h3 { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 10.8pt; margin: 10pt 0 6pt 0; color: var(--near-black); }
p { margin: 0 0 9pt 0; color: var(--near-black); }
ul { list-style: none; padding-left: 0; margin: 0 0 9pt 0; }
li { position: relative; padding-left: 13pt; margin-bottom: 4pt; color: var(--near-black); }
li::before { content: "\\2013"; position: absolute; left: 0; color: var(--warm-500); font-weight: 600; }
strong { font-weight: 600; color: var(--near-black); }
em { font-style: italic; color: var(--warm-600); }
table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 9.6pt; }
th { text-align: left; font-weight: 600; color: var(--warm-600); text-transform: uppercase; font-size: 8.3pt; letter-spacing: 0.05em; border-bottom: 1pt solid var(--near-black); padding: 4pt 8pt 4pt 0; }
td { border-bottom: 1pt solid var(--warm-border); padding: 4pt 8pt 4pt 0; }
hr { border: none; border-top: 1pt solid var(--warm-border); margin: 12pt 0; }

.sig-block { break-before: column; }
.sig-row { margin-top: 14pt; }
.sig-name { font-weight: 600; color: var(--near-black); }
.sig-line { border-bottom: 1pt solid var(--near-black); height: 26pt; margin-top: 14pt; }
.sig-caption { font-size: 8.3pt; color: var(--warm-600); margin-top: 3pt; text-transform: uppercase; letter-spacing: 0.04em; }
`;
}

function signatureBlockHtml(
  clientName: string,
  clientSignatoryName: string,
  fonderSignatoryName: string,
): string {
  return `
    <div class="sig-block">
      <h2 style="counter-increment: none;" class="no-count">Signatures</h2>
      <div class="sig-row">
        <p class="sig-name">${clientName}</p>
        <p>${clientSignatoryName || "&nbsp;"}</p>
        <div class="sig-line"></div>
        <p class="sig-caption">Signature</p>
        <div class="sig-line"></div>
        <p class="sig-caption">Date</p>
      </div>
      <div class="sig-row">
        <p class="sig-name">Fonder Studio</p>
        <p>${fonderSignatoryName}</p>
        <div class="sig-line"></div>
        <p class="sig-caption">Signature</p>
        <div class="sig-line"></div>
        <p class="sig-caption">Date</p>
      </div>
    </div>
  `;
}

export async function buildSignableDocumentHtml(params: {
  clientName: string;
  engagementTitle: string;
  sowMarkdown: string;
  msaMarkdown: string;
  clientSignatoryName: string;
  fonderSignatoryName: string;
}): Promise<{ html: string; headerHtml: string; footerHtml: string }> {
  const assets = getAssets();
  const css = buildCss(assets);

  const sowHtml = await marked.parse(params.sowMarkdown);
  const msaHtml = await marked.parse(params.msaMarkdown);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head>
<body>
  <div class="doc-title">${params.clientName} &times; Fonder</div>
  <div class="doc-subtitle">${params.engagementTitle} — Statement of Work</div>
  <div class="body-columns">${sowHtml}</div>

  <div style="break-before: page;"></div>
  <div class="doc-title" style="margin-top: 0;">${params.clientName} &times; Fonder Studio</div>
  <div class="doc-subtitle">Master Services Agreement</div>
  <div class="body-columns">
    ${msaHtml}
    ${signatureBlockHtml(params.clientName, params.clientSignatoryName, params.fonderSignatoryName)}
  </div>
</body></html>`;

  const headerHtml = `<div style="width:100%; font-size:0; padding: 0 0.5in; margin-top: 0.22in;">
    <img src="data:image/png;base64,${assets.logo}" style="height:16px;" />
  </div>`;

  const footerHtml = `<div style="width:100%; font-size:8pt; font-family: Arial, sans-serif; color:#8a8d93; text-align:right; padding: 0 0.5in; letter-spacing:0.03em;">
    ${params.clientName} &times; Fonder Studio
  </div>`;

  return { html, headerHtml, footerHtml };
}
