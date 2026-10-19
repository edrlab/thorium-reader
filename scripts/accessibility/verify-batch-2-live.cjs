const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const out = path.resolve('docs/accessibility/evidence/batch-2');
fs.mkdirSync(out, { recursive: true });
const tests = [];
function snapshot(label) {
    execFileSync(process.execPath, ['scripts/accessibility/snapshot.cjs', label], { env: { ...process.env, THORIUM_AUDIT_EVIDENCE_SUBDIR: 'batch-2' }, timeout: 60000, stdio: 'pipe' });
    return `batch-2/${label}.json`;
}
async function test(id, run) {
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error).slice(0, 400)); }
    fs.writeFileSync(path.join(out, 'application-checks.json'), JSON.stringify({ batch: 2, startup: 'npm run start:dev:quick', tests }, null, 2) + '\n');
}
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().includes('index_library.html'));
        const reader = pages.find(p => p.url().includes('index_reader.html'));
        assert.ok(lib && reader, 'Open Library and existing Accessible EPUB 3 sample first.');
        await reader.keyboard.press('Escape');
        await test('both-host-skip-heading-level-and-focus', async () => {
            for (const p of [lib, reader]) for (const id of ['main-toolbar', 'main-content']) {
                const target = p.locator('#' + id); await expect(target).toHaveAttribute('role', 'heading'); await expect(target).toHaveAttribute('aria-level', '2');
                await target.focus(); await expect(target).toBeFocused();
            }
            return { findings: ['A21'], evidence: snapshot('reader-host-headings'), limitation: 'Heading levels and programmatic focus preserved. Native screen-reader heading navigation not tested.' };
        });
        await test('live-home-carousel-keyboard', async () => {
            await lib.getByRole('button', { name: 'Home', exact: true }).click();
            const right = lib.getByRole('button', { name: 'Slide to the right', exact: true }).first();
            const left = lib.getByRole('button', { name: 'Slide to the left', exact: true }).first();
            await expect(right).toBeEnabled(); await right.press('Enter'); await expect(left).toBeEnabled();
            const open = snapshot('library-home-carousel');
            await left.press('Space'); await expect(left).toBeDisabled();
            return { findings: ['A06'], evidence: open };
        });
        await test('live-local-opds-refresh-keyboard', async () => {
            await lib.getByRole('button', { name: 'Catalogs', exact: true }).click();
            await lib.getByRole('link', { name: 'http://127.0.0.1:4873/opds/v2/catalog.json', exact: true }).click();
            const heading = lib.getByRole('heading', { name: 'Thorium OPDS Progression Test Catalog', exact: true }); await expect(heading).toBeVisible();
            const refresh = lib.getByRole('button', { name: 'reload', exact: true });
            assert.equal(await refresh.locator('a,button').count(), 0);
            await refresh.press('Enter'); await expect(heading).toBeVisible();
            await refresh.press('Space'); await expect(heading).toBeVisible();
            return { findings: ['A07'], evidence: snapshot('library-opds-refresh'), limitation: 'Existing loopback test catalog only. Pagination links tested separately in fixtures.' };
        });
        await test('live-profile-group-inspection', async () => {
            await lib.getByRole('button', { name: 'Application Settings', exact: true }).click();
            await lib.getByRole('tab', { name: 'Profiles', exact: true }).click();
            const group = lib.getByRole('radiogroup', { name: 'Profiles', exact: true });
            const radios = group.getByRole('radio'); assert.equal(await radios.count(), await group.locator('input[type="radio"]').count());
            await expect(group.getByRole('radio', { name: 'Thorium vanilla', exact: true })).toBeChecked();
            const evidence = snapshot('library-live-profiles'); await lib.getByRole('button', { name: 'Close', exact: true }).click();
            return { findings: ['A10'], evidence, limitation: 'Existing profile inspected only; no live profile activated or deleted. Multi-profile keyboard selection tested in fixtures.' };
        });
        await test('live-reader-tts-preview-keyboard', async () => {
            const trigger = reader.getByRole('button', { name: 'TTS options', exact: true }); await trigger.press('Enter');
            const summary = reader.getByText('TTS highlight style preview', { exact: true }); await summary.focus(); await expect(summary).toBeFocused();
            await reader.keyboard.press('Enter'); await expect(reader.locator('details')).toHaveAttribute('open', '');
            const evidence = snapshot('reader-tts-preview');
            await reader.keyboard.press('Space'); await expect(reader.locator('details')).not.toHaveAttribute('open', '');
            await reader.keyboard.press('Escape'); await expect(trigger).toBeFocused();
            return { findings: ['A25'], evidence, limitation: 'Preview opened and closed; audio not started and TTS settings not changed.' };
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
