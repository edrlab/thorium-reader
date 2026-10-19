process.env.THORIUM_AUDIT_EVIDENCE_SUBDIR = 'batch-4';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const { capture, out } = require('./fixture-scan.cjs');
const only = process.env.THORIUM_AUDIT_ONLY;
const tests = only ? JSON.parse(fs.readFileSync(path.join(out, 'fixture-checks.json'))).tests : [];
async function test(id, run) {
    if (only && !new RegExp(only).test(id)) return;
    const old = tests.findIndex(t => t.id === id); if (old >= 0) tests.splice(old, 1);
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error)); }
    fs.writeFileSync(path.join(out, 'fixture-checks.json'), JSON.stringify({ batch: 4, tests }, null, 2) + '\n');
}
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().endsWith('/library.html'));
        const reader = pages.find(p => p.url().endsWith('/reader.html'));
        for (const p of [lib, reader]) { await p.reload(); await p.setViewportSize({ width: 1200, height: 850 }); }
        const mount = async (p, id) => { await p.evaluate(id => window.auditMount(id), id); await p.waitForTimeout(200); assert.deepEqual(await p.evaluate(() => window.auditErrors), []); };
        const patch = (p, payload) => p.evaluate(payload => window.auditStore.dispatch({ type: 'AUDIT_SET', payload }), payload);
        const evidence = async (p, label) => { await p.waitForTimeout(300); return (await capture(p, label)).evidencePrefix + '.json'; };
        for (const locale of ['en', 'fr']) {
            await test('main-load-status-' + locale, async () => {
                await mount(lib, 'main-load-status'); await lib.evaluate(l => window.auditSetLocale(l), locale);
                const status = lib.getByRole('status'); await expect(status).toHaveText(''); const handle = await status.elementHandle();
                await patch(lib, { load: { state: true } }); await expect(status).toHaveText(locale === 'en' ? 'Loading…' : 'Chargement…');
                const captures = [await evidence(lib, 'main-load-busy-' + locale)];
                await patch(lib, { load: { state: false } }); await expect(status).toHaveText('');
                assert.equal(await status.evaluate((el, previous) => el === previous, handle), true); await handle.dispose();
                captures.push(await evidence(lib, 'main-load-idle-' + locale));
                return { findings: ['A15'], evidence: captures, limitation: 'Real connected loader and reducer; synthetic load-state transitions. Stable polite status node, no focus movement.' };
            });
            await test('opds-status-transitions-' + locale, async () => {
                await mount(lib, 'opds-status'); await lib.evaluate(l => window.auditSetLocale(l), locale);
                const status = lib.getByRole('status'); await expect(status).toHaveCount(1); await expect(status).toContainText(locale === 'en' ? 'Loading' : 'Chargement');
                const handle = await status.elementHandle(); const captures = [await evidence(lib, 'opds-loading-' + locale)];
                for (const [name, data] of [
                    ['error', { error: true, errorMessage: { message: 'Audit network failure' } }],
                    ['empty', { result: { isSuccess: true, contentType: 'application/opds+json', data: { opds: {} } } }],
                    ['timeout', { result: { isTimeout: true } }],
                ]) {
                    await patch(lib, { api: { browseOpdsApiResult: { data } } });
                    await expect(status).not.toHaveText(''); assert.equal(await status.evaluate((el, previous) => el === previous, handle), true);
                    if (name === 'error') await expect(status).toContainText('Audit network failure');
                    captures.push(await evidence(lib, 'opds-' + name + '-' + locale));
                }
                await handle.dispose(); return { findings: ['A15'], evidence: captures, limitation: 'Actual BrowserResult composition; synthetic network states, no remote requests. One persistent status avoids duplicate loader announcements.' };
            });
            await test('search-status-transitions-' + locale, async () => {
                await mount(reader, 'search-status'); await reader.evaluate(l => window.auditSetLocale(l), locale);
                const status = reader.getByRole('status'); const input = reader.getByRole('searchbox'); await input.focus(); const handle = await status.elementHandle();
                await reader.keyboard.press('Tab'); await expect(reader.getByRole('search').getByRole('button')).toBeFocused(); await input.focus();
                const change = (state, count) => reader.evaluate(({ state, count }) => { const s = window.auditStore.getState().search; window.auditStore.dispatch({ type: 'AUDIT_SET', payload: { search: { ...s, state, textSearch: 'audit', foundArray: Array.from({ length: count }, () => ({})) } } }); }, { state, count });
                await change('busy', 0); await expect(status).toHaveText(locale === 'en' ? 'Searching…' : 'Recherche en cours…');
                const captures = [await evidence(reader, 'search-busy-' + locale)];
                await change('idle', 3); await expect(status).toContainText('3'); captures.push(await evidence(reader, 'search-results-' + locale));
                await change('busy', 0); await change('idle', 0); await expect(status).not.toHaveText(''); await expect(status).not.toContainText('3');
                await expect(input).toBeFocused(); assert.equal(await status.evaluate((el, previous) => el === previous, handle), true); await handle.dispose();
                captures.push(await evidence(reader, 'search-empty-' + locale));
                return { findings: ['A15'], evidence: captures, limitation: 'Actual EPUB SearchPicker and service-free reducer transitions. Search input keeps focus; no native screen-reader listening.' };
            });
        }
        await test('pdf-contents-arrives-and-changes-depth', async () => {
            await mount(reader, 'changing-pdf-contents');
            const replace = reader.getByRole('button', { name: 'Replace PDF contents', exact: true }); const captures = [];
            for (const [index, count] of [[1, 3], [2, 4], [3, 0]]) {
                await replace.press('Enter'); await expect(reader.locator('a[data-href]')).toHaveCount(count);
                assert.deepEqual(await reader.evaluate(() => window.auditErrors), []);
                if (count) {
                    const link = reader.locator('a[data-href]').last(); await link.press('Enter');
                    assert.ok(await reader.evaluate(() => window.auditActions.some(a => a[1] === '3' || a[1] === '4')));
                }
                captures.push(await evidence(reader, 'pdf-contents-change-' + index));
            }
            return { findings: ['A16'], evidence: captures, limitation: 'Actual ReaderMenu: empty to nested TOC, changed child count, then empty. Keyboard activation recorded; no hook-order error. Synthetic PDF metadata.' };
        });
        for (const count of [101, 1]) await test('print-preview-keyboard-' + count, async () => {
            await mount(reader, 'print-preview-' + count); const trigger = reader.getByRole('button', { name: 'Print preview', exact: true }); await trigger.press('Enter');
            const preview = reader.getByRole('region', { name: 'Preview', exact: true });
            await reader.getByRole('textbox', { name: 'Pages', exact: true }).focus(); await reader.keyboard.press('Tab'); await expect(preview).toBeFocused();
            await expect(preview.locator('img').first()).toHaveJSProperty('complete', true);
            const initial = await preview.evaluate(e => ({ width: e.clientWidth, scrollWidth: e.scrollWidth, left: e.scrollLeft }));
            const captures = [await evidence(reader, 'print-' + count + '-start')];
            if (count > 1) {
                assert.ok(initial.scrollWidth > initial.width);
                for (let i = 0; i < 12; i++) await preview.press('ArrowRight');
                await expect.poll(() => preview.evaluate(e => e.scrollLeft)).toBeGreaterThan(initial.left);
                const beforePage = await preview.evaluate(e => e.scrollLeft); await preview.press('PageDown');
                await expect.poll(() => preview.evaluate(e => e.scrollLeft)).toBeGreaterThan(beforePage);
                await preview.press('End');
                await expect.poll(() => preview.locator('img[alt="Page 101"]').count()).toBe(1);
                await expect(preview.locator('img[alt="Page 101"]')).toBeInViewport(); await expect(preview.locator('img[alt="Page 101"]')).toHaveJSProperty('complete', true);
                captures.push(await evidence(reader, 'print-' + count + '-end'));
                await preview.press('Home'); await expect.poll(() => preview.evaluate(e => e.scrollLeft)).toBe(0);
            } else assert.ok(initial.scrollWidth <= initial.width + 1);
            await reader.getByRole('button', { name: 'Cancel', exact: true }).press('Enter'); await expect(trigger).toBeFocused();
            assert.equal(await reader.evaluate(() => window.auditActions.some(a => JSON.stringify(a).includes('"READER_PRINT"'))), false);
            return { findings: ['A27'], evidence: captures, geometry: initial, limitation: '101 preloaded synthetic thumbnails or one-page boundary; real virtualizer. Tab, arrows, Home/End and cancellation only. Print never activated.' };
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
