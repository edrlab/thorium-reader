const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const out = path.resolve('docs/accessibility/evidence/batch-1');
fs.mkdirSync(out, { recursive: true });
const results = [];
function snapshot(label) {
    execFileSync(process.execPath, ['scripts/accessibility/snapshot.cjs', label], { env: { ...process.env, THORIUM_AUDIT_EVIDENCE_SUBDIR: 'batch-1' }, timeout: 60000, stdio: 'pipe' });
    return `batch-1/${label}.json`;
}
async function test(id, run) {
    try { results.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { results.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error).slice(0, 250)); }
    fs.writeFileSync(path.join(out, 'application-checks.json'), JSON.stringify({ batch: 1, startup: 'npm run start:dev:quick', tests: results }, null, 2) + '\n');
}
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().includes('index_library.html'));
        const reader = pages.find(p => p.url().includes('index_reader.html'));
        assert.ok(lib && reader, 'Open Library and sample Reader before this check.');
        await test('both-host-languages', async () => {
            for (const page of [lib, reader]) await expect(page.locator('html')).toHaveAttribute('lang', 'en');
            return { findings: ['A18'], evidence: snapshot('reader-baseline') };
        });
        await test('reader-settings-labels', async () => {
            await reader.getByRole('button', { name: 'Reader settings', exact: true }).click();
            let originalDock;
            if (await reader.getByRole('tab', { name: 'Text', exact: true }).count() === 0) {
                originalDock = await reader.getByRole('button', { name: 'Dock panel to the left', exact: true }).isDisabled() ? 'left' : 'right';
                await reader.getByRole('button', { name: 'Show panel as a modal popup', exact: true }).click();
            }
            const customize = reader.getByRole('checkbox', { name: 'Customize text formatting', exact: true });
            const wasChecked = await customize.isChecked();
            if (!wasChecked) await customize.click();
            try {
                await reader.getByRole('tab', { name: 'Text', exact: true }).click();
                await expect(reader.getByRole('slider', { name: 'Font size', exact: true })).toHaveAttribute('min', '75');
                const text = snapshot('reader-settings-text');
                await reader.getByRole('tab', { name: 'Spacing', exact: true }).click();
                for (const name of ['Margin', 'Word spacing', 'Letter spacing', 'Paragraph spacing', 'Line spacing']) {
                    await expect(reader.getByRole('slider', { name, exact: true })).toHaveCount(1);
                    await expect(reader.getByRole('button', { name: 'Increase ' + name, exact: true })).toHaveCount(1);
                    await expect(reader.getByRole('button', { name: 'Decrease ' + name, exact: true })).toHaveCount(1);
                }
                const spacing = snapshot('reader-settings-spacing');
                return { findings: ['A01', 'A02', 'A13'], evidence: [text, spacing], limitation: 'Settings values were not changed in the live user profile.' };
            } finally {
                if (!wasChecked) await customize.click();
                if (originalDock) await reader.getByRole('button', { name: 'Dock panel to the ' + originalDock, exact: true }).click();
                await reader.getByRole('button', { name: 'Close', exact: true }).click();
            }
        });
        await test('live-bookmark-popover-label', async () => {
            await reader.keyboard.press('Alt+Shift+B');
            await expect(reader.getByRole('textbox', { name: 'Bookmark note', exact: true })).toBeFocused();
            const evidence = snapshot('reader-bookmark-editor');
            await reader.keyboard.press('Escape'); await expect(reader.getByRole('textbox', { name: 'Bookmark note', exact: true })).toHaveCount(0);
            return { findings: ['A03'], evidence, limitation: 'Cancelled without saving a bookmark.' };
        });
        await test('live-catalog-favorite-names', async () => {
            await lib.getByRole('button', { name: 'Catalogs', exact: true }).click();
            const favorites = lib.locator('button.button_favorites'); assert.ok(await favorites.count() > 0);
            for (const button of await favorites.all()) { await expect(button).toHaveAccessibleName(/^Favorite catalog: .+/); assert.ok(['true', 'false'].includes(await button.getAttribute('aria-pressed'))); }
            return { findings: ['A19'], evidence: snapshot('library-catalogs'), limitation: 'Favorite states inspected without mutation.' };
        });
        await test('live-table-description-names', async () => {
            await lib.getByRole('button', { name: 'All publications', exact: true }).click();
            await lib.getByRole('button', { name: 'Table', exact: true }).click();
            const buttons = lib.locator('.cell_description button'); await expect(buttons.first()).toBeVisible();
            for (const button of await buttons.all()) await expect(button).toHaveAccessibleName(/^(Description|Accessibility): .+/);
            const first = buttons.first(), label = await first.getAttribute('aria-label');
            await first.press('Enter'); await expect(lib.getByRole('dialog', { name: label, exact: true })).toHaveCount(1);
            const open = snapshot('library-table-description-popover'); await lib.keyboard.press('Escape'); await expect(first).toBeFocused();
            return { findings: ['A20'], evidence: [open, snapshot('library-table-descriptions')] };
        });
        await test('live-locale-switch-propagates-and-restores', async () => {
            await lib.getByRole('button', { name: 'Application Settings', exact: true }).click();
            await lib.getByRole('button', { name: 'Show suggestions Language', exact: true }).click();
            await lib.getByRole('option', { name: 'Français (French)', exact: true }).click();
            try {
                for (const page of [lib, reader]) await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
                return { findings: ['A18'], evidence: snapshot('reader-locale-fr'), languagesObserved: ['en', 'fr', 'en'] };
            } finally {
                await lib.getByRole('button', { name: 'Show suggestions Choix de la langue', exact: true }).click();
                await lib.getByRole('option', { name: 'English', exact: true }).click();
                for (const page of [lib, reader]) await expect(page.locator('html')).toHaveAttribute('lang', 'en');
                await lib.getByRole('button', { name: 'Close', exact: true }).click();
            }
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
