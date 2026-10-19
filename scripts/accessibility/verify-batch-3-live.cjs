const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const { layout, bounded, focusTrace, save } = require('./layout-checks.cjs');
const out = path.resolve('docs/accessibility/evidence/batch-3');
fs.mkdirSync(out, { recursive: true });
const only = process.env.THORIUM_AUDIT_ONLY;
const tests = only ? JSON.parse(fs.readFileSync(path.join(out, 'application-checks.json'))).tests : [];
async function test(id, run) {
    if (only && !new RegExp(only).test(id)) return;
    const previous = tests.findIndex(t => t.id === id); if (previous >= 0) tests.splice(previous, 1);
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error).slice(0, 1600)); }
    fs.writeFileSync(path.join(out, 'application-checks.json'), JSON.stringify({ batch: 3, startup: 'npm run start:dev:quick', tests }, null, 2) + '\n');
}
function snapshot(label) {
    execFileSync(process.execPath, ['scripts/accessibility/snapshot.cjs', label], { env: { ...process.env, THORIUM_AUDIT_EVIDENCE_SUBDIR: 'batch-3' }, timeout: 60000, stdio: 'pipe' });
    return `batch-3/${label}.json`;
}
async function clearMetrics(page) {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.clearDeviceMetricsOverride');
    await page.waitForTimeout(150);
    // Keep Playwright's click viewport in sync when removing a temporary CDP viewport.
    if (page.viewportSize()) {
        const native = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
        await page.setViewportSize(native); await session.send('Emulation.clearDeviceMetricsOverride');
        await page.waitForTimeout(150);
    }
    await session.detach();
}
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().includes('index_library.html'));
        const reader = pages.find(p => p.url().includes('index_reader.html'));
        assert.ok(lib && reader, 'Library and existing EPUB Reader must be open.');
        // Reload after source builds so old hook closures cannot retain the previous layout.
        for (const p of [lib, reader]) await clearMetrics(p);
        if (!only) await lib.reload();
        await lib.locator('nav').first().waitFor({ state: 'attached' });
        await lib.keyboard.press('Escape'); await lib.keyboard.press('Escape');
        await lib.getByRole('button', { name: 'Application Settings', exact: true }).waitFor();
        await reader.getByRole('button', { name: 'Reader settings', exact: true }).waitFor();
        const originalZoom = await Promise.all([lib, reader].map(p => p.evaluate(() => require('electron').webFrame.getZoomFactor())));
        const closeLibraryDialog = async () => {
            const dialogs = lib.getByRole('dialog');
            const close = dialogs.getByRole('button', { name: 'Close', exact: true });
            if (await close.count()) await close.first().press('Enter'); await lib.keyboard.press('Escape');
        };
        await closeLibraryDialog();
        await test('live-reader-settings-native-200-percent', async () => {
            const trigger = reader.getByRole('button', { name: 'Reader settings', exact: true });
            if (await reader.getByRole('button', { name: 'Close', exact: true }).count()) await reader.getByRole('button', { name: 'Close', exact: true }).click();
            await trigger.press('Enter');
            const originalDock = await reader.getByRole('dialog', { name: 'Reader settings', exact: true }).count() ? 'full' :
                await reader.getByRole('button', { name: 'Dock panel to the left', exact: true }).isDisabled() ? 'left' : 'right';
            if (originalDock !== 'full') await reader.getByRole('button', { name: 'Show panel as a modal popup', exact: true }).press('Enter');
            const custom = reader.getByRole('checkbox', { name: 'Customize text formatting', exact: true }); const wasCustom = await custom.isChecked();
            const originalTab = await reader.getByRole('tab', { selected: true }).textContent();
            if (!wasCustom) await custom.click();
            const evidence = [], counts = {};
            try {
                await reader.evaluate(() => require('electron').webFrame.setZoomFactor(2)); await reader.waitForTimeout(300);
                assert.equal(await reader.evaluate(() => require('electron').webFrame.getZoomFactor()), 2);
                for (const name of ['Display', 'Text', 'Spacing', 'Preferences']) {
                    const tab = reader.getByRole('tab', { name, exact: true }); await tab.press('Enter'); const m = await layout(reader); bounded(m);
                    const trace = await focusTrace(reader, tab); counts[name] = trace.length;
                    const label = 'reader-live-200-' + name.toLowerCase(); save(out, label, m, trace);
                    await reader.getByRole('tabpanel').locator('h3').first().scrollIntoViewIfNeeded().catch(() => {});
                    evidence.push(snapshot(label));
                }
                return { findings: ['A26'], evidence, keyboardStops: counts, limitation: 'Actual Electron webFrame zoom factor 2. Text customization toggled only to expose Text/Spacing and restored; format values and presets not changed.' };
            } finally {
                for (const [i, p] of [lib, reader].entries()) await p.evaluate(z => require('electron').webFrame.setZoomFactor(z), originalZoom[i]);
                if (await custom.isChecked() !== wasCustom) await custom.click();
                const previous = reader.getByRole('tab', { name: originalTab.trim(), exact: true }); if (await previous.count() && !await previous.isDisabled()) await previous.click();
                if (originalDock !== 'full') await reader.getByRole('button', { name: 'Dock panel to the ' + originalDock, exact: true }).click();
                await reader.getByRole('button', { name: 'Close', exact: true }).click();
            }
        });
        await test('live-library-settings-320-all-tabs', async () => {
            await closeLibraryDialog(); await lib.getByRole('button', { name: 'Application Settings', exact: true }).press('Enter');
            const evidence = [], counts = {};
            const nativeViewport = await lib.evaluate(() => ({ width: innerWidth, height: innerHeight }));
            try {
                await lib.setViewportSize({ width: 320, height: 228 });
                assert.deepEqual(await lib.evaluate(() => [innerWidth, innerHeight]), [320, 228]);
                for (const name of ['General', 'Keyboard shortcuts', 'Profiles', 'Storage', 'Advanced']) {
                    const tab = lib.getByRole('tab', { name, exact: true }); await tab.press('Enter'); const m = await layout(lib); bounded(m);
                    const trace = await focusTrace(lib, tab); counts[name] = trace.length;
                    const label = 'library-live-320-' + name.toLowerCase().replaceAll(' ', '-'); save(out, label, m, trace);
                    await lib.getByRole('tabpanel').locator('h3').first().scrollIntoViewIfNeeded().catch(() => {});
                    evidence.push(snapshot(label));
                }
                await lib.getByRole('button', { name: 'Close', exact: true }).press('Enter');
                return { findings: ['A26'], evidence, keyboardStops: counts, limitation: 'CSS viewport 320x228 via CDP device metrics, not native window resize. Focus-only traversal; no setting, storage or shortcut action submitted.' };
            } finally {
                await lib.setViewportSize(nativeViewport); await clearMetrics(lib);
                await expect.poll(() => lib.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual(nativeViewport);
                await closeLibraryDialog();
            }
        });
        await test('live-existing-publication-tag-target-and-keyboard', async () => {
            await closeLibraryDialog(); await lib.getByRole('button', { name: 'Home', exact: true }).click();
            await lib.getByRole('button', { name: 'Menu (La Proie)', exact: true }).click();
            await lib.getByRole('button', { name: 'About publication', exact: true }).click();
            try {
                const button = lib.getByRole('button', { name: 'Edit tag: Crime & mystery fiction', exact: true });
                await button.scrollIntoViewIfNeeded(); const geometry = await button.boundingBox(); assert.ok(geometry.width >= 24 && geometry.height >= 24);
                const closed = snapshot('library-live-tag-target');
                await button.press('Enter'); const popover = lib.getByRole('dialog', { name: 'Edit tag: Crime & mystery fiction', exact: true });
                await expect(popover.getByRole('button').first()).toBeFocused(); const opened = snapshot('library-live-tag-popover');
                await lib.keyboard.press('Escape'); await expect(popover).toHaveCount(0); await lib.waitForTimeout(100); await expect(button).toBeFocused();
                return { findings: ['A31'], evidence: [closed, opened], geometry, limitation: 'Existing Crime & mystery fiction tag inspected in La Proie. Delete was never activated; no publication metadata changed.' };
            } finally { await closeLibraryDialog(); }
        });
        for (const [i, p] of [lib, reader].entries()) await expect.poll(() => p.evaluate(() => require('electron').webFrame.getZoomFactor())).toBe(originalZoom[i]);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
