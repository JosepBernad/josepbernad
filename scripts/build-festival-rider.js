/**
 * Generate the one-off festival technical rider PDF: Catalan, DJ Set,
 * artist-provided Pioneer DJ OPUS-QUAD, one page, no hospitality.
 *
 * Output is written to out/ (git-ignored) on purpose: this document is sent
 * directly to a promoter and is NOT published on josepbernad.com. The public
 * riders still come from scripts/build-rider.js + src/_data/presskit.json.
 *
 * Run: node scripts/build-festival-rider.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");

// Fill these in to stamp the document with the specific booking, then rerun.
// Left empty the header simply omits the line.
const EVENT_NAME = "";
const EVENT_DATE = "";

const PDF_EPOCH = new Date("2020-01-01T00:00:00Z");
const OUT_DIR = path.join(__dirname, "..", "out");
const OUT_FILE = path.join(OUT_DIR, "josep-bernad-rider-festival-dj-ca.pdf");

const ASSET_DIR = path.join(__dirname, "..", "src", "press-kit");
const WORDMARK_PNG = path.join(ASSET_DIR, "josep-bernad-wordmark-dj-black.png");

const TECH_EMAIL = "tech@josepbernad.com";
const TECH_PHONE = "(+34) 608 811 342";
const TECH_PHONE_TEL = "+34608811342";

const INK = "#0a0a0a";
const MUTED = "#6b6b6b";
const FAINT = "#cfcfcf";

const M = 56;
const QTY_W = 56;

/** Read intrinsic width/height from a PNG IHDR chunk. */
function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), buf };
}

function rule(doc, x, y, w, color = INK, weight = 0.6) {
  doc.save()
    .moveTo(x, y).lineTo(x + w, y)
    .lineWidth(weight).strokeColor(color).stroke()
    .restore();
}

function caps(doc, text, x, y, opts = {}) {
  const {
    size = 8, color = MUTED, font = "Helvetica-Bold",
    spacing = 2, width, align,
  } = opts;
  doc.font(font).fontSize(size).fillColor(color);
  doc.text(text.toUpperCase(), x, y, {
    characterSpacing: spacing,
    width, align,
    lineBreak: false,
  });
}

/* ---------------------------------------------------------------- content */

const SECTIONS = [
  {
    title: "Aporto jo",
    items: [
      {
        qty: "1×",
        name: "Pioneer DJ OPUS-QUAD",
      },
    ],
  },
  {
    title: "A càrrec del festival",
    items: [
      {
        qty: "1×",
        name: "Taula de cabina",
        meta: "mínim 120 × 60 cm, estable (l'equip ocupa 73 × 44 cm)",
      },
      {
        qty: "4×",
        name: "Preses Schuko 230 V",
        meta: "amb presa de terra, a la cabina",
      },
      {
        qty: "2×",
        name: "Entrades de línia amb cable XLR",
        meta: "per al master balancejat de l'OPUS-QUAD, al sistema o al mixer de casa",
      },
      {
        qty: "1×",
        name: "Micròfon sense fils",
        meta: "Shure SM58 o equivalent",
      },
      { divider: true },
      {
        qty: "",
        name: "Monitor de cabina",
        meta: "amb nivell independent des del 'booth' de la taula",
      },
      {
        qty: "",
        name: "PA principal",
        meta: "estèreo net i dimensionat al recinte",
      },
    ],
  },
];

/* ----------------------------------------------------------------- layout */

const FOOTER_H = 50;
const SECTION_GAP = 18;
const DIVIDER_GAP = 14;
const LABEL_W = 80;

function contentLimit(doc) {
  return doc.page.height - M - FOOTER_H - 14;
}

/** Height an item occupies, meta wrapping included. */
function itemHeight(doc, item, colW) {
  if (!item.meta) return 22;
  doc.font("Helvetica").fontSize(9);
  return 13 + doc.heightOfString(item.meta, { width: colW - QTY_W }) + 8;
}

function noteHeight(doc, note, colW) {
  doc.font("Helvetica").fontSize(10);
  return doc.heightOfString(note.text, { width: colW - LABEL_W }) + 12;
}

