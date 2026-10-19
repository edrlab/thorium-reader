const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium, expect } = require('@playwright/test');
const out = path.resolve('docs/accessibility/evidence/batch-5'); fs.mkdirSync(out, { recursive: true });
const profiles = JSON.parse(fs.readFileSync('dist/accessibility-batch5-packages/profiles.json'));
const locales = { en: require('../../src/resources/locales/en.json'), fr: require('../../src/resources/locales/fr.json') };
const only = process.env.THORIUM_AUDIT_ONLY;
const tests = only ? JSON.parse(fs.readFileSync(path.join(out, 'application-checks.json'))).tests : [];
async function test(id, run) {
    if (only && !new RegExp(only).test(id)) return;
    const old = tests.findIndex(t => t.id === id); if (old >= 0) tests.splice(old, 1);
    try { tests.push({ id, status: 'passed', ...await run() }); console.log(id + ': passed'); }
    catch (error) { tests.push({ id, status: 'failed', error: String(error) }); process.exitCode = 1; console.log(id + ': ' + String(error)); }
    fs.writeFileSync(path.join(out, 'application-checks.json'), JSON.stringify({ batch: 5, startup: 'npm run start:dev:quick; isolated Electron user-data-dir on port 9225', tests }, null, 2) + '\n');
}
function snapshot(label, port) {
    execFileSync(process.execPath, ['scripts/accessibility/snapshot.cjs', label], { env: { ...process.env, THORIUM_AUDIT_EVIDENCE_SUBDIR: 'batch-5', THORIUM_AUDIT_CDP_PORT: String(port) }, timeout: 90000, stdio: 'pipe' });
    return 'batch-5/' + label + '.json';
}
async function ax(page, label) {
    const session = await page.context().newCDPSession(page); const data = await session.send('Accessibility.getFullAXTree'); await session.detach();
    fs.writeFileSync(path.join(out, label + '-ax.json'), JSON.stringify(data, null, 2) + '\n');
    return data.nodes.filter(n => !n.ignored && n.role?.value === 'image').map(n => n.name?.value);
}
async function setLocale(page, target) {
    const current = await page.locator('html').getAttribute('lang'); if (current === target) return;
    await page.getByRole('button', { name: locales[current].header.settingsLabel, exact: true }).press('Enter');
    try {
        await page.getByRole('tab', { name: locales[current].settings.tabs.general, exact: true }).press('Enter');
        await page.getByRole('button', { name: 'Show suggestions ' + locales[current].settings.language.languageChoice, exact: true }).click();
        await page.getByRole('option', { name: target === 'fr' ? 'Français (French)' : 'English', exact: true }).click();
        await expect(page.locator('html')).toHaveAttribute('lang', target);
    } finally {
        await page.locator('[role="dialog"] button[aria-label="Close"],[role="dialog"] button[aria-label="Fermer"]').first().click();
    }
}
(async () => {
    const normal = await chromium.connectOverCDP('http://127.0.0.1:9223');
    const isolated = await chromium.connectOverCDP('http://127.0.0.1:9225');
    try {
        const main = normal.contexts().flatMap(c => c.pages()).find(p => p.url().includes('index_library.html'));
        const page = isolated.contexts().flatMap(c => c.pages()).find(p => p.url().includes('index_library.html'));
        await main.reload(); await page.reload();
        await test('default-library-navigation-icons', async () => {
            await main.getByRole('button', { name: 'Home', exact: true }).waitFor();
            const icons = await main.locator('nav li a svg').evaluateAll(es => es.map(e => e.getAttribute('aria-hidden'))); assert.ok(icons.length >= 3 && icons.every(v => v === 'true'));
            const titles = await main.getByRole('button', { name: /^Menu \(/ }).count(); assert.equal(titles, 5);
            return { findings: ['A17'], evidence: [snapshot('library-default-navigation', 9223)], limitation: 'Existing default library inspected, without profile activation or language changes. Five visible publication menu controls retained.' };
        });
        for (const profile of profiles) await test('profile-' + profile.id, async () => {
            assert.equal(await page.getByRole('button', { name: /^Menu \(/ }).count(), 0, 'Only the empty isolated library may receive audit profiles');
            await setLocale(page, profile.locale);
            execFileSync(require('electron'), ['.', '--user-data-dir=' + path.resolve('dist/accessibility-batch5-profile'), profile.package], { env: { ...process.env, NODE_ENV: 'development', DEBUG: '' }, timeout: 60000, stdio: 'pipe' });
            const dialog = page.getByRole('alertdialog'); await expect(dialog).toBeVisible({ timeout: 20000 });
            await expect(dialog.getByRole('heading', { level: 1 })).toContainText('Thorium University Press');
            const dontShow = dialog.getByRole('checkbox'); await expect(dontShow).toHaveAttribute('aria-checked', 'false');
            if (profile.id === 'decorative-en') {
                await dontShow.press('Space'); await expect(dontShow).toHaveAttribute('aria-checked', 'true');
                await dontShow.press('Space'); await expect(dontShow).toHaveAttribute('aria-checked', 'false');
            }
            const hero = dialog.locator('img');
            if (profile.noArt) await expect(hero).toHaveCount(0);
            else {
                await expect(hero).toHaveJSProperty('complete', true); await expect.poll(() => hero.evaluate(e => e.naturalWidth)).toBeGreaterThan(0);
                const expected = typeof profile.hero === 'object' ? profile.hero[profile.locale] || profile.hero.en : profile.hero;
                await expect(hero).toHaveAttribute('alt', expected);
                if (expected) await expect(hero).toHaveAttribute('lang', profile.hero[profile.locale] ? profile.locale : 'en');
            }
            const welcome = 'library-welcome-' + profile.id; const evidence = [snapshot(welcome, 9225)]; const names = await ax(page, welcome);
            if (profile.hero && !profile.noArt) assert.deepEqual(names, [profile.hero[profile.locale] || profile.hero.en]); else assert.deepEqual(names, []);
            await dialog.getByRole('button', { name: locales[profile.locale].accessibility.closeDialog, exact: true }).press('Enter'); await expect(dialog).toHaveCount(0);
            await expect(page.getByRole('dialog')).toHaveCount(0);
            const nav = page.getByRole('navigation', { name: locales[profile.locale].header.home, exact: true });
            const logo = nav.locator('.logo img'); await expect(logo).toHaveJSProperty('complete', true); await expect.poll(() => logo.evaluate(e => e.naturalWidth)).toBeGreaterThan(0);
            const expectedLogo = profile.logo === undefined ? 'Thorium University Press' : typeof profile.logo === 'object' ? profile.logo[profile.locale] || profile.logo.en : profile.logo;
            await expect(logo).toHaveAttribute('alt', expectedLogo);
            if (expectedLogo && typeof profile.logo === 'object') await expect(logo).toHaveAttribute('lang', profile.logo[profile.locale] ? profile.locale : 'en');
            const icons = await nav.locator('li a svg').evaluateAll(es => es.map(e => e.getAttribute('aria-hidden'))); assert.ok(icons.length >= 5 && icons.every(v => v === 'true'));
            await expect(nav.getByRole('button', { name: 'FAQ', exact: true })).toHaveCount(1); await expect(nav.getByRole('button', { name: 'Help', exact: true })).toHaveCount(1);
            const header = 'library-header-' + profile.id; evidence.push(snapshot(header, 9225)); const headerNames = await ax(page, header);
            assert.deepEqual(headerNames, expectedLogo ? [expectedLogo] : []);
            const manifest = JSON.parse(fs.readFileSync(profile.manifest)); fs.writeFileSync(path.join(out, 'manifest-' + profile.id + '.json'), JSON.stringify({ kind: 'profile-input', manifest }, null, 2) + '\n');
            return { findings: ['A17'], evidence, imageNames: { welcome: names, header: headerNames }, limitation: 'Real signed package and profile activation in empty workspace-local user data. Uses the bundled SVG/HTML; informative titles are explicit test variants. No publications or catalog links in the packages. No native screen-reader listening.' };
        });
        assert.equal(await main.getByRole('button', { name: /^Menu \(/ }).count(), 5);
    } finally { await normal.close(); await isolated.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
