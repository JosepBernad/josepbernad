# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Static Site Generation (SSG) with multilingual pagination

**Key Characteristics:**
- All pages are pre-rendered at build time to static HTML — zero server-side runtime
- Multilingual support (EN/ES/CA) is achieved via Eleventy pagination over a languages array, producing one copy of each page per locale
- Client-side JavaScript handles i18n text replacement, theme toggling, and video modal interactions post-load
- Content (films, bio text, SEO strings) lives in JSON data files — no CMS or database

## Layers

**Data Layer:**
- Purpose: Provides structured content and configuration to templates
- Location: `src/_data/`
- Contains: JSON files for films, home copy, about copy, contact, SEO metadata, and language definitions
- Depends on: Nothing (static files)
- Used by: All Nunjucks templates via Eleventy's global data cascade

**Template Layer:**
- Purpose: Renders data into HTML at build time
- Location: `src/_includes/`, `src/pages/`, `src/404.njk`, `src/sitemap.njk`, `src/robots.njk`
- Contains: Nunjucks `.njk` templates
- Depends on: `src/_data/` (data), `src/_includes/base.njk` (layout)
- Used by: Eleventy build pipeline

**Client Runtime Layer:**
- Purpose: Handles interactivity that cannot be pre-rendered (translations, theming, video player, newsletter)
- Location: `src/js/main.js`
- Contains: Vanilla JavaScript IIFE
- Depends on: Public JSON endpoints served from `/data/*.json`, Vidstack CDN, GoatCounter CDN
- Used by: Browser at page load

**Build Output:**
- Location: `_site/` (git-ignored)
- Contains: Flat static HTML files, copied CSS/JS/images, and public JSON data files

## Data Flow

**Content to HTML:**
1. Eleventy reads `src/_data/languages.json` (3 locales)
2. Pages in `src/pages/` use `pagination` over the languages list — each template generates 3 output files (e.g., `/films/`, `/es/films/`, `/ca/films/`)
3. Template receives language metadata (`lang.code`, `lang.prefix`) and all global data (`films`, `home`, `seo`, etc.)
4. Nunjucks renders the template with `src/_includes/base.njk` as layout
5. Eleventy writes static `.html` files to `_site/`

**Client-Side i18n:**
1. Page HTML is rendered in English by default (fallback text in template)
2. On load, `main.js` fetches `/data/home.json`, `/data/films.json`, `/data/about.json`, `/data/contact.json` via `Promise.all`
3. The `lang` attribute on `<html>` (set at build time from URL) determines active locale
4. Elements with `data-i18n`, `data-i18n-html`, `data-i18n-placeholder` attributes are updated in-place

**Video Playback:**
1. Film cards render with YouTube thumbnail images (`img.youtube.com`)
2. On card click, `main.js` opens a `<media-player>` (Vidstack web component) in a modal
3. Vidstack is loaded from CDN only on pages where `pageId == 'films'` or `pageId == 'home'`

## Key Abstractions

**Language Pagination:**
- Purpose: Generates one output page per locale from a single source template
- Examples: `src/pages/home.njk`, `src/pages/films.njk`, `src/pages/about.njk`, `src/pages/contact.njk`
- Pattern: Each page template has a `pagination` block over `languages.list` with `size: 1`; permalink uses `{{ lang.prefix }}` which is `""`, `"/es"`, or `"/ca"`

**Global Data Files (also served as public JSON):**
- Purpose: Dual-use — consumed by Eleventy at build time AND served as `/data/*.json` for runtime i18n
- Examples: `src/_data/films.json`, `src/_data/home.json`, `src/_data/about.json`, `src/_data/contact.json`
- Pattern: `.eleventy.js` copies these files to `_site/data/` via `addPassthroughCopy`

**Base Layout:**
- Purpose: Single shared HTML shell for all pages
- File: `src/_includes/base.njk`
- Contains: `<head>` with SEO, Open Graph, hreflang tags, structured data JSON-LD, font/CSS links, conditional Vidstack CDN inclusion; `<body>` with header/footer includes and `{{ content | safe }}`

**Computed Global Data:**
- Purpose: Derives `urlLang` and `urlLangPrefix` from the current page URL at build time
- Location: `.eleventy.js` `addGlobalData("eleventyComputed", ...)`
- Used by: Templates and `base.njk` for language-aware link generation

## Entry Points

**Eleventy Config:**
- Location: `.eleventy.js`
- Triggers: `pnpm run build` or `pnpm run dev`
- Responsibilities: Registers passthrough copies, adds computed global data, sets input/output directories and template engine

**Client JS Entry:**
- Location: `src/js/main.js`
- Triggers: Page load (included as last `<script>` in `base.njk`)
- Responsibilities: Theme init, i18n fetch + apply, social label hover, film image skeleton, newsletter form (Mailchimp JSONP), video modal

**Utility Template — version.json:**
- Location: `src/version.11ty.js`
- Triggers: Build
- Responsibilities: Reads `package.json` version, outputs `/version.json` for external version monitoring

## Error Handling

**Strategy:** Minimal — static site has no server logic. Client JS uses `.catch(() => {})` silently for translation fetch failures and falls back to build-time English text.

**Patterns:**
- Translation fetch failure: silently ignored; template-rendered English text remains
- Newsletter submission error: re-shows the banner with a localized error message
- Mailchimp JSONP `script.onerror`: calls `showError()` to restore banner

## Cross-Cutting Concerns

**Theming:** `data-theme` attribute on `<html>` toggled by `main.js`; persisted to `localStorage`; respects `prefers-color-scheme` media query; favicon swapped between `favicon-light.svg` and `favicon-dark.svg`

**SEO:** All metadata (title, description, OG, Twitter cards, hreflang, canonical, JSON-LD) rendered server-side in `base.njk` from `src/_data/seo.json` keyed by `pageId` and `lang`

**Analytics:** GoatCounter (`gc.zgo.at/count.js`) — privacy-friendly, cookie-free, async script injected in `base.njk`

**Deployment:** Vercel Git Integration — on push to `main`, Vercel builds with the Eleventy preset (Node 24.x) and deploys `_site/` to the production alias. Custom domain `josepbernad.com` (+ `www`) is attached via `vercel domains add`; DNS at cdmon points apex to `76.76.21.21` and `www` CNAME to `cname.vercel-dns.com`.

---

*Architecture analysis: 2026-04-15*
