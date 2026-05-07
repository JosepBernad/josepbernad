/**
 * Generate press-kit logo variants from masters in src/press-kit-source/.
 *
 * For each *.svg in src/press-kit-source/, produces in src/press-kit/:
 *   josep-bernad-<name>-black.svg
 *   josep-bernad-<name>-white.svg
 *   josep-bernad-<name>-black.png   (PNG_WIDTH wide, transparent bg)
 *   josep-bernad-<name>-white.png
 *
 * Masters must use fill="currentColor" (or stroke="currentColor"); this script
 * swaps those tokens for #000000 / #ffffff before rasterizing.
 *
 * Run: node scripts/build-presskit.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const archiver = require("archiver");
const { buildRider } = require("./build-rider.js");

const SRC_DIR = path.join(__dirname, "..", "src", "press-kit-source");
const OUT_DIR = path.join(__dirname, "..", "src", "press-kit");
const PNG_WIDTH = 2000;
const FILE_PREFIX = "josep-bernad-";
const ZIP_NAME = `${FILE_PREFIX}press-kit.zip`;

// Source files that are personal/dev-only and must not ship in the public zip.
const DEV_SOURCES = new Set([
  "wordmark-software",
  "wordmark-eng-en",
  "wordmark-eng-es",
  "wordmark-eng-ca",
  "wordmark-dj-live",
]);

const VARIANTS = [
  { suffix: "black", color: "#000000" },
  { suffix: "white", color: "#ffffff" },
];

function colorize(svg, color) {
  return svg.replace(/currentColor/g, color);
}

async function buildOne(srcPath) {
  const name = path.basename(srcPath, ".svg");
  const master = fs.readFileSync(srcPath, "utf8");
  if (!master.includes("currentColor")) {
    throw new Error(
      `${path.relative(process.cwd(), srcPath)} must use fill/stroke="currentColor"`
    );
  }

  const outputs = [];
  for (const { suffix, color } of VARIANTS) {
    const colored = colorize(master, color);
    const outBase = `${FILE_PREFIX}${name}-${suffix}`;
    const svgOut = path.join(OUT_DIR, `${outBase}.svg`);
    const pngOut = path.join(OUT_DIR, `${outBase}.png`);

    fs.writeFileSync(svgOut, colored);
    await sharp(Buffer.from(colored), { density: 384 })
      .resize({ width: PNG_WIDTH })
      .png()
      .toFile(pngOut);

    outputs.push(svgOut, pngOut);
    console.log(
      `  ${path.relative(process.cwd(), svgOut)} + ${path.basename(pngOut)} (${PNG_WIDTH}px)`
    );
  }
  return { name, outputs };
}

// Fixed epoch for zip entry timestamps, matching PDF_EPOCH in build-rider.js.
// Without this, archiver reads each file's mtime from disk and embeds it in
// the zip header, dirtying `git status` on every rebuild even when the
// archived files are byte-identical.
const ZIP_EPOCH = new Date("2020-01-01T00:00:00Z");

function buildZip(publicFiles) {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(OUT_DIR, ZIP_NAME);
    const stream = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    stream.on("close", () => {
      const sizeKb = (archive.pointer() / 1024).toFixed(1);
      console.log(`Wrote ${path.relative(process.cwd(), zipPath)} (${publicFiles.length} files, ${sizeKb} KB)`);
      resolve();
    });
    archive.on("error", reject);

    archive.pipe(stream);
    // Sort to guarantee a stable entry order across filesystems.
    const sorted = [...publicFiles].sort();
    // Read bytes synchronously and append as Buffers, instead of letting
    // archiver lazily fs.createReadStream(path) at finalize-time. The lazy
    // path raced with pdfkit stream flushing and intermittently produced
    // truncated/zero-byte rider PDFs inside the zip (the bug behind 1.13.3).
    for (const f of sorted) {
      archive.append(fs.readFileSync(f), { name: path.basename(f), date: ZIP_EPOCH });
    }
    archive.finalize();
  });
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.log(`No ${path.relative(process.cwd(), SRC_DIR)} directory; skipping.`);
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sources = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.toLowerCase().endsWith(".svg"))
    .map((f) => path.join(SRC_DIR, f));

  if (sources.length === 0) {
    console.log("No SVG masters in press-kit-source/; skipping.");
    return;
  }

  const publicFiles = [];
  for (const src of sources) {
    console.log(`Building from ${path.relative(process.cwd(), src)}:`);
    const { name, outputs } = await buildOne(src);
    if (!DEV_SOURCES.has(name)) {
      publicFiles.push(...outputs);
    }
  }

  // Build language-specific rider PDFs now that the wordmark assets exist.
  // Rider PDFs embed the wordmark PNG produced above, so this must run after
  // the logo loop.
  console.log("Building rider PDFs:");
  const riderPaths = await buildRider();
  for (const p of riderPaths) {
    console.log(`  ${path.relative(process.cwd(), p)}`);
    publicFiles.push(p);
  }

  if (publicFiles.length) {
    await buildZip(publicFiles);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
