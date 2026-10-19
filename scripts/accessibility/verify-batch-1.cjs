// Post-fix checks. Preserve the original audit captures under evidence/continuation.
process.env.THORIUM_AUDIT_EVIDENCE_SUBDIR = 'batch-1';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const { capture, out } = require('./fixture-scan.cjs');
const results = [];
async function test(id, run) {
    try { results.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { results.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error).slice(0, 250)); }
    fs.writeFileSync(path.join(out, 'fixture-checks.json'), JSON.stringify({ batch: 1, baseline: '1fcc4fa782cf0b24441128903f40b48fd476bba5', tests: results }, null, 2) + '\n');
}
const noRules = (result, rules) => assert.deepEqual(result.axe.violations.filter(v => rules.includes(v.id)).map(v => v.id), []);
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().endsWith('/library.html'));
        const reader = pages.find(p => p.url().endsWith('/reader.html'));
        for (const p of [lib, reader]) await p.reload();
        const mount = async (page, id) => { await page.evaluate(id => window.auditMount(id), id); await page.waitForTimeout(150); assert.deepEqual(await page.evaluate(() => window.auditErrors), []); };
        await test('font-range-name-and-values', async () => {
            await mount(reader, 'font-settings');
            const slider = reader.getByRole('slider', { name: 'Font size', exact: true });
            await expect(slider).toHaveAttribute('min', '75'); await expect(slider).not.toHaveAttribute('aria-valuemin', '0');
            await expect(slider).toHaveAttribute('aria-valuetext', '100%');
            await slider.focus(); await reader.keyboard.press('ArrowRight'); await expect(slider).toHaveValue('112.5');
            await reader.getByRole('button', { name: 'Increase font size', exact: true }).press('Enter'); await expect(slider).toHaveValue('125');
            await reader.getByRole('button', { name: 'Reset Font size', exact: true }).press('Enter'); await expect(slider).toHaveValue('100');
            const r = await capture(reader, 'font-settings'); noRules(r, ['label', 'aria-input-field-name', 'button-name']);
            return { findings: ['A01', 'A13'], evidence: r.evidencePrefix + '.json' };
        });
        await test('spacing-labels-and-repeated-adjustment', async () => {
            await mount(reader, 'spacing-settings');
            for (const setting of ['Margin', 'Word spacing', 'Letter spacing', 'Paragraph spacing', 'Line spacing']) {
                const slider = reader.getByRole('slider', { name: setting, exact: true }); await expect(slider).toHaveCount(1);
                const increase = reader.getByRole('button', { name: 'Increase ' + setting, exact: true });
                const before = Number(await slider.inputValue());
                await increase.press('Enter'); await expect(slider).toHaveValue(String(before + 1));
                await increase.press('Enter'); await expect(slider).toHaveValue(String(before + 2));
                await reader.getByRole('button', { name: 'Decrease ' + setting, exact: true }).press('Enter'); await expect(slider).toHaveValue(String(before + 1));
                assert.ok(await slider.getAttribute('aria-valuetext'));
            }
            const word = reader.getByRole('slider', { name: 'Word spacing', exact: true }); await expect(word).toHaveAttribute('aria-valuetext', '0.0675rem');
            const r = await capture(reader, 'spacing-settings'); noRules(r, ['label', 'aria-input-field-name', 'button-name']);
            return { findings: ['A01', 'A02', 'A13'], evidence: r.evidencePrefix + '.json' };
        });
        await test('localized-names-and-live-document-language', async () => {
            await mount(reader, 'spacing-settings'); await reader.evaluate(() => window.auditSetLocale('fr'));
            await expect(reader.getByRole('slider', { name: 'Espacement des mots', exact: true })).toHaveCount(1);
            await expect(reader.getByRole('button', { name: 'Augmenter Espacement des mots', exact: true })).toHaveCount(1);
            assert.equal(await reader.locator('html').getAttribute('lang'), 'fr');
            const r = await capture(reader, 'spacing-settings-fr');
            await reader.evaluate(() => window.auditSetLocale('en')); assert.equal(await reader.locator('html').getAttribute('lang'), 'en');
            return { findings: ['A01', 'A02', 'A18'], evidence: r.evidencePrefix + '.json' };
        });
        for (const [id, name] of [['annotation-card', 'Annotation note'], ['bookmark-card', 'Bookmark note']]) await test(id + '-editor-label', async () => {
            await mount(reader, id); await reader.getByRole('button', { name: 'Edit', exact: true }).press('Enter');
            const editor = reader.getByRole('textbox', { name, exact: true }); await expect(editor).toBeFocused();
            await expect(editor).toHaveValue('Audit note **with emphasis**');
            const r = await capture(reader, id + '-editing'); noRules(r, ['label']);
            await reader.keyboard.press('Escape'); await expect(reader.getByRole('button', { name: 'Edit', exact: true })).toBeFocused();
            return { findings: ['A03'], evidence: r.evidencePrefix + '.json' };
        });
        await test('apiapp-search-label', async () => {
            await mount(lib, 'apiapp-add'); await lib.getByRole('button').first().press('Enter'); await expect(lib.getByRole('searchbox', { name: 'Search', exact: true })).toHaveCount(1);
            const r = await capture(lib, 'apiapp-add'); noRules(r, ['label']); return { findings: ['A04'], evidence: r.evidencePrefix + '.json' };
        });
        await test('export-template-label', async () => {
            await mount(lib, 'template-editor'); await expect(lib.getByRole('textbox')).toHaveAccessibleName(/.+/);
            const r = await capture(lib, 'template-editor'); noRules(r, ['label']); return { findings: ['A08'], evidence: r.evidencePrefix + '.json' };
        });
        await test('favorite-name-and-pressed-state', async () => {
            await mount(lib, 'catalog-favorites');
            await expect(lib.getByRole('button', { name: 'Favorite catalog: Audit catalog', exact: true })).toHaveAttribute('aria-pressed', 'false');
            await expect(lib.getByRole('button', { name: 'Favorite catalog: Favorite audit catalog', exact: true })).toHaveAttribute('aria-pressed', 'true');
            const r = await capture(lib, 'catalog-favorites'); noRules(r, ['button-name']); return { findings: ['A19'], evidence: r.evidencePrefix + '.json', limitation: 'Both states rendered; no catalog favorite mutated.' };
        });
        await test('tag-trigger-and-dialog-name', async () => {
            await mount(lib, 'editable-tags'); await lib.getByRole('button', { name: 'Edit tag: Research', exact: true }).press('Enter');
            await expect(lib.getByRole('dialog', { name: 'Edit tag: Research', exact: true })).toHaveCount(1);
            const r = await capture(lib, 'tag-delete-popover'); noRules(r, ['button-name', 'aria-dialog-name']);
            const ax = JSON.parse(fs.readFileSync(path.join(out, 'library-tag-delete-popover-ax.json')));
            assert.ok(ax.nodes.some(n => n.role?.value === 'dialog' && n.name?.value === 'Edit tag: Research'));
            await lib.keyboard.press('Escape'); await expect(lib.getByRole('button', { name: 'Edit tag: Research', exact: true })).toBeFocused();
            const closed = await capture(lib, 'editable-tags'); return { findings: ['A28'], evidence: [r.evidencePrefix + '.json', closed.evidencePrefix + '.json'], limitation: 'A31 target-size finding remains.' };
        });
        await test('download-progress-names', async () => {
            await mount(lib, 'downloads');
            await expect(lib.getByRole('progressbar', { name: 'Download progress: Audit book download', exact: true })).toHaveAttribute('value', '42');
            await expect(lib.getByRole('progressbar', { name: 'Download progress: Queued audit book', exact: true })).not.toHaveAttribute('value');
            const r = await capture(lib, 'downloads'); const ax = JSON.parse(fs.readFileSync(path.join(out, 'library-downloads-ax.json')));
            assert.deepEqual(ax.nodes.filter(n => n.role?.value === 'progressbar').map(n => n.name.value).sort(), ['Download progress: Audit book download', 'Download progress: Queued audit book'].sort());
            return { findings: ['A30'], evidence: r.evidencePrefix + '.json', limitation: 'A05 cancellation keyboard defect remains for batch 2.' };
        });
        await test('welcome-image-alternative-contract', async () => {
            await mount(lib, 'welcome-profile'); await lib.waitForTimeout(150);
            const image = lib.locator('[role="alertdialog"] img'); await expect(image).toHaveAttribute('alt', '');
            const decorative = await capture(lib, 'welcome-profile-decorative'); noRules(decorative, ['image-alt']);
            await lib.evaluate(() => { const s = window.auditStore.getState(); window.auditStore.dispatch({ type: 'AUDIT_SET', payload: { customization: { ...s.customization, manifest: { ...s.customization.manifest, images: [{ ...s.customization.manifest.images[0], title: { en: 'Audit profile illustration', fr: 'Illustration du profil de test' } }] } } } }); });
            await expect(image).toHaveAttribute('alt', 'Audit profile illustration');
            await lib.evaluate(() => window.auditSetLocale('fr')); await expect(image).toHaveAttribute('alt', 'Illustration du profil de test');
            const titled = await capture(lib, 'welcome-profile-titled-fr'); noRules(titled, ['image-alt']);
            return { findings: ['A17', 'A18'], evidence: [decorative.evidencePrefix + '.json', titled.evidencePrefix + '.json'], limitation: 'Untitled images treated as decorative; informative image authors must supply a localized manifest title.' };
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
