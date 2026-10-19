// Keyboard and semantics checks against real components in isolated Electron runtimes.
process.env.THORIUM_AUDIT_EVIDENCE_SUBDIR ||= 'batch-2';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const { capture, out } = require('./fixture-scan.cjs');
const tests = [];
async function test(id, run) {
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error).slice(0, 400)); }
    fs.writeFileSync(path.join(out, 'fixture-checks.json'), JSON.stringify({ batch: 2, tests }, null, 2) + '\n');
}
const noRules = (r, rules) => assert.deepEqual(r.axe.violations.filter(v => rules.includes(v.id)).map(v => v.id), []);
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().endsWith('/library.html'));
        const reader = pages.find(p => p.url().endsWith('/reader.html'));
        for (const p of [lib, reader]) await p.reload();
        const mount = async (p, id) => { await p.evaluate(id => window.auditMount(id), id); await p.waitForTimeout(200); assert.deepEqual(await p.evaluate(() => window.auditErrors), []); };
        const actions = async p => p.evaluate(() => window.auditActions.filter(a => a[0] === 'dispatch').map(a => a[1]));
        await test('download-cancel-enter-space-and-localization', async () => {
            await mount(lib, 'downloads');
            const cancel = lib.getByRole('button', { name: 'Cancel download: Audit book download', exact: true });
            await cancel.focus(); await expect(cancel).toBeFocused(); await lib.keyboard.press('Enter');
            await lib.getByRole('button', { name: 'Cancel download: Queued audit book', exact: true }).press('Space');
            const dispatched = (await actions(lib)).filter(a => a.type.includes('ABORT'));
            assert.equal(dispatched.length, 2); assert.deepEqual(dispatched.map(a => a.payload), [{ id: 1 }, { id: 2 }]);
            const r = await capture(lib, 'downloads'); noRules(r, ['button-name', 'aria-hidden-focus']);
            await lib.evaluate(() => window.auditSetLocale('fr'));
            await expect(lib.getByRole('button', { name: 'Annuler le téléchargement : Audit book download', exact: true })).toHaveCount(1);
            const fr = await capture(lib, 'downloads-fr');
            return { findings: ['A05'], evidence: [r.evidencePrefix + '.json', fr.evidencePrefix + '.json'], limitation: 'Synthetic download IDs; abort actions recorded without download sagas.' };
        });
        await test('carousel-exposed-buttons-scroll-with-keyboard', async () => {
            await mount(lib, 'carousel');
            const left = lib.getByRole('button', { name: 'Slide to the left', exact: true });
            const right = lib.getByRole('button', { name: 'Slide to the right', exact: true });
            await expect(left).toBeDisabled(); await expect(right).toBeEnabled();
            await right.press('Enter'); await expect(left).toBeEnabled();
            const r = await capture(lib, 'carousel-scrolled'); noRules(r, ['aria-hidden-focus', 'button-name']);
            await left.press('Space'); await expect(left).toBeDisabled();
            const reset = await capture(lib, 'carousel-start');
            return { findings: ['A06'], evidence: [r.evidencePrefix + '.json', reset.evidencePrefix + '.json'] };
        });
        await test('pagination-single-controls-and-routing', async () => {
            await mount(lib, 'opds-navigation');
            // Check native tab order using the four controls in their rendered order.
            const controls = lib.locator('button[class*="pagination_arrow"]'); await expect(controls).toHaveCount(4);
            await controls.first().focus();
            for (let i = 0; i < 4; i++) {
                await expect(controls.nth(i)).toBeFocused();
                assert.ok(await controls.nth(i).getAttribute('aria-label'));
                await lib.keyboard.press(i % 2 ? 'Space' : 'Enter');
                if (i < 3) await lib.keyboard.press('Tab');
            }
            const navigation = (await actions(lib)).filter(a => a.type === '@@router/CALL_HISTORY_METHOD');
            assert.equal(navigation.length, 4); assert.equal(new Set(navigation.map(a => JSON.stringify(a.payload))).size, 4);
            assert.equal(await controls.locator('a,button').count(), 0);
            const r = await capture(lib, 'opds-navigation'); noRules(r, ['nested-interactive', 'button-name']);
            return { findings: ['A07'], evidence: r.evidencePrefix + '.json', limitation: 'Redux navigation requests recorded; no remote catalog was contacted.' };
        });
        await test('pagination-disabled-and-absent-links', async () => {
            await mount(lib, 'opds-navigation-disabled');
            const controls = lib.locator('button'); await expect(controls).toHaveCount(4);
            for (let i = 0; i < 4; i++) await expect(controls.nth(i)).toBeDisabled();
            await controls.evaluateAll(elements => elements.forEach(e => e.click()));
            assert.equal((await actions(lib)).filter(a => a.type === '@@router/CALL_HISTORY_METHOD').length, 0);
            const r = await capture(lib, 'opds-navigation-disabled'); noRules(r, ['nested-interactive', 'button-name']);
            return { findings: ['A07'], evidence: r.evidencePrefix + '.json' };
        });
        await test('refresh-native-button-and-skip-heading-levels', async () => {
            await mount(lib, 'library-refresh');
            const refresh = lib.getByRole('button', { name: 'reload', exact: true });
            await expect(refresh).toHaveCount(1); assert.equal(await refresh.locator('a').count(), 0);
            await refresh.press('Enter'); await refresh.press('Space');
            assert.equal((await actions(lib)).filter(a => a.type === '@@router/CALL_HISTORY_METHOD').length, 2);
            for (const id of ['main-toolbar', 'main-content']) {
                await expect(lib.locator('#' + id)).toHaveAttribute('aria-level', '2');
                await lib.locator('#' + id).focus(); await expect(lib.locator('#' + id)).toBeFocused();
            }
            const r = await capture(lib, 'library-refresh'); noRules(r, ['nested-interactive', 'button-name', 'aria-required-attr']);
            return { findings: ['A07', 'A21'], evidence: r.evidencePrefix + '.json' };
        });
        await test('profiles-one-native-radio-arrow-selection', async () => {
            await mount(lib, 'profiles');
            const group = lib.getByRole('radiogroup', { name: 'Profiles', exact: true });
            const radios = group.getByRole('radio'); await expect(radios).toHaveCount(3);
            const first = group.getByRole('radio', { name: 'Audit profile 1', exact: true });
            const second = group.getByRole('radio', { name: 'Audit profile 2', exact: true });
            await first.focus(); await lib.keyboard.press('ArrowDown'); await expect(second).toBeChecked(); await expect(second).toBeFocused();
            await lib.keyboard.press('ArrowDown'); await expect(group.getByRole('radio', { name: 'Thorium vanilla', exact: true })).toBeChecked();
            await lib.keyboard.press('ArrowUp'); await expect(second).toBeChecked();
            await first.focus(); await lib.keyboard.press('Space'); await expect(first).toBeChecked();
            const activation = (await actions(lib)).filter(a => a.type === 'CUSTOMIZATION_ACTIVATE_PROFILE_ID');
            assert.deepEqual(activation.map(a => a.payload.id), ['audit-two', '', 'audit-two', 'audit-one']);
            assert.equal(new Set(await radios.evaluateAll(es => es.map(e => e.name))).size, 1);
            const r = await capture(lib, 'profiles'); noRules(r, ['aria-required-attr', 'aria-input-field-name']);
            return { findings: ['A10'], evidence: r.evidencePrefix + '.json', limitation: 'Real reducer updates in fixture; branding activation sagas and profile deletion not executed.' };
        });
        await test('apiapp-buttons-select-without-submitting', async () => {
            await mount(lib, 'apiapp-add'); await lib.getByRole('button').first().press('Enter');
            const search = lib.getByRole('searchbox', { name: 'Search', exact: true });
            await search.fill('Audit'); await search.press('Enter');
            // Fulfil the recorded API request at the Redux service boundary, with local search results.
            await lib.evaluate(() => {
                const request = window.auditActions.map(a => a[1]).find(a => a?.type === 'API_REQUEST' && a.meta?.api?.moduleId === 'apiapp');
                if (!request) throw new Error('Missing search request');
                const store = window.auditStore;
                store.dispatch({ type: 'AUDIT_SET', payload: { api: { ...store.getState().api, [request.meta.api.requestId]: { data: { result: [1, 2].map(id => ({ id: 'audit-' + id, name: 'Audit library ' + id, address: 'Local address ' + id, url: 'https://audit.invalid/' + id })) } } } } });
            });
            const one = lib.getByRole('button', { name: 'Audit library 1 Local address 1', exact: true });
            const two = lib.getByRole('button', { name: 'Audit library 2 Local address 2', exact: true });
            await one.press('Enter'); await expect(one).toHaveAttribute('aria-pressed', 'true');
            await two.press('Space'); await expect(two).toHaveAttribute('aria-pressed', 'true'); await expect(one).toHaveAttribute('aria-pressed', 'false');
            assert.equal((await actions(lib)).filter(a => a.meta?.api?.methodId === 'addFeed').length, 0);
            await expect(lib.getByRole('dialog')).toBeVisible(); assert.equal(await lib.getByRole('option').count(), 0);
            const r = await capture(lib, 'apiapp-results'); noRules(r, ['aria-required-parent', 'aria-required-children', 'nested-interactive']);
            await lib.keyboard.press('Escape'); await expect(lib.getByRole('button').first()).toBeFocused();
            return { findings: ['A09'], evidence: r.evidencePrefix + '.json', limitation: 'Synthetic API response. Selection tested; no catalog added.' };
        });
        for (const [runtime, page] of [['library', lib], ['reader', reader]]) await test(runtime + '-description-disclosure', async () => {
            await mount(page, 'long-description');
            const more = page.getByRole('button', { name: 'See more', exact: true }); await expect(more).toHaveAttribute('aria-expanded', 'false');
            const target = await more.getAttribute('aria-controls'); assert.ok(target); assert.equal(await page.evaluate(id => !!document.getElementById(id), target), true);
            await more.press('Enter'); const less = page.getByRole('button', { name: 'See less', exact: true }); await expect(less).toHaveAttribute('aria-expanded', 'true');
            const r = await capture(page, 'description-expanded'); noRules(r, ['aria-hidden-focus', 'button-name']);
            await less.press('Space'); await expect(more).toHaveAttribute('aria-expanded', 'false');
            const closed = await capture(page, 'description-collapsed');
            return { findings: ['A29'], evidence: [r.evidencePrefix + '.json', closed.evidencePrefix + '.json'] };
        });
        await test('reader-tts-preview-disclosure-exposed', async () => {
            await mount(reader, 'audio-preview');
            const summary = reader.getByText('TTS highlight style preview', { exact: true });
            await summary.focus(); await expect(summary).toBeFocused(); await reader.keyboard.press('Enter');
            const details = reader.locator('details'); await expect(details).toHaveAttribute('open', '');
            const r = await capture(reader, 'tts-preview-expanded'); noRules(r, ['aria-hidden-focus']);
            const ax = JSON.parse(fs.readFileSync(path.join(out, 'reader-tts-preview-expanded-ax.json')));
            assert.ok(ax.nodes.some(n => !n.ignored && n.role?.value === 'DisclosureTriangle' && n.name?.value?.startsWith('TTS highlight style preview') && n.properties?.some(p => p.name === 'expanded' && p.value.value === true)));
            await reader.keyboard.press('Space'); await expect(details).not.toHaveAttribute('open', '');
            return { findings: ['A25'], evidence: r.evidencePrefix + '.json', limitation: 'Preview disclosure only; no audio played.' };
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