function renderItem(doc, item, x, y, colW, drawRule = true) {
  const itemX = x + QTY_W;
  const itemW = colW - QTY_W;

  if (item.qty) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
    doc.text(item.qty, x, y, { width: QTY_W - 8, lineBreak: false });
  }

  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
  doc.text(item.name, itemX, y, { width: itemW, lineBreak: false });

  let newY;
  if (item.meta) {
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    doc.text(item.meta, itemX, y + 13, { width: itemW });
    newY = doc.y + 8;
  } else {
    newY = y + 22;
  }

  if (drawRule) rule(doc, x, newY - 4, colW, FAINT, 0.4);
  return newY;
}

/** Title + underline shared by list sections and titled note blocks. */
function renderHeading(doc, title, badge, y, colW) {
  caps(doc, title, M, y, { size: 11, color: INK, spacing: 2.5, width: colW });
  if (badge) {
    caps(doc, badge, M, y + 2, { size: 7.5, color: MUTED, spacing: 1.8, width: colW, align: "right" });
  }
  y += 18;
  rule(doc, M, y, colW, INK, 0.6);
  return y + 14;
}

/** Compact running header used on every page after the first. */
function pageHeader(doc) {
  const colW = doc.page.width - M * 2;
  let y = M;
  caps(doc, "Rider tècnic · DJ Set", M, y, { size: 8, color: INK, spacing: 2 });
  caps(doc, "Josep Bernad", M, y, { size: 8, color: MUTED, spacing: 2, width: colW, align: "right" });
  y += 16;
  rule(doc, M, y, colW, INK, 0.8);
  return y + 26;
}

function footer(doc) {
  const colW = doc.page.width - M * 2;
  const footerY = doc.page.height - M - FOOTER_H;
  rule(doc, M, footerY, colW, INK, 0.6);

  doc.font("Courier-Bold").fontSize(10).fillColor(INK);
  const emailY = footerY + 12;
  const phoneY = footerY + 26;
  const emailW = doc.widthOfString(TECH_EMAIL);
  const phoneW = doc.widthOfString(TECH_PHONE);
  doc.text(TECH_EMAIL, M, emailY, { lineBreak: false });
  doc.text(TECH_PHONE, M, phoneY, { lineBreak: false });
  doc.link(M, emailY, emailW, 11, `mailto:${TECH_EMAIL}`);
  doc.link(M, phoneY, phoneW, 11, `tel:${TECH_PHONE_TEL}`);

  doc.font("Courier").fontSize(10).fillColor(MUTED);
  const siteText = "josepbernad.com";
  const igText = "@djosepbernad";
  const siteW = doc.widthOfString(siteText);
  const igW = doc.widthOfString(igText);
  const rightEdge = M + colW;
  doc.text(siteText, M, emailY, { width: colW, align: "right", lineBreak: false });
  doc.text(igText, M, phoneY, { width: colW, align: "right", lineBreak: false });
  doc.link(rightEdge - siteW, emailY, siteW, 11, "https://josepbernad.com");
  doc.link(rightEdge - igW, phoneY, igW, 11, "https://www.instagram.com/djosepbernad/");
}

/**
 * Sequential renderer. Every block measures itself before drawing, so a
 * block never spills past the footer: it moves to a fresh page instead.
 */
