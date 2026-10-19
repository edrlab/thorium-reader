const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const out = path.resolve('docs/accessibility/evidence/batch-2-continuation');
fs.mkdirSync(out, { recursive: true });
const only = process.env.THORIUM_AUDIT_ONLY;
const tests = only ? JSON.parse(fs.readFileSync(path.join(out, 'application-checks.json'))).tests : [];
function snapshot(label) {
    execFileSync(process.execPath, ['scripts/accessibility/snapshot.cjs', label], { env: { ...process.env, THORIUM_AUDIT_EVIDENCE_SUBDIR: 'batch-2-continuation' }, timeout: 60000, stdio: 'pipe' });
    return `batch-2-continuation/${label}.json`;
}
async function ax(page, label) {
    const session = await page.context().newCDPSession(page);
    fs.writeFileSync(path.join(out, label + '-ax.json'), JSON.stringify(await session.send('Accessibility.getFullAXTree'), null, 2));
    await session.detach();
}
async function test(id, run) {
    if (only && !new RegExp(only).test(id)) return;
    const previous = tests.findIndex(t => t.id === id); if (previous >= 0) tests.splice(previous, 1);
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error).slice(0, 500)); }
    fs.writeFileSync(path.join(out, 'application-checks.json'), JSON.stringify({ batch: 2, phase: 'continuation', startup: 'npm run start:dev:quick', tests }, null, 2) + '\n');
}
async function validLists(page) {
    assert.deepEqual(await page.locator('nav ul').evaluateAll(lists => lists.flatMap(ul => [...ul.children].filter(c => !['LI', 'SCRIPT', 'TEMPLATE'].includes(c.tagName)).map(c => c.outerHTML))), []);
}
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().includes('index_library.html'));
        const reader = pages.find(p => p.url().includes('index_reader.html'));
        assert.ok(lib && reader, 'Open the Library and existing Accessible EPUB 3 before this check.');
        await reader.keyboard.press('Escape');
        const settingsDialog = () => lib.getByRole('dialog').filter({ has: lib.getByRole('tab', { name: 'General', exact: true }) });
        if (await settingsDialog().count()) await settingsDialog().getByRole('button', { name: 'Close', exact: true }).click();
        for (const page of [lib, reader]) {
            while (await page.locator('button.closeButton').count()) { await page.locator('button.closeButton').first().click(); await page.waitForTimeout(500); }
        }
        const closePanels = async () => { const close = reader.locator('button[aria-label="Close"]:not(.closeButton)'); if (await close.count()) await close.click(); };
        await closePanels();
        await test('live-library-and-epub-navigation-lists', async () => {
            await lib.getByRole('button', { name: 'Home', exact: true }).press('Enter');
            await validLists(lib); await validLists(reader);
            const heights = await lib.locator('nav[aria-label="Bookshelf menu"] li').evaluateAll(es => es.map(e => e.getBoundingClientRect().height));
            assert.ok(heights.every(h => h >= 24 && h <= 64), 'Navigation rows retain compact geometry');
            assert.equal(await reader.locator('nav[aria-label="toolbar"] > div > ul').count(), 3);
            return { findings: ['A22'], evidence: [snapshot('library-live-valid-navigation'), snapshot('reader-epub-valid-navigation')] };
        });
        const readerSettingState = async () => {
            await lib.getByRole('button', { name: 'Application Settings', exact: true }).click();
            await lib.getByRole('tab', { name: 'General', exact: true }).click();
            const value = await lib.getByRole('checkbox', { name: 'Enhance screen reader experience', exact: true }).getAttribute('aria-checked');
            await settingsDialog().getByRole('button', { name: 'Close', exact: true }).click();
            return value;
        };
        await test('live-notification-keyboard-persistence-and-restoration', async () => {
            const original = await readerSettingState(); let changed = false, clipboardStubbed = false;
            try {
                await lib.locator('#main-toolbar').focus(); await lib.keyboard.press('Control+Shift+F12'); changed = true;
                await expect(lib.getByRole('alert').first()).toBeVisible();
                await lib.waitForTimeout(6100); await expect(lib.getByRole('alert').first()).toBeVisible();
                const details = lib.getByRole('button', { name: 'Details', exact: true }).first(); await details.press('Enter'); await expect(details).toHaveAttribute('aria-expanded', 'true');
                const text = await lib.getByRole('alert').first().textContent();
                await lib.evaluate(() => { const c = require('electron').clipboard; window.auditClipboardOriginal = c.writeText; window.auditClipboard = []; c.writeText = (text, type) => window.auditClipboard.push({ text, type }); }); clipboardStubbed = true;
                await lib.getByRole('button', { name: 'Copy notification', exact: true }).first().press('Space');
                assert.deepEqual(await lib.evaluate(() => window.auditClipboard), [{ text, type: 'clipboard' }]);
                await expect(lib.getByRole('status').filter({ hasText: 'Notification copied' }).first()).toBeVisible();
                const evidence = snapshot('library-live-notification'); await ax(lib, 'library-live-notification');
                await details.press('Space'); await expect(details).toHaveAttribute('aria-expanded', 'false');
                return { findings: ['A12'], evidence, limitation: 'Real shortcut produced notification. Screen-reader optimization toggled then restored. Clipboard service stubbed/restored; OS clipboard unchanged. No native screen-reader listening.' };
            } finally {
                if (clipboardStubbed) await lib.evaluate(() => { require('electron').clipboard.writeText = window.auditClipboardOriginal; delete window.auditClipboardOriginal; });
                if (changed) { await lib.locator('#main-toolbar').focus(); await lib.keyboard.press('Control+Shift+F12'); }
                assert.equal(await readerSettingState(), original);
                for (const page of [lib, reader]) {
                    const alerts = page.getByRole('alert');
                    for (let i = 0; i < 6 && await alerts.count(); i++) { await page.getByRole('button', { name: 'Details', exact: true }).first().locator('..').locator('..').getByRole('button', { name: 'Close', exact: true }).click(); await page.waitForTimeout(500); }
                }
            }
        });
        const triggerFor = title => reader.locator(`button[aria-label="${title}"]`).first();
        const mode = async () => {
            if (await reader.getByRole('dialog').filter({ has: reader.getByRole('button', { name: 'Dock panel to the left', exact: true }) }).count()) return 'modal';
            return await reader.getByRole('button', { name: 'Dock panel to the left', exact: true }).isDisabled() ? 'left' : 'right';
        };
        const setMode = async value => {
            const name = value === 'modal' ? 'Show panel as a modal popup' : 'Dock panel to the ' + value;
            const button = reader.getByRole('button', { name, exact: true }); if (!await button.isDisabled()) await button.press('Enter');
        };
        const relationship = async (title, value) => {
            const trigger = triggerFor(title); await expect(trigger).toHaveAttribute('aria-expanded', 'true');
            const panel = reader.getByRole(value === 'modal' ? 'dialog' : 'region', { name: title, exact: true });
            await expect(panel).toBeVisible();
            const id = await trigger.getAttribute('aria-controls'); assert.ok(id); await expect(panel).toHaveAttribute('id', id);
            await expect(trigger).not.toHaveAttribute('aria-haspopup', 'dialog');
            if (value !== 'modal') { await trigger.focus(); await expect(trigger).toBeFocused(); }
            return panel;
        };
        for (const title of ['Navigation', 'Reader settings']) await test('live-' + title.toLowerCase().replaceAll(' ', '-') + '-docked-and-modal', async () => {
            await closePanels(); const trigger = triggerFor(title); await trigger.press('Enter'); const originalMode = await mode(); const evidence = [];
            try {
                for (const value of ['left', 'right', 'modal']) {
                    await setMode(value); const panel = await relationship(title, value);
                    const label = 'reader-live-' + (title === 'Navigation' ? 'navigation' : 'settings') + '-' + value;
                    evidence.push(snapshot(label)); await ax(reader, label);
                    if (value === 'modal') {
                        await panel.getByRole('button', { name: 'Close', exact: true }).press('Enter');
                        await trigger.press('Enter'); const reopened = await relationship(title, 'modal');
                        for (let i = 0; i < 6; i++) { await reader.keyboard.press('Tab'); assert.equal(await reopened.evaluate(e => e.contains(document.activeElement)), true); }
                        await reader.keyboard.press('Escape'); await expect(trigger).toBeFocused();
                        await trigger.press('Enter');
                    }
                }
                return { findings: ['A23'], evidence, limitation: 'Both dock sides and modal relationships verified. Docked trigger can retain focus outside panel. Modal Tab containment and Escape restoration tested after reopening from header trigger.' };
            } finally { await setMode(originalMode); await closePanels(); }
        });
        await test('live-annotation-filter-disclosures-and-actions', async () => {
            await triggerFor('Navigation').press('Enter');
            const selector = reader.getByRole('button', { name: / Navigation$/ }).first(); await selector.press('Enter');
            await reader.getByRole('option', { name: 'Annotations', exact: true }).press('Enter');
            const trigger = reader.getByRole('button', { name: 'Filter Options', exact: true }); await trigger.press('Enter');
            try {
                assert.equal(await reader.locator('summary button,summary a').count(), 0);
                const details = reader.locator('#annotationListColorDetails'); const summary = details.locator('summary');
                await summary.press('Enter'); await expect(details).not.toHaveAttribute('open', '');
                await summary.press('Space'); await expect(details).toHaveAttribute('open', '');
                // Existing filter state is restored after exercising the bulk actions.
                const before = await details.locator('[role="row"][aria-selected="true"]').evaluateAll(es => es.map(e => e.getAttribute('data-key')));
                const hadAll = await details.getByRole('button', { name: 'All: Filter by Color', exact: true }).evaluate(e => e.className.includes('button_primary_blue'));
                await reader.getByRole('button', { name: 'None: Filter by Color', exact: true }).press('Enter'); await expect(details).toHaveAttribute('open', '');
                await reader.getByRole('button', { name: 'All: Filter by Color', exact: true }).press('Space'); await expect(details).toHaveAttribute('open', '');
                const evidence = snapshot('reader-live-filter-actions'); await ax(reader, 'reader-live-filter-actions');
                if (!hadAll) {
                    await reader.getByRole('button', { name: 'None: Filter by Color', exact: true }).click();
                    for (const key of before) if (key) await details.locator(`[role="row"][data-key="${key}"]`).click();
                }
                return { findings: ['A24'], evidence, limitation: 'Live empty annotation list; color actions/disclosure exercised. Tag/type/creator populated branches validated in fixtures. No note saved or deleted.' };
            } finally {
                await reader.keyboard.press('Escape'); await expect(trigger).toBeFocused();
                const current = reader.getByRole('button', { name: / Navigation$/ }).first(); await current.click(); await reader.getByRole('option', { name: 'Search', exact: true }).click();
                await closePanels();
            }
        });
        await test('live-pdf-toolbar-valid-list', async () => {
            await reader.getByRole('button', { name: 'Close this reading window (back to bookshelf)', exact: true }).click();
            await lib.getByRole('button', { name: 'Home', exact: true }).click();
            await lib.locator('a.publication_main_container').filter({ hasText: 'Untitled' }).first().click();
            await expect.poll(() => browser.contexts().flatMap(c => c.pages()).filter(p => p.url().includes('index_reader.html')).length).toBe(1);
            const pdf = browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes('index_reader.html'));
            await expect(pdf.getByRole('button', { name: 'Reader settings', exact: true })).toBeVisible();
            await validLists(pdf);
            return { findings: ['A22'], evidence: snapshot('reader-pdf-valid-navigation'), limitation: 'Existing PDF toolbar inspected; audiobook and Divina branches source-reviewed only.' };
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
