const { buildRider } = require("./scripts/build-rider.js");
const { execSync } = require("child_process");

const MONTHS_SHORT = {
  en: ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],
  es: ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"],
  ca: ["GEN","FEB","MAR","ABR","MAI","JUN","JUL","AGO","SET","OCT","NOV","DES"]
};

function parseISODate(str) {
  const parts = (str || "").split("-");
  return {
    year: parseInt(parts[0], 10),
    monthIdx: parseInt(parts[1], 10) - 1,
    day: parts[2] || ""
  };
}

module.exports = function(eleventyConfig) {
  // Localhost-only dev pages live under src/dev/. Ignore them in
  // production / one-off builds; only emit during `eleventy --serve`.
  if (process.env.ELEVENTY_RUN_MODE !== "serve") {
    eleventyConfig.ignores.add("src/dev/**");
  } else {
    // Regenerate the rider PDFs on every rebuild so editing
    // src/_data/presskit.json live-refreshes the localhost preview.
    // The PDFs land in src/press-kit/ (passthrough-copied), so we must
    // tell the watcher to ignore them — otherwise writing the PDFs
    // re-triggers the build and we get an infinite loop.
    eleventyConfig.watchIgnores.add("src/press-kit/josep-bernad-rider-*.pdf");
    eleventyConfig.on("eleventy.before", async () => {
      try {
        await buildRider();
      } catch (err) {
        console.error("[rider] build failed:", err);
      }
    });
  }

  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/press-kit");
  eleventyConfig.addPassthroughCopy("src/favicon-light.svg");
  eleventyConfig.addPassthroughCopy("src/favicon-dark.svg");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy({ "src/_data/about.json": "data/about.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/home.json": "data/home.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/films.json": "data/films.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/contact.json": "data/contact.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/live.json": "data/live.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/presskit.json": "data/presskit.json" });

  // Live date part filters
  eleventyConfig.addFilter("liveDay", (date) => {
    const { day } = parseISODate(date);
    return day;
  });
  eleventyConfig.addFilter("liveMonth", (date, lang) => {
    const { monthIdx } = parseISODate(date);
    const months = MONTHS_SHORT[lang] || MONTHS_SHORT.en;
    return months[monthIdx] || "";
  });
  eleventyConfig.addFilter("liveYear", (date) => {
    const { year } = parseISODate(date);
    return isNaN(year) ? "" : String(year);
  });
  // Short date for the home pill, "8 MAY"
  eleventyConfig.addFilter("liveDateShort", (date, lang) => {
    const { day, monthIdx } = parseISODate(date);
    const months = MONTHS_SHORT[lang] || MONTHS_SHORT.en;
    const d = String(parseInt(day, 10) || "").trim();
    return `${d} ${months[monthIdx] || ""}`.trim();
  });
  // Filter upcoming events: only those with date >= today, excluding hidden
  eleventyConfig.addFilter("upcomingOnly", (events) => {
    if (!Array.isArray(events)) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events.filter(ev => {
      if (ev.hidden) return false;
      const d = new Date(ev.date);
      return !isNaN(d) && d >= now;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  });
  // Sort past descending, excluding hidden
  eleventyConfig.addFilter("pastDesc", (events) => {
    if (!Array.isArray(events)) return [];
    return events
      .filter(ev => !ev.hidden)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  // Same as pastDesc, but only keeps events with a video or SoundCloud track
  eleventyConfig.addFilter("pastWithMediaDesc", (events) => {
    if (!Array.isArray(events)) return [];
    return events
      .filter(ev => !ev.hidden && (ev.videoId || ev.soundcloudUrl))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // Last git commit date (YYYY-MM-DD) touching any of the given source
  // files. Used for sitemap <lastmod> so static pages report when their
  // content actually changed instead of the build date. Returns "" when
  // git is unavailable or the file has no commit in the available history
  // (e.g. a shallow CI clone); callers fall back to the build date.
  eleventyConfig.addFilter("gitLastMod", (paths) => {
    const files = (Array.isArray(paths) ? paths : [paths]).filter(Boolean);
    if (files.length === 0) return "";
    try {
      return execSync(
        `git log -1 --format=%cs -- ${files.map(f => `'${f}'`).join(" ")}`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      ).trim();
    } catch {
      return "";
    }
  });

  // True only under `eleventy --serve` (local dev), so templates can render
  // preview-only affordances that must not ship to the deployed site.
  eleventyConfig.addGlobalData("isDev", process.env.ELEVENTY_RUN_MODE === "serve");

  // Build calendar month grids for the availability page from
  // src/_data/availability.json. Weeks start on Monday. Days that fall
  // outside the configured range render muted so the grid stays aligned.
  // Any day inside the range that is not listed in `days` defaults to
  // "available", so the JSON only needs to track exceptions.
  eleventyConfig.addFilter("availabilityCalendar", (avail, lang, padded = false) => {
    if (!avail || !avail.range) return [];
    // Days flagged "fake" in availability.json are padding. Only the padded
    // build (/[lang]/a/availability/) renders them, and there they look like
    // any other reservation; the clean build drops them back to "available"
    // so nothing about them reaches that page. On the localhost preview the
    // padded ones are outlined so they stay distinguishable while editing.
    const markFake = padded && process.env.ELEVENTY_RUN_MODE === "serve";
    const MONTH_NAMES = {
      es: [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ],
      ca: [
        "gener", "febrer", "març", "abril", "maig", "juny",
        "juliol", "agost", "setembre", "octubre", "novembre", "desembre"
      ],
      en: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
    };
    const MONTH_NAMES_ES = MONTH_NAMES[lang] || MONTH_NAMES.es;
    const start = new Date(avail.range.start + "T00:00:00Z");
    const end = new Date(avail.range.end + "T00:00:00Z");
    if (isNaN(start) || isNaN(end) || start > end) return [];
    // Months already over at build time never render; a client-side pass on
    // the page removes any month that finishes between deploys, so both the
    // HTML and the visitor's view only ever show the current month onward.
    const today = new Date();
    const firstOfCurrentMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const months = [];
    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cursor <= end) {
      if (cursor < firstOfCurrentMonth) {
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
        continue;
      }
      const y = cursor.getUTCFullYear();
      const m = cursor.getUTCMonth();
      const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const firstDow = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // Monday = 0
      const name = MONTH_NAMES_ES[m];
      // Catalan elides the preposition before a vowel ("1 d'agost", not
      // "1 de agost"). Spanish keeps "de" in every case; English puts the
      // month first and needs no preposition at all.
      const de = (lang === "ca" && /^[aeiou]/i.test(name)) ? "d'" : "de ";
      const dayLabel = (d) => lang === "en" ? `${name} ${d}` : `${d} ${de}${name}`;

      const cells = [];
      const notes = [];
      for (let i = 0; i < firstDow; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const date = new Date(iso + "T00:00:00Z");
        if (date < start || date > end) {
          cells.push({ day: d, out: true });
          continue;
        }
        const entry = (avail.days && avail.days[iso]) || {};
        // Outside the padded build a fake day is treated as if it were never
        // listed at all: no status, no note, no marker.
        const info = (!padded && entry.fake === true) ? {} : entry;
        const cell = {
          day: d,
          iso,
          label: dayLabel(d),
          status: info.status || "available",
          note: info.note || "",
          fake: markFake && info.fake === true
        };
        cells.push(cell);
        if (cell.note) notes.push({ day: d, label: cell.label, note: cell.note });
      }
      while (cells.length % 7 !== 0) cells.push(null);
      const weeks = [];
      for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
      months.push({
        year: y,
        name,
        de,
        ym: `${y}-${String(m + 1).padStart(2, "0")}`,
        weeks,
        notes
      });
      cursor = new Date(Date.UTC(y, m + 1, 1));
    }
    return months;
  });

  // Long-form localized date ("21 de julio de 2026") from an ISO date,
  // used by the availability page's "last updated" line.
  eleventyConfig.addFilter("availabilityDate", (iso, lang) => {
    const locales = { es: "es-ES", ca: "ca-ES", en: "en-GB" };
    const d = new Date(iso + "T00:00:00Z");
    if (isNaN(d)) return iso;
    return new Intl.DateTimeFormat(locales[lang] || locales.es, {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    }).format(d);
  });

  // Add global data for language prefix based on URL
  eleventyConfig.addGlobalData("eleventyComputed", {
    urlLangPrefix: (data) => {
      const url = data.page?.url || '';
      if (url.startsWith('/en/') || url === '/en') return '/en';
      if (url.startsWith('/es/') || url === '/es') return '/es';
      if (url.startsWith('/ca/') || url === '/ca') return '/ca';
      return '';
    },
    urlLang: (data) => {
      const url = data.page?.url || '';
      if (url.startsWith('/en/') || url === '/en') return 'en';
      if (url.startsWith('/es/') || url === '/es') return 'es';
      if (url.startsWith('/ca/') || url === '/ca') return 'ca';
      return 'en';
    }
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "html", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
