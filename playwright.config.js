const { defineConfig } = require("@playwright/test");

const suiteSuffix = process.env.PLAYWRIGHT_SUITE ? `-${process.env.PLAYWRIGHT_SUITE}` : "";

module.exports = defineConfig({
  testDir: "./automation/tests",
  fullyParallel: true,
  timeout: 30000,
  workers: process.env.PW_WORKERS || "50%",
  outputDir: `test-results${suiteSuffix}`,
  reporter: [
    ["list"],
    ["html", { outputFolder: `automation/reports/html${suiteSuffix}`, open: "never" }],
    ["json", { outputFile: `automation/reports/json/results${suiteSuffix}.json` }],
    ["junit", { outputFile: `automation/reports/junit/results${suiteSuffix}.xml` }]
  ],
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off"
  },
  projects: [
    {
      name: "build",
      testMatch: /build\.spec\.js/
    },
    {
      name: "popup",
      testMatch: /popup\.spec\.js/,
      use: {
        browserName: "chromium"
      }
    },
    {
      name: "companion",
      testMatch: /companion\.spec\.js/
    }
  ]
});
