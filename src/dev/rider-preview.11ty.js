/**
 * Localhost-only preview for the technical rider PDFs.
 *
 * Reachable at /dev/rider/ when running `pnpm run dev` (eleventy --serve).
 * The whole src/dev/ folder is ignored outside serve mode in .eleventy.js,
 * so this page never reaches production.
 *
 * Workflow: edit src/_data/presskit.json, save, the page reloads with
 * the regenerated PDFs (rider builder runs from .eleventy.js eleventy.before).
 */
module.exports = class RiderPreview {
  data() {
    return {
      permalink: "/dev/rider/index.html",
      eleventyExcludeFromCollections: true,
      layout: false,
    };
  }

  render() {
    const cacheBust = Date.now();
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Rider preview · localhost</title>
<meta name="robots" content="noindex,nofollow">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #f4f4f3; font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: #0a0a0a; }
  body { display: flex; flex-direction: column; }
  header { display: flex; align-items: center; gap: 20px; padding: 14px 20px; border-bottom: 1px solid #e3e3e1; background: #ffffff; flex: 0 0 auto; position: relative; }
  .pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: #0a0a0a; color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; }
  h1 { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 0.2px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .tabs { display: inline-flex; gap: 4px; padding: 3px; background: #f0efed; border-radius: 8px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
  .tab { font: inherit; font-size: 12px; font-weight: 600; padding: 5px 12px; border: 0; background: transparent; border-radius: 6px; cursor: pointer; color: #6b6b6b; letter-spacing: 1px; }
  .tab.active { background: #fff; color: #0a0a0a; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
  .tab:not(.active):hover { color: #0a0a0a; }
  .hint { font-size: 12px; color: #6b6b6b; margin-left: auto; display: flex; gap: 16px; align-items: center; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f0efed; padding: 2px 6px; border-radius: 4px; font-size: 11.5px; }
  .icon { font: inherit; font-size: 12px; padding: 6px 12px; border: 1px solid #d6d6d4; background: #fff; border-radius: 6px; cursor: pointer; color: #0a0a0a; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
  .icon:hover { background: #f0efed; }
  main { flex: 1 1 auto; padding: 20px; min-height: 0; }
  .frame { position: relative; width: 100%; height: 100%; border: 1px solid #e3e3e1; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px -16px rgba(0,0,0,0.18); }
  iframe { width: 100%; height: 100%; border: 0; border-radius: 8px; display: block; }
  .pdf-actions { position: absolute; top: 12px; right: 28px; display: flex; gap: 6px; z-index: 2; }
  .pdf-actions .icon { background: rgba(255,255,255,0.95); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); box-shadow: 0 2px 6px -2px rgba(0,0,0,0.12); }
  .kind-floater { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 2; padding: 4px; background: rgba(255,255,255,0.95); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border-radius: 10px; box-shadow: 0 4px 16px -4px rgba(0,0,0,0.18); display: inline-flex; gap: 4px; }
  .kind-floater .tab { font-size: 11px; padding: 6px 14px; }
</style>
</head>
<body>
  <header>
    <span class="pill"><span class="dot"></span>Rider preview</span>
    <h1 id="filename">josep-bernad-rider-dj-en.pdf</h1>
    <div class="tabs" id="langs" role="tablist" aria-label="Rider language">
      <button class="tab active" data-lang="en" role="tab" aria-selected="true">EN</button>
      <button class="tab" data-lang="ca" role="tab" aria-selected="false">CA</button>
      <button class="tab" data-lang="es" role="tab" aria-selected="false">ES</button>
    </div>
    <div class="hint">
      <span>Edit <code>src/_data/presskit.json</code> &rarr; save &rarr; auto-reload</span>
      <button id="reload" type="button" class="icon">Reload</button>
    </div>
  </header>
  <main>
    <div class="frame">
      <div class="pdf-actions">
        <button id="print" type="button" class="icon" title="Print">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print
        </button>
        <a id="download" class="icon" href="/press-kit/josep-bernad-rider-dj-en.pdf" download title="Download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download
        </a>
      </div>
      <iframe id="pdf" src="/press-kit/josep-bernad-rider-dj-en.pdf?t=${cacheBust}#toolbar=0&amp;navpanes=0&amp;scrollbar=0" title="Rider PDF preview"></iframe>
      <div class="kind-floater" id="kinds" role="tablist" aria-label="Rider kind">
        <button class="tab active" data-kind="dj" role="tab" aria-selected="true">DJ</button>
        <button class="tab" data-kind="live" role="tab" aria-selected="false">LIVE</button>
      </div>
    </div>
  </main>
  <script>
    (function() {
      var iframe = document.getElementById('pdf');
      var filename = document.getElementById('filename');
      var kinds = document.getElementById('kinds');
      var langs = document.getElementById('langs');
      var reload = document.getElementById('reload');
      var printBtn = document.getElementById('print');
      var download = document.getElementById('download');
      var currentLang = 'en';
      var currentKind = 'dj';

      function refresh() {
        var name = 'josep-bernad-rider-' + currentKind + '-' + currentLang + '.pdf';
        filename.textContent = name;
        var bust = Date.now();
        iframe.src = '/press-kit/' + name + '?t=' + bust + '#toolbar=0&navpanes=0&scrollbar=0';
        download.href = '/press-kit/' + name;
        download.setAttribute('download', name);
      }

      function syncTabs(group, attr, value) {
        Array.prototype.forEach.call(group.querySelectorAll('.tab'), function(b) {
          var active = b.dataset[attr] === value;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      }

      kinds.addEventListener('click', function(e) {
        var btn = e.target.closest('.tab');
        if (!btn || btn.dataset.kind === currentKind) return;
        currentKind = btn.dataset.kind;
        syncTabs(kinds, 'kind', currentKind);
        refresh();
      });

      langs.addEventListener('click', function(e) {
        var btn = e.target.closest('.tab');
        if (!btn || btn.dataset.lang === currentLang) return;
        currentLang = btn.dataset.lang;
        syncTabs(langs, 'lang', currentLang);
        refresh();
      });

      reload.addEventListener('click', refresh);

      printBtn.addEventListener('click', function() {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          // Same-origin should be fine in dev; fall back to opening the PDF.
          window.open(iframe.src, '_blank');
        }
      });
    })();
  </script>
</body>
</html>`;
  }
};
