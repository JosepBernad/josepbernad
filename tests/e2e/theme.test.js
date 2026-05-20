import { test, expect } from '@playwright/test';

// Two `.theme-toggle` buttons exist in the header (desktop nav + mobile overlay).
// On ≤500px viewports the desktop one is `display: none` and the overlay one
// lives inside a clip-path-hidden menu, so the menu must be opened first.
async function clickThemeToggle(page) {
  const navToggle = page.locator('.nav-toggle');
  if (await navToggle.isVisible()) {
    const header = page.locator('.site-header');
    if ((await header.getAttribute('data-menu-open')) === null) {
      await navToggle.click();
      await expect(header).toHaveAttribute('data-menu-open', '');
    }
  }
  await page.locator('.theme-toggle:visible').first().click();
}

test.describe('Theme toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so theme starts from system preference. We hit /en/
    // (not /) because the root is now a language picker with no header/toggle.
    await page.goto('/en/');
    await page.evaluate(() => localStorage.removeItem('theme-preference'));
    await page.reload();
  });

  test('page has a data-theme attribute on load', async ({ page }) => {
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(['light', 'dark']).toContain(theme);
  });

  test('theme toggle button switches the theme', async ({ page }) => {
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');

    await clickThemeToggle(page);

    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);
    expect(['light', 'dark']).toContain(after);
  });

  test('theme persists after page reload', async ({ page }) => {
    await clickThemeToggle(page);
    const theme = await page.locator('html').getAttribute('data-theme');

    await page.reload();

    const themeAfterReload = await page.locator('html').getAttribute('data-theme');
    expect(themeAfterReload).toBe(theme);
  });

  test('toggling twice returns to original theme', async ({ page }) => {
    const original = await page.locator('html').getAttribute('data-theme');
    await clickThemeToggle(page);
    await clickThemeToggle(page);
    const current = await page.locator('html').getAttribute('data-theme');
    expect(current).toBe(original);
  });
});
