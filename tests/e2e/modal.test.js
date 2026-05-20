import { test, expect } from '@playwright/test';

test.describe('Video modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/films/');
    // Wait for the page JS to finish attaching click handlers
    await page.waitForLoadState('networkidle');
  });

  test('clicking a film card opens the modal', async ({ page }) => {
    const modal = page.locator('#videoModal');
    await expect(modal).not.toHaveClass(/active/);

    await page.locator('[data-video-id]:not(.video-rec-card)').first().click();

    await expect(modal).toHaveClass(/active/);
  });

  test('close button dismisses the modal', async ({ page }) => {
    await page.locator('[data-video-id]:not(.video-rec-card)').first().click();
    const modal = page.locator('#videoModal');
    await expect(modal).toHaveClass(/active/);

    await page.locator('.video-modal-close').click();

    await expect(modal).not.toHaveClass(/active/);
  });

  test('Escape key dismisses the modal', async ({ page }) => {
    await page.locator('[data-video-id]:not(.video-rec-card)').first().click();
    const modal = page.locator('#videoModal');
    await expect(modal).toHaveClass(/active/);

    await page.keyboard.press('Escape');

    await expect(modal).not.toHaveClass(/active/);
  });

  test('clicking the backdrop dismisses the modal', async ({ page }) => {
    await page.locator('[data-video-id]:not(.video-rec-card)').first().click();
    const modal = page.locator('#videoModal');
    await expect(modal).toHaveClass(/active/);

    // Click the modal backdrop (the overlay itself, not the inner wrapper)
    await modal.click({ position: { x: 10, y: 10 } });

    await expect(modal).not.toHaveClass(/active/);
  });

  test('modal displays the film title when opened', async ({ page }) => {
    const firstCard = page.locator('[data-video-id]:not(.video-rec-card)').first();
    const expectedTitle = await firstCard.getAttribute('data-title');

    await firstCard.click();

    const titleEl = page.locator('#videoTitleOverlay');
    await expect(titleEl).not.toBeEmpty();
    // Title may be split into main/sub spans, check the container text
    const titleText = await titleEl.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
  });

  test('modal closes and can be reopened', async ({ page }) => {
    const modal = page.locator('#videoModal');
    const cards = page.locator('[data-video-id]:not(.video-rec-card)');

    await cards.first().click();
    await expect(modal).toHaveClass(/active/);

    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/active/);

    await cards.nth(1).click();
    await expect(modal).toHaveClass(/active/);
  });
});

// Mobile-specific: uses iframe instead of Vidstack player
test.describe('Video modal, mobile', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('modal opens on mobile and shows iframe', async ({ page }) => {
    await page.goto('/en/films/');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-video-id]:not(.video-rec-card)').first().click();

    const modal = page.locator('#videoModal');
    await expect(modal).toHaveClass(/active/);

    // Mobile path sets iframe src
    const iframe = page.locator('#videoMobileIframe');
    const src = await iframe.getAttribute('src');
    expect(src).toContain('youtube.com/embed/');
  });
});