function renderFlow(doc, blocks, yStart, colW) {
  let y = yStart;

  const nextPage = () => {
    doc.addPage();
    return pageHeader(doc);
  };

  for (const block of blocks) {
    if (block.pageBreakBefore) y = nextPage();

    if (block.type === "section") {
      const items = block.items.filter((it) => !it.divider);
      const firstH = items.length ? itemHeight(doc, items[0], colW) : 0;
      // Keep the heading with its first row.
      if (y + 32 + firstH > contentLimit(doc)) y = nextPage();
      y = renderHeading(doc, block.title, block.badge, y, colW);

      for (let i = 0; i < block.items.length; i++) {
        const item = block.items[i];
        if (item.divider) {
          y += DIVIDER_GAP;
          continue;
        }
        const h = itemHeight(doc, item, colW);
        if (y + h > contentLimit(doc)) y = nextPage();
        const next = block.items[i + 1];
        const isLast = i === block.items.length - 1;
        // No dashed rule before a divider gap or at the end of the block,
        // so the break reads as a section change, not a dangling separator.
        y = renderItem(doc, item, M, y, colW, !isLast && !(next && next.divider));
      }
      y += SECTION_GAP;
      continue;
    }

    if (block.type === "notes") {
      const firstH = noteHeight(doc, block.notes[0], colW);
      if (y + 32 + firstH > contentLimit(doc)) y = nextPage();

      if (block.title) {
        y = renderHeading(doc, block.title, block.badge, y, colW);
      } else {
        rule(doc, M, y, colW, INK, 0.6);
        y += 18;
      }

      for (const note of block.notes) {
        const h = noteHeight(doc, note, colW);
        if (y + h > contentLimit(doc)) y = nextPage();
        caps(doc, note.label, M, y + 1, { size: 8, color: MUTED, spacing: 2 });
        doc.font("Helvetica").fontSize(10).fillColor(INK);
        doc.text(note.text, M + LABEL_W, y, { width: colW - LABEL_W });
        y = doc.y + 12;
      }
      y += SECTION_GAP;
    }
  }
}

/* ------------------------------------------------------------------ build */

function build() {
  const doc = new PDFDocument({
    size: "A4",
    margin: M,
    bufferPages: true,
    info: {
      Title: "Josep Bernad - Rider tècnic - DJ Set festival (OPUS-QUAD)",
      Author: "Josep Bernad",
      Subject: "Rider tècnic - DJ Set per a festival",
      Keywords: "rider, dj set, festival, opus quad, booking",
      Creator: "josepbernad.com",
      Producer: "josepbernad.com",
      CreationDate: PDF_EPOCH,
      ModDate: PDF_EPOCH,
    },
  });
  doc._id = crypto.createHash("md5").update(path.basename(OUT_FILE)).digest();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));

  const CW = doc.page.width - M * 2;

  // === Cover header (page 1 only) ===
  let y = M;
  caps(doc, "Rider tècnic", M, y, { size: 8, color: INK, spacing: 2 });
  caps(doc, "DJ Set", M, y, { size: 8, color: MUTED, spacing: 2, width: CW, align: "right" });
  y += 22;

  // Wordmark centred on the page width.
  const wordmarkW = 300;
  const wordmarkX = M + (CW - wordmarkW) / 2;
  if (fs.existsSync(WORDMARK_PNG)) {
    const { w, h, buf } = pngSize(WORDMARK_PNG);
    doc.image(buf, wordmarkX, y, { width: wordmarkW });
    y += wordmarkW / (w / h) + 16;
  } else {
    doc.font("Helvetica-Bold").fontSize(40).fillColor(INK);
    doc.text("JOSEP BERNAD", M, y, { characterSpacing: 5, width: CW, align: "center", lineBreak: false });
    y += 58;
  }

  rule(doc, M, y, CW, INK, 0.8);
  y += 12;

  if (EVENT_NAME || EVENT_DATE) {
    const line = [EVENT_NAME, EVENT_DATE].filter(Boolean).join(" · ");
    caps(doc, line, M, y, { size: 8, color: MUTED, spacing: 2, width: CW });
    y += 16;
  }
  y += 10;

  const blocks = [
    ...SECTIONS.map((section) => ({ type: "section", ...section })),
  ];
  renderFlow(doc, blocks, y, CW);

  // Footer on every page, drawn once the page count is final.
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    footer(doc);
  }
  doc.flushPages();

  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      try {
        fs.writeFileSync(OUT_FILE, Buffer.concat(chunks));
        resolve(OUT_FILE);
      } catch (err) {
        reject(err);
      }
    });
    doc.on("error", reject);
    doc.end();
  });
}

module.exports = { build, OUT_FILE };

if (require.main === module) {
  build()
    .then((p) => {
      const size = (fs.statSync(p).size / 1024).toFixed(1);
      console.log(`Wrote ${path.relative(process.cwd(), p)} (${size} KB)`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
