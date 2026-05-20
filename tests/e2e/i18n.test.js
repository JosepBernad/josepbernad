import { test, expect } from '@playwright/test';

test.describe('i18n, language routing', () => {
  test('/ shows the language landing selector', async ({ page }) => {
    // Clear any previous selection so the modal renders instead of redirecting.
    await page.addInitScript(() => {
      try { localStorage.removeItem('lang-preference'); } catch (_) {}
    });
    await page.goto('/');
    await expect(page.locator('body.lang-landing')).toBeVisible();
    await expect(page.locator('a[data-lang="en"]')).toBeVisible();
    await expect(page.locator('a[data-lang="es"]')).toBeVisible();
    await expect(page.locator('a[data-lang="ca"]')).toBeVisible();
  });

  test('/en/ serves English (lang="en")', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('/es/ serves Spanish (lang="es")', async ({ page }) => {
    await page.goto('/es/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('/ca/ serves Catalan (lang="ca")', async ({ page }) => {
    await page.goto('/ca/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
  });

  test('/ with saved preference redirects to that language', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('lang-preference', 'ca'); } catch (_) {}
    });
    await page.goto('/');
    await page.waitForURL('**/ca/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
  });

  test('/?next=/films/ pre-fills button hrefs with the section', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.removeItem('lang-preference'); } catch (_) {}
    });
    await page.goto('/?next=%2Ffilms%2F');
    await expect(page.locator('a[data-lang="en"]')).toHaveAttribute('href', '/en/films/');
    await expect(page.locator('a[data-lang="ca"]')).toHaveAttribute('href', '/ca/films/');
    await expect(page.locator('a[data-lang="es"]')).toHaveAttribute('href', '/es/films/');
  });

  test('/?next=/films/ with saved preference deep-links to that section', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('lang-preference', 'es'); } catch (_) {}
    });
    await page.goto('/?next=%2Ffilms%2F');
    await page.waitForURL('**/es/films/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('/?next=/evil/ is ignored (whitelist)', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.removeItem('lang-preference'); } catch (_) {}
    });
    await page.goto('/?next=%2Fevil%2F');
    // Falls back to the bare language home.
    await expect(page.locator('a[data-lang="en"]')).toHaveAttribute('href', '/en/');
  });
});

test.describe('i18n, translations applied', () => {
  test('English nav link text renders after JS loads', async ({ page }) => {
    await page.goto('/en/');
    const filmsLink = page.locator('[data-i18n="nav.films"]').first();
    await expect(filmsLink).not.toBeEmpty();
  });

  test('Spanish subtitle resolves to a non-empty string', async ({ page }) => {
    await page.goto('/es/');
    await page.waitForTimeout(1500);
    const esSubtitle = await page.locator('[data-i18n="subtitle"]').textContent();
    expect(typeof esSubtitle).toBe('string');
    expect(esSubtitle.length).toBeGreaterThan(0);
  });
});
