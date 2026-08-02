# Changelog

All notable changes to this project will be documented in this file.

## [1.23.1] - 2026-08-02

### Changed
- Availability calendar no longer shows months that have already ended: the `availabilityCalendar` filter skips them at build time, and the page's inline script also removes any month that finishes between deploys so the visitor's view tracks real time.
- Marked 2026-08-14 as booked (`unavailable`) in `src/_data/availability.json` (it was previously a fake padding reservation) and bumped the `updated` date to 2026-08-02.

## [1.23.0] - 2026-07-22

### Added
- New availability calendar at `/{lang}/availability/`, driven by `src/_data/availability.json`. Month grids start on Monday, days inside `range` default to "available" so the JSON only tracks exceptions, and a client script mutes days before the visitor's own current date instead of the build date. Two Eleventy filters back it: `availabilityCalendar` (builds the month/week cells, localized month names, Catalan `d'` elision) and `availabilityDate` (long-form localized "last updated" line). The page is standalone (no site chrome) and carries `noindex, nofollow` in both the meta tag and an `X-Robots-Tag` header.
- Second build of the same calendar at `/{lang}/a/availability/` that also renders the days flagged `"fake": true` in the JSON, for sharing a fuller-looking agenda. The split happens at build time via `src/_data/availabilityViews.js` (paginates the template over language x variant), so the clean URL's HTML contains no trace of the flagged days: they fall back to "available" and any note on them is dropped. Under `eleventy --serve` the flagged days get a dashed outline on the padded page only, so they stay distinguishable while editing.
- `isDev` global data (`ELEVENTY_RUN_MODE === "serve"`) for preview-only affordances that must not ship.
- `vercel.json` redirects for the unprefixed `/availability` and `/a/availability` (with and without trailing slash) to their `/es/` equivalents.

### Changed
- Switched the package manager from npm to pnpm: `package-lock.json` removed, `pnpm-lock.yaml` added, and `pnpm-workspace.yaml` approves the `sharp` native build used by the favicon script. Updated the npm references in `package.json` scripts, `playwright.config.js` `webServer.command`, `vercel.json` `devCommand`, the rider preview header comment, and the `.planning/codebase` docs.

### Fixed
- Flaky video modal e2e tests. `beforeEach` now waits on `typeof window.openVideo === 'function'` instead of `networkidle`, which tied the tests to jsDelivr latency (the films page loads vidstack from a CDN). The "close button dismisses the modal" test is skipped above 750px, where the button stays `opacity: 0` until the Vidstack player renders its controls; desktop dismissal is still covered by the Escape and backdrop tests.

## [1.22.1] - 2026-05-27

### Changed
- Sitemap `<lastmod>` for the static pages (home, about, contact, press-kit) now reflects the date of the last git commit that touched the page's template or its data JSON, instead of the build date. Added a `gitLastMod` Eleventy filter (`git log -1 --format=%cs -- <files>`) that falls back to the build date when git history is unavailable (e.g. a shallow CI clone). `films` and `live` keep their existing content-driven dates.

## [1.22.0] - 2026-05-20

### Changed
- Home hero "Upcoming shows" pill replaced with a compact calendar-event card (date column + event title + venue + time) that mirrors the date block used on `/live/`. Removes the animated dot and uppercase "UPCOMING SHOWS · NEXT…" wording that read as a generic notification badge. The venue label drops anything after the first comma to keep it short. Unused `home.nextShow.label` / `home.nextShow.next` i18n keys and the matching loader line in `src/js/main.js` removed.

### Added
- Deep-link to a single live event via the URL hash. Every `<article class="live-card">` (upcoming and past) now carries a stable `id="event-{YYYY-MM-DD}-{index}"`. On `/live/`, a small client script reads `location.hash`, smooth-scrolls the matching card into view (`block: 'center'`), and applies an `.is-highlighted` class for ~2 s — a neutral box-shadow ring (white in dark mode, black in light, no accent color). Also listens to `hashchange` so the highlight re-fires when re-anchoring. `scroll-margin-top: 6rem` clears the sticky header. The home calendar card now links to `/{lang}/live/#event-{date}-0` so clicking it lands on the next upcoming gig pre-highlighted.
- Dev-only "share event" button on every `.live-card` (upcoming + past). Hidden behind `[data-dev]` and revealed by the existing `dev-affordances.njk` script (localhost or saved dev flag). Clicking copies `${origin}${pathname}#${id}` to the clipboard via `navigator.clipboard.writeText`, with a brief green-icon confirmation. Falls back to `window.prompt` if clipboard access is blocked.

### Fixed
- Restored the 2026-05-22 SEN Chill Beach Bar gig in `src/_data/live.json` (event, venue, time 18:30, map, description, lineup). It had been removed at some point during local edits.

## [1.21.0] - 2026-05-20

