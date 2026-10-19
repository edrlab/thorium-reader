process.env.THORIUM_AUDIT_EVIDENCE_SUBDIR = 'batch-3';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const { capture, out } = require('./fixture-scan.cjs');
const { layout, bounded, focusTrace, save } = require('./layout-checks.cjs');
const only = process.env.THORIUM_AUDIT_ONLY;
const tests = only ? JSON.parse(fs.readFileSync(path.join(out, 'fixture-checks.json'))).tests : [];
async function test(id, run) {
    if (only && !new RegExp(only).test(id)) return;
    const previous = tests.findIndex(t => t.id === id); if (previous >= 0) tests.splice(previous, 1);
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error).slice(0, 1200)); }
    fs.writeFileSync(path.join(out, 'fixture-checks.json'), JSON.stringify({ batch: 3, tests }, null, 2) + '\n');
}
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().endsWith('/library.html'));
        const reader = pages.find(p => p.url().endsWith('/reader.html'));
        for (const p of [lib, reader]) { await p.reload(); await p.setViewportSize({ width: 1200, height: 850 }); }
        const mount = async (p, id) => { await p.evaluate(id => window.auditMount(id), id); await p.waitForTimeout(200); assert.deepEqual(await p.evaluate(() => window.auditErrors), []); };
        for (const runtime of ['library', 'reader']) await test(runtime + '-settings-320-reflow-and-keyboard', async () => {
            const page = runtime === 'library' ? lib : reader;
            await page.setViewportSize({ width: 320, height: 228 }); await mount(page, runtime === 'library' ? 'library-settings' : 'reader-settings-modal');
            await page.getByRole('button').first().press('Enter');
            const evidence = [], counts = {};
            for (const name of runtime === 'library' ? ['General', 'Keyboard shortcuts', 'Profiles', 'Storage', 'Advanced'] : ['Display', 'Text', 'Spacing', 'Preferences']) {
                const tab = page.getByRole('tab', { name, exact: true }); await tab.press('Enter');
                const m = await layout(page); bounded(m);
                const trace = await focusTrace(page, tab); counts[name] = trace.length;
                const label = runtime + '-320-' + name.toLowerCase().replaceAll(' ', '-'); save(out, label, m, trace);
                // Keep the content in view after the focus trace returns to the tab list.
                const content = page.getByRole('tabpanel'); await content.locator('h3').first().scrollIntoViewIfNeeded().catch(() => {});
                const r = await capture(page, '320-' + name.toLowerCase().replaceAll(' ', '-')); evidence.push(r.evidencePrefix + '.json');
            }
            await page.getByRole('button', { name: 'Close', exact: true }).press('Enter');
            await expect(page.getByRole('button').first()).toBeFocused();
            await page.setViewportSize({ width: 1200, height: 850 });
            return { findings: ['A26'], evidence, keyboardStops: counts, limitation: '320x228 CSS viewport via CDP; actual components and keyboard events. No setting values changed.' };
        });
        await test('library-french-settings-320', async () => {
            await lib.setViewportSize({ width: 320, height: 228 }); await mount(lib, 'library-settings'); await lib.evaluate(() => window.auditSetLocale('fr'));
            await lib.getByRole('button').first().press('Enter');
            const evidence = [];
            for (const tab of await lib.getByRole('tab').all()) {
                await tab.press('Enter'); const m = await layout(lib); bounded(m);
                const name = await tab.getAttribute('data-key'); save(out, 'library-fr-' + name, m);
                const r = await capture(lib, 'fr-' + name); evidence.push(r.evidencePrefix + '.json');
            }
            await lib.keyboard.press('Escape'); await lib.evaluate(() => window.auditSetLocale('en')); await lib.setViewportSize({ width: 1200, height: 850 });
            return { findings: ['A26'], evidence };
        });
        await test('editable-tag-targets-real-publication-context', async () => {
            await lib.setViewportSize({ width: 320, height: 228 }); await mount(lib, 'publication-tags');
            const buttons = lib.getByRole('button', { name: /^Edit tag: / }); await expect(buttons).toHaveCount(2);
            const geometry = [];
            for (const button of await buttons.all()) {
                const box = await button.boundingBox(); assert.ok(box.width >= 24 && box.height >= 24); geometry.push(box);
                await button.press('Enter');
                const dialog = lib.getByRole('dialog', { name: await button.getAttribute('aria-label'), exact: true });
                await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button').first()).toBeFocused();
                await lib.keyboard.press('Escape'); await expect(lib.locator('[role="dialog"]')).toHaveCount(0);
                await lib.waitForTimeout(100); await expect(button).toBeFocused();
            }
            const r = await capture(lib, 'publication-tag-targets');
            assert.deepEqual(r.axe.violations.filter(v => v.id === 'target-size').map(v => v.id), []);
            assert.equal(await lib.evaluate(() => window.auditActions.some(a => String(a).includes('delete-tag'))), false);
            await lib.setViewportSize({ width: 1200, height: 850 });
            return { findings: ['A31'], evidence: r.evidencePrefix + '.json', geometry, limitation: 'Real TagManager composition with synthetic publication. Popovers cancelled; no tag deleted.' };
        });
        await test('standalone-tag-targets-regression', async () => {
            await mount(lib, 'editable-tags'); const buttons = lib.getByRole('button', { name: /^Edit tag: / });
            for (const button of await buttons.all()) { const box = await button.boundingBox(); assert.ok(box.width >= 24 && box.height >= 24); }
            const r = await capture(lib, 'editable-tags'); assert.equal(r.axe.violations.filter(v => v.id === 'target-size').length, 0);
            return { findings: ['A31'], evidence: r.evidencePrefix + '.json' };
        });
        for (const id of ['apiapp-add', 'delete-publication']) await test(id + '-modal-regression', async () => {
            await lib.setViewportSize({ width: 1200, height: 850 }); await mount(lib, id); const trigger = lib.getByRole('button').first(); await trigger.press('Enter');
            await expect(lib.getByRole(id === 'apiapp-add' ? 'dialog' : 'alertdialog')).toBeVisible();
            const r = await capture(lib, id + '-regression');
            if (id === 'delete-publication') await lib.getByRole('button', { name: 'Cancel', exact: true }).press('Enter'); else await lib.keyboard.press('Escape');
            await expect(trigger).toBeFocused(); return { findings: ['A26'], evidence: r.evidencePrefix + '.json', limitation: 'Standard-size shared modal regression only; cancellation without mutation.' };
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
