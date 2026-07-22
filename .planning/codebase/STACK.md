# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- HTML (Nunjucks-templated) - all page templates in `src/`
- CSS - single stylesheet at `src/css/styles.css`
- JavaScript (ES5 IIFE) - client-side logic at `src/js/main.js`

**Secondary:**
- JSON - all content/data stored as static JSON in `src/_data/`

## Runtime

**Environment:**
- Node.js 24.x (configured in `.vercel/project.json`; used by Vercel builds)

**Package Manager:**
- pnpm
- Lockfile: `pnpm-lock.yaml`
- `pnpm-workspace.yaml` approves the `sharp` native build (used by the favicon script)

## Frameworks

**Core:**
- `@11ty/eleventy` ^3.1.2 (resolved: 3.1.2) - static site generator; config at `.eleventy.js`

**Template Engine:**
- Nunjucks (`.njk`) - built into Eleventy; used for all pages and layouts
- Markdown (`.md`) - supported but not currently used for content pages

**Testing:**
- None — no testing framework is present

**Build/Dev:**
- `eleventy --serve` - dev server with live reload
- `eleventy` - production build; outputs to `_site/`

## Key Dependencies

**Direct (devDependencies):**
- `@11ty/eleventy` ^3.1.2 - the only declared dependency

**Bundled with Eleventy (transitive, not separately declared):**
- `@11ty/eleventy-dev-server` ^2.0.8 - local dev server
- `@11ty/eleventy-plugin-bundle` ^3.0.6 - asset bundling
- `nunjucks` - template rendering (pulled in by Eleventy)

**Runtime CDN (loaded in browser, not npm):**
- Vidstack Player (`vidstack@next`) - video player web components; loaded via jsDelivr CDN
  - CSS: `https://cdn.jsdelivr.net/npm/vidstack@next/player/styles/...`
  - JS: `https://cdn.jsdelivr.net/npm/vidstack@next/cdn/with-layouts/vidstack.js`
  - Only loaded on `films` and `home` pages (conditional in `src/_includes/base.njk`)
- Google Fonts (`Sedan` family) - loaded via `fonts.googleapis.com`

## Configuration

**Eleventy:**
- Config file: `.eleventy.js`
- Input: `src/`
- Output: `_site/`
- Includes: `src/_includes/`
- Data: `src/_data/`
- Template formats: `njk`, `html`, `md`
- HTML template engine: Nunjucks
- Markdown template engine: Nunjucks

**No build-time environment variables required** — the site is fully static with no server-side secrets.

**Version tracking:**
- `package.json` holds the version string
- `src/version.11ty.js` generates a public `/version.json` endpoint at build time

## Platform Requirements

**Development:**
- Node.js 20+
- pnpm (for `pnpm install`)
- Run `pnpm run dev` for local dev server

**Production:**
- Static files only — no server runtime required
- Output directory: `_site/`
- Deployed to Vercel via Git Integration (Eleventy preset, Node 24.x; auto-deploys on push to `main`)

---

*Stack analysis: 2026-04-15*
