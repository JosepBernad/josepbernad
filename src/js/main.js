import { resolveKey, formatFilmDate } from '/js/utils.js';

// Translations (loaded from external JSON files)
const translations = { en: {}, es: {}, ca: {} };
const html = document.documentElement;
const toggles = document.querySelectorAll('.theme-toggle');
const THEME_KEY = 'theme-preference';

// Get current language from HTML lang attribute (set by server based on URL)
function getCurrentLang() {
  return html.getAttribute('lang') || 'en';
}

// Load all translations from JSON files
Promise.all([
  fetch('/data/home.json').then(res => res.json()),
  fetch('/data/films.json').then(res => res.json()),
  fetch('/data/about.json').then(res => res.json()),
  fetch('/data/contact.json').then(res => res.json()).catch(() => ({}))
]).then(([homeData, filmsData, aboutData, contactData]) => {
  // Merge translations
  ['en', 'es', 'ca'].forEach(lang => {
    translations[lang].subtitle = homeData[lang].subtitle;
    translations[lang].nav = homeData[lang].nav;
    translations[lang].error = homeData[lang].error;
    translations[lang].newsletter = homeData[lang].newsletter;
    translations[lang].months = filmsData.months[lang];
    translations[lang].about = aboutData[lang];
    if (contactData[lang]) {
      translations[lang].contact = contactData[lang];
    }
  });
  // Apply translations for current language
  applyTranslations(getCurrentLang());
}).catch(() => {});

// Theme functions
function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const isDark = theme === 'dark';
  toggles.forEach((t) => {
    t.setAttribute('aria-pressed', String(isDark));
    t.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  });
}

setTheme(getInitialTheme());

toggles.forEach((t) => {
  t.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
});

window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  if (!localStorage.getItem(THEME_KEY)) {
    setTheme(e.matches ? 'light' : 'dark');
  }
});

// Mobile nav toggle (hamburger)
const navToggle = document.querySelector('.nav-toggle');
const siteHeader = document.querySelector('.site-header');
if (navToggle && siteHeader) {
  const setOpen = (open) => {
    if (open) {
      siteHeader.setAttribute('data-menu-open', '');
    } else {
      siteHeader.removeAttribute('data-menu-open');
    }
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  navToggle.addEventListener('click', () => {
    setOpen(!siteHeader.hasAttribute('data-menu-open'));
  });
  // Close on nav link click
  siteHeader.querySelectorAll('.site-nav__link').forEach(link => {
    link.addEventListener('click', () => setOpen(false));
  });
  // Close on outside click (scrim / page background)
  document.addEventListener('click', (e) => {
    if (!siteHeader.hasAttribute('data-menu-open')) return;
    if (!siteHeader.contains(e.target)) setOpen(false);
  });
  // Close if viewport grows past mobile breakpoint
  window.matchMedia('(min-width: 701px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

// Translation functions
function formatFilmDates(lang) {
  const months = translations[lang]?.months;
  if (!months) return;
  document.querySelectorAll('.film-date').forEach(el => {
    const year = el.dataset.year;
    const monthIndex = parseInt(el.dataset.month, 10) - 1;
    el.textContent = formatFilmDate(lang, year, monthIndex, months);
  });
}

function applyTranslations(lang) {
  // Update text content
  if (translations[lang]?.nav) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const value = resolveKey(el.dataset.i18n, translations[lang]);
      if (value) el.textContent = value;
    });
  }

  // Update HTML content (for elements with rich text like bold)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const value = resolveKey(el.dataset.i18nHtml, translations[lang]);
    if (value) el.innerHTML = value;
  });

  // Update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const value = resolveKey(el.dataset.i18nPlaceholder, translations[lang]);
    if (value) el.placeholder = value;
  });

  // Update contact email link href
  const emailLink = document.getElementById('contact-email-link');
  if (emailLink && translations[lang]?.contact?.emailAddress) {
    const temp = document.createElement('div');
    temp.innerHTML = translations[lang].contact.emailAddress;
    const decodedEmail = temp.textContent;
    const encodedMailto = 'mailto:' + decodedEmail.split('').map(c => '&#' + c.charCodeAt(0) + ';').join('');
    emailLink.href = encodedMailto;
  }

  // Update film dates format
  formatFilmDates(lang);
}

// Social hover label
const socialLinks = document.querySelectorAll('.socials a');
const socialLabel = document.getElementById('social-label');

if (socialLinks.length && socialLabel) {
  socialLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      socialLabel.textContent = link.dataset.label;
      socialLabel.classList.add('visible');
    });

    link.addEventListener('mouseleave', () => {
      socialLabel.classList.remove('visible');
    });
  });
}

