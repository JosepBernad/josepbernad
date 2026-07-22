# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**Video Hosting:**
- YouTube - all film/set videos are hosted on YouTube
  - Thumbnails fetched directly: `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`
  - Video IDs stored in `src/_data/films.json` per item (`videoId` field)
  - No YouTube API key required — thumbnail URLs are public

**Video Player:**
- Vidstack Player (`vidstack@next`) - web component-based video player
  - Loaded via jsDelivr CDN (no npm install, no API key)
  - Used in `src/_includes/video-modal.njk` and conditionally loaded in `src/_includes/base.njk`
  - Plays YouTube videos inline via modal

**Email Marketing:**
- Mailchimp - newsletter subscription
  - Integration method: JSONP (no SDK, no server-side proxy)
  - Endpoint hardcoded in `src/js/main.js`:
    `https://gmail.us2.list-manage.com/subscribe/post-json?u=ec19e426d1a78e9baa513bfaf&id=7a99017863&f_id=00f8eae3f0`
  - No API key required (uses public list URL)
  - Spam protection: timing honeypot (rejects submissions under 3 seconds) + Mailchimp's built-in hidden field honeypot

## Data Storage

**Databases:**
- None — no database

**File Storage:**
- Local filesystem only — all content is static JSON files in `src/_data/`
  - `src/_data/home.json` - homepage content and translations
  - `src/_data/films.json` - film/video catalogue with YouTube IDs
  - `src/_data/about.json` - about page content
  - `src/_data/contact.json` - contact page content
  - `src/_data/seo.json` - per-page SEO metadata
  - `src/_data/languages.json` - i18n language list (en, es, ca)

**Caching:**
- None — static site, no server-side caching layer

## Authentication & Identity

**Auth Provider:**
- None — no user authentication

## Analytics & Monitoring

**Analytics:**
- GoatCounter - privacy-friendly, cookie-free analytics
  - Script: `//gc.zgo.at/count.js`
  - Endpoint: `https://josepbernad.goatcounter.com/count`
  - Loaded via async script tag in `src/_includes/base.njk`
  - No API key visible in templates (server-side only for GoatCounter dashboard)

**Error Tracking:**
- None — no error tracking service integrated

**Uptime / Version Monitoring:**
- Public `/version.json` endpoint generated at build time by `src/version.11ty.js`
  - Serves `{ "version": "x.y.z" }` from `package.json`
  - Allows external monitors to detect deployed version

## Fonts & CDN

**Google Fonts:**
- Font: `Sedan` (italic + non-italic)
- Loaded via `fonts.googleapis.com` / `fonts.gstatic.com`
- Preconnect and preload hints in `src/_includes/base.njk`

**jsDelivr CDN:**
- Hosts Vidstack player assets (CSS + JS)
- No API key required

## CI/CD & Deployment

**Hosting:**
- Vercel — static site, custom domains `josepbernad.com` and `www.josepbernad.com` (attached to Vercel project `josepbernad.com` in team `josep-bernads-projects`). DNS at cdmon: apex A → `76.76.21.21`, `www` CNAME → `cname.vercel-dns.com`.

**CI Pipeline:**
- Vercel Git Integration — auto-deploys on push to any branch
  - Trigger: push to `main` → Production deploy; push to other branches → Preview deploy
  - Framework preset: Eleventy; Node 24.x; build command `pnpm run build`; output `_site/`
  - No secrets or environment variables required

## Environment Configuration

**Required env vars:**
- None — the site has no server runtime and requires no environment variables for build or deployment

**Secrets location:**
- No secrets managed; Mailchimp list URL and GoatCounter endpoint are public-facing values embedded directly in source files

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Mailchimp JSONP callback: dynamic `<script>` tag appended to `<body>` at newsletter form submission time (see `src/js/main.js`)

## Social Profiles Referenced

The following external profiles are referenced in structured data (`src/_includes/base.njk`) and page content but are not API integrations:
- Instagram: `https://www.instagram.com/djosepbernad/`
- YouTube: `https://www.youtube.com/@JosepBernad`
- Spotify: `https://open.spotify.com/artist/1f320LpftKzOM47I0RgMfJ`
- SoundCloud: `https://soundcloud.com/djosepbernad`
- LinkedIn: `https://www.linkedin.com/in/josepbernad/`
- GitHub: `https://github.com/JosepBernad`

---

*Integration audit: 2026-04-15*
