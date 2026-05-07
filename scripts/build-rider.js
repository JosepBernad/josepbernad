/**
 * Generate the technical rider PDFs from src/_data/presskit.json.
 *
 * Two PDFs per language — one for the DJ Set, one for the Live Set:
 *   src/press-kit/josep-bernad-rider-dj-en.pdf
 *   src/press-kit/josep-bernad-rider-dj-es.pdf
 *   src/press-kit/josep-bernad-rider-dj-ca.pdf
 *   src/press-kit/josep-bernad-rider-live-en.pdf
 *   src/press-kit/josep-bernad-rider-live-es.pdf
 *   src/press-kit/josep-bernad-rider-live-ca.pdf
 *
 * Run: node scripts/build-rider.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");

// Fixed epoch so PDFKit doesn't stamp `new Date()` into CreationDate/ModDate
// on every build, which would dirty `git status` with metadata-only diffs.
const PDF_EPOCH = new Date("2020-01-01T00:00:00Z");

const PRESSKIT_PATH = path.join(__dirname, "..", "src", "_data", "presskit.json");
const OUT_DIR = path.join(__dirname, "..", "src", "press-kit");
const FILE_PREFIX = "josep-bernad-rider-";
const LANGS = ["en", "es", "ca"];
const KINDS = [
  { id: "dj", listKey: "djList", nameKey: "djName", badgeKey: "djBadge", showGuests: false },
  { id: "live", listKey: "liveList", nameKey: "liveName", badgeKey: "liveBadge", showGuests: true },
];

// Wordmark asset embedded in every rider PDF. Built by build-presskit.js
// from src/press-kit-source/wordmark.svg before this script runs.
const WORDMARK_PNG = path.join(OUT_DIR, "josep-bernad-wordmark-black.png");
const WORDMARK_ASPECT = 2000 / 346; // intrinsic width / height of the PNG

// Rider-specific contact, intentionally separate from the public hi@/hola@
// addresses on the press-kit page. Bookers use these for technical comms.
const TECH_EMAIL = "tech@josepbernad.com";
const TECH_PHONE = "(+34) 608 811 342";
const TECH_PHONE_TEL = "+34608811342"; // canonical for tel: URL

const INK = "#0a0a0a";
const MUTED = "#6b6b6b";
const FAINT = "#cfcfcf";

function loadFresh(p) {
  // Re-read so eleventy serve picks up live JSON edits between rebuilds.
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function outputFor(kind, lang) {
  return path.join(OUT_DIR, `${FILE_PREFIX}${kind}-${lang}.pdf`);
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

const QTY_W = 56;
const MIN_DIVIDER_GAP = 28;

function splitOnDivider(list) {
  const idx = list.findIndex((it) => it.divider);
  if (idx < 0) return { inputs: list, outputs: [] };
  return { inputs: list.slice(0, idx), outputs: list.slice(idx + 1) };
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
    newY = doc.y + 10;
  } else {
    newY = y + 22;
  }

  if (drawRule) rule(doc, x, newY - 4, colW, FAINT, 0.4);
  return newY;
}

function renderList(doc, x, yStart, colW, title, badge, list) {
  let y = yStart;

  caps(doc, title, x, y, { size: 11, color: INK, spacing: 2.5, width: colW });
  caps(doc, badge, x, y + 2, { size: 7.5, color: MUTED, spacing: 1.8, width: colW, align: "right" });
  y += 18;

  rule(doc, x, y, colW, INK, 0.6);
  y += 14;

  const { inputs, outputs } = splitOnDivider(list);
  const hasOutputs = outputs.length > 0;

  for (let i = 0; i < inputs.length; i++) {
    const isLastInput = i === inputs.length - 1;
    // Drop the trailing dashed rule on the last input when outputs follow,
    // so the gap reads as a clean section break (no dangling separator).
    y = renderItem(doc, inputs[i], x, y, colW, !(isLastInput && hasOutputs));
  }

  if (hasOutputs) {
    y += MIN_DIVIDER_GAP;
    for (let i = 0; i < outputs.length; i++) {
      const isLast = i === outputs.length - 1;
      y = renderItem(doc, outputs[i], x, y, colW, !isLast);
    }
  }

  return y;
}

function buildOne(kind, lang, presskit) {
  const rider = presskit.rider[lang];
  const s = presskit.strings[lang];
  const labels = rider.pdfLabels || { note: "Note", backline: "Backline", booking: "Booking" };
  const out = outputFor(kind.id, lang);

  const M = 56;
  const doc = new PDFDocument({
    size: "A4",
    margin: M,
    info: {
      Title: `Josep Bernad - ${s.riderTitle} - ${rider[kind.nameKey]}`,
      Author: "Josep Bernad",
      Subject: `${s.riderTitle} - ${rider[kind.nameKey]}`,
      Keywords: `rider, ${kind.id} set, technical, booking`,
      Creator: "josepbernad.com",
      Producer: "josepbernad.com",
      CreationDate: PDF_EPOCH,
      ModDate: PDF_EPOCH,
    },
  });
  // Override pdfkit's random /ID trailer with a deterministic one derived
  // from the output filename, so byte-identical content produces byte-identical PDFs.
  doc._id = crypto.createHash("md5").update(path.basename(out)).digest();

  fs.mkdirSync(path.dirname(out), { recursive: true });
  // Collect pdfkit's output into memory and write it synchronously at the
  // end. Piping `doc` into an fs.WriteStream raced with pdfkit's image
  // embedding: the writable would emit 'finish'/'close' before pdfkit had
  // pushed all bytes, leaving stub PDFs on disk (recurring 1.13.3 bug).
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));

  const W = doc.page.width;
  const H = doc.page.height;
  const CW = W - M * 2;

  // === Header strip ===
  let y = M;
  caps(doc, s.riderTitle, M, y, { size: 8, color: INK, spacing: 2 });
  y += 22;

  // Wordmark (real logo asset, falls back to typed text if PNG missing).
  // Read into a Buffer first: passing a path lets pdfkit decide when to read
  // the file, which has historically raced with build-presskit.js's wordmark
  // regeneration step and produced rider PDFs without the embedded logo.
  const wordmarkW = 320;
  const wordmarkH = wordmarkW / WORDMARK_ASPECT;
  if (fs.existsSync(WORDMARK_PNG)) {
    const wordmarkBuf = fs.readFileSync(WORDMARK_PNG);
    doc.image(wordmarkBuf, M, y, { width: wordmarkW });
  } else {
    doc.font("Helvetica-Bold").fontSize(40).fillColor(INK);
    doc.text("JOSEP BERNAD", M, y, { characterSpacing: 5, lineBreak: false });
  }
  y += wordmarkH + 18;

  rule(doc, M, y, CW, INK, 0.8);
  y += 28;

  // === Single full-width list for this kind ===
  y = renderList(doc, M, y, CW, rider[kind.nameKey], rider[kind.badgeKey], rider[kind.listKey]);
  y += 18;

  // === Notes ===
  rule(doc, M, y, CW, INK, 0.6);
  y += 18;

  const labelW = 80;
  const noteW = CW - labelW;

  caps(doc, labels.note, M, y + 1, { size: 8, color: MUTED, spacing: 2 });
  doc.font("Helvetica").fontSize(10).fillColor(INK);
  doc.text(rider.note, M + labelW, y, { width: noteW });
  y = doc.y + 12;

  if (kind.showGuests && rider.guestsNote && labels.guests) {
    caps(doc, labels.guests, M, y + 1, { size: 8, color: MUTED, spacing: 2 });
    doc.font("Helvetica").fontSize(10).fillColor(INK);
    doc.text(rider.guestsNote, M + labelW, y, { width: noteW });
    y = doc.y + 12;
  }

  caps(doc, labels.backline, M, y + 1, { size: 8, color: MUTED, spacing: 2 });
  doc.font("Helvetica").fontSize(10).fillColor(INK);
  // Strip emoji from JSON text — PDFKit's standard fonts can't encode them.
  const backlineNote = rider.globalNote.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
  doc.text(backlineNote, M + labelW, y, { width: noteW });

  // === Footer (anchored) ===
  const footerY = H - M - 50;
  rule(doc, M, footerY, CW, INK, 0.6);

  // Left side: contact (email + phone), bold mono.
  doc.font("Courier-Bold").fontSize(10).fillColor(INK);
  const emailY = footerY + 12;
  const phoneY = footerY + 26;
  const emailW = doc.widthOfString(TECH_EMAIL);
  const phoneW = doc.widthOfString(TECH_PHONE);
  doc.text(TECH_EMAIL, M, emailY, { lineBreak: false });
  doc.text(TECH_PHONE, M, phoneY, { lineBreak: false });
  doc.link(M, emailY, emailW, 11, `mailto:${TECH_EMAIL}`);
  doc.link(M, phoneY, phoneW, 11, `tel:${TECH_PHONE_TEL}`);

  // Right side: site + IG, regular mono, muted.
  doc.font("Courier").fontSize(10).fillColor(MUTED);
  const siteText = "josepbernad.com";
  const igText = "@djosepbernad";
  const siteW = doc.widthOfString(siteText);
  const igW = doc.widthOfString(igText);
  const rightEdge = M + CW;
  doc.text(siteText, M, emailY, { width: CW, align: "right", lineBreak: false });
  doc.text(igText, M, phoneY, { width: CW, align: "right", lineBreak: false });
  doc.link(rightEdge - siteW, emailY, siteW, 11, "https://josepbernad.com");
  doc.link(rightEdge - igW, phoneY, igW, 11, "https://www.instagram.com/djosepbernad/");

  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      try {
        fs.writeFileSync(out, Buffer.concat(chunks));
        resolve(out);
      } catch (err) {
        reject(err);
      }
    });
    doc.on("error", reject);
    doc.end();
  });
}

async function buildRider() {
  const presskit = loadFresh(PRESSKIT_PATH);
  const outputs = [];
  for (const lang of LANGS) {
    for (const kind of KINDS) {
      outputs.push(await buildOne(kind, lang, presskit));
    }
  }
  return outputs;
}

module.exports = { buildRider, outputFor, LANGS, KINDS, OUT_DIR, FILE_PREFIX };

if (require.main === module) {
  buildRider()
    .then((paths) => {
      for (const p of paths) {
        const size = (fs.statSync(p).size / 1024).toFixed(1);
        console.log(`Wrote ${path.relative(process.cwd(), p)} (${size} KB)`);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
