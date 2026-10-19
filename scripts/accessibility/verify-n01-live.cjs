// Verify actual Library control names after N01; native NVDA output is recorded separately.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const out = path.resolve('docs/accessibility/evidence/native-nvda/n01-fix');
fs.mkdirSync(out, { recursive: true });
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 10000 });
    try {
        const page = browser.contexts().flatMap(context => context.pages()).find(page => page.url().includes('index_library.html'));
        assert.ok(page, 'Actual Library page required');
        // Library bootstrap can be refreshed; do not reload the Reader.
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.locator('.publication_main_container').first().waitFor({ timeout: 15000 });
        const cards = await page.locator('.publication_main_container').evaluateAll(elements => elements.map(element => ({
            title: element.querySelector('.publication_title')?.textContent,
            name: element.getAttribute('aria-label'),
            tooltip: element.getAttribute('title'),
            tag: element.tagName,
        })));
        assert.ok(cards.length >= 2, 'Need actual PDF and EPUB publications');
        const cdp = await page.context().newCDPSession(page);
        const ax = await cdp.send('Accessibility.getFullAXTree');
        await cdp.detach();
        for (const card of cards) {
            assert.ok(card.title && card.name.startsWith(card.title), 'Name must start with visible title: ' + card.title);
            assert.equal(card.tooltip, card.name);
            assert.ok(ax.nodes.some(node => !node.ignored && ['link', 'button'].includes(node.role?.value) && node.name?.value === card.name), 'Actual AX name: ' + card.name);
        }
        assert.ok(cards.some(card => card.name === 'Untitled'), 'Original PDF regression case');
        assert.ok(cards.some(card => card.name === 'Accessible EPUB 3 - Matt Garrish'), 'EPUB author-name regression case');
        await page.screenshot({ path: path.join(out, 'library-cards.png') });
        fs.writeFileSync(path.join(out, 'library-card-names.json'), JSON.stringify({ kind: 'actual application', source: 'N01 working-tree fix on c3467cd61', locale: await page.locator('html').getAttribute('lang'), status: 'passed', cards, controlNames: ax.nodes.filter(node => !node.ignored && ['link', 'button'].includes(node.role?.value)).map(node => ({ role: node.role.value, name: node.name?.value })), limitations: 'Five existing local cards sampled; catalog, unavailable and all locale branches are source-repaired but not dynamically certified. Chromium AX verification is separate from native NVDA confirmation.' }, null, 2) + '\n');
        console.log(JSON.stringify({ status: 'passed', cards: cards.map(card => card.name) }));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
