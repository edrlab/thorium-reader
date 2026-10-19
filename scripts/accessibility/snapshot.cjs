// Attach to an already running `npm run start:dev:quick`; never launch another app.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

(async () => {
    const label = (process.argv[2] || "snapshot").replace(/[^a-z0-9_-]/gi, "-");
    const output = path.resolve("docs/accessibility/evidence");
    fs.mkdirSync(output, { recursive: true });
    const browser = await chromium.connectOverCDP("http://127.0.0.1:9223");
    try {
        const targets = await (await fetch("http://127.0.0.1:9223/json/list")).json();
        const results = { label, timestamp: new Date().toISOString(), axeVersion: require("axe-core/package.json").version, targets, pages: [] };
        for (const [index, page] of browser.contexts().flatMap(c => c.pages()).entries()) {
            if (!/index_(library|reader)\.html/.test(page.url())) continue;
            await page.addScriptTag({ path: require.resolve("axe-core") });
            const info = await page.evaluate(() => ({
                title: document.title, url: location.href, lang: document.documentElement.lang,
                dimensions: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
                focus: document.activeElement?.outerHTML?.slice(0, 1200),
                dialogs: [...document.querySelectorAll('[role="dialog"],[role="alertdialog"]')].map(e => ({ html: e.outerHTML.slice(0, 1600) })),
                sliders: [...document.querySelectorAll('input[type="range"]')].map(e => ({ html: e.outerHTML, labels: [...e.labels].map(l => l.textContent) })),
            }));
            const axe = await page.evaluate(async () => {
                const result = await window.axe.run(document, {
                    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
                });
                return {
                    violations: result.violations, incomplete: result.incomplete,
                    passes: result.passes.map(r => ({ id: r.id, nodes: r.nodes.length })),
                    inapplicable: result.inapplicable.map(r => r.id),
                };
            });
            const prefix = `${label}-${index}`;
            // Capture the actual surface: Playwright's logical clip can crop Electron at non-1 zoom.
            const session = await page.context().newCDPSession(page);
            const screenshot = await session.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
            fs.writeFileSync(path.join(output, `${prefix}.png`), Buffer.from(screenshot.data, "base64"));
            await session.detach();
            fs.writeFileSync(path.join(output, `${prefix}-aria.txt`), await page.locator("body").ariaSnapshot());
            results.pages.push({ ...info, evidencePrefix: prefix, axe });
            console.log(JSON.stringify({ label, url: info.url, lang: info.lang, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), incomplete: axe.incomplete.map(v => v.id) }));
        }
        fs.writeFileSync(path.join(output, `${label}.json`), JSON.stringify(results, null, 2) + "\n");
    } finally {
        await browser.close(); // Disconnect from CDP; does not quit the Electron app.
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