// Film thumbnail skeleton loading
document.querySelectorAll('.film-thumbnail img').forEach(img => {
  // Check if already loaded (cached images)
  if (img.complete && img.naturalHeight !== 0) {
    img.classList.add('loaded');
  } else {
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
  }
});

// Newsletter banner functionality
const newsletterBanner = document.getElementById('newsletter-banner');
const newsletterClose = document.getElementById('newsletter-close');
const newsletterForm = document.getElementById('newsletter-form');
const newsletterStatus = document.getElementById('newsletter-status');
const NEWSLETTER_DISMISSED_KEY = 'newsletter-dismissed';

// Mailchimp config
const MAILCHIMP_URL = 'https://gmail.us2.list-manage.com/subscribe/post-json?u=ec19e426d1a78e9baa513bfaf&id=7a99017863&f_id=00f8eae3f0';

if (newsletterBanner) {
  // Check if user already subscribed
  const subscribed = localStorage.getItem(NEWSLETTER_DISMISSED_KEY);
  if (subscribed) {
    newsletterBanner.classList.add('hidden');
  }

  // Close button handler (just hides for this session, doesn't persist)
  if (newsletterClose) {
    newsletterClose.addEventListener('click', () => {
      newsletterBanner.classList.add('hidden');
    });
  }

  // Form submission with timing honeypot (bots submit too fast)
  const formLoadedAt = Date.now();

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Reject if submitted in under 3 seconds (bot behaviour)
      if (Date.now() - formLoadedAt < 3000) return;

      // Reject if hidden honeypot field is filled (existing Mailchimp honeypot)
      const honeypot = newsletterForm.querySelector('input[tabindex="-1"]');
      if (honeypot && honeypot.value) return;

      const lang = getCurrentLang();
      const messages = translations[lang]?.newsletter || translations.en.newsletter;
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput.value;

      if (!email) return;

      // Hide banner immediately (optimistic)
      newsletterBanner.classList.add('hidden');

      // Build URL with email parameter
      const url = `${MAILCHIMP_URL}&EMAIL=${encodeURIComponent(email)}&c=callback`;

      const showThankYou = (message) => {
        localStorage.setItem(NEWSLETTER_DISMISSED_KEY, 'true');

        // Create thank you message
        const thankYou = document.createElement('div');
        thankYou.className = 'newsletter-thank-you';
        thankYou.textContent = message;
        document.body.appendChild(thankYou);

        // Trigger animation
        requestAnimationFrame(() => {
          thankYou.classList.add('visible');
        });

        // Remove after delay
        setTimeout(() => {
          thankYou.classList.remove('visible');
          setTimeout(() => thankYou.remove(), 400);
        }, 2500);
      };

      const showError = () => {
        // Show banner again with error
        newsletterBanner.classList.remove('hidden');
        newsletterStatus.textContent = messages.error;
        newsletterStatus.className = 'newsletter-status error';
      };

      // Create JSONP callback
      const callbackName = 'mailchimpCallback' + Date.now();
      window[callbackName] = (response) => {
        // Cleanup
        delete window[callbackName];
        document.body.removeChild(script);

        if (response.result === 'success') {
          showThankYou(messages.success);
        } else if (response.msg && response.msg.includes('already subscribed')) {
          showThankYou(messages.alreadySubscribed);
        } else {
          showError();
        }
      };

      // Create script tag for JSONP
      const script = document.createElement('script');
      script.src = url.replace('&c=callback', `&c=${callbackName}`);
      script.onerror = () => {
        delete window[callbackName];
        showError();
      };
      document.body.appendChild(script);
    });
  }
}

// Tracklist copy buttons on /live
document.querySelectorAll('.live-tracklist-copy').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const body = btn.closest('.live-tracklist-body');
    const pre = body && body.querySelector('.live-tracklist-text');
    if (!pre) return;
    const text = pre.textContent;
    const labelEl = btn.querySelector('span');
    const original = btn.dataset.label || (labelEl && labelEl.textContent);
    const copied = btn.dataset.labelCopied || 'Copied';
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      btn.classList.add('is-copied');
      if (labelEl) labelEl.textContent = copied;
      setTimeout(() => {
        btn.classList.remove('is-copied');
        if (labelEl && original) labelEl.textContent = original;
      }, 1800);
    } catch (e) {
      // silent fail, user can still select and copy manually
    }
  });
});

