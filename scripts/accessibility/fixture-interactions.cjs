// Real keyboard events against production components in the isolated fixture stores.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { capture, out } = require('./fixture-scan.cjs');
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const results = [];
    const pages = browser.contexts().flatMap(c => c.pages());
    const lib = pages.find(p => p.url().endsWith('/library.html'));
    const reader = pages.find(p => p.url().endsWith('/reader.html'));
    const focus = page => page.evaluate(() => ({ html: document.activeElement?.outerHTML?.slice(0, 1600), hidden: document.activeElement?.closest('[aria-hidden="true"]')?.outerHTML?.slice(0, 400) }));
    async function mount(page, id, delay = 550) { await page.evaluate(id => window.auditMount(id), id); await page.waitForTimeout(delay); }
    async function trace(page, count = 8) {
        const steps = [];
        for (let i = 0; i < count; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(30); steps.push(await focus(page)); }
        return steps;
    }
    async function test(id, page, run) {
        try { const result = await run(); results.push({ id, runtime: page === lib ? 'library' : 'reader', ...result }); console.log(id + ': complete'); }
        catch (error) { results.push({ id, error: String(error), rendererErrors: await page.evaluate(() => window.auditErrors) }); console.log(id + ': ' + String(error).slice(0, 150)); }
        fs.writeFileSync(path.join(out, 'keyboard-interactions.json'), JSON.stringify(results, null, 2) + '\n');
    }
    try {
        for (const page of [lib, reader]) await page.reload();
        for (const id of ['delete-feed', 'delete-publication', 'update-feed', 'apiapp-add']) await test(id + '-focus', lib, async () => {
            await mount(lib, id);
            const trigger = lib.getByRole('button').first();
            await trigger.focus(); await lib.keyboard.press('Enter'); await lib.waitForTimeout(150);
            const initialFocus = await focus(lib);
            const steps = await trace(lib, 12);
            await lib.keyboard.press('Escape'); await lib.waitForTimeout(150);
            return { initialFocus, steps, afterEscape: await focus(lib), dialogsAfterEscape: await lib.getByRole('dialog').count() + await lib.getByRole('alertdialog').count() };
        });
        await test('download-keyboard', lib, async () => {
            await mount(lib, 'downloads'); await capture(lib, 'downloads');
            return { steps: await trace(lib, 6), anchors: await lib.locator('a').evaluateAll(es => es.map(e => ({ html: e.outerHTML, tabIndex: e.tabIndex, role: e.getAttribute('role') }))) };
        });
        await test('description-hidden-focus', lib, async () => {
            await mount(lib, 'long-description', 700);
            const steps = await trace(lib, 3);
            const b = lib.locator('button'); await b.focus(); const before = await b.textContent();
            await lib.keyboard.press('Enter'); const after = await b.textContent();
            await capture(lib, 'description-expanded'); return { steps, before, after, focus: await focus(lib) };
        });
        await test('tag-popover', lib, async () => {
            await mount(lib, 'editable-tags'); const b = lib.locator('button').first();
            await b.focus(); await lib.keyboard.press('Enter'); await lib.waitForTimeout(150);
            await capture(lib, 'tag-delete-popover');
            const steps = await trace(lib, 5); await lib.keyboard.press('Escape'); await lib.waitForTimeout(100);
            return { steps, afterEscape: await focus(lib) };
        });
        await test('toast-keyboard-expand', lib, async () => {
            await mount(lib, 'toast', 100); const alert = lib.locator('p[role="alert"]'); await alert.focus();
            const before = await alert.getAttribute('class'); await lib.keyboard.press('Enter'); await lib.keyboard.press('Space'); const afterKeyboard = await alert.getAttribute('class');
            await alert.locator('..').click({ position: { x: 2, y: 2 } }); const afterPointer = await alert.getAttribute('class');
            await capture(lib, 'toast-expanded'); return { before, afterKeyboard, afterPointer, focus: await focus(lib) };
        });
        await test('empty-library-details', lib, async () => { await mount(lib, 'empty-library'); const summary = lib.locator('summary'); await summary.focus(); await lib.keyboard.press('Enter'); return { open: await lib.locator('details').getAttribute('open'), focus: await focus(lib) }; });
        await test('session-space', lib, async () => { await mount(lib, 'session-settings'); const c = lib.getByRole('checkbox'); await c.focus(); const before = await c.getAttribute('aria-checked'); await lib.keyboard.press('Space'); return { before, after: await c.getAttribute('aria-checked'), steps: await trace(lib, 3) }; });
        for (const id of ['file-import-valid', 'file-import-invalid', 'lcp-authentication', 'import-annotations-conflicts']) await test(id + '-keyboard', lib, async () => { await mount(lib, id); const initial = await focus(lib); const steps = await trace(lib, 9); await lib.keyboard.press('Escape'); return { initial, steps, actions: await lib.evaluate(() => window.auditActions), afterEscape: await focus(lib) }; });
        for (const id of ['borrow', 'cancel-hold']) await test(id + '-response-states', lib, async () => {
            await mount(lib, id); await lib.getByRole('button').focus(); await lib.keyboard.press('Enter'); await lib.waitForTimeout(80);
            await capture(lib, id + '-pending'); const pendingFocus = await focus(lib);
            await lib.evaluate(() => { const request = window.auditActions.find(a => a[0] === 'dispatch' && a[1].type === 'API_REQUEST')[1]; window.auditStore.dispatch({ type: 'API_RESULT', meta: request.meta, payload: { isSuccess: false, statusCode: 500 }, error: false }); });
            await lib.waitForTimeout(150); await capture(lib, id + '-failed');
            return { pendingFocus, failureAlert: await lib.getByRole('alert').textContent(), steps: await trace(lib, 4) };
        });
        await test('apiapp-search-results', lib, async () => {
            await mount(lib, 'apiapp-add'); await lib.getByRole('button').first().click();
            await lib.locator('#apiapp_search').fill('Audit'); await lib.locator('#apiapp_search').press('Enter');
            await lib.evaluate(() => { const request = window.auditActions.find(a => a[0] === 'dispatch' && a[1].type === 'API_REQUEST')[1]; window.auditStore.dispatch({ type: 'API_RESULT', meta: request.meta, payload: [{ id: 'audit', name: 'Audit lending library', address: 'Audit city', url: 'https://audit.invalid' }], error: false }); });
            await lib.waitForTimeout(100); await capture(lib, 'apiapp-search-results');
            return { steps: await trace(lib, 10), actions: await lib.evaluate(() => window.auditActions) };
        });
        await test('opds-navigation-keyboard', lib, async () => { await mount(lib, 'opds-navigation'); await lib.getByRole('searchbox').fill('Audit'); await lib.keyboard.press('Enter'); return { steps: await trace(lib, 10), actions: await lib.evaluate(() => window.auditActions) }; });
        await test('lcp-renew-return-confirmations', lib, async () => {
            const states = [];
            for (const name of ['Renew', 'Return']) { await mount(lib, 'lcp-controls'); await lib.getByRole('button', { name, exact: true }).focus(); await lib.keyboard.press('Enter'); await lib.waitForTimeout(100); await capture(lib, 'lcp-' + name.toLowerCase() + '-confirmation'); const initial = await focus(lib); await lib.getByRole('button', { name: 'Cancel', exact: true }).press('Enter'); states.push({ name, initial, restored: await focus(lib) }); }
            return { states };
        });
        for (const id of ['annotation-card', 'bookmark-card']) await test(id + '-interactions', reader, async () => {
            await mount(reader, id); const filter = reader.locator('a').first(); await filter.focus(); await reader.keyboard.press('Enter');
            const filterFocus = await focus(reader), filterActions = await reader.evaluate(() => window.auditActions);
            await reader.getByRole('button', { name: 'Edit', exact: true }).focus(); await reader.keyboard.press('Enter'); await reader.waitForTimeout(150);
            await capture(reader, id + '-editing'); const initial = await focus(reader); const steps = await trace(reader, 12); await reader.keyboard.press('Escape'); await reader.waitForTimeout(150);
            return { filterFocus, filterActions, initial, steps, afterEscape: await focus(reader) };
        });
        await test('image-viewer-zoom', reader, async () => {
            await mount(reader, 'image-viewer'); const transform = () => reader.locator('.react-transform-component').getAttribute('style');
            const before = await transform(); await reader.getByRole('button', { name: 'Zoom In', exact: true }).focus(); await reader.keyboard.press('Enter'); await reader.waitForTimeout(250); const after = await transform();
            await capture(reader, 'image-viewer-zoomed'); await reader.getByRole('button', { name: 'Reset Zoom', exact: true }).press('Enter'); await reader.waitForTimeout(250); const reset = await transform();
            const steps = await trace(reader, 8); await reader.keyboard.press('Escape'); await reader.waitForTimeout(100); return { before, after, reset, steps, dialogsAfterEscape: await reader.getByRole('dialog').count() };
        });
        await test('divina-arrow-selection', reader, async () => { await mount(reader, 'divina-modes'); await reader.locator('#radio-single').focus(); await reader.keyboard.press('ArrowRight'); await capture(reader, 'divina-selection'); return { selected: await reader.locator('input:checked').getAttribute('id'), guidedDisabled: await reader.locator('#radio-guided').isDisabled() }; });
        await test('reader-tags-and-close', reader, async () => { await mount(reader, 'publication-information'); await capture(reader, 'publication-information'); const steps = await trace(reader, 12); await reader.keyboard.press('Escape'); await reader.waitForTimeout(150); return { steps, dialogsAfterEscape: await reader.getByRole('dialog').count(), focus: await focus(reader) }; });
        await test('user-profile-loading-unavailable', lib, async () => {
            await lib.evaluate(() => { window.auditRealService = window.auditService; window.auditService = () => new Promise(resolve => setTimeout(() => resolve(undefined), 1300)); });
            await mount(lib, 'user-profile', 0); await capture(lib, 'user-profile-loading');
            await lib.waitForTimeout(1400); await capture(lib, 'user-profile-unavailable');
            await lib.evaluate(() => window.auditService = window.auditRealService); return {};
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
