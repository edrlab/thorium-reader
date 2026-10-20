const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = 'docs/accessibility';
const dir = 'evidence/reader-columns-fix';
for (const [before, after] of [['08-default-restored', '08-home-browse-scroll'], ['11-scrollable-restored', '11-scrollable-attempt']]) {
    const oldFile = path.join(root, dir, before + '.json');
    if (fs.existsSync(oldFile)) {
        const capture = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
        capture.label = after;
        fs.writeFileSync(oldFile, JSON.stringify(capture, null, 2) + '\n');
        for (const extension of ['.json', '.jpg']) fs.renameSync(path.join(root, dir, before + extension), path.join(root, dir, after + extension));
    }
}
const names = fs.readdirSync(path.join(root, dir));
const read = name => JSON.parse(fs.readFileSync(path.join(root, dir, name + '.json'), 'utf8'));
const speech = name => read(name).speech.join('\n');
assert.ok(speech('04-two-columns-pointer').includes("'2 cols', 'radio button'"));
assert.ok(speech('05-two-columns-focus').includes("'checked'"));
assert.ok(speech('06-one-column-keyboard').includes("'1 col', 'radio button'"));
assert.ok(speech('07-two-columns-keyboard').includes("'2 cols', 'radio button'"));
assert.ok(speech('10-modal-default-restored').includes("'Default', 'radio button'"));
assert.ok(speech('13-scrollable-pointer-restored').includes("'Scrollable', 'radio button'"));
const captures = names.filter(name => /^\d\d[a-z]?-.*\.json$/.test(name) && !name.startsWith('00-'));
const readerWindow = read('01-settings-open').window.id;
for (const name of captures) assert.equal(read(name.slice(0, -5)).window.id, readerWindow, 'Reader-only repair inputs');
const source = 'src/renderer/assets/styles/components/settings.scss';
const evidence = ['native-reader-columns-remediation.json', ...names.map(name => dir + '/' + name)];
const limitations = 'Sampled English EPUB Reader right-docked settings and modal layout only; screenshot visibility and native NVDA diagnostic text checked. Speech not assessed acoustically. Home scrolled the browse viewport and is not passed as radio selection. Actual publication two-page spreads, other locales/formats and full WCAG conformance remain unverified.';
const result = {
    date: '2026-10-20', status: 'fixed in sampled scope',
    branch: 'codex/a11y-reader-columns-reflow', baseBranch: 'codex/a11y-reader-progress-track-end',
    baseRevision: 'b1f0f8a2cec27cab2169541f85b12f9c4755a805',
    sourceHashes: { [source]: crypto.createHash('sha256').update(fs.readFileSync(source, 'utf8').replace(/\r\n/g, '\n')).digest('hex') },
    implementation: 'Allow existing settings radio groups to wrap within their container and let their option row grow vertically. Fixed-width radio cards, accessible names, roles, orientation and selection handlers are unchanged. Shared styles also address the same overflow pattern in Alignment.',
    baseline: 'evidence/reader-two-page-zoom/02-one-column-focus.jpg',
    validationRecovery: 'Old Reader retained stale CSS despite hot compilation. First authorized sample reopen timed out. Restarted npm run start:dev:quick, then retried the sample reopen to load fresh assets. Capture00 is historical stale-window evidence; repair captures start01 in a fresh Reader.',
    readerWindow, recordedCaptures: captures.length,
    staticValidation: { stylelint: 'passed', typescript: 'passed', readerWebpackScope: 'passed (15998ms)', libraryWebpackScope: 'passed (15129ms)' },
    checks: [{ id: 'RHF03', complete: true, status: 'Columns clipping fixed in sampled Reader; native NVDA verified',
        files: ['src/renderer/reader/components/ReaderSettings/ReadingDisplayCol.tsx', 'src/renderer/reader/components/ReaderSettings/ReaderSettings.tsx'],
        evidence, observation: 'Columns choices wrap into the available docked-panel width. The complete 2 cols card and focus outline are visible after pointer selection, with no horizontal panel shift. NVDA identifies the named radio and checked state; ArrowLeft and ArrowRight move selection between 1 col and 2 cols. All three modal choices fit in one row; Default selection and its focus outline were verified.', limitations }],
    limitations,
    cleanup: 'Fresh Reader initial Scrollable layout, unchecked custom formatting, Columns Default and right docking restored; Reader left open. Exact pre-restart reading position not restored. NVDA diagnostic logging disabled after testing. Full logs remain ignored under dist.'
};
fs.writeFileSync(path.join(root, 'native-reader-columns-remediation.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, recordedCaptures: captures.length, readerWindow }));