// Lightweight video modal on /live
const liveVideoModal = document.getElementById('liveVideoModal');
if (liveVideoModal) {
  const liveVideoIframe = document.getElementById('liveVideoIframe');
  const liveVideoClose = document.getElementById('liveVideoClose');

  function openLiveVideo(videoId) {
    liveVideoIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
    liveVideoModal.classList.add('is-open');
    liveVideoModal.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeLiveVideo() {
    liveVideoModal.classList.remove('is-open');
    liveVideoModal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    setTimeout(() => { liveVideoIframe.src = ''; }, 250);
  }

  document.querySelectorAll('.live-watch').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.videoId;
      if (id) openLiveVideo(id);
    });
  });

  liveVideoClose.addEventListener('click', closeLiveVideo);
  liveVideoModal.addEventListener('click', (e) => {
    if (e.target === liveVideoModal) closeLiveVideo();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && liveVideoModal.classList.contains('is-open')) closeLiveVideo();
  });
}

// Parallax effect on the panoramic newsletter image
{
  const sections = document.querySelectorAll('.home-panoramic[data-parallax]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sections.length && !reduceMotion) {
    const STRENGTH = 0.18;
    const targets = [];
    sections.forEach((section) => {
      const img = section.querySelector('img');
      if (img) targets.push({ section, img, inView: false });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const t = targets.find((x) => x.section === entry.target);
        if (t) t.inView = entry.isIntersecting;
      });
      schedule();
    }, { threshold: 0 });
    targets.forEach((t) => io.observe(t.section));

    let ticking = false;
    function update() {
      ticking = false;
      const vh = window.innerHeight;
      targets.forEach((t) => {
        if (!t.inView) return;
        const rect = t.section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const denom = vh / 2 + rect.height / 2;
        const progress = (sectionCenter - vh / 2) / denom;
        const offset = progress * rect.height * STRENGTH;
        t.img.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
      });
    }
    function schedule() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
  }
}

// About-page TL;DR helper popover: close on X click, Escape, or click outside
(function initGlanceTip() {
  const tip = document.querySelector('.about-glance-tip');
  if (!tip) return;

  function close() {
    if (tip.open) tip.open = false;
  }

  tip.addEventListener('click', (e) => {
    if (e.target.closest('[data-glance-tip-close]')) {
      e.preventDefault();
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tip.open) close();
  });

  document.addEventListener('click', (e) => {
    if (!tip.open) return;
    if (!tip.contains(e.target)) close();
  });
})();

(function () {
  function enhanceDetails(item, summary, content) {
    if (!summary || !content) return;
    item.classList.add('is-enhanced');

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (item.dataset.animating === '1') return;

      const isOpen = item.open;
      item.dataset.animating = '1';

      if (!isOpen) {
        item.open = true;
        const target = content.scrollHeight;
        content.style.height = '0px';
        void content.offsetHeight;
        const onEnd = (ev) => {
          if (ev.propertyName !== 'height') return;
          content.removeEventListener('transitionend', onEnd);
          content.style.height = '';
          delete item.dataset.animating;
        };
        content.addEventListener('transitionend', onEnd);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            content.style.height = target + 'px';
          });
        });
      } else {
        const start = content.scrollHeight;
        content.style.height = start + 'px';
        void content.offsetHeight;
        content.style.height = '0px';
        const onEnd = (ev) => {
          if (ev.propertyName !== 'height') return;
          content.removeEventListener('transitionend', onEnd);
          item.open = false;
          content.style.height = '';
          delete item.dataset.animating;
        };
        content.addEventListener('transitionend', onEnd);
      }
    });
  }

  document.querySelectorAll('.page-faq-item').forEach((item) => {
    enhanceDetails(item, item.querySelector('.page-faq-q'), item.querySelector('.page-faq-a'));
  });

  document.querySelectorAll('.live-tracklist').forEach((item) => {
    enhanceDetails(item, item.querySelector('.live-tracklist-summary'), item.querySelector('.live-tracklist-body'));
  });
})();

// Live page: scroll to + briefly highlight the event referenced by #event-...
// Also wires the dev-only share button on each card.
(function () {
  if (!document.querySelector('.live-card')) return;

  const HIGHLIGHT_MS = 2200;
  let activeTimer = null;

  function highlightFromHash() {
    const hash = location.hash;
    if (!hash || !hash.startsWith('#event-')) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Restart the animation if already running
      target.classList.remove('is-highlighted');
      void target.offsetWidth;
      target.classList.add('is-highlighted');
      clearTimeout(activeTimer);
      activeTimer = setTimeout(() => {
        target.classList.remove('is-highlighted');
      }, HIGHLIGHT_MS);
    });
  }

  highlightFromHash();
  window.addEventListener('hashchange', highlightFromHash);

  document.querySelectorAll('.event-share').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.shareId;
      if (!id) return;
      const url = `${location.origin}${location.pathname}#${id}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch (_) {
        window.prompt('Copy share link:', url);
        return;
      }
      btn.dataset.copied = 'true';
      setTimeout(() => { delete btn.dataset.copied; }, 1400);
    });
  });
})();
