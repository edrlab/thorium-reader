const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const out = path.resolve('docs/accessibility/evidence/batch-4'); fs.mkdirSync(out, { recursive: true });
const only = process.env.THORIUM_AUDIT_ONLY;
const tests = only ? JSON.parse(fs.readFileSync(path.join(out, 'application-checks.json'))).tests : [];
async function test(id, run) {
    if (only && !new RegExp(only).test(id)) return;
    const old = tests.findIndex(t => t.id === id); if (old >= 0) tests.splice(old, 1);
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error)); }
    fs.writeFileSync(path.join(out, 'application-checks.json'), JSON.stringify({ batch: 4, startup: 'npm run start:dev:quick', tests }, null, 2) + '\n');
}
function snapshot(label) {
    execFileSync(process.execPath, ['scripts/accessibility/snapshot.cjs', label], { env: { ...process.env, THORIUM_AUDIT_EVIDENCE_SUBDIR: 'batch-4' }, timeout: 90000, stdio: 'pipe' });
    return 'batch-4/' + label + '.json';
}
async function watchStatus(page) {
    await page.evaluate(() => {
        window.auditStatusTrace = [];
        window.auditStatusObserver?.disconnect();
        window.auditStatusObserver = new MutationObserver(() => {
            for (const e of document.querySelectorAll('[role="status"]')) {
                const text = e.textContent.trim(); if (text && window.auditStatusTrace.at(-1)?.text !== text) window.auditStatusTrace.push({ text, time: performance.now(), focus: document.activeElement?.outerHTML.slice(0, 300) });
            }
        }); window.auditStatusObserver.observe(document.body, { childList: true, characterData: true, subtree: true });
    });
}
async function saveStatus(page, label) {
    const trace = await page.evaluate(() => window.auditStatusTrace);
    fs.writeFileSync(path.join(out, label + '-status.json'), JSON.stringify({ kind: 'status-transition-measurement', trace }, null, 2) + '\n');
    const session = await page.context().newCDPSession(page);
    fs.writeFileSync(path.join(out, label + '-ax.json'), JSON.stringify(await session.send('Accessibility.getFullAXTree'), null, 2) + '\n');
    await session.detach();
    return trace;
}
async function chooseSection(reader, section) {
    const trigger = reader.getByRole('button', { name: 'Navigation', exact: true });
    if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.press('Enter');
    const selector = reader.getByRole('button', { name: /^(Table of Contents|Search|Go to page|Landmarks|Bookmarks|Annotations) Navigation$/ });
    await expect.poll(async () => await selector.count() + await reader.getByRole('tab', { name: section, exact: true }).count()).toBeGreaterThan(0);
    if (await selector.count()) { await selector.press('Enter'); await reader.getByRole('option', { name: section, exact: true }).press('Enter'); }
    else await reader.getByRole('tab', { name: section, exact: true }).press('Enter');
}
async function closePanel(reader) { const close = reader.getByRole('button', { name: 'Close', exact: true }); if (await close.count()) await close.press('Enter'); }
async function href(reader) { return reader.locator('webview').first().evaluate(w => w.READIUM2?.link?.Href || new URL(w.src).pathname); }
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223'); let server;
    try {
        const lib = browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes('index_library.html'));
        let reader = browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes('index_reader.html'));
        assert.ok(lib && reader, 'Open Library and the existing Accessible EPUB 3 first.');
        await lib.reload(); await lib.getByRole('button', { name: 'Home', exact: true }).waitFor();
        const isEpub = await reader.locator('webview').first().getAttribute('id') !== 'pdfwebview';
        const epub = isEpub && await reader.evaluate(() => !!window.READIUM2?.publication?.Spine);
        let original;
        if (epub) {
            const url = await reader.locator('webview').first().getAttribute('src');
            original = { href: await href(reader), locations: await reader.evaluate(() => window.auditLocations?.at(-1)?.locations), goto: new URL(url).searchParams.get('r2_GOTO') };
            fs.writeFileSync(path.join(out, 'epub-original-locator.json'), JSON.stringify({ kind: 'restoration-measurement', ...original }, null, 2) + '\n');
        }
        const restoreEpub = async () => {
            if (!original) return;
            await chooseSection(reader, 'Table of Contents');
            const link = reader.locator('a[data-href]').filter({ hasText: '' });
            const index = await link.evaluateAll((es, target) => es.findIndex(e => e.getAttribute('data-href')?.split('#')[0] === target), original.href);
            assert.ok(index >= 0, 'Original EPUB resource is in the sample TOC'); await link.nth(index).press('Enter');
            await expect.poll(() => href(reader)).toBe(original.href);
            const goto = original.locations ? Buffer.from(JSON.stringify(original.locations)).toString('base64') : original.goto;
            if (goto) {
                await reader.locator('webview').first().evaluate(async (w, goto) => {
                    window.auditRestoreLocations = []; const listener = e => { if (e.channel === 'R2_EVENT_READING_LOCATION') window.auditRestoreLocations.push(e.args[0]); };
                    w.addEventListener('ipc-message', listener); window.auditRestoreListener = listener;
                    await w.send('R2_EVENT_SCROLLTO', { goto, gotoDomRange: undefined, hash: undefined, previous: false, isSecondWebView: false });
                }, goto);
                await expect.poll(() => reader.evaluate(() => window.auditRestoreLocations.length)).toBeGreaterThan(0);
                const restored = await reader.evaluate(() => window.auditRestoreLocations.at(-1));
                if (original.locations?.cssSelector) assert.equal(restored.locations.cssSelector, original.locations.cssSelector);
                fs.writeFileSync(path.join(out, 'epub-restored-locator.json'), JSON.stringify({ kind: 'restoration-measurement', href: original.href, restored }, null, 2) + '\n');
                await reader.locator('webview').first().evaluate(w => w.removeEventListener('ipc-message', window.auditRestoreListener));
            }
            await chooseSection(reader, 'Search'); await closePanel(reader);
        };
        await test('live-epub-equivalent-keyboard-navigation', async () => {
            assert.ok(epub); await closePanel(reader);
            if (await reader.getByRole('searchbox').count()) await reader.getByRole('button', { name: 'Search publication', exact: true }).press('Enter');
            const spine = await reader.evaluate(() => window.READIUM2.publication.Spine.map(l => l.Href)); const index = spine.indexOf(original.href); assert.ok(index > 0 && index < spine.length - 1);
            const evidence = [];
            try {
                for (const [key, target, label] of [['Control+PageDown', spine[index + 1], 'next'], ['Control+PageUp', spine[index - 1], 'previous']]) {
                    await closePanel(reader); await reader.locator('#main-toolbar').focus(); await reader.keyboard.press(key); await expect.poll(() => href(reader)).toBe(target);
                    evidence.push(snapshot('reader-epub-chapter-' + label)); await restoreEpub();
                }
                await chooseSection(reader, 'Table of Contents');
                await reader.getByRole('button', { name: 'Close', exact: true }).focus(); await reader.keyboard.press('Tab');
                const target = await reader.evaluate(() => document.activeElement.getAttribute('data-href')); assert.ok(target);
                await reader.keyboard.press('Enter'); await expect.poll(() => href(reader)).toBe(target.split('#')[0]);
                evidence.push(snapshot('reader-epub-toc-keyboard'));
                return { findings: ['A16'], evidence, spineItems: spine.length, limitation: 'Existing EPUB: Tab/Enter TOC and next/previous spine shortcuts. Original resource/selector restored through Readium IPC; restoration is not counted as keyboard evidence. Other formats and exact pointer offsets not certified.' };
            } finally { await restoreEpub(); }
        });
        await test('live-epub-search-status', async () => {
            assert.ok(epub); await closePanel(reader);
            if (!await reader.getByRole('searchbox').count()) await reader.getByRole('button', { name: 'Search publication', exact: true }).press('Enter');
            await watchStatus(reader); const input = reader.getByRole('searchbox');
            try {
                await input.fill('accessibility'); await input.press('Enter'); await expect(reader.getByRole('status')).toHaveText(/\d+ matches/); await expect(input).toBeFocused();
                const evidence = [snapshot('reader-search-results-live')];
                await input.fill('auditzznomatch837291'); await input.press('Enter'); await expect(reader.getByRole('status')).toHaveText('no matches');
                evidence.push(snapshot('reader-search-empty-live')); const trace = await saveStatus(reader, 'reader-search-live');
                assert.ok(trace.some(t => t.text === 'Searching…')); assert.ok(trace.some(t => /\d+ matches/.test(t.text))); assert.ok(trace.some(t => t.text === 'no matches'));
                return { findings: ['A15'], evidence, limitation: 'Actual EPUB search and DOM status mutations, with input focus retained. Chromium semantics inspected; no native screen-reader announcement listening.' };
            } finally { await reader.evaluate(() => window.auditStatusObserver?.disconnect()); await input.fill(''); await reader.getByRole('button', { name: 'Search publication', exact: true }).press('Enter'); await restoreEpub(); }
        });
        await test('live-local-opds-loading-and-error-status', async () => {
            let mode = 'empty'; const requests = [];
            server = http.createServer((req, res) => {
                if (req.method !== 'GET' || req.url !== '/opds/v2/catalog.json') { res.writeHead(404); res.end(); return; }
                requests.push({ method: req.method, url: req.url, mode });
                setTimeout(() => { res.writeHead(mode === 'error' ? 503 : 200, { 'Content-Type': mode === 'error' ? 'application/problem+json' : 'application/opds+json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(mode === 'error' ? { type: 'about:blank', title: 'Audit catalog unavailable', status: 503 } : { metadata: { title: 'Audit empty catalog' }, links: [{ rel: 'self', href: 'http://127.0.0.1:4873/opds/v2/catalog.json', type: 'application/opds+json' }] })); }, 1200);
            }); await new Promise((resolve, reject) => { server.once('error', reject); server.listen(4873, '127.0.0.1', resolve); });
            await lib.getByRole('button', { name: 'Catalogs', exact: true }).press('Enter'); await watchStatus(lib);
            try {
                await lib.getByRole('link', { name: 'http://127.0.0.1:4873/opds/v2/catalog.json', exact: true }).press('Enter');
                const status = lib.locator('#opds_browserResults [role="status"]'); await expect(status).toHaveText('Loading…');
                const evidence = [snapshot('library-opds-loading-live')]; await expect(status).not.toHaveText('Loading…');
                evidence.push(snapshot('library-opds-empty-live')); mode = 'error'; await lib.getByRole('button', { name: 'reload', exact: true }).press('Enter');
                await expect(status).toContainText('Audit catalog unavailable', { timeout: 15000 }); evidence.push(snapshot('library-opds-error-live'));
                const trace = await saveStatus(lib, 'library-opds-live'); assert.ok(trace.some(t => t.text === 'Loading…')); assert.ok(trace.some(t => t.text.includes('Audit catalog unavailable')));
                fs.writeFileSync(path.join(out, 'local-opds-requests.json'), JSON.stringify({ kind: 'local-network-measurement', requests }, null, 2) + '\n');
                return { findings: ['A15'], evidence, limitation: 'Existing loopback catalog only; delayed empty response then HTTP 503 problem response. No catalog saved, remote service, borrowing or authentication.' };
            } finally { await lib.evaluate(() => window.auditStatusObserver?.disconnect()); await lib.getByRole('button', { name: 'Home', exact: true }).press('Enter'); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); server = undefined; }
        });
        if (!only || /pdf/.test(only)) {
            if (epub) {
                await reader.evaluate(() => window.close()).catch(() => {});
                await expect.poll(() => browser.contexts().flatMap(c => c.pages()).filter(p => p.url().includes('index_reader.html')).length).toBe(0);
            }
            await lib.getByRole('button', { name: 'Home', exact: true }).press('Enter');
            if (epub) await lib.locator('a.publication_main_container').filter({ hasText: 'Untitled' }).first().click();
            await expect.poll(() => browser.contexts().flatMap(c => c.pages()).filter(p => p.url().includes('index_reader.html')).length).toBe(1);
            reader = browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes('index_reader.html')); await reader.getByRole('button', { name: 'Print', exact: true }).waitFor();
        }
        await test('live-pdf-page-keyboard-alternative', async () => {
            const initial = await reader.locator('webview').first().evaluate(w => w.executeJavaScript('window.PDFViewerApplication.pdfViewer.currentPageNumber'));
            await chooseSection(reader, 'Go to page'); const input = reader.getByRole('combobox');
            await input.fill('101'); await input.press('ArrowDown'); await input.press('Enter'); await expect(input).toHaveValue('101');
            await reader.getByRole('button', { name: 'Go to', exact: true }).press('Enter');
            await expect.poll(() => reader.locator('webview').first().evaluate(w => w.executeJavaScript('window.PDFViewerApplication.pdfViewer.currentPageNumber'))).toBe(101);
            const evidence = [snapshot('reader-pdf-goto-page-101')];
            await chooseSection(reader, 'Go to page'); const restoreInput = reader.getByRole('combobox'); await restoreInput.fill(String(initial)); await restoreInput.press('ArrowDown'); await restoreInput.press('Enter'); await reader.getByRole('button', { name: 'Go to', exact: true }).press('Enter'); await closePanel(reader);
            await expect.poll(() => reader.locator('webview').first().evaluate(w => w.executeJavaScript('window.PDFViewerApplication.pdfViewer.currentPageNumber'))).toBe(initial);
            return { findings: ['A16'], evidence, originalPage: initial, limitation: 'Existing 101-page PDF. Native page combobox and Go to activated by keyboard; page restored. No claim for Divina or audiobook progress-track alternatives.' };
        });
        await test('live-pdf-long-print-preview-keyboard', async () => {
            const pageBefore = await reader.locator('webview').first().evaluate(w => w.executeJavaScript('window.PDFViewerApplication.pdfViewer.currentPageNumber'));
            const trigger = reader.getByRole('button', { name: 'Print', exact: true }); await trigger.press('Enter');
            const preview = reader.getByRole('region', { name: 'Preview', exact: true });
            try {
                await expect(reader.getByRole('textbox', { name: 'Pages', exact: true })).toHaveValue('1-101');
                await reader.getByRole('textbox', { name: 'Pages', exact: true }).focus(); await reader.keyboard.press('Tab'); await expect(preview).toBeFocused();
                await expect.poll(() => preview.locator('img').count(), { timeout: 20000 }).toBeGreaterThan(0); await expect.poll(() => preview.locator('img').evaluateAll(es => es.every(e => e.complete && e.naturalWidth > 0)), { timeout: 20000 }).toBe(true);
                const initial = await preview.evaluate(e => ({ width: e.clientWidth, scrollWidth: e.scrollWidth, left: e.scrollLeft, outline: getComputedStyle(e).outline })); assert.ok(initial.scrollWidth > initial.width);
                const evidence = [snapshot('reader-pdf-print-start-live')];
                await preview.press('PageDown'); await expect.poll(() => preview.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
                await preview.press('End'); const last = preview.locator('img[alt="Page 101"]'); await expect(last).toBeInViewport({ timeout: 20000 }); await expect.poll(() => last.evaluate(e => e.complete && e.naturalWidth > 0), { timeout: 20000 }).toBe(true);
                evidence.push(snapshot('reader-pdf-print-end-live')); await preview.press('Home'); await expect.poll(() => preview.evaluate(e => e.scrollLeft)).toBe(0);
                fs.writeFileSync(path.join(out, 'reader-pdf-print-layout.json'), JSON.stringify({ kind: 'layout-measurement', initial, final: await preview.evaluate(e => ({ left: e.scrollLeft, focused: e === document.activeElement })) }, null, 2) + '\n');
                return { findings: ['A27'], evidence, geometry: initial, limitation: 'Actual 101-page PDF and loaded endpoint thumbnails. Virtualization loads the visible windows, not all 101 thumbnails simultaneously. No print job submitted.' };
            } finally {
                await reader.getByRole('button', { name: 'Cancel', exact: true }).press('Enter'); await expect(trigger).toBeFocused();
                assert.equal(await reader.locator('webview').first().evaluate(w => w.executeJavaScript('window.PDFViewerApplication.pdfViewer.currentPageNumber')), pageBefore);
            }
        });
        await test('live-pdf-thumbnail-fallback-without-sidebar', async () => {
            await reader.evaluate(() => window.close()).catch(() => {});
            await lib.locator('a.publication_main_container').filter({ hasText: 'Untitled' }).first().click();
            await expect.poll(() => browser.contexts().flatMap(c => c.pages()).filter(p => p.url().includes('index_reader.html')).length).toBe(1);
            reader = browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes('index_reader.html'));
            const trigger = reader.getByRole('button', { name: 'Print', exact: true }); await trigger.waitFor();
            await expect.poll(() => reader.locator('webview').first().evaluate(w => w.executeJavaScript('window.PDFViewerApplication?.pdfDocument?.numPages'))).toBe(101);
            await reader.locator('webview').first().evaluate(w => w.executeJavaScript('window.auditNativeThumbnailViewer = window.PDFViewerApplication.pdfThumbnailViewer; window.PDFViewerApplication.pdfThumbnailViewer = undefined;'));
            try {
                await trigger.press('Enter'); const preview = reader.getByRole('region', { name: 'Preview', exact: true });
                await expect.poll(() => preview.locator('img[alt="Page 1"]').count(), { timeout: 20000 }).toBe(1);
                await expect.poll(() => preview.locator('img[alt="Page 1"]').evaluate(e => e.complete && e.naturalWidth > 0)).toBe(true);
                const evidence = [snapshot('reader-pdf-print-fallback-start-live')];
                await preview.press('End'); const last = preview.locator('img[alt="Page 101"]'); await expect(last).toBeInViewport({ timeout: 20000 });
                await expect.poll(() => last.evaluate(e => e.complete && e.naturalWidth > 0)).toBe(true); evidence.push(snapshot('reader-pdf-print-fallback-end-live'));
                return { findings: ['A27'], evidence, limitation: 'Real PDF pages and renderer; fresh cache. PDFViewerApplication.pdfThumbnailViewer temporarily hidden to force the fallback, restored in finally. This fault simulation is separate from the normal live preview case. No print job.' };
            } finally {
                const cancel = reader.getByRole('button', { name: 'Cancel', exact: true }); if (await cancel.count()) await cancel.press('Enter');
                await reader.locator('webview').first().evaluate(w => w.executeJavaScript('window.PDFViewerApplication.pdfThumbnailViewer = window.auditNativeThumbnailViewer; delete window.auditNativeThumbnailViewer;'));
            }
        });
    } finally { if (server) { server.closeAllConnections(); server.close(); } await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
