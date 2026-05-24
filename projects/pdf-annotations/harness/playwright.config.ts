import { defineConfig } from "@playwright/test";

const port = process.env.PDF_ANNOTATION_HARNESS_PORT || "4173";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
    expect: {
        timeout: 10000,
    },
    fullyParallel: false,
    outputDir: "test-results",
    reporter: "list",
    testDir: "./tests",
    timeout: 45000,
    use: {
        baseURL,
        browserName: "chromium",
        trace: "retain-on-failure",
    },
    webServer: {
        command: `node projects/pdf-annotations/harness/test-server.mjs ${port}`,
        cwd: process.cwd(),
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        url: `${baseURL}/projects/pdf-annotations/harness/standalone.html`,
    },
    workers: 1,
});
