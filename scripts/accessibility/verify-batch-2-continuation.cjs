process.env.THORIUM_AUDIT_EVIDENCE_SUBDIR = 'batch-2-continuation';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const { capture, out } = require('./fixture-scan.cjs');
const only = process.env.THORIUM_AUDIT_ONLY;
const tests = only ? JSON.parse(fs.readFileSync(path.join(out, 'fixture-checks.json'))).tests : [];
async function test(id, run) {
    if (only && !new RegExp(only).test(id)) return;
    const previous = tests.findIndex(t => t.id === id); if (previous >= 0) tests.splice(previous, 1);
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error).slice(0, 500)); }
    fs.writeFileSync(path.join(out, 'fixture-checks.json'), JSON.stringify({ batch: 2, phase: 'continuation', tests }, null, 2) + '\n');
}
const noRules = (r, rules) => assert.deepEqual(r.axe.violations.filter(v => rules.includes(v.id)).map(v => v.id), []);
async function stubClipboard(page) {
    await page.evaluate(() => {
        const clipboard = require('electron').clipboard;
        window.auditClipboardOriginal = clipboard.writeText;
        window.auditClipboard = [];
        clipboard.writeText = (text, type) => { window.auditClipboard.push({ text, type }); };
    });
}
async function restoreClipboard(page) {
    await page.evaluate(() => { require('electron').clipboard.writeText = window.auditClipboardOriginal; delete window.auditClipboardOriginal; });
}
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const lib = pages.find(p => p.url().endsWith('/library.html'));
        const reader = pages.find(p => p.url().endsWith('/reader.html'));
        for (const p of [lib, reader]) await p.reload();
        const mount = async (p, id) => { await p.evaluate(id => window.auditMount(id), id); await p.waitForTimeout(200); assert.deepEqual(await p.evaluate(() => window.auditErrors), []); };
        for (const [runtime, page] of [['library', lib], ['reader', reader]]) await test(runtime + '-notification-keyboard-copy-and-no-reading-timeout', async () => {
            await mount(page, 'toast');
            const alert = page.getByRole('alert'); const text = await alert.textContent();
            await page.waitForTimeout(6100); await expect(alert).toBeVisible();
            const details = page.getByRole('button', { name: 'Details', exact: true });
            await expect(details).toHaveAttribute('aria-expanded', 'false');
            const collapsed = await capture(page, 'notification-collapsed');
            await details.press('Enter'); await expect(details).toHaveAttribute('aria-expanded', 'true');
            const controlled = await details.getAttribute('aria-controls'); assert.equal(await alert.getAttribute('id'), controlled);
            await page.keyboard.press('Tab'); const copy = page.getByRole('button', { name: 'Copy notification', exact: true }); await expect(copy).toBeFocused();
            await stubClipboard(page);
            let expanded, failed;
            try {
                await page.keyboard.press('Enter'); await expect(page.getByRole('status')).toHaveText('Notification copied');
                await page.keyboard.press('Space');
                assert.deepEqual(await page.evaluate(() => window.auditClipboard), [{ text, type: 'clipboard' }, { text, type: 'clipboard' }]);
                await expect(details).toHaveAttribute('aria-expanded', 'true');
                expanded = await capture(page, 'notification-expanded-copied'); noRules(expanded, ['button-name', 'aria-hidden-focus', 'nested-interactive']);
                await page.evaluate(() => { require('electron').clipboard.writeText = () => { throw new Error('Synthetic clipboard failure'); }; });
                await copy.press('Enter'); await expect(page.getByRole('status')).toHaveText('Could not copy notification');
                failed = await capture(page, 'notification-copy-failed');
            } finally { await restoreClipboard(page); }
            await details.press('Space'); await expect(details).toHaveAttribute('aria-expanded', 'false');
            await details.evaluate(e => e.blur()); await expect(details).not.toBeFocused();
            await page.waitForTimeout(6100); await expect(alert).toBeVisible();
            if (runtime === 'library') {
                await page.evaluate(() => window.auditSetLocale('fr'));
                await expect(page.getByRole('button', { name: 'Détails', exact: true })).toHaveCount(1);
                await expect(page.getByRole('button', { name: 'Copier la notification', exact: true })).toHaveCount(1);
                await capture(page, 'notification-fr'); await page.evaluate(() => window.auditSetLocale('en'));
            }
            await page.getByRole('button', { name: 'Close', exact: true }).press('Space'); await expect(alert).toHaveCount(0);
            return { findings: ['A12'], evidence: [collapsed, expanded, failed].map(r => r.evidencePrefix + '.json'), limitation: 'Clipboard service temporarily stubbed and restored. Full text/feedback tested without changing OS clipboard. Unfocused and blurred message persists beyond prior five-second timeout.' };
        });
        await test('notification-stack-independent-dismissal', async () => {
            await mount(lib, 'toast');
            for (let i = 1; i <= 2; i++) {
                await lib.evaluate(i => window.auditStore.dispatch({ type: 'AUDIT_SET', payload: { toast: { type: 'success', data: 'Additional audit notification ' + i } } }), i);
                await expect(lib.getByRole('alert')).toHaveCount(i + 1);
            }
            await expect(lib.getByRole('alert')).toHaveCount(3);
            await lib.getByRole('button', { name: 'Close', exact: true }).nth(1).press('Enter');
            await expect(lib.getByRole('alert')).toHaveCount(2);
            const r = await capture(lib, 'notification-stack');
            return { findings: ['A12'], evidence: r.evidencePrefix + '.json' };
        });
        await test('library-navigation-valid-list', async () => {
            await mount(lib, 'library-refresh');
            const invalid = await lib.locator('nav ul').evaluateAll(lists => lists.flatMap(ul => [...ul.children].filter(c => !['LI', 'SCRIPT', 'TEMPLATE'].includes(c.tagName)).map(c => c.outerHTML)));
            assert.deepEqual(invalid, []);
            for (const name of ['Home', 'All publications', 'Catalogs', 'Application Settings']) await expect(lib.getByRole('button', { name, exact: true })).toHaveCount(1);
            const heights = await lib.locator('nav li').evaluateAll(es => es.map(e => e.getBoundingClientRect().height));
            assert.ok(heights.every(h => h >= 24 && h <= 64), 'Navigation rows retain compact geometry');
            const r = await capture(lib, 'library-navigation'); noRules(r, ['list', 'listitem']);
            return { findings: ['A22'], evidence: r.evidencePrefix + '.json' };
        });
        for (const mode of ['left', 'right', 'modal']) await test('panel-' + mode + '-relationship-and-close', async () => {
            await mount(reader, 'panel-' + mode);
            const trigger = reader.getByRole('button', { name: 'Open audit panel', exact: true, includeHidden: true });
            await expect(trigger).toHaveAttribute('aria-expanded', 'false');
            await trigger.press('Enter'); await expect(trigger).toHaveAttribute('aria-expanded', 'true');
            const target = await trigger.getAttribute('aria-controls'); assert.ok(target);
            const panel = mode === 'modal' ? reader.getByRole('dialog', { name: 'Audit panel', exact: true }) : reader.getByRole('region', { name: 'Audit panel', exact: true });
            await expect(panel).toHaveAttribute('id', target);
            if (mode !== 'modal') { await expect(trigger).not.toHaveAttribute('aria-haspopup', 'dialog'); await trigger.focus(); await expect(trigger).toBeFocused(); }
            const r = await capture(reader, 'panel-' + mode); noRules(r, ['aria-valid-attr-value', 'aria-dialog-name']);
            await panel.getByRole('button', { name: 'Close panel', exact: true }).press('Enter'); await expect(panel).toHaveCount(0); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
            if (mode === 'modal') await expect(trigger).toBeFocused();
            else assert.equal(await trigger.getAttribute('aria-controls'), null);
            return { findings: ['A23'], evidence: r.evidencePrefix + '.json' };
        });
        await test('panel-switch-docked-modal-docked', async () => {
            await mount(reader, 'panel-left'); const trigger = reader.getByRole('button', { name: 'Open audit panel', exact: true });
            await trigger.press('Enter'); await reader.getByRole('button', { name: 'Show modal', exact: true }).press('Enter');
            let id = await trigger.getAttribute('aria-controls'); await expect(reader.getByRole('dialog')).toHaveAttribute('id', id);
            await reader.getByRole('button', { name: 'Dock right', exact: true }).press('Enter');
            id = await trigger.getAttribute('aria-controls'); await expect(reader.getByRole('region')).toHaveAttribute('id', id);
            assert.equal(await reader.getByRole('dialog').count(), 0); await expect(trigger).not.toHaveAttribute('aria-haspopup', 'dialog');
            const r = await capture(reader, 'panel-mode-switch');
            return { findings: ['A23'], evidence: r.evidencePrefix + '.json' };
        });
        await test('filter-all-none-independent-of-disclosure', async () => {
            await mount(reader, 'filter-controls'); const trigger = reader.getByRole('button', { name: 'Filter Options', exact: true }); await trigger.press('Enter');
            assert.equal(await reader.locator('summary button,summary a,input summary').count(), 0);
            const names = ['Filter by Tag', 'Filter by Color', 'Filter by Type', 'Filter by Creator'];
            const keys = ['tags', 'colors', 'draw', 'creators'];
            for (const [index, name] of names.entries()) {
                const details = reader.locator('details').nth(index); const summary = details.locator('summary');
                await summary.press('Enter'); await expect(details).not.toHaveAttribute('open', '');
                await expect(reader.getByRole('button', { name: 'All: ' + name, exact: true })).toHaveCount(0);
                await summary.press('Space'); await expect(details).toHaveAttribute('open', '');
                await reader.getByRole('button', { name: 'None: ' + name, exact: true }).press('Enter'); await expect(details).toHaveAttribute('open', '');
                assert.equal(await details.locator('[aria-selected="true"]').count(), 0);
                await reader.getByRole('button', { name: 'All: ' + name, exact: true }).press('Space'); await expect(details).toHaveAttribute('open', '');
                assert.ok(await details.locator('[aria-selected="true"]').count() > 0);
                const changes = await reader.evaluate(key => window.auditActions.filter(a => a[0] === 'filter' && a[1] === key).map(a => a[2]), keys[index]);
                assert.deepEqual(changes, [[], 'all']);
            }
            const r = await capture(reader, 'filters-selected'); noRules(r, ['nested-interactive', 'button-name']);
            await reader.keyboard.press('Escape'); await expect(trigger).toBeFocused();
            return { findings: ['A24'], evidence: r.evidencePrefix + '.json' };
        });
        await test('empty-filter-actions-disabled', async () => {
            await mount(reader, 'filter-controls-empty'); await reader.getByRole('button', { name: 'Filter Options', exact: true }).press('Enter');
            for (const id of ['annotationListTagDetails', 'annotationListCreator']) for (const button of await reader.locator('#' + id + ' button').all()) await expect(button).toBeDisabled();
            const r = await capture(reader, 'filters-empty'); noRules(r, ['nested-interactive']);
            return { findings: ['A24'], evidence: r.evidencePrefix + '.json' };
        });
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