### Added
- Root `/` is now a neutral language landing page (`src/index.njk`). It auto-redirects to the visitor's saved `lang-preference` when present; otherwise it shows EN/CA/ES buttons. Honours a `?next=<path>` query against a whitelist (`/films/`, `/about/`, `/live/`, `/contact/`, `/press-kit/`) so legacy section links deep-link into the picked language.
- `vercel.json`: 308 redirects for every legacy unprefixed section (`/films`, `/about`, `/live`, `/contact`, `/press-kit`, with and without trailing slash) → `/?next=<urlencoded-path>` so old shared links land on the picker carrying the section.
- Centralised dev affordances in `src/_includes/dev-affordances.njk` (included from `src/_includes/base.njk` on every page). Auto-active on localhost, with an easter-egg trigger: 5 taps on the home-page logo within 2 s flips a persistent `dev-mode` flag in `localStorage`. A "Reset storage" chip clears it. Reveals any `[data-dev][hidden]` element and sets `html[data-dev=true]`.
- Custom video poster overlay in `src/_includes/video-modal.njk`: bypasses YouTube's low-res default thumbnail by probing `maxresdefault` and falling back to `hqdefault`. Tapping the poster is the user gesture that starts playback, so audio works on first play.
- `?v=<videoId>` deep linking on the films page. Opening a video updates `location.search` to `?v=…`; loading a films URL with `?v=…` opens the matching card on first paint (skipping autoplay since there's no user gesture). Closing the modal strips `v` from the URL.
- New `src/_includes/live-lineup.njk` macro renders DJ lineup rows (time + name with optional Instagram link). Used by `src/pages/live.njk` for upcoming events.
- New `pastWithMediaDesc` Eleventy filter in `.eleventy.js`: same as `pastDesc` but filters past events down to those with a `videoId` or `soundcloudUrl`. The live page's past list now uses it so completed gigs without a recording drop off automatically.
- Press-kit deep linking in `src/pages/press-kit.njk`: every section gets a stable `id` (`bio`, `formats`, `logos`, `rider`, `weddings`, `contact`); rider blocks carry `data-rider="dj"|"live"`. Two new client scripts: one mirrors every control click into URL params (`?bio=&logo=&color=&format=&rider=`), and another reads those same params on load to apply the matching variant, highlight the targeted format/rider, dim the non-targeted rider, and smooth-scroll to the lowest-priority targeted section.
- New live entry in `src/_data/live.json`: "Cap Vermell Padel Tournament" (2026-06-06).
- Lineup added to the 2026-05-24 Kaafu Beach Club gig (Josep Bernad → Julian Mielcarek).
- Full 48-track tracklist for the past 2026-05-16 "Mainly House Music at Kyrat" gig (with soundcloudUrl) in `src/_data/live.json`.
- New `dev:vercel` npm script (`vercel dev`) for the rare cases when local testing needs the Vercel redirect layer.

### Changed
- English routes move from `/` to `/en/`. `src/_data/languages.json` flips `en` from `prefix: ""` / `isDefault: true` to `prefix: "/en"` / `isDefault: false`, putting all three languages on equal footing. Updated everywhere the old assumption was hard-coded: `src/pages/home.njk` permalink, `.eleventy.js` (`urlLang`/`urlLangPrefix` filters now recognise `/en`), `src/sitemap.njk` (all English `loc`s gain `/en/`, `x-default` points at `/en/`), `src/_includes/base.njk` (hreflang and JSON-LD URLs), `src/_includes/header.njk` (EN lang-switcher href), `src/404.njk` (lang detection + nav rewrite), `src/_data/seo.json`, `src/_data/contact.json`, `src/llms.njk`, `src/llms-full.njk`.
- `src/pages/live.njk` tracklist sharing footer drops the language prefix (was `josepbernad.com{{ currentPrefix }}/live`, now bare `josepbernad.com/live`) so a copied tracklist works for any audience.
- `src/_includes/header.njk` home-page logo becomes a `<button data-dev-trigger>` (instead of a plain link) so the dev-mode easter egg can register taps; non-home pages keep the link.
- `src/_data/live.json`: Kaafu Beach Club (2026-05-24) start time `19h` → `18h`.
- `package.json` `dev` script now binds the port (`--port=${PORT:-8080}`) so it doesn't collide with whatever else is running.
- `src/pages/press-kit.njk` removed two duplicated localhost-detection blocks now that `dev-affordances.njk` centralises the reveal.
- `.eleventy.js`: dropped the `CNAME` and `.nojekyll` passthroughs (GitHub Pages leftovers, no longer relevant on Vercel).

### Fixed
- `.video-modal-close` is no longer interactive on mobile while the modal is closed. The previous mobile media query forced `opacity: 1; pointer-events: auto` unconditionally; combined with the modal's `opacity: 0` when inactive, this produced an invisible-but-clickable 44×44 hit target floating vertically centered, which intercepted taps on whatever sat behind it (e.g. an open mobile menu). The rule is now scoped to `.video-modal.active`.

### Tests
- `tests/e2e/i18n.test.js`: replaces the old "/ serves English" assertion with five tests covering the new architecture — `/` shows the picker, `/en/` serves English, saved preference auto-redirects, `?next=/films/` pre-fills button hrefs and deep-links when a preference is saved, and `?next=/evil/` is rejected by the whitelist.
- `tests/e2e/modal.test.js`, `tests/e2e/theme.test.js`: navigate to `/en/...` since `/` no longer serves the app shell.

## [1.20.3] - 2026-05-17

### Fixed
- Default theme in `src/_includes/base.njk` no longer follows the OS's `prefers-color-scheme`. First-time visitors now always get dark mode; the toggle still persists per-user choice in `localStorage`. Previously, anyone whose phone/OS was set to light mode (the default on most devices) saw the site light on first visit, which contradicted the intended dark-first default.

## [1.20.2] - 2026-05-14

### Changed
- Reworded the contact-form `formNote` in `src/_data/contact.json` across all three languages. EN: "I usually reply…" → "I usually answer…". CA: "Et responc en poques hores 🤙" → "Normalment contest en poques hores 🤙". ES: "Te respondo en pocas horas 🤙" → "Normalmente contesto en pocas horas 🤙". Adds an explicit "usually/normalment/normalmente" hedge to soften the promise and standardizes the verb across languages (answer/contest/contesto).

## [1.20.1] - 2026-05-14

### Changed
- Header rhythm tune-up in `src/css/styles.css`. `.header-name-logo` height `2.4rem → 1.6rem` so the brand mark sits at ~1.9× the nav cap height instead of dominating the bar. `.site-header__left` gap `2rem → 2.75rem` and `.site-nav ul` gap `1.5rem → 1.25rem` to widen the logo→nav moat and tighten the nav into one group (2.2× ratio). On the right cluster, `.site-header__controls` gap `0.5rem → 0.75rem` and `.lang-switcher` gap `0.5rem → 0.4rem` so the EN/CA/ES pills bind tighter while the divider gets proper breathing room around it (≈2.5× intra/inter ratio, matching the left side).

### Fixed
- Removed the `filter: grayscale(70%)` on `.about-image img` in `src/css/styles.css` so the about-page portrait renders in full color.

## [1.20.0] - 2026-05-11

### Added
- `.github/workflows/daily-rebuild.yml`: scheduled GitHub Actions workflow that POSTs to a Vercel Deploy Hook each day at 04:10 UTC (just after midnight Madrid). Keeps the build-time `upcomingOnly` / `pastDesc` partition in `live.njk` honest about "today" without needing a manual commit to age out past gigs. Requires a `VERCEL_DEPLOY_HOOK_URL` repo secret pointing at a Vercel deploy hook on `main`.

### Changed
- Migrated the two 2026-05-08 entries (Spritz & Art at Licors Moyà, Mainly House Music at Angels) from `upcoming` to `past` in `src/_data/live.json`. The build-time filter on the previous deploy had baked them as "upcoming" into the static HTML on 2026-05-08; since the site only rebuilds on commit, they stayed in the upcoming section past their date. Moving them now restores correctness immediately; the new daily-rebuild workflow prevents this drift going forward.

## [1.19.1] - 2026-05-08

### Added
- 46-track tracklist for the 2026-04-30 "Mainly House Music at Angels" past gig in `src/_data/live.json`.

### Changed
- Updated today's "Spritz & Art" gig at Licors Moyà (2026-05-08) start time from `19h` to `18:30`.

## [1.19.0] - 2026-05-07

### Changed
- Removed the `today  ·  v${pkg.version}` line from the top-right of every rider PDF in `scripts/build-rider.js`. The stamp regenerated the PDFs on every version bump and every calendar-day rollover, even when no rider content had changed (the recurring "phantom diff" pattern). With it gone, rider PDFs only change when the underlying rider content does. Dropped now-unused `PKG_PATH` and `pkg` plumbing.

## [1.18.2] - 2026-05-07

### Changed
- Regenerated rider PDFs (`src/press-kit/josep-bernad-rider-{dj,live}-{ca,en,es}.pdf`) and the bundled `src/press-kit/josep-bernad-press-kit.zip` so the embedded version stamp tracks the new package version.

## [1.18.1] - 2026-05-07

### Changed
- `src/llms-full.njk` now renders past shows through the `pastDesc` filter (instead of iterating `live.past` directly), so `hidden: true` entries are dropped from the LLM-targeted markdown alongside the rendered `/live` pages.
- Marked the 2026-04-26 "Mainly House Music at Angels" entry in `src/_data/live.json` as `hidden: true`. It is a duplicate of the 2026-04-30 SoundCloud-recorded set added in 1.17.0; the recorded version is the canonical public entry.

## [1.18.0] - 2026-05-07

### Added
- `hidden: true` flag on `live.json` entries now removes them from both the upcoming and past lists. Implemented in `.eleventy.js` via `upcomingOnly` and `pastDesc` filters. Lets a show stay in the data file (with tracklist, etc.) without appearing on `/live`.

### Changed
- Regenerated rider PDFs (`src/press-kit/josep-bernad-rider-{dj,live}-{ca,en,es}.pdf`) so the in-PDF version stamp tracks the new package version.

## [1.17.0] - 2026-05-07

### Added
- New past show in `src/_data/live.json`: "Mainly House Music at Angels" on 2026-04-30 at 21:00 in Angels, Cala Rajada, with en/es/ca event/venue text and a `soundcloudUrl` pointing to the recorded DJ set.

## [1.16.1] - 2026-05-07

### Fixed
- Press-kit zip and rider PDFs are now byte-deterministic across rebuilds. Previously every `npm run build:presskit` run dirtied `git status` for `src/press-kit/josep-bernad-press-kit.zip` and `src/press-kit/josep-bernad-rider-{dj,live}-{ca,en,es}.pdf` even when no source content had changed.
- Resolved the recurring 1.13.3 truncated-rider-PDF bug (random rider showing as a ~3 KB stub inside the zip on roughly 75% of rebuilds). Root cause was a race in `scripts/build-rider.js`: the writable stream emitted `'finish'` before pdfkit had finished pushing image bytes through the pipe, so the next step read partial content. `buildOne` now collects pdfkit's chunks in memory and writes the full buffer with `fs.writeFileSync` after pdfkit emits `'end'`.

### Changed
- `scripts/build-rider.js` pins `CreationDate`/`ModDate` to a fixed epoch and overrides pdfkit's random `/ID` trailer with an md5 of the output filename, so byte-identical content produces byte-identical PDFs.
- `scripts/build-presskit.js` pins zip entry timestamps to the same fixed epoch, sorts public files for stable entry order, and appends each entry as an in-memory Buffer to remove archiver's lazy file-read race.

## [1.16.0] - 2026-05-07

### Changed
- Default theme is now dark for visitors with no saved preference and no explicit `prefers-color-scheme: light` system setting. Previously the default was light unless the system preferred dark. Updated in `src/_includes/base.njk` (inline pre-paint script) and `src/js/main.js` (`getInitialTheme` and the `prefers-color-scheme` change listener).

## [1.15.0] - 2026-05-07

### Added
- Optional `soundcloudUrl` field on past `live.json` entries renders an inline SoundCloud HTML5 widget on past `/live` cards (full-grid-width row, default SoundCloud orange accent, lazy-loaded). Wired in `src/pages/live.njk` and styled via `.live-soundcloud` in `src/css/styles.css`.
- New past show in `src/_data/live.json`: "ES VERMUT des Pas" on 2026-02-07 at 12h in Es Pas a Nivell, Artà, with `soundcloudUrl` pointing to the recorded session.
- "ES VERMUT" (uppercase) is now picked up by the `.live-event-bebas` font replacer in `src/pages/live.njk`, alongside the existing "Es Vermut" form.

### Changed
- "Spritz & art" renamed to "Spritz & Art" in `src/_data/live.json`; the `.live-event-spritz` font replacer in `src/pages/live.njk` updated to match the new capitalization.

## [1.14.0] - 2026-05-07

### Added
- New upcoming show in `src/_data/live.json`: "Mainly House Music at Angels" on 2026-05-08 at 21:30 in Angels, Cala Rajada, with en/es/ca event/venue/description and Google Maps link.
- New upcoming show in `src/_data/live.json`: "Es Vermut de Sa Roda" on 2026-06-06 at 12h in Sa Roda, Artà, with en/es/ca descriptions and Google Maps link.
- Self-hosted Bebas Neue and DM Serif Display fonts (`src/css/fonts/bebas-neue-regular-*.woff2`, `src/css/fonts/dm-serif-display-regular-*.woff2`) with `@font-face` rules in `src/css/styles.css`, replacing Google Fonts CDN dependency for these families.
- Per-event title typography in `/live`: `.live-event-tag` (Sedan, stroked) for "Mainly House Music", `.live-event-bebas` (Bebas Neue) for "Es Vermut", and `.live-event-spritz` (DM Serif Display) for "Spritz & art", wired in `src/pages/live.njk` for both upcoming and past shows.

### Changed
- Festa Tremolartà venue in `src/_data/live.json` updated from "Na Batlessa, Artà" to "Plaça de l'Ajuntament, Artà" with a new Google Maps link. Date and time unchanged.
- Renamed 2026-05-08 Licors Moyà event from "Presentació Herbes Ecològiques" to "Spritz & art" in `src/_data/live.json`.
- Default `.live-event` font in `src/css/styles.css` switched from Sedan serif to a thin system sans (weight 200), so per-event tagged spans carry the typographic personality.
- Live `.live-date .day` now uses a 0.5px text stroke for a touch more weight at large sizes.
- Regenerated rider PDFs (`src/press-kit/josep-bernad-rider-{dj,live}-{ca,en,es}.pdf`) and the bundled `src/press-kit/josep-bernad-press-kit.zip`.

## [1.13.4] - 2026-05-05

### Fixed
- Festa Tremolartà date in `src/_data/live.json` corrected from 2026-06-25 to 2026-07-25.

## [1.13.3] - 2026-05-05

### Fixed
- Press-kit zip (`src/press-kit/josep-bernad-press-kit.zip`) was bundling a truncated 3 KB stub for `josep-bernad-rider-dj-en.pdf` instead of the full 31 KB rider. Rebuilt zip now contains the correct English DJ rider PDF.

## [1.13.2] - 2026-05-05

### Changed
- Renamed npm package from `josepbernad.com` to `josepbernad` in `package.json` (and `package-lock.json`). Production domain references in `src/` are unchanged.

## [1.13.1] - 2026-05-05

### Fixed
- VideoObject JSON-LD `uploadDate` now emits a full ISO 8601 datetime with explicit UTC timezone (`YYYY-MM-01T00:00:00Z`) instead of a date-only string. Resolves Google Search Console structured data warnings ("Invalid datetime value for uploadDate" and "Datetime property uploadDate is missing a timezone").

### Changed
- `/dev/rider/` localhost preview: DJ/LIVE selector moved out of the header toolbar onto a floating pill at the bottom-center of the PDF viewer frame, so the kind toggle is closer to the viewport and the header stays visually anchored on the language tabs.

## [1.13.0] - 2026-04-28

### Changed
- Press-kit rider downloads split per set: instead of a single combined PDF with both DJ and Live columns, each rider block on `/press-kit` now has its own download button pointing at a dedicated single-column PDF. `scripts/build-rider.js` now emits six files (`josep-bernad-rider-{dj,live}-{en,es,ca}.pdf`), with the live PDFs including the guests note and DJ PDFs omitting it. `src/_data/presskit.json` replaces the single `download` string with `djDownload` / `liveDownload` per language. The `/dev/rider/` localhost preview gains a DJ/LIVE toggle alongside the EN/CA/ES tabs. The public `josep-bernad-press-kit.zip` now bundles all six rider PDFs.

## [1.12.1] - 2026-04-28

### Fixed
- `/press-kit` dev-only affordances (engineering wordmark chips and the `/dev/rider/` Preview link) leaked onto production. Their `hidden` attribute was overridden by author CSS rules setting `display: inline-flex`, so the localhost-detection script that should have *revealed* them on dev was instead the only thing keeping them hidden, and it never ran on production. Added a defensive `[hidden] { display: none !important; }` in `src/css/styles.css` so the UA-stylesheet semantics of `[hidden]` win over per-component display rules.

## [1.12.0] - 2026-04-28

### Added
- Trilingual technical rider PDFs (`josep-bernad-rider-{en,es,ca}.pdf`), generated by a new `scripts/build-rider.js` from `src/_data/presskit.json`. Each PDF embeds the real wordmark PNG, mono-typeset email/phone with clickable `mailto:`/`tel:` annotations, mono-typeset site/Instagram links, and renders the rider gear list as two columns with a divider that splits inputs from outputs and anchors outputs to a shared bottom in both columns. The press-kit page download button now points to the language-matching PDF, and all three are bundled into the public `josep-bernad-press-kit.zip`.
- Localhost-only `/dev/rider/` preview page (`src/dev/rider-preview.11ty.js`). Renders the active rider PDF inside an iframe with the native viewer chrome hidden via `#toolbar=0&navpanes=0&scrollbar=0`, EN/CA/ES tabs centered in the toolbar, a Reload button to bust the iframe cache, and a floating Print/Download overlay anchored top-right of the viewer. Editing `src/_data/presskit.json` triggers a rebuild via an `eleventy.before` hook so the iframe refreshes with the regenerated PDF. The whole `src/dev/` folder is ignored outside `eleventy --serve`, so it never ships to production. A dev-only "Preview · DEV" affordance was also added to the `/press-kit` rider section, hidden by default and revealed only on `localhost`.
- Parametric wordmark generator (`scripts/generate-wordmarks.js`). Renders all 8 lockup SVGs (`wordmark`, `wordmark-dj`, `wordmark-live`, `wordmark-dj-live`, `wordmark-software`, `wordmark-eng-{en,es,ca}`) from the Sedan WOFF2 via opentype.js + wawoff2. Title/subtitle stroke, font size, letter-spacing, and gap are knobs at the top of the script (`TITLE_STROKE_WIDTH`, `SUB_STROKE_WIDTH`, `SUB_FONT_SIZE`, `SUB_GAP`, etc.) tuned to match the home page's CSS title/subtitle proportions. The `wordmark-dj-live` lockup now reads "Live & DJ Set" to match the home subtitle.
- Rider gear updates: wireless mic on both sets, additional mics + DI boxes (conditional, "if applicable") for the live set, monitor sends for guest musicians, full DJ booth (CDJs + DJM) on the live set as well, and a dedicated `GUESTS` note block explaining that the live set may include guest musicians and that "if applicable" items scale with the final lineup.
- `vercel.json` apex-domain redirect: `www.josepbernad.com` → `josepbernad.com` (permanent 301).
- `pdfkit` as a dev dependency (PDF generation).

### Changed
- Press-kit build orchestration consolidated in `scripts/build-presskit.js`: it now builds logos, then calls `buildRider()`, then assembles the zip — replacing the previous chained `build-rider && build-presskit` flow so the rider PDFs always have the freshly-rasterized wordmark PNG to embed.
- `/press-kit` rider section: the rider list now supports a `divider` entry that renders as a vertical gap separating inputs from outputs, and a new `pk-rider-note-guests` note appears above the existing stage-plot note. The download button uses `/press-kit/josep-bernad-rider-{lang}.pdf`.
- `/about` TL;DR copy: "He is also a software engineer and speaks Catalan, Spanish, and English." is now "He also works as a freelance software engineer with tech companies and on independent projects." (and equivalents in es/ca).
- `/live` event description for `Licors Moyà`: removed the explicit `<br>` + `live-desc-gap` line break, the link to Sonia Santandreu now flows inline.
- The old single-color `src/press-kit/logo-{dark,light}.svg` files were removed; the new wordmark/mark variants supersede them.



### Added
- Parallax effect on the panoramic newsletter image: the image drifts as the visitor scrolls past it. Driven by an `IntersectionObserver` (only animates while in view) and a `requestAnimationFrame`-throttled scroll listener, with `prefers-reduced-motion` opting out via CSS. Image is scaled (`1.4`) to absorb the translation so no edges reveal.
- Reusable `_includes/newsletter-panoramic.njk` partial. Both `home.njk` and `live.njk` now `{% include %}` the same markup instead of duplicating the panoramic + newsletter block.
- `/about` TL;DR helper: an `i` info disclosure next to the `TL;DR` label expands a small popover explaining what `TL;DR` means (with a close button), localized in EN/ES/CA via new `glanceHelpLabel`, `glanceHelpClose`, and `glanceHelp` keys in `src/_data/about.json`.
- `/live` past events now support tracklists and video previews. New per-event optional fields in `src/_data/live.json`: `tracklist` (array of `{ artist, title }`), `videoId` (YouTube ID for an inline preview that opens a modal player), `videoTags`, and `dateApprox` (renders month + year only). First past entries seeded: `Mainly House Music at Angels` (Cala Rajada, 2026-04-26, 46-track tracklist), `Sunset at Kaafu Beach Club` (Cala Millor, 2025-08-31), and others.
- `/live` tracklist UI: each tracklist is a collapsible `<details>` with track count, a monospaced numbered list inside an ASCII frame (event title, venue, date, `via josepbernad.com/live` footer), and a `Copy` button that writes the formatted text to the clipboard.
- `/live` video modal: a fixed-position `<dialog>`-style overlay (`#liveVideoModal`) with a YouTube `<iframe>` that loads on demand when a past event's preview thumbnail is clicked.

### Changed
- `/contact` form footer: `Send` button moved to the right and the form-note (`I usually reply within a few hours` / `Te respondo en pocas horas` / `Et responc en poques hores`) is stacked directly underneath it.
- `/contact` form-note copy rewritten in first person and a warmer, more direct tone across EN/ES/CA, with a trailing 🤙.
- `/contact` socials: `LinkedIn` and `GitHub` pushed to their own row via a zero-height `flex-basis: 100%` break, separating them visually from the music socials (Instagram, YouTube, SoundCloud, Spotify).
- `/contact` reCAPTCHA disclaimer is no longer pinned to the viewport bottom; it now flows in the document at the end of the contact card and right-aligns inside the section container.
- `/films` card layout: date and location moved into a single meta line (`{date} · {location}`) above the title inside `.film-info`, replacing the previous absolutely-positioned `live-location` / `live-date` corners. Play button promoted to a semantic `<span aria-hidden>` with the SVG, so the click target is the whole card.
- `/press-kit` bio length toggle now crossfades between short/long copy with an animated container height (driven by `ResizeObserver`) instead of toggling `[hidden]`. Both copies stay in the DOM stacked; the inactive one is `aria-hidden`. Falls back to a `resize` listener when `ResizeObserver` is unavailable.
- `/live` first event description (Licors Moyà): the `<br>` paragraph break now uses a dedicated `live-desc-gap` spacer span so the second paragraph has a proper visual gap matching the rest of the layout.

### Fixed
- `/live` bottom spacing: the panoramic newsletter section was not sitting flush to the page bottom because the `.live-video-modal` was the actual `:last-child` of the body, defeating the existing `:has(.home-panoramic:last-child)` rule that strips bottom padding. Reordered the modal above the panoramic so the rule applies again. The modal is `position: fixed`, so DOM order has no visual impact.
- `/contact` form-note `Typically replies in hours` was unreadable in dark mode because the rule only set `opacity` on top of an inherited (black) text color. Now uses explicit per-theme colors matching the rest of the form's secondary text (`rgba(245,245,245,0.7)` dark, `rgba(26,26,26,0.6)` light).

## [1.10.1] - 2026-04-27

### Changed
- Narrow the no-em-dash rule in `CLAUDE.md` to public-facing text only (anything under `src/` that ships to readers). Internal artifacts (commit messages, `CHANGELOG.md`, code comments, test descriptions, repo docs) are now explicitly out of scope. The test in `tests/unit/no-em-dash.test.js` already only scans `src/`, so enforcement matches the new wording.

## [1.10.0] - 2026-04-27

### Added
- Answer-engine optimization for AI assistants: new `/llms.txt` and `/llms-full.txt` (per the llmstxt.org convention) with key facts, live formats, page index, influences, and a long-form trilingual companion file.
- `robots.txt` now explicitly allows the major AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Bytespider, Meta-ExternalAgent, Amazonbot, cohere-ai, DuckAssistBot, MistralAI-User).
- About page: trilingual `TL;DR` glance section and a 7-question FAQ covering identity, location, genres, formats, instruments, languages, and booking.
- Contact page: trilingual 6-question booking FAQ with a press-kit CTA.
- `FAQPage` JSON-LD on `/about/` and `/contact/` (one entry per question, including press-kit deep-link in the answer).
- `Person.knowsLanguage` (`ca`, `es`, `en`) added to the about-page JSON-LD; `Person.description` now sources from the new glance copy.
- Project typography rule (`CLAUDE.md`): no em-dash or en-dash anywhere in `src/`. Enforced by new unit test `tests/unit/no-em-dash.test.js`, which scans every `.njk`, `.json`, `.css`, `.js`, `.html`, and `.md` file.

