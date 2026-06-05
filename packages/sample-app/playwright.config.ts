import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './integration-tests/tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:9000',
    viewport: { width: 1920, height: 1080 },
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'on',
    testIdAttribute: 'data-test-id',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'integration-tests/results/html', open: 'never' }],
    ['junit', { outputFile: 'integration-tests/results/junit-results.xml' }],
  ],
  webServer: [
    {
      command: 'yarn http-server',
      port: 9000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'yarn workspace @monorepo/sample-plugin run http-server',
      port: 9001,
      reuseExistingServer: !process.env.CI,
      cwd: '../..',
    },
  ],
});
