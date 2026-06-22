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
    workers: 1,
});
