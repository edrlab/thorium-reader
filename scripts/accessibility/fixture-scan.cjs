const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const subdir = process.env.THORIUM_AUDIT_EVIDENCE_SUBDIR || 'continuation';
if (!/^[a-z0-9-]+$/.test(subdir)) throw new Error('Invalid audit evidence subdirectory');
const out = path.resolve('docs/accessibility/evidence', subdir);
fs.mkdirSync(out, { recursive: true });
async function capture(page, id) {
    if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({ path: require.resolve('axe-core') });
    const result = await page.evaluate(async () => {
        const axe = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
        const active = document.activeElement;
        return { ...window.auditCurrent, timestamp: new Date().toISOString(), lang: document.documentElement.lang, errors: window.auditErrors, actions: window.auditActions,
            text: document.body.innerText, html: [...document.body.children].filter(e => e.tagName !== 'svg' && e.tagName !== 'SCRIPT').map(e => e.outerHTML).join('\n'), dimensions: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
            focus: active?.outerHTML, controls: [...document.querySelectorAll('button,a,input,textarea,select,progress,[role="checkbox"],[role="radio"],[role="status"],[role="alert"]')].map(e => ({ html: e.outerHTML, rect: e.getBoundingClientRect().toJSON(), visible: e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0 })),
            axe: { version: axe.testEngine.version, violations: axe.violations, incomplete: axe.incomplete, passes: axe.passes.map(p => ({ id: p.id, nodes: p.nodes.length })) } };
    });
    const prefix = `${result.runtime}-${id}`;
    result.evidencePrefix = `${subdir}/${prefix}`;
    fs.writeFileSync(path.join(out, `${prefix}.json`), JSON.stringify(result, null, 2) + '\n');
    fs.writeFileSync(path.join(out, `${prefix}-aria.txt`), await page.locator('body').ariaSnapshot());
    const session = await page.context().newCDPSession(page);
    const screenshot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(out, `${prefix}.png`), Buffer.from(screenshot.data, 'base64'));
    const ax = await session.send('Accessibility.getFullAXTree');
    fs.writeFileSync(path.join(out, `${prefix}-ax.json`), JSON.stringify(ax, null, 2));
    await session.detach();
    console.log(JSON.stringify({ id: prefix, errors: result.errors.length, violations: result.axe.violations.map(v => `${v.id}:${v.nodes.length}`), controls: result.controls.length, text: result.text.slice(0, 100) }));
    return result;
}
module.exports = { capture, out };
if (require.main === module) (async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    try {
        for (const page of browser.contexts().flatMap(c => c.pages())) {
            if (!/fixtures\/(library|reader)\.html/.test(page.url())) continue;
            const cases = await page.evaluate(() => window.auditCases);
            for (const c of cases) {
                if (process.argv[2] && !new RegExp(process.argv[2]).test(c.id)) continue;
                try {
                    await page.evaluate(id => window.auditMount(id), c.id);
                    await page.waitForTimeout(650);
                    if (['apiapp-add', 'delete-feed', 'delete-publication', 'update-feed', 'opds-menu'].includes(c.id)) {
                        await page.getByRole('button').first().click();
                        await page.waitForTimeout(300);
                    }
                    await capture(page, c.id);
                } catch (error) {
                    fs.writeFileSync(path.join(out, `failure-${c.id}.json`), JSON.stringify({ id: c.id, files: c.files, error: String(error), renderer: await page.evaluate(() => ({ errors: window.auditErrors, text: document.body.innerText })) }, null, 2));
                    console.log(`${c.id} FAILED: ${String(error).slice(0, 150)}`);
                }
            }
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
