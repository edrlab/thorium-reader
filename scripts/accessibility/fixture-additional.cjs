const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { capture, out } = require('./fixture-scan.cjs');
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    try {
        const page = browser.contexts().flatMap(c => c.pages()).find(p => p.url().endsWith('/library.html'));
        await page.evaluate(() => window.auditMount('opds-menu'));
        await page.getByRole('button').first().click();
        await page.evaluate(() => {
            const publication = { baseUrl: 'https://audit.invalid/', documentTitle: 'Audit OPDS publication', authorsLangString: [{ name: 'Audit author', nameLangString: { en: 'Audit author' } }], languages: ['en'], description: '<p>Audit catalog publication description.</p>', tags: [], numberOfPages: 100, catalogLinkView: [], cover: { coverLinks: [], thumbnailLinks: [] } };
            window.auditStore.dispatch({ type: 'AUDIT_SET', payload: { dialog: { open: true, type: 'publication-info-opds', data: { publication } } } });
        });
        await page.waitForTimeout(650); await capture(page, 'opds-menu');
        await page.evaluate(() => window.auditMount('cancel-hold'));
        await page.getByRole('button').focus(); await page.keyboard.press('Enter');
        await page.evaluate(() => { const request = window.auditActions.find(a => a[0] === 'dispatch' && a[1].type === 'API_REQUEST')[1]; window.auditStore.dispatch({ type: 'API_RESULT', meta: request.meta, payload: { isSuccess: false, statusCode: 500 }, error: false }); });
        await page.waitForTimeout(1500); await capture(page, 'cancel-hold-failed-settled');
        const failures = await page.evaluate(() => window.auditErrors);
        fs.writeFileSync(path.join(out, 'additional-checks.json'), JSON.stringify({ errors: failures, interpretation: 'Settled-state retest distinguishes CSS transition contrast from persistent failure. OPDS menu data supplied at its saga hydration boundary.' }, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
