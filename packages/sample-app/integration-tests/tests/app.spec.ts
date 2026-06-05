import { test, expect } from '@playwright/test';

test.describe('Sample Plugin Host Application', () => {
  test('Loads the sample plugin', async ({ page }) => {
    await page.goto('/');

    const table = page.getByTestId('plugin-table');
    await expect(table.locator('tbody')).toContainText('No plugins detected');

    const openButton = page.getByTestId('plugin-modal-open');
    await expect(openButton).toHaveText('Load remote plugin');
    await openButton.click();

    const urlInput = page.getByTestId('plugin-modal-url');
    await expect(urlInput).toHaveValue('http://localhost:9001/plugin-manifest.json');

    const loadButton = page.getByTestId('plugin-modal-load');
    await expect(loadButton).toBeEnabled();
    await expect(loadButton).toHaveText('Load');
    await loadButton.click();

    await expect(table.locator('tbody')).not.toContainText('No plugins detected');

    const rows = table.locator('tbody > tr');
    await expect(rows).toHaveCount(1);

    const row = rows.first();
    await expect(row.locator('td[data-label="Name"]')).toContainText('sample-plugin');
    await expect(row.locator('td[data-label="Version"]')).toContainText('1.2.3');
    await expect(row.locator('td[data-label="Status"]')).toContainText('loaded');
    await expect(row.locator('td[data-label="Extensions"]')).toContainText('2');
    await expect(row.locator('td[data-label="Enabled"]')).toContainText('Yes');
  });
});