### Changed
- Server-render localized text via Eleventy on every page so crawlers (Bing, social, AI bots that don't run JS) see actual content. About bios, contact form labels, hero copy, nav links, newsletter CTAs, and the recaptcha disclaimer were previously empty `data-i18n` placeholders filled only by client-side JS. Templates now emit the localized strings inline from the existing per-language data files; `data-i18n` attributes remain so client-side language switching keeps working.
- SEO title separators across all languages and pages: em-dash (`Page — Site`) replaced with pipe (`Page | Site`).
- Image alt text on home, films, video-modal recommendations, and `VideoObject` JSON-LD descriptions: em-dash separators replaced with commas.
- Contact form notes: `2–3 days` rephrased as `2 to 3 days` / `2 a 3 días` / `2 a 3 dies`.
- Live event description (Licors Moyà): paragraph break inserted before the Sonia Santandreu credit so the artist mention sits on its own line.

## [1.9.0] - 2026-04-26

### Added
- Per-page JSON-LD structured data: `MusicEvent` for every upcoming show on `/live/`, `VideoObject` for every film on `/films/` and `/`, `ProfilePage` + `Person` on `/about/` linked to the existing `#musician` graph, and a localized `BreadcrumbList` on every non-home page.
- Per-page Open Graph images: `/films/` uses the latest YouTube `maxresdefault.jpg`, `/about/` uses `about.webp`, `/press-kit/` uses the panoramic photo, others fall back to the default. `og:image:width` and `og:image:height` now declared.
- `<lastmod>` on every sitemap entry: build date for static pages, latest film date for `/films/`, next upcoming event for `/live/`.
- `<h2>Latest Films</h2>` (visually-hidden) above the home film grid for a complete document outline; localized to EN/ES/CA via new `latestFilms` key in `home.json`.
- Self-hosted Sedan font: woff2 files at `src/css/fonts/`, `@font-face` declarations in `styles.css`, replacing the Google Fonts CDN dependency.
- `.visually-hidden` CSS utility class.

### Changed
- Home `<h1>` now wraps the entire hero block (location, claim, name, subtitle) in a single semantic heading; visual layout unchanged via `.home-hero-heading` reset and `display: block` on inner spans.
- Page titles and meta descriptions rewritten to lead with keywords (e.g. "House DJ Barcelona & Mallorca — Josep Bernad") across all pages and languages, replacing the prior brand-led format.
- `og:type=profile` for `/about/` (was `article`).
- Vidstack player CSS (3 stylesheets) and JS module are no longer shipped in the initial HTML — they're now lazy-loaded on the first film-card click and skipped entirely on mobile (which uses a YouTube iframe). Reduces initial payload by ~150 KB on home/films.
- Image alt text upgraded across home, live, about, films, press-kit, and the video modal recommendations: panoramic banner → "Josep playing at night in Artà"; about portrait → "Young Josep playing a drum"; wedding photos → "Wedding performance at Restaurante Voro"; film thumbnails → `"{title} — Josep Bernad {tag} in {location}"`.

### Removed
- `<meta name="keywords">` (ignored by Google, removed from `base.njk`).
- Google Fonts `preconnect`, `preload`, and stylesheet `<link>` tags.

## [1.8.0] - 2026-04-26

### Added
- Three new live dates: "Presentació Herbes Ecològiques" at Licors Moyà (May 8), "Mainly House Music at Kaafu" (May 24), and "Festa Tremolartà" at Na Batlessa (Jun 25).
- `favicon.ico` and `apple-touch-icon.png` assets with passthrough copy in Eleventy config and `<link>` tags in `base.njk`.
- `build:favicons` npm script and `generate-favicons.js` utility (`sharp` + `png-to-ico` deps).
- Instagram pill-style link button styles in `.live-desc a` for event descriptions that include inline links.
- Localized `event` and `venue` objects in `live.json` for upcoming dates; `live.njk` now renders them with lang fallback and `| safe` filter for HTML descriptions.

### Changed
- About bio rewritten in first-person voice across EN, ES, and CA.
- Em dashes replaced with commas sitewide (about, contact, films, live, presskit, seo metadata, base.njk OG alt and JSON-LD).

## [1.7.0] - 2026-04-21

### Changed
- **Hosting migrated from GitHub Pages to Vercel.** `josepbernad.com` + `www` now served by Vercel (team `josep-bernads-projects`, project `josepbernad.com`, Eleventy preset, Node 24.x). DNS at cdmon: apex A → `76.76.21.21`, `www` CNAME → `cname.vercel-dns.com`. Deploys auto-trigger on push to `main` via Vercel Git Integration — no in-repo CI workflow needed.
- Unified browser-tab titles across all pages and languages: consistent `topic | Josep Bernad` format, keyword-led inner pages (`Bookings & Contact`, `Live Sets & Films`, `Upcoming Shows & DJ Dates`), and translated Films/Press Kit metadata in ES/CA for better long-tail SEO and CTR.

### Removed
- `.github/workflows/deploy.yml` — obsolete GitHub Actions deploy pipeline.
- `CNAME` — GitHub Pages custom-domain marker (domain now managed by Vercel).
- `.nojekyll` — GitHub Pages Jekyll-bypass marker.

## [1.6.0] - 2026-04-21

### Added
- **Unified `site-header`** with primary navigation (Films / Live / About / Contact / Press Kit) replacing the old section-nav / back-link pattern. Desktop shows inline links + lang switcher + theme toggle; mobile uses a hamburger (`.nav-toggle`) that expands into an overlay menu, closing on link click or on resize past the breakpoint.
- **Page hero component** reused across About, Contact, Films, Live, and Press Kit — each ships an `eyebrow / title (with `<em>` accent) / sub` block via its data file (`hero.{en,es,ca}`).
- **Contact page redesign** — split card with a left-hand details aside (email, Instagram, social links) and a right-hand labelled form; added `formNote` ("typically replies within 2–3 days") and refreshed success/error copy across EN/ES/CA.
- **Live page newsletter CTA** — panoramic banner with Mailchimp newsletter form appended below the upcoming/past dates.
- **Press Kit contact CTA** — new "Check availability" card with direct-line display and copy-to-clipboard control; added `contactDirectLabel`, `contactCopyLabel`, `contactCopiedLabel`, `contactCtaTitle`, `contactCtaSub` strings.
- **Wedding gallery images** (`wedding1.webp`, `wedding2.webp`, `wedding3.webp`) wired into the Press Kit weddings section.
- **SVG icon partials** — `src/_includes/icons/{sun,moon,menu,close}.njk` included by the header for theme toggle and mobile menu states.
- Home hero now surfaces "Mainly House Music" and "Barcelona // Mallorca" directly in the hero (previously only in the floating top-header).

### Changed
- `base.njk` drives `data-section` from `pageId` instead of `sectionName`; `pagePath` (language-prefix-stripped) is computed once in `base.njk` and reused by the header's language switcher.
- Rider spec: mixer fallback updated from `DJM-900 NXS2` → `DJM-A9` across EN/ES/CA.
- Theme toggle now supports multiple instances on the page — `main.js` binds every `.theme-toggle` and keeps `aria-pressed` / `aria-label` in sync with the current theme.
- 404 page: language rewriting now reads `hreflang` attributes instead of parsing `aria-label`, and also rewrites the primary-nav links so a language switch from a missing path lands on the right locale.

### Fixed
- **Video modal race** — opening a second video within 500ms of closing the previous one no longer blanks out the new player. The pending `src=''` reset is now cancelled when `openVideo` is called again.
- `contact.json` cleanup: dropped deprecated `intro`, `orEmail`, and placeholder-only keys; replaced with label/eyebrow/hero fields used by the new form layout.

## [1.5.1] - 2026-04-21

### Changed
- Home hero pill now reads "Upcoming shows · Next <date>" — dropped the event name and introduced a `nextShow.next` i18n string (EN/ES/CA). Fixed the empty server-rendered label caused by `eleventyComputed` overriding `lang` — template now uses `currentLang` consistently, and `main.js` wires `nextShow` into client-side translations so language switches stay in sync.
- `live.json`: removed the unconfirmed **Tremolartà** (2026-07-24) entry and cleared all past shows.

## [1.5.0] - 2026-04-21

### Added
- **Live page** (`/live/`, `/es/live/`, `/ca/live/`) — upcoming and past shows with i18n strings, date filters (`liveDay`, `liveMonth`, `liveYear`, `liveDateShort`), and `upcomingOnly` / `pastDesc` helpers
- **Press Kit page** (`/press-kit/`, `/es/press-kit/`, `/ca/press-kit/`) — multilingual bio (short/long), set formats, logos (light/dark BG), technical rider, weddings section, and booking contact; logo assets copied from `src/press-kit/`
- **Next-show pill** on the home hero — surfaces the next upcoming live date with a direct link to `/live/`
- "Press Kit" entry in the home navigation (EN/ES/CA)
- SEO metadata and sitemap entries for Live and Press Kit across all three languages

### Changed
- Unified `.top-header` layout across home and interior pages — location now always sits at the bottom
- `.header-name` now shares typography with `.header-claim` (font-size, letter-spacing, margin) and keeps Sedan + `-webkit-text-stroke: 1px` as its only distinguishing styles; letter-spacing tightened to `0.08em`
- `.header-name` "Josep Bernad" is now a locale-aware link back to the home
- Theme bootstrap script moved into `<head>` to prevent FOUC on the theme toggle
- 404 page now detects language prefix client-side (Vercel serves `/404.html` on miss) and rewrites language-switcher links, back link, and the header name link accordingly

## [1.4.2] - 2026-04-15

### Fixed
- Add `"11ty.js"` to Eleventy `templateFormats` so `version.11ty.js` is processed and `/version.json` is generated at build time

## [1.4.1] - 2026-04-15

### Added
- `src/version.11ty.js` — generates public `/version.json` from `package.json` version
- `.planning/codebase/` — codebase analysis docs (architecture, stack, conventions, concerns)

## [1.4.0] - 2026-04-15

### Security
- Pinned Vidstack CDN from floating `@next` tag to explicit version `1.12.13`
- Added SRI `integrity` + `crossorigin` attributes to all 4 Vidstack CDN resources

### Added
- Vitest unit test suite — 12 tests covering `resolveKey` (i18n key resolution) and `formatFilmDate`
- Playwright e2e test suite — 32 tests across desktop and mobile covering video modal, theme toggle, and i18n language routing
- Extracted pure utility functions (`resolveKey`, `formatFilmDate`) to `src/js/utils.js`
- Converted `main.js` from IIFE to ES module

## [1.3.0] - 2024-12-04

### Added
- **Frosted glass effect** on all film cards with backdrop blur
- **Glow effect** on Live Set cards to highlight premium content
- **About page** with translatable bio, profile image, and LinkedIn/GitHub links
- **Frosted glass effect** (backdrop blur) on all film cards
- **Glow effect** on Live Set cards to highlight premium content


### Changed
- Refactored Live Set styling from tag-level to card-level differentiation
- Film dates now display abbreviated month names (OCT, JUL) with translations
- Renamed "Contact" navigation item to "About"
- Film dates now display abbreviated month names (OCT, JUL) with translations
- Refactored Live Set styling from tag-level to card-level
- Section header simplified: solid background with subtle border
- Created shared `.section-container` class for section pages
- **External translation files** for home, films, and about content

## [1.2.2] - 2024-12-04

### Added
- **"Soon" tooltip and lock icon** for disabled navigation links
- **Backdrop blur** on social icon buttons (frosted glass effect)
- **Premium "Live Set" tag styling** with diagonal gradient using opposite theme colors

### Changed
- Compact spacing breakpoint increased from 840px to 1000px height
- Film card layout adjustments for better spacing
- Enhanced first tag styling (DJ Set, Live Set) with increased prominence
- Film dates now show abbreviated month names (OCT, JUL, etc.) instead of numbers, with translations for English, Spanish, and Catalan

## [1.2.1] - 2024-12-02

### Added
- **Films page** with complete content and responsive grid layout
  - 7 films displayed with YouTube thumbnails (auto-fetched from video IDs)
  - Film cards showing title, location, date, and genre tags
  - Play button overlay on hover (desktop only)
  - Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
  - Links open YouTube videos in new tab
- Section page layout system
  - Header background gradient overlay for better readability
  - Back navigation button with section title
  - Top header showing location and artist name on section pages
  - Background image dimmed to 10% opacity on section pages
- Films data file (`src/_data/films.json`) for easy content management
- Disabled navigation links styling for upcoming sections

### Changed
- Navigation breakpoint increased from 768px to 900px (mobile 2x2 grid extends to larger screens)
- Navigation spacing unified to 2.5rem (40px) in all directions for visual consistency
- Hover effects disabled on mobile/touch devices using `@media (hover: hover)` detection
- Film cards redesigned with centered info, corner-positioned location/date
- Film tags centered with first tag emphasized
- Section navigation separator increased (50px vertical line on mobile)

### Improved
- Refactored hover effects architecture using CSS custom properties
  - Centralized control of all hover behaviors in single media query
  - Self-documenting system with inline usage guide
  - Future-proof: impossible to forget mobile optimization for new elements
  - Better performance: one media query instead of 14 scattered blocks
- Navigation spacing now consistent across all screen sizes and heights
  - Removed compact gap override for screens with max-height: 840px
  - Maintains 40px spacing regardless of device orientation
- Film card hover effects use new CSS custom property system
  - Lift effect, image zoom, and box shadows on hover (desktop only)
  - Touch devices show clean static cards without hover artifacts

### Fixed
- GitHub Pages deployment: added .nojekyll file to fix image loading issues
- CNAME file now properly copied to _site for custom domain support
- Horizontal overflow hidden on html/body to prevent scroll issues

## [1.2.0] - 2024-12-02

### Added
- GitHub Actions workflow for automatic deployment to GitHub Pages

## [1.1.0] - 2024-12-02

### Added
- Dynamic favicon that changes with theme toggle
- Background colors for mobile overscroll prevention

### Fixed
- iOS overscroll now shows theme-matching colors instead of white

## [1.0.0] - 2024-12-02

### Added
- Initial release of josepbernad.com
- Main landing page with title "Josep Bernad" and subtitle "Live & DJ Set"
- Corporate claim "Mainly House Music" with location "Barcelona // Mallorca"
- Social media links (Instagram, YouTube, Spotify, SoundCloud)
- Dark/light theme toggle with system preference detection
- Responsive design with mobile-first approach
- Version label easter egg in bottom right corner
- Background images for both themes (mobile and desktop variants)

